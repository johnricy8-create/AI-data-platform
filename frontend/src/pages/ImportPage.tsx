import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { api, type ImportJob } from "../lib/api";
import { fmtDateTime, fmtNum } from "../lib/format";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingPage, PageHeader } from "../components/UI";

const dataTypes = [
  { value: "orders", label: "订单 orders" },
  { value: "products", label: "商品 products" },
  { value: "traffic", label: "流量 traffic" },
  { value: "inventory", label: "库存 inventory" },
];

const fields: Record<string, Array<[string, string, string]>> = {
  orders: [
    ["order_id", "订单号", "文本"],
    ["order_date", "下单日期", "日期"],
    ["channel", "渠道", "枚举"],
    ["status", "订单状态", "枚举"],
    ["product_id", "商品 ID", "文本"],
    ["quantity", "数量", "整数"],
    ["unit_price", "成交单价（元）", "金额"],
    ["cost_price", "成本单价（元）", "金额"],
  ],
  products: [
    ["product_id", "商品 ID", "文本"],
    ["name", "商品名称", "文本"],
    ["category", "品类", "文本"],
    ["cost_price", "成本价（元）", "金额"],
    ["sale_price", "售价（元）", "金额"],
  ],
  traffic: [
    ["date", "日期", "日期"],
    ["channel", "渠道", "枚举"],
    ["visitors", "访客数", "整数"],
    ["page_views", "浏览量", "整数"],
    ["add_to_cart", "加购数", "整数"],
    ["paid_buyers", "支付买家数", "整数"],
  ],
  inventory: [
    ["product_id", "商品 ID", "文本"],
    ["stock_quantity", "当前库存", "整数"],
    ["safety_stock", "安全库存", "整数"],
    ["lead_time_days", "交期（天）", "整数"],
  ],
};

const steps = ["读取文件", "文档解析", "字段映射", "数据校验", "写入数据库"];

const supportedFormats = [
  { label: "CSV", tone: "green" },
  { label: "Excel .xlsx / .xls", tone: "green" },
  { label: "Word .docx", tone: "blue" },
  { label: "PPT .pptx", tone: "violet" },
  { label: "PDF", tone: "amber" },
];

export function ImportPage() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const [dataType, setDataType] = useState("orders");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["imports"],
    queryFn: api.imports,
  });

  if (query.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Data Ingestion" title="数据接入" subtitle="正在加载导入任务…" />
        <LoadingPage />
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader eyebrow="Data Ingestion" title="数据接入" subtitle="上传订单、商品、流量与库存文件。" />
        <ErrorState message={query.error instanceof Error ? query.error.message : "未知错误"} onRetry={() => query.refetch()} />
      </>
    );
  }

  const latest = result || query.data.items[0] || null;
  const latestSuccessRate = latest && latest.rows ? (latest.success_count / latest.rows) * 100 : 100;
  const score = Math.max(0, Math.min(100, Number(latestSuccessRate.toFixed(1))));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setResult(null);
    setStage(0);
    timerRef.current = window.setInterval(() => {
      setStage((value) => Math.min(4, value + 1));
    }, 650);
    try {
      const job = await api.uploadImport(file, dataType);
      setResult(job);
      setStage(5);
      await queryClient.invalidateQueries({ queryKey: ["imports"] });
      toast.success(`导入完成：${job.success_count} 条成功，${job.failed_count} 条失败`);
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : "上传失败");
      toast.error(exc instanceof Error ? exc.message : "上传失败");
    } finally {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setUploading(false);
    }
  };

  const onFileChange = (file?: File) => {
    if (file) void handleUpload(file);
  };

  const activeData = fields[dataType] || fields.orders;

  return (
    <>
      <PageHeader
        eyebrow="Data Ingestion"
        title="数据接入"
        subtitle="支持 CSV、Excel、Word、PPT、PDF；表格直读，文档由 AI 抽取并结构化为标准字段。"
        actions={
          <>
            <a className="btn btn-ghost" href={api.templateUrl(dataType)}>
              <Download /> 下载模板
            </a>
            <Button onClick={() => toast.info("Excel/CSV 直接导入；Word/PPT/PDF 先抽取文本与表格，再由 AI 转成标准字段")}>
              <FileText /> 接入规范
            </Button>
          </>
        }
      />

      <div className="grid-12">
        <Card
          className="upload-card span-8"
          title="上传数据文件"
          subtitle="CSV / Excel 直接解析；Word / PPT / PDF 使用 AI 文档解析 · 单文件 ≤ 20MB"
          actions={<Badge tone="blue">表格 + 文档</Badge>}
        >
          <div
            className={`dropzone ${dragging ? "drag" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              onFileChange(event.dataTransfer.files?.[0]);
            }}
          >
            <div className="dropzone-icon"><UploadCloud /></div>
            <h4>拖拽文件到这里，或点击选择文件</h4>
            <p>支持表格与文档；文档会先抽取表格/文本，再由 AI 结构化</p>
            <div className="format-chips">
              {supportedFormats.map((format) => (
                <span className={`chip ${format.tone === "green" ? "active" : ""}`} key={format.label}>
                  {format.label}
                </span>
              ))}
            </div>
            <div className="upload-controls" onClick={(event) => event.stopPropagation()}>
              <select value={dataType} onChange={(event) => setDataType(event.target.value)}>
                {dataTypes.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <a className="link" href={api.templateUrl(dataType)}>
                <Download /> 下载当前模板
              </a>
            </div>
            <div className="upload-spec" style={{ margin: "10px auto 0", maxWidth: 560, textAlign: "left" }}>
              <FileText />
              <span>
                `.docx` / `.pptx` / `.pdf` 会调用智谱 AI 抽取数据；
                旧版 `.doc` / `.ppt` 请先另存为 `.docx` / `.pptx`。扫描版 PDF 需要 OCR。
              </span>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.docx,.pptx,.pdf,.doc,.ppt"
            hidden
            onChange={(event) => {
              onFileChange(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />

          <div className="upload-steps">
            {steps.map((label, index) => {
              const done = stage > index;
              const active = uploading && stage === index;
              return (
                <div className={`step ${done ? "done" : ""} ${active ? "active" : ""}`} key={label}>
                  <span className="step-dot">{done ? <CheckCircle2 /> : index + 1}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>

          {error ? (
            <div className="import-result-card error">
              <h4><AlertTriangle /> 导入失败</h4>
              <p className="muted-line" style={{ margin: 0 }}>{error}</p>
            </div>
          ) : null}

          {result ? (
            <div className="import-result-card">
              <h4><CheckCircle2 /> 导入完成 · {result.filename}</h4>
              <div className="import-stat-row">
                <span><strong>{fmtNum(result.success_count)}</strong> 成功</span>
                <span><strong style={{ color: "#BE123C" }}>{fmtNum(result.failed_count)}</strong> 失败</span>
                <span><strong>{result.rows}</strong> 总行数</span>
                <span>状态 <strong>{result.status === "success" ? "成功" : result.status === "partial" ? "部分成功" : "失败"}</strong></span>
              </div>
              {result.extraction ? (
                <div className="import-stat-row" style={{ marginTop: 7 }}>
                  <span>
                    <strong>{result.extraction.mode === "llm" ? "AI 文档解析" : "表格直读"}</strong>
                    {result.extraction.format ? ` · ${result.extraction.format.toUpperCase()}` : ""}
                    {result.extraction.model ? ` · ${result.extraction.model}` : ""}
                  </span>
                  {result.extraction.rows_extracted !== undefined ? (
                    <span>抽取 <strong>{result.extraction.rows_extracted}</strong> 行</span>
                  ) : null}
                </div>
              ) : null}
              {result.extraction?.warnings?.length ? (
                <p className="muted-line" style={{ margin: "6px 0 0" }}>
                  提示：{result.extraction.warnings.join("；")}
                </p>
              ) : null}
              {result.errors.length ? (
                <button className="link" style={{ marginTop: 8 }} onClick={() => toast.info("错误明细已保留在任务记录中")}>
                  <Download /> 查看 {result.errors.length} 条错误明细
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="upload-spec">
            <ShieldCheck />
            Excel/CSV 直接读取；Word/PPT/PDF 先抽取文本与表格，再由 AI 转成标准字段。订单按 order_id 幂等，商品/库存按 product_id 更新，流量按日期+渠道覆盖。
          </div>
        </Card>

        <Card
          className="span-4"
          title="数据质量概览"
          subtitle={latest ? `最近任务 · ${latest.filename}` : "暂无导入任务"}
          actions={<Badge tone={score >= 95 ? "success" : "amber"}>{score >= 95 ? "优秀" : "需关注"}</Badge>}
        >
          <div className="quality-ring" style={{ background: `conic-gradient(#10b981 0 ${score}%, #eaf0f7 ${score}% 100%)` }}>
            <div className="quality-ring-content">
              <strong>{score.toFixed(1)}</strong>
              <span>质量评分</span>
            </div>
          </div>
          <div className="quality-dims" style={{ padding: 0 }}>
            <div className="quality-dim"><span>完整性</span><div className="quality-dim-track"><div className="quality-dim-fill" style={{ width: `${score}%` }} /></div><strong>{score.toFixed(1)}%</strong></div>
            <div className="quality-dim"><span>唯一性</span><div className="quality-dim-track"><div className="quality-dim-fill" style={{ width: "100%" }} /></div><strong>100%</strong></div>
            <div className="quality-dim"><span>有效性</span><div className="quality-dim-track"><div className="quality-dim-fill" style={{ width: `${score}%` }} /></div><strong>{score.toFixed(1)}%</strong></div>
            <div className="quality-dim"><span>及时性</span><div className="quality-dim-track"><div className="quality-dim-fill" style={{ width: "100%" }} /></div><strong>100%</strong></div>
          </div>
          <div className="safety-note" style={{ marginTop: 12 }}>
            <strong>{latest?.extraction?.mode === "llm" ? "AI 文档解析" : "表格直读"}</strong>
            <br />
            {latest?.extraction?.format ? `格式 ${latest.extraction.format.toUpperCase()} · ` : ""}
            {latest?.extraction?.rows_extracted !== undefined ? `抽取 ${latest.extraction.rows_extracted} 行` : "支持 CSV / Excel / Word / PPT / PDF"}
          </div>
        </Card>

        <Card
          className="span-7"
          title="字段映射预览"
          subtitle={`当前类型：${dataTypes.find((item) => item.value === dataType)?.label}`}
          actions={<Badge tone="amber">模板字段</Badge>}
        >
          <div className="table-wrap">
            <table className="table mapping-table">
              <thead>
                <tr><th>标准字段</th><th>中文说明</th><th>类型</th><th>状态</th></tr>
              </thead>
              <tbody>
                {activeData.map(([field, label, type]) => (
                  <tr key={field}>
                    <td className="mapping-target">{field}</td>
                    <td>{label}</td>
                    <td>{type}</td>
                    <td><span className="tag green">已支持</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mapping-hint">
            上传时系统会按表头自动映射；缺少必填字段会阻止导入并返回行级错误。
          </div>
        </Card>

        <Card
          className="span-5"
          title="校验结果"
          subtitle={latest ? `${latest.failed_count} 个问题 · ${latest.id}` : "暂无任务"}
          actions={<Badge tone={latest?.failed_count ? "danger" : "success"}>{latest?.failed_count || 0} 条</Badge>}
        >
          {latest?.errors?.length ? (
            <div className="validation-list" style={{ padding: 0 }}>
              {latest.errors.slice(0, 6).map((item, index) => (
                <div className="validation-item" key={`${item.row}-${item.field}-${index}`}>
                  <span className={`validation-icon ${item.field === "product_id" ? "warning" : "error"}`}>
                    {item.field === "product_id" ? <Info /> : <AlertTriangle />}
                  </span>
                  <div>
                    <div className="validation-title">第 {item.row} 行 · {item.field}</div>
                    <div className="validation-meta">{item.reason}<br /><code>{item.value}</code></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="没有校验错误" description="最近一次导入全部通过，或尚未执行导入。" />
          )}
          <div className="card-footer" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span className="muted-2" style={{ fontSize: 9 }}>错误行不会写入数据库</span>
            <button className="link" onClick={() => toast.info("错误明细已保留在任务记录中")}>
              <Download /> 下载明细
            </button>
          </div>
        </Card>

        <Card
          className="span-12"
          title="导入历史"
          subtitle="最近 30 个导入任务"
          actions={<span className="badge badge-gray">{query.data.items.length} 个任务</span>}
          flush
        >
          {query.data.items.length ? (
            <div className="table-wrap" style={{ paddingTop: 10 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>任务 ID</th>
                    <th>文件</th>
                    <th>类型</th>
                    <th className="num">记录数</th>
                    <th className="num">失败</th>
                    <th>状态</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.items.map((item) => (
                    <tr key={item.id}>
                      <td><span className="mapping-target">{item.id}</span></td>
                      <td><FileSpreadsheet /> <span style={{ marginLeft: 5 }}>{item.filename}</span></td>
                      <td><span className="tag blue">{dataTypes.find((type) => type.value === item.data_type)?.label || item.data_type}</span></td>
                      <td className="num">{fmtNum(item.rows)}</td>
                      <td className="num" style={{ color: item.failed_count ? "#BE123C" : undefined }}>{item.failed_count}</td>
                      <td>
                        <Badge tone={item.status === "success" ? "success" : item.status === "partial" ? "amber" : "danger"}>
                          {item.status === "success" ? "成功" : item.status === "partial" ? "部分成功" : "失败"}
                        </Badge>
                      </td>
                      <td>{fmtDateTime(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="暂无导入记录" description="上传第一份订单或商品文件，开始建立数据资产。" />
          )}
        </Card>
      </div>
    </>
  );
}
