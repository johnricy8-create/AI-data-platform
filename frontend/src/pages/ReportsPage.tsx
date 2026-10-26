import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock3, Download, FileText, Sparkles, Timer, Cpu } from "lucide-react";
import { api } from "../lib/api";
import { fmtDateTime, fmtSeconds } from "../lib/format";
import { Badge, Card, EmptyState, ErrorState, LoadingPage, Modal, PageHeader } from "../components/UI";
import { ReportCard } from "../components/ReportCard";

export function ReportsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["reports"],
    queryFn: () => api.reports(50),
  });
  const reportQuery = useQuery({
    queryKey: ["report", selectedId],
    queryFn: () => api.report(selectedId as string),
    enabled: Boolean(selectedId),
  });

  if (query.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Reports" title="报告中心" subtitle="正在加载历史分析…" />
        <LoadingPage />
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader eyebrow="Reports" title="报告中心" subtitle="查看 AI 生成的经营分析报告。" />
        <ErrorState message={query.error instanceof Error ? query.error.message : "未知错误"} onRetry={() => query.refetch()} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="报告中心"
        subtitle="每次 AI 分析都会自动保存，包含结论、证据、原因与建议动作。"
        actions={<Badge tone="blue">{query.data.items.length} 份报告</Badge>}
      />

      <Card title="历史报告" subtitle="按生成时间倒序" actions={<span className="badge badge-gray">只读</span>}>
        {query.data.items.length ? (
          <div className="report-list">
            {query.data.items.map((item) => (
              <article className="report-item" key={item.id} onClick={() => setSelectedId(item.id)}>
                <div className="report-item-head">
                  <div>
                    <h4>{item.headline || "经营分析报告"}</h4>
                    <p>{item.summary}</p>
                  </div>
                  <Badge tone={item.mode === "zhipu" ? "violet" : "amber"}>
                    {item.mode === "zhipu" ? "AI" : "规则"}
                  </Badge>
                </div>
                <div className="report-meta">
                  <span><FileText /> {item.question}</span>
                  <span><Clock3 /> {fmtDateTime(item.created_at)}</span>
                  <span><Cpu /> {item.model || "规则引擎"}</span>
                  <span><Timer /> {fmtSeconds(item.latency_ms)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="还没有报告" description="去 AI 运营助手提出第一个经营问题，报告会自动保存到这里。" />
        )}
      </Card>

      {selectedId ? (
        <Modal
          title="分析报告"
          subtitle={reportQuery.data ? `${reportQuery.data.range.start} 至 ${reportQuery.data.range.end}` : "正在加载…"}
          onClose={() => setSelectedId(null)}
          wide
        >
          <div className="modal-body">
            {reportQuery.isLoading ? (
              <div className="skeleton" style={{ height: 300 }} />
            ) : reportQuery.isError || !reportQuery.data ? (
              <ErrorState
                message={reportQuery.error instanceof Error ? reportQuery.error.message : "报告加载失败"}
                onRetry={() => reportQuery.refetch()}
              />
            ) : (
              <>
                <ReportCard
                  response={reportQuery.data}
                  onSave={() => toast.success("报告已在报告中心")}
                  onPlan={() => toast.info("请在 AI 助手中继续生成运营计划")}
                />
                <div className="answer-actions" style={{ marginTop: 14 }}>
                  <a className="btn btn-soft" href={api.reportMarkdownUrl(reportQuery.data.id)}>
                    <Download /> 导出 Markdown
                  </a>
                  <span className="source-chip">
                    <Sparkles /> 自动保存 · {fmtDateTime(reportQuery.data.created_at)}
                  </span>
                </div>
              </>
            )}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
