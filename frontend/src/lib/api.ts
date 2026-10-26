export type RangeKey = "today" | "7d" | "30d" | "90d";

export interface Kpis {
  sales: number;
  sales_cents: number;
  orders: number;
  visitors: number;
  conversion: number;
  aov: number;
  gross_profit: number;
  gross_margin: number;
  refund_amount: number;
  refund_rate: number;
  previous: {
    sales: number;
    orders: number;
    visitors: number;
    conversion: number;
    gross_margin: number;
    refund_rate: number;
  };
  sales_growth: number;
  orders_growth: number;
  visitors_growth: number;
  conversion_growth: number;
  gross_margin_growth: number;
  refund_rate_growth: number;
}

export interface Trend {
  labels: string[];
  sales: number[];
  orders: number[];
  visitors: number[];
  conversion: number[];
  previous_sales: number[];
  refunds: number[];
}

export interface ChannelRow {
  name: string;
  sales: number;
  orders: number;
  share: number;
  growth: number;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  sale_price: number;
  qty: number;
  net_qty: number;
  sales: number;
  sales_cents: number;
  gross_profit: number;
  margin: number;
  refund: number;
  growth: number;
  stock: number;
  safety: number;
}

export interface InventoryAlert {
  id: string;
  name: string;
  stock: number;
  safety: number;
  days: number;
  level: "high" | "medium";
  note: string;
}

export interface Insight {
  tag: string;
  tone: string;
  title: string;
  text: string;
  evidence: string;
}

export interface RangeInfo {
  start: string;
  end: string;
  key?: string;
  label?: string;
  channel?: string;
  category?: string;
}

export interface OverviewData {
  range: RangeInfo;
  kpis: Kpis;
  trend: Trend;
  channels: ChannelRow[];
  products: ProductRow[];
  inventory_alerts: InventoryAlert[];
  insights: Insight[];
}

export interface ProductsData {
  products: ProductRow[];
  inventory_alerts: InventoryAlert[];
  summary: {
    active_products: number;
    hot_products: number;
    inventory_alerts: number;
    avg_margin: number;
  };
  scatter: Array<{ id: string; name: string; sales: number; margin: number; qty: number }>;
  insights: Insight[];
}

export interface SalesData {
  range: RangeInfo;
  kpis: Kpis;
  trend: Trend;
  channels: ChannelRow[];
  categories: Array<{ name: string; sales: number; share: number }>;
  status: Array<{ status: string; label: string; count: number }>;
}

export interface MetaData {
  min_date: string;
  max_date: string;
  channels: string[];
  categories: string[];
  products: Array<{ id: string; name: string; category: string }>;
  demo: boolean;
}

export interface ProductDetail {
  product: {
    id: string;
    name: string;
    category: string;
    sale_price: number;
    cost_price: number;
    status: string;
  };
  metrics: {
    sales: number;
    qty: number;
    margin: number;
    growth: number;
    refund: number;
  };
  inventory: {
    stock: number;
    safety: number;
    lead_time_days: number;
  };
  trend: { labels: string[]; sales: number[] };
  diagnosis: string;
}

export interface ImportError {
  row: number;
  field: string;
  value: string;
  reason: string;
}

export interface ImportExtraction {
  source?: "table" | "document";
  format?: string;
  mode?: "direct" | "llm";
  rows_extracted?: number;
  warnings?: string[];
  model?: string;
  tokens?: number;
  latency_ms?: number;
  pages?: number;
  slides?: number;
  text_chars?: number;
  table_count?: number;
  converted_from?: string | null;
}

export interface ImportJob {
  id: string;
  filename: string;
  data_type: string;
  rows: number;
  success_count: number;
  failed_count: number;
  status: "success" | "partial" | "failed";
  error_message: string | null;
  errors: ImportError[];
  extraction?: ImportExtraction | null;
  created_at: string;
}

export interface ImportFormats {
  data_types: string[];
  table_formats: string[];
  document_formats: string[];
  legacy_formats: string[];
  max_upload_mb: number;
  document_mode: string;
}

export interface AIEvidence {
  id: string;
  label: string;
  value: string;
  source: string;
}

export interface AIFinding {
  text: string;
  evidence_ids: string[];
  confidence: "high" | "medium" | "low";
}

export interface AIAction {
  priority: "P0" | "P1" | "P2";
  title: string;
  detail: string;
  evidence_ids: string[];
}

export interface AIReportBody {
  headline: string;
  summary: string;
  findings: AIFinding[];
  causes: AIFinding[];
  actions: AIAction[];
  data_gaps: string[];
  source: "llm" | "fallback";
  evidence?: AIEvidence[];
  kpis?: Kpis;
}

export interface AIResponse {
  id: string;
  question: string;
  range: RangeInfo;
  kpis: Kpis;
  evidence: AIEvidence[];
  report: AIReportBody;
  model: string | null;
  mode: "zhipu" | "fallback";
  tokens: number;
  latency_ms: number;
  llm_latency_ms: number;
  attempts: Array<Record<string, unknown>>;
  llm_error: string | null;
  created_at: string;
}

export interface AIReportListItem {
  id: string;
  question: string;
  headline: string;
  summary: string;
  mode: string;
  model: string | null;
  tokens: number | null;
  latency_ms: number | null;
  created_at: string;
}

export interface AIHealth {
  enabled: boolean;
  mode: string;
  primary_model: string;
  fallback_models: string[];
  base_url: string;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || "/api/v1";

function query(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      search.set(key, String(value));
    }
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      const body = await response.json();
      message = body.detail || message;
    } catch {
      // ignore non-JSON errors
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export const api = {
  base: API_BASE,
  meta: () => request<MetaData>("/meta/filters"),
  overview: (params: { range: RangeKey; channel: string; category?: string }) =>
    request<OverviewData>(`/overview${query({ range: params.range, channel: params.channel, category: params.category })}`),
  products: (params: { range: RangeKey; channel: string; category?: string }) =>
    request<ProductsData>(`/products${query({ range: params.range, channel: params.channel, category: params.category })}`),
  product: (id: string) => request<ProductDetail>(`/products/${id}`),
  sales: (params: { range: RangeKey; channel: string; category?: string }) =>
    request<SalesData>(`/sales${query({ range: params.range, channel: params.channel, category: params.category })}`),
  imports: () => request<{ items: ImportJob[] }>("/imports"),
  importFormats: () => request<ImportFormats>("/imports/formats"),
  uploadImport: (file: File, dataType: string) => {
    const form = new FormData();
    form.append("file", file);
    form.append("data_type", dataType);
    return request<ImportJob>("/imports", { method: "POST", body: form });
  },
  templateUrl: (dataType: string) => `${API_BASE}/imports/template/${dataType}`,
  chat: (payload: {
    question: string;
    range: RangeKey;
    channel: string;
    category?: string;
  }) =>
    request<AIResponse>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({
        question: payload.question,
        range: payload.range,
        channel: payload.channel === "all" ? null : payload.channel,
        category: payload.category === "all" ? null : payload.category,
        save: true,
      }),
    }),
  reports: (limit = 30) => request<{ items: AIReportListItem[] }>(`/ai/reports?limit=${limit}`),
  report: (id: string) => request<AIResponse>(`/ai/reports/${id}`),
  reportMarkdownUrl: (id: string) => `${API_BASE}/ai/reports/${id}/markdown`,
  aiHealth: () => request<AIHealth>("/ai/health"),
};
