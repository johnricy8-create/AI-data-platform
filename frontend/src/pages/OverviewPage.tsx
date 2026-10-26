import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Download,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import { api } from "../lib/api";
import { useFilters } from "../context/Filters";
import {
  channelLabel,
  fmtDelta,
  fmtMoney,
  fmtNum,
  fmtPct,
  rangeLabel,
} from "../lib/format";
import { Button, Card, ErrorState, KpiCard, LoadingPage, PageHeader, ProductThumb } from "../components/UI";
import { ChannelBars, TrendChart } from "../components/Charts";

const tones = ["blue", "teal", "violet", "amber", "rose", "indigo", "sky", "emerald"];

function compareLabel(range: string): string {
  if (range === "today") return "较昨日";
  if (range === "7d") return "较上周";
  if (range === "30d") return "较上月";
  return "较上期";
}

export function OverviewPage() {
  const navigate = useNavigate();
  const { range, channel } = useFilters();
  const [question, setQuestion] = useState("");
  const query = useQuery({
    queryKey: ["overview", range, channel],
    queryFn: () => api.overview({ range, channel }),
  });

  const aiLink = (text: string) => {
    const params = new URLSearchParams({ q: text, range, channel });
    navigate(`/ai?${params.toString()}`);
  };

  if (query.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="经营概览" subtitle="正在汇总经营指标…" />
        <LoadingPage />
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="经营概览" subtitle="一眼看清经营健康度与增长来源。" />
        <ErrorState message={query.error instanceof Error ? query.error.message : "未知错误"} onRetry={() => query.refetch()} />
      </>
    );
  }

  const data = query.data;
  const kpis = data.kpis;
  const trend = data.trend;
  const compare = compareLabel(range);
  const scope = channel === "all" ? "全渠道" : channelLabel(channel);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="经营概览"
        subtitle={`一眼看清 ${scope} 的经营健康度、增长来源与待处理风险。`}
        actions={
          <>
            <Button onClick={() => toast.success("经营日报已生成（演示导出）")}>
              <Download /> 导出日报
            </Button>
            <Button variant="primary" onClick={() => aiLink("请根据当前经营数据生成明日运营计划")}>
              <Sparkles /> 生成运营计划
            </Button>
          </>
        }
      />

      <div className="kpi-grid">
        <KpiCard
          label={`${rangeLabel[range]}销售额`}
          value={fmtMoney(kpis.sales)}
          icon={<Wallet />}
          accent="blue"
          growth={kpis.sales_growth}
          compare={compare}
          spark={trend.sales.slice(-7)}
        />
        <KpiCard
          label={`${rangeLabel[range]}订单数`}
          value={fmtNum(kpis.orders)}
          icon={<ShoppingBag />}
          accent="teal"
          growth={kpis.orders_growth}
          compare={compare}
          spark={trend.orders.slice(-7)}
        />
        <KpiCard
          label={`${rangeLabel[range]}访客数`}
          value={fmtNum(kpis.visitors)}
          icon={<Users />}
          accent="violet"
          growth={kpis.visitors_growth}
          compare={compare}
          spark={trend.visitors.slice(-7)}
        />
        <KpiCard
          label={`${rangeLabel[range]}转化率`}
          value={fmtPct(kpis.conversion, 2)}
          icon={<Target />}
          accent="amber"
          growth={kpis.conversion_growth}
          compare={compare}
          spark={trend.conversion}
          suffix="pp"
        />
      </div>

      <div className="grid-12">
        <Card
          className="span-8"
          title="销售趋势"
          subtitle={`销售额与订单量 · ${rangeLabel[range]} · ${scope}`}
          actions={<span className="badge badge-blue">{rangeLabel[range]}</span>}
          bodyClassName=""
        >
          <div style={{ padding: "0 0 4px" }}>
            <TrendChart data={trend} height={300} />
          </div>
          <div className="trend-summary">
            <div className="trend-stat">
              <span>本期累计销售额</span>
              <strong>{fmtMoney(kpis.sales)}</strong>
              <em className={kpis.sales_growth >= 0 ? "up" : "down"}>{fmtDelta(kpis.sales_growth)}</em>
            </div>
            <div className="trend-stat">
              <span>日均销售额</span>
              <strong>{fmtMoney(kpis.sales / Math.max(trend.labels.length, 1))}</strong>
            </div>
            <div className="trend-stat">
              <span>客单价</span>
              <strong>{fmtMoney(kpis.aov)}</strong>
            </div>
          </div>
        </Card>

        <Card
          className="span-4"
          title="渠道销售占比"
          subtitle={`${rangeLabel[range]} · 各渠道贡献`}
          actions={<span className="badge badge-gray">{data.channels.length} 个渠道</span>}
        >
          <ChannelBars
            channels={data.channels}
            total={kpis.sales}
            active={channel !== "all" ? channel : undefined}
          />
          <div className="channel-foot">
            <ShieldCheck /> 数据来自订单与流量表，按统一渠道口径聚合
          </div>
        </Card>

        <Card
          className="span-8"
          title="热销商品排行"
          subtitle={`${rangeLabel[range]} · 点击商品查看经营诊断`}
          actions={
            <button className="link" onClick={() => navigate(`/products?range=${range}&channel=${channel}`)}>
              全部商品 <ArrowRight />
            </button>
          }
          flush
        >
          <div className="table-wrap" style={{ paddingTop: 10 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 38 }}>#</th>
                  <th>商品</th>
                  <th className="num">销量</th>
                  <th className="num">销售额</th>
                  <th className="num">毛利率</th>
                  <th className="num">趋势</th>
                </tr>
              </thead>
              <tbody>
                {data.products.slice(0, 8).map((product, index) => (
                  <tr
                    key={product.id}
                    onClick={() => navigate(`/products?product=${product.id}&range=${range}&channel=${channel}`)}
                  >
                    <td>
                      <span className={`rank ${index < 3 ? "top" : ""}`}>{index + 1}</span>
                    </td>
                    <td>
                      <div className="product-cell">
                        <ProductThumb tone={tones[index % tones.length]} />
                        <div>
                          <div className="product-name">{product.name}</div>
                          <div className="product-meta">{product.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="num">{fmtNum(product.qty)}</td>
                    <td className="num strong">{fmtMoney(product.sales)}</td>
                    <td className="num">{fmtPct(product.margin, 1)}</td>
                    <td className="num">
                      <span className={`delta ${product.growth >= 0 ? "up" : "down"}`}>
                        {fmtDelta(product.growth)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <span className="muted-2" style={{ fontSize: 9 }}>
              展示前 {data.products.length} 个商品 · 全部商品见商品分析
            </span>
            <button className="link" onClick={() => navigate(`/products?range=${range}&channel=${channel}`)}>
              查看完整排行 <ArrowRight />
            </button>
          </div>
        </Card>

        <div className="span-4 stack">
          <section className="ai-card">
            <div className="card-head">
              <div className="ai-card-title">
                <span className="ai-badge">
                  <Sparkles />
                </span>
                <div>
                  <h3 className="card-title">AI 运营建议</h3>
                  <p className="card-sub">基于经营指标与商品数据</p>
                </div>
              </div>
              <span className="badge badge-violet">AI</span>
            </div>
            <div className="insight-list">
              {data.insights.map((insight, index) => (
                <div className="insight-item" key={insight.title}>
                  <div className="insight-index">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <div className="insight-title">
                      {insight.title}
                      <span className={`badge badge-${insight.tone}`}>{insight.tag}</span>
                    </div>
                    <p className="insight-text">{insight.text}</p>
                    <div className="insight-evidence">{insight.evidence}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="ai-footer">
              <Button variant="primary" className="btn-block" onClick={() => aiLink("请根据当前经营数据生成明日运营计划")}>
                <Sparkles /> 一键生成运营计划
              </Button>
            </div>
          </section>

          <Card bodyClassName="mini-chat">
            <div className="mini-chat-head">
              <Sparkles /> 智能问答
            </div>
            <form
              className="mini-chat-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (question.trim()) aiLink(question.trim());
              }}
            >
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="问问你的经营数据..."
              />
              <button type="submit" aria-label="发送">
                <Send />
              </button>
            </form>
            <div className="mini-chat-hint">例如：哪些商品存在库存风险？</div>
          </Card>
        </div>
      </div>

      <div className="data-note">
        <ShieldCheck /> 数据范围：{data.range.start} 至 {data.range.end} · {scope} · 所有指标由程序计算，AI 仅负责解释。
      </div>
    </>
  );
}
