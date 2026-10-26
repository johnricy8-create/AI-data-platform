import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Copy,
  Cpu,
  Database,
  FileText,
  LoaderCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api, type AIResponse } from "../lib/api";
import { useFilters } from "../context/Filters";
import { channelLabel, fmtMoney, fmtNum, fmtPct, rangeLabel } from "../lib/format";
import { Badge, Button, Card, Modal, PageHeader } from "../components/UI";
import { ReportCard } from "../components/ReportCard";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; kind: "welcome" }
  | { id: string; role: "assistant"; kind: "loading" }
  | { id: string; role: "assistant"; kind: "error"; text: string }
  | { id: string; role: "assistant"; kind: "report"; response: AIResponse };

const suggestions = [
  "昨天销售额为什么下降？",
  "哪些商品值得重点推广？",
  "哪些商品存在库存不足风险？",
  "哪些商品销售额高但毛利率低？",
  "生成本周运营计划",
];

function uid(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function welcomeMessage(): ChatMessage {
  return { id: uid(), role: "assistant", kind: "welcome" };
}

export function AIPage() {
  const navigate = useNavigate();
  const { range, channel } = useFilters();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage()]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [latest, setLatest] = useState<AIResponse | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const sentRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const health = useQuery({ queryKey: ["ai-health"], queryFn: api.aiHealth, staleTime: 60_000 });

  const scrollToBottom = () => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  };

  const scrollToMessage = (id: string) => {
    const container = scrollRef.current;
    const element = document.getElementById(`chat-${id}`);
    if (!container || !element) return;
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    container.scrollTop += elementRect.top - containerRect.top - 10;
  };

  const send = async (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setQuestion("");
    const userMessage: ChatMessage = { id: uid(), role: "user", text: value };
    const loadingMessage: ChatMessage = { id: uid(), role: "assistant", kind: "loading" };
    setMessages((current) => [...current, userMessage, loadingMessage]);
    setTimeout(scrollToBottom, 30);

    try {
      const response = await api.chat({ question: value, range, channel });
      setLatest(response);
      setMessages((current) =>
        current.map((message) => (message.id === loadingMessage.id ? { id: message.id, role: "assistant", kind: "report", response } : message)),
      );
      if (response.mode === "fallback") {
        toast.info("AI 调用未完成，已使用规则分析并保留证据");
      } else {
        toast.success(`分析完成 · ${response.model || "智谱 GLM"}`);
      }
      setTimeout(() => scrollToMessage(loadingMessage.id), 70);
    } catch (error) {
      const message = error instanceof Error ? error.message : "分析失败";
      setMessages((current) =>
        current.map((item) =>
          item.id === loadingMessage.id ? { id: item.id, role: "assistant", kind: "error", text: message } : item,
        ),
      );
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !sentRef.current) {
      sentRef.current = true;
      void send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, busy]);

  const newChat = () => {
    setMessages([welcomeMessage()]);
    setLatest(null);
    setBusy(false);
    sentRef.current = false;
  };

  const copyPlan = async () => {
    if (!latest) return;
    const text = [
      "AI 电商数据中台 · 运营计划",
      `问题：${latest.question}`,
      `范围：${latest.range.start} 至 ${latest.range.end}`,
      "",
      ...latest.report.actions.map((action) => `[${action.priority}] ${action.title}：${action.detail}`),
      "",
      "所有动作需人工确认，系统不会自动执行。",
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("运营计划已复制");
    } catch {
      toast.error("复制失败，请手动选择文本");
    }
  };

  const modelLabel = health.data?.primary_model || "GLM-4.7-Flash";
  const scope = channel === "all" ? "全部渠道" : channelLabel(channel);

  return (
    <div className="chat-page">
      <PageHeader
        eyebrow="AI Copilot"
        title="AI 运营助手"
        subtitle="先查数、再分析、后建议。每条结论都能回溯到具体的指标与数据范围。"
        actions={
          <>
            <Badge tone="success"><ShieldCheck /> 只读分析</Badge>
            <Badge tone="violet"><Sparkles /> 智谱 GLM</Badge>
            <Button onClick={newChat}><Plus /> 新建对话</Button>
          </>
        }
      />

      <div className="grid-12">
        <section className="card chat-card span-8">
          <div className="chat-head">
            <div className="chat-avatar"><Sparkles /></div>
            <div>
              <div className="chat-title">经营分析助手</div>
              <div className="chat-status"><span /> 在线 · 已连接指标工具</div>
            </div>
            <div className="chat-head-right">
              <span className="badge badge-gray">智谱 GLM · 自动降级</span>
              <button className="icon-btn" onClick={newChat} aria-label="新建对话"><Plus /></button>
            </div>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((message) => {
              if (message.role === "user") {
                return (
                  <div className="msg user" key={message.id} id={`chat-${message.id}`}>
                    <div className="msg-avatar user">你</div>
                    <div className="msg-bubble">{message.text}</div>
                  </div>
                );
              }
              if (message.kind === "welcome") {
                return (
                  <div className="msg" key={message.id} id={`chat-${message.id}`}>
                    <div className="msg-avatar">AI</div>
                    <div className="msg-bubble">
                      <div className="answer-head">
                        <span className="badge badge-violet">AI 经营分析</span>
                        <h4>下午好，我是你的经营分析助手</h4>
                      </div>
                      <p>我会先调用指标工具核对数据，再给出结论、证据和可执行建议。当前范围：{rangeLabel[range]} · {scope}。</p>
                      <div className="capability-grid">
                        <div><span>01</span>经营异动归因</div>
                        <div><span>02</span>商品增长机会</div>
                        <div><span>03</span>库存与退款风险</div>
                        <div><span>04</span>运营计划生成</div>
                      </div>
                      <p className="muted-line">所有数字来自 SQL 指标层，模型只负责解释；不会直接修改价格、库存或投放。</p>
                      <div className="upload-spec" style={{ margin: "9px 0 0" }}>
                        <Database /> 已连接：订单 / 流量 / 库存 · 75 天演示数据
                      </div>
                      <div className="chat-starter">
                        <div className="chat-starter-head"><Sparkles /> 从这些问题开始，我会先查数再回答</div>
                        <div className="chat-starter-grid">
                          {suggestions.slice(0, 4).map((item) => (
                            <button key={item} onClick={() => void send(item)}>{item}</button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              if (message.kind === "loading") {
                return (
                  <div className="msg" key={message.id} id={`chat-${message.id}`}>
                    <div className="msg-avatar">AI</div>
                    <div className="msg-bubble">
                      <div className="ai-loading">
                        <div className="ai-loading-row"><span className="ai-loading-dot" />正在解析问题与时间范围</div>
                        <div className="ai-loading-row"><span className="ai-loading-dot" />正在查询订单、流量与库存指标</div>
                        <div className="ai-loading-row"><span className="ai-loading-dot" />正在生成结论并校验证据</div>
                      </div>
                    </div>
                  </div>
                );
              }
              if (message.kind === "error") {
                return (
                  <div className="msg" key={message.id} id={`chat-${message.id}`}>
                    <div className="msg-avatar">AI</div>
                    <div className="msg-bubble">
                      <div className="answer-head">
                        <span className="badge badge-danger">分析失败</span>
                        <h4>这次分析没有完成</h4>
                      </div>
                      <p>{message.text}</p>
                      <p className="muted-line">请稍后重试，或检查后端与大模型配置。</p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="msg" key={message.id} id={`chat-${message.id}`}>
                  <div className="msg-avatar">AI</div>
                  <div className="msg-bubble">
                    <ReportCard
                      response={message.response}
                      onPlan={() => setPlanOpen(true)}
                      onSave={() => toast.success("报告已自动保存到报告中心")}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-suggestions">
            {suggestions.map((item) => (
              <button className="suggestion" key={item} onClick={() => void send(item)} disabled={busy}>
                {item}
              </button>
            ))}
          </div>

          <form
            className="chat-input-wrap"
            onSubmit={(event) => {
              event.preventDefault();
              void send(question);
            }}
          >
            <div className="chat-input">
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="问问经营数据，例如：为什么淘宝销售额下降？"
                disabled={busy}
              />
              <button className="btn btn-primary" type="submit" disabled={busy || !question.trim()} aria-label="发送">
                {busy ? <LoaderCircle className="spin" /> : <Send />}
              </button>
            </div>
            <div className="chat-hint">Enter 发送 · 结果仅供决策参考 · 不会自动执行任何操作</div>
          </form>
        </section>

        <div className="span-4 stack">
          <Card
            className="context-card chat-context"
            title="分析上下文"
            subtitle="范围、工具与指标快照"
            actions={<Badge tone="gray">只读</Badge>}
          >
            <div className="context-section">
              <div className="context-label">分析范围</div>
              <div className="context-value"><span>时间范围</span><strong>{rangeLabel[range]}</strong></div>
              <div className="context-value"><span>渠道</span><strong>{scope}</strong></div>
              <div className="context-value"><span>品类</span><strong>全部品类</strong></div>
              <div className="context-value"><span>对比口径</span><strong>{range === "today" ? "较昨日" : range === "7d" ? "较上周" : "较上期"}</strong></div>
            </div>

            <div className="context-section">
              <div className="context-label">本次调用的数据工具</div>
              <div className="tool-row"><span className="tool-check"><CheckCircle2 /></span> get_kpis <span className="tool-time">SQL</span></div>
              <div className="tool-row"><span className="tool-check"><CheckCircle2 /></span> get_trend <span className="tool-time">SQL</span></div>
              <div className="tool-row"><span className="tool-check"><CheckCircle2 /></span> get_product_ranking <span className="tool-time">SQL</span></div>
              <div className="tool-row"><span className="tool-check"><CheckCircle2 /></span> get_inventory_risk <span className="tool-time">SQL</span></div>
            </div>

            <div className="context-section">
              <div className="context-label">关键指标快照</div>
              <div className="context-value"><span>销售额</span><strong>{latest ? fmtMoney(latest.kpis.sales) : "—"}</strong></div>
              <div className="context-value"><span>订单量</span><strong>{latest ? fmtNum(latest.kpis.orders) : "—"}</strong></div>
              <div className="context-value"><span>转化率</span><strong>{latest ? fmtPct(latest.kpis.conversion) : "—"}</strong></div>
              <div className="context-value"><span>毛利率</span><strong>{latest ? fmtPct(latest.kpis.gross_margin, 1) : "—"}</strong></div>
            </div>

            <div className="context-section">
              <div className="context-label">安全边界</div>
              <div className="safety-note">
                <strong>只读分析</strong><br />
                不改价格、不改库存、不调整广告预算；所有执行动作都需要人工确认。
              </div>
            </div>

            <div className="context-section">
              <div className="context-label">模型运行信息</div>
              <div className="context-value"><span>模式</span><strong>{latest?.mode === "zhipu" ? "智谱 GLM" : latest ? "规则降级" : "待分析"}</strong></div>
              <div className="context-value"><span>模型</span><strong>{latest?.model || modelLabel}</strong></div>
              <div className="context-value"><span>耗时</span><strong>{latest ? `${(latest.latency_ms / 1000).toFixed(1)}s` : "—"}</strong></div>
              <div className="context-value"><span>Tokens</span><strong>{latest ? fmtNum(latest.tokens) : "—"}</strong></div>
            </div>
          </Card>

          <Card title="可以这样问" subtitle="用自然语言描述业务问题" actions={<BarChart3 />}>
            <div className="evidence-list">
              <li><span className="evidence-ref">01</span>为什么某个渠道/商品涨跌？</li>
              <li><span className="evidence-ref">02</span>哪些商品值得推广或优化？</li>
              <li><span className="evidence-ref">03</span>库存、退款、毛利有哪些风险？</li>
              <li><span className="evidence-ref">04</span>帮我生成明日/本周运营计划</li>
            </div>
          </Card>

          <Card title="数据新鲜度" subtitle="本地 SQLite 实时聚合">
            <div className="context-value"><span><Database /> 数据源</span><strong>订单 / 流量 / 库存</strong></div>
            <div className="context-value"><span><Clock3 /> 指标层</span><strong>SQL + Pandas</strong></div>
            <div className="context-value"><span><Cpu /> 模型</span><strong>{modelLabel}</strong></div>
            <div className="safety-note" style={{ marginTop: 9 }}>
              <strong>证据优先</strong><br />
              每条结论都要求引用证据 ID；证据不足时会明确说明。
            </div>
          </Card>
        </div>
      </div>

      {planOpen && latest ? (
        <Modal
          title="运营计划"
          subtitle={`${latest.range.start} 至 ${latest.range.end} · 所有动作需人工确认`}
          onClose={() => setPlanOpen(false)}
          wide
        >
          <div className="modal-body">
            <div className="plan-summary">{latest.report.summary}</div>
            {latest.report.actions.map((action, index) => (
              <div className={`plan-block ${action.priority === "P0" ? "p0" : action.priority === "P1" ? "p1" : ""}`} key={`${action.title}-${index}`}>
                <div className="plan-block-head">
                  <span>{action.priority}</span>
                  <strong>{action.title}</strong>
                </div>
                <p style={{ margin: 0, color: "var(--text-2)", fontSize: 10, lineHeight: 1.65 }}>{action.detail}</p>
                {action.evidence_ids.length ? (
                  <div className="plan-evidence">
                    {action.evidence_ids.map((id) => <span key={id}>{id}</span>)}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="plan-evidence">
              <span>证据：{latest.evidence.map((item) => item.id).join(" · ")}</span>
            </div>
          </div>
          <div className="modal-footer">
            <Button onClick={() => setPlanOpen(false)}>关闭</Button>
            <Button onClick={copyPlan}><Copy /> 复制计划</Button>
            <Button variant="primary" onClick={() => { toast.success("报告已保存到报告中心"); navigate("/reports"); }}>
              <FileText /> 保存到报告中心
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
