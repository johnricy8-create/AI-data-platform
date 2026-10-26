import { CheckCircle2, FileText, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import type { AIResponse } from "../lib/api";
import { fmtDelta, fmtMoney, fmtNum, fmtPct } from "../lib/format";
import { Confidence, Priority } from "./UI";

export function EvidenceChip({
  id,
  label,
}: {
  id: string;
  label?: string;
}) {
  return (
    <span className="evidence-ref" title={label || id}>
      {id}
    </span>
  );
}

export function ReportCard({
  response,
  onPlan,
  onSave,
}: {
  response: AIResponse;
  onPlan?: () => void;
  onSave?: () => void;
}) {
  const report = response.report;
  const kpis = response.kpis;
  const evidenceMap = new Map(response.evidence.map((item) => [item.id, item.label]));

  return (
    <div>
      <div className="answer-head">
        <span className={`badge ${response.mode === "zhipu" ? "badge-violet" : "badge-amber"}`}>
          <Sparkles /> {response.mode === "zhipu" ? "AI 分析" : "规则分析"}
        </span>
        <h4>{report.headline}</h4>
      </div>
      <p>{report.summary}</p>

      <div className="answer-kpis">
        <div>
          <span>净销售额</span>
          <strong>{fmtMoney(kpis.sales)}</strong>
          <em className={kpis.sales_growth >= 0 ? "up" : "down"}>{fmtDelta(kpis.sales_growth)}</em>
        </div>
        <div>
          <span>订单量</span>
          <strong>{fmtNum(kpis.orders)}</strong>
          <em className={kpis.orders_growth >= 0 ? "up" : "down"}>{fmtDelta(kpis.orders_growth)}</em>
        </div>
        <div>
          <span>转化率 / 毛利率</span>
          <strong>{fmtPct(kpis.conversion)}</strong>
          <em className="up">毛利 {fmtPct(kpis.gross_margin, 1)}</em>
        </div>
      </div>

      <div className="answer-section">
        <h5>数据依据</h5>
        <ul className="evidence-list">
          {report.findings.map((item, index) => (
            <li key={`${item.text}-${index}`}>
              <div>
                {item.text}
                <span style={{ marginLeft: 4 }}>
                  {item.evidence_ids.map((id) => (
                    <EvidenceChip key={id} id={id} label={evidenceMap.get(id)} />
                  ))}
                </span>
              </div>
              <Confidence value={item.confidence} />
            </li>
          ))}
        </ul>
      </div>

      <div className="answer-section">
        <h5>可能原因</h5>
        {report.causes.map((item, index) => (
          <div className="cause-row" key={`${item.text}-${index}`}>
            <span>{item.text}</span>
            <Confidence value={item.confidence} />
          </div>
        ))}
      </div>

      <div className="answer-section">
        <h5>建议动作</h5>
        <ol className="action-list">
          {report.actions.map((item, index) => (
            <li key={`${item.title}-${index}`}>
              <Priority value={item.priority} />
              <div>
                <strong>{item.title}</strong>
                {item.detail ? <p>{item.detail}</p> : null}
                {item.evidence_ids.length ? (
                  <div style={{ marginTop: 2 }}>
                    {item.evidence_ids.map((id) => (
                      <EvidenceChip key={id} id={id} label={evidenceMap.get(id)} />
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {report.data_gaps.length ? (
        <div className="answer-gaps">
          <TriangleAlert style={{ width: 12, height: 12, display: "inline", marginRight: 4 }} />
          <strong>需要补充：</strong>
          {report.data_gaps.join("；")}
        </div>
      ) : null}

      {response.evidence.length ? (
        <div className="answer-section">
          <h5>本次证据</h5>
          <div className="evidence-grid">
            {response.evidence.map((item) => (
              <div className="evidence-item" key={item.id}>
                <span>{item.id} · {item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="answer-actions">
        <button className="btn btn-soft" onClick={onSave}>
          <FileText /> 保存提示
        </button>
        <button className="btn btn-primary" onClick={onPlan}>
          <Sparkles /> 生成运营计划
        </button>
        <span className="source-chip" style={{ marginLeft: "auto" }}>
          <ShieldCheck /> {response.model || "规则引擎"} · {response.latency_ms}ms
        </span>
      </div>

      {response.llm_error ? (
        <p className="muted-line" style={{ marginTop: 8 }}>
          <CheckCircle2 style={{ width: 11, height: 11, display: "inline", marginRight: 4 }} />
          AI 调用未完成，已自动降级为规则分析：{response.llm_error}
        </p>
      ) : null}
    </div>
  );
}
