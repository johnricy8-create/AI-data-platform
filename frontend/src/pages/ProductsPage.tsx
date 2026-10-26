import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  ExternalLink,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { api, type ProductRow } from "../lib/api";
import { useFilters } from "../context/Filters";
import { fmtDelta, fmtMoney, fmtNum, fmtPct, rangeLabel } from "../lib/format";
import {
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  LoadingPage,
  PageHeader,
  ProductThumb,
} from "../components/UI";
import { ProductTrendChart, ScatterChart } from "../components/Charts";

const tones = ["blue", "teal", "violet", "amber", "rose", "indigo", "sky", "emerald", "cyan", "lime"];

type SortKey = "sales" | "qty" | "margin" | "refund";

export function ProductsPage() {
  const navigate = useNavigate();
  const { range, channel } = useFilters();
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<SortKey>("sales");
  const [selectedId, setSelectedId] = useState<string | null>(params.get("product"));
  const query = useQuery({
    queryKey: ["products", range, channel],
    queryFn: () => api.products({ range, channel }),
  });

  useEffect(() => {
    const product = params.get("product");
    if (product) setSelectedId(product);
  }, [params]);

  const sorted = useMemo(() => {
    if (!query.data) return [];
    return [...query.data.products].sort((a, b) => Number(b[sort]) - Number(a[sort]));
  }, [query.data, sort]);

  const openProduct = (product: ProductRow) => {
    setSelectedId(product.id);
    const next = new URLSearchParams(params);
    next.set("product", product.id);
    setParams(next, { replace: true });
  };

  const closeProduct = () => {
    setSelectedId(null);
    const next = new URLSearchParams(params);
    next.delete("product");
    setParams(next, { replace: true });
  };

  const aiProduct = (product: { name: string }) => {
    const question = `请分析${product.name}的销售、毛利和库存表现，并给出优化建议`;
    navigate(`/ai?${new URLSearchParams({ q: question, range, channel }).toString()}`);
  };

  if (query.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Products" title="商品分析" subtitle="正在计算商品指标…" />
        <LoadingPage />
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader eyebrow="Products" title="商品分析" subtitle="从销售、毛利、退款与库存四个维度分析商品。" />
        <ErrorState message={query.error instanceof Error ? query.error.message : "未知错误"} onRetry={() => query.refetch()} />
      </>
    );
  }

  const data = query.data;
  const summary = data.summary;

  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="商品分析"
        subtitle={`从销售额、毛利、退款与库存四个维度，找到值得加注和需要调整的商品。范围：${rangeLabel[range]}`}
        actions={
          <>
            <Button onClick={() => toast.success("商品报表已生成（演示导出）")}>
              <Download /> 导出商品报表
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/ai?${new URLSearchParams({ q: "哪些商品值得重点推广？", range, channel }).toString()}`)}
            >
              <Sparkles /> 生成选品建议
            </Button>
          </>
        }
      />

      <div className="mini-kpi-grid">
        <div className="mini-kpi accent-blue">
          <span className="mini-kpi-icon"><Package /></span>
          <div><span>在售商品</span><strong>{summary.active_products}</strong></div>
        </div>
        <div className="mini-kpi accent-teal">
          <span className="mini-kpi-icon"><TrendingUp /></span>
          <div><span>高增长商品</span><strong>{summary.hot_products}</strong></div>
        </div>
        <div className="mini-kpi accent-amber">
          <span className="mini-kpi-icon"><AlertTriangle /></span>
          <div><span>库存预警</span><strong>{summary.inventory_alerts}</strong></div>
        </div>
        <div className="mini-kpi accent-violet">
          <span className="mini-kpi-icon"><ArrowUpRight /></span>
          <div><span>平均毛利率</span><strong>{fmtPct(summary.avg_margin, 1)}</strong></div>
        </div>
      </div>

      <div className="grid-12">
        <Card
          className="span-8"
          title="商品经营排行"
          subtitle={`${rangeLabel[range]} · 点击右上角切换排序`}
          actions={
            <div className="tabs">
              {[
                { key: "sales", label: "销售额" },
                { key: "qty", label: "销量" },
                { key: "margin", label: "毛利率" },
                { key: "refund", label: "退款率" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`tab ${sort === tab.key ? "active" : ""}`}
                  onClick={() => setSort(tab.key as SortKey)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
          flush
        >
          {sorted.length ? (
            <div className="table-wrap" style={{ paddingTop: 10 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>商品</th>
                    <th className="num">销量</th>
                    <th className="num">销售额</th>
                    <th className="num">毛利率</th>
                    <th className="num">退款率</th>
                    <th className="num">库存</th>
                    <th className="num">趋势</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(0, 10).map((product, index) => {
                    const lowStock = product.stock < product.safety;
                    return (
                      <tr key={product.id} onClick={() => openProduct(product)}>
                        <td>
                          <div className="product-cell">
                            <span className={`rank ${index < 3 ? "top" : ""}`}>{index + 1}</span>
                            <ProductThumb tone={tones[index % tones.length]} />
                            <div>
                              <div className="product-name">{product.name}</div>
                              <div className="product-meta">
                                {product.category} · SKU {product.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="num">{fmtNum(product.qty)}</td>
                        <td className="num strong">{fmtMoney(product.sales)}</td>
                        <td className="num">{fmtPct(product.margin, 1)}</td>
                        <td className="num">{fmtPct(product.refund, 1)}</td>
                        <td className="num">
                          <span style={{ color: lowStock ? "#BE123C" : undefined, fontWeight: lowStock ? 700 : 500 }}>
                            {fmtNum(product.stock)}
                          </span>
                        </td>
                        <td className="num">
                          <span className={`delta ${product.growth >= 0 ? "up" : "down"}`}>
                            {product.growth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
                            {Math.abs(product.growth).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="暂无商品数据" description="请先导入订单和商品数据。" />
          )}
          <div className="card-footer">
            <span className="muted-2" style={{ fontSize: 9 }}>
              展示前 {Math.min(10, sorted.length)} 个商品 · 共 {sorted.length} 个
            </span>
            <button className="link" onClick={() => toast.info("完整商品列表将在后续版本开放筛选")}>
              查看全部 <ExternalLink />
            </button>
          </div>
        </Card>

        <div className="span-4 stack">
          <Card title="销售-毛利四象限" subtitle={`气泡大小代表销量 · ${rangeLabel[range]}`} actions={<Badge tone="blue">四象限</Badge>}>
            <ScatterChart data={data.scatter} height={292} />
          </Card>
          <Card
            title="库存预警"
            subtitle="低于安全库存或可售天数 < 7 天"
            actions={<Badge tone="danger">{data.inventory_alerts.length} 个</Badge>}
          >
            {data.inventory_alerts.length ? (
              <div className="inventory-list" style={{ padding: 0 }}>
                {data.inventory_alerts.map((item) => {
                  const ratio = Math.min(100, Math.round((item.stock / Math.max(item.safety, 1)) * 100));
                  return (
                    <div className="inventory-item" key={item.id}>
                      <div className="inventory-top">
                        <span className="inventory-name">
                          {item.name}
                          <span className={`tag ${item.level === "high" ? "red" : "amber"}`}>
                            {item.level === "high" ? "高风险" : "关注"}
                          </span>
                        </span>
                        <span className="muted-2" style={{ fontSize: 9 }}>
                          {item.stock} / {item.safety}
                        </span>
                      </div>
                      <div className="inventory-bar">
                        <div className={`inventory-fill ${item.level === "medium" ? "medium" : ""}`} style={{ width: `${ratio}%` }} />
                      </div>
                      <div className="inventory-meta">
                        <span>可售 {item.days} 天</span>
                        <span>{item.note}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="库存健康" description="当前没有低于安全库存的商品。" />
            )}
          </Card>
        </div>
      </div>

      <div className="diagnosis-strip" style={{ marginTop: 20 }}>
        <div className="diagnosis-cell">
          <span><TrendingUp /> 增长最快</span>
          <strong>{data.products.length ? [...data.products].sort((a, b) => b.growth - a.growth)[0]?.name : "—"}</strong>
          <p>结合增长率与库存，优先判断是否需要补货和加投。</p>
        </div>
        <div className="diagnosis-cell">
          <span><ArrowDownRight /> 毛利关注</span>
          <strong>{data.products.length ? [...data.products].sort((a, b) => a.margin - b.margin)[0]?.name : "—"}</strong>
          <p>低毛利商品优先检查采购成本、组合定价与平台费用。</p>
        </div>
        <div className="diagnosis-cell">
          <span><AlertTriangle /> 库存风险</span>
          <strong>{data.inventory_alerts.length} 个 SKU 需处理</strong>
          <p>可售天数低于 7 天的商品，建议今日生成补货计划。</p>
        </div>
      </div>

      {selectedId ? (
        <ProductDrawer
          productId={selectedId}
          onClose={closeProduct}
          onAsk={aiProduct}
        />
      ) : null}
    </>
  );
}

function ProductDrawer({
  productId,
  onClose,
  onAsk,
}: {
  productId: string;
  onClose: () => void;
  onAsk: (product: { id: string; name: string }) => void;
}) {
  const navigate = useNavigate();
  const { range, channel } = useFilters();
  const query = useQuery({
    queryKey: ["product", productId],
    queryFn: () => api.product(productId),
  });

  if (query.isLoading) {
    return (
      <Drawer title="商品经营详情" subtitle="正在加载…" onClose={onClose}>
        <div className="skeleton" style={{ height: 260 }} />
      </Drawer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <Drawer title="商品经营详情" onClose={onClose}>
        <ErrorState message={query.error instanceof Error ? query.error.message : "加载失败"} onRetry={() => query.refetch()} />
      </Drawer>
    );
  }

  const detail = query.data;
  const product = detail.product;
  const metrics = detail.metrics;

  return (
    <Drawer title="商品经营详情" subtitle="近 30 天 · 实时聚合" onClose={onClose}>
      <div className="drawer-hero">
        <ProductThumb tone="blue" size="lg" />
        <div>
          <h4>{product.name}</h4>
          <p>{product.category} · SKU {product.id}</p>
        </div>
        <Badge tone={detail.inventory.stock < detail.inventory.safety ? "danger" : "success"} className="ml-auto">
          {detail.inventory.stock < detail.inventory.safety ? "库存风险" : "库存健康"}
        </Badge>
      </div>

      <div className="drawer-kpis">
        <div><span>近30天销售额</span><strong>{fmtMoney(metrics.sales)}</strong></div>
        <div><span>销量</span><strong>{fmtNum(metrics.qty)}</strong></div>
        <div><span>毛利率</span><strong>{fmtPct(metrics.margin, 1)}</strong></div>
        <div><span>当前库存</span><strong style={{ color: detail.inventory.stock < detail.inventory.safety ? "#BE123C" : undefined }}>{fmtNum(detail.inventory.stock)}</strong></div>
      </div>

      <Card title="近 7 天销售额" subtitle="按商品动销趋势" actions={<Badge tone={metrics.growth >= 0 ? "success" : "danger"}>{fmtDelta(metrics.growth)}</Badge>}>
        <ProductTrendChart data={detail.trend} />
      </Card>

      <div className="ai-diagnosis" style={{ marginTop: 14 }}>
        <div className="ai-diagnosis-head"><Sparkles /> AI 经营诊断</div>
        <p>{detail.diagnosis}</p>
      </div>

      <div className="drawer-extra">
        <div><span>退款率</span><strong>{fmtPct(metrics.refund, 1)}</strong></div>
        <div><span>安全库存</span><strong>{fmtNum(detail.inventory.safety)}</strong></div>
        <div><span>30天销量</span><strong>{fmtNum(metrics.qty)}</strong></div>
        <div><span>环比增长</span><strong>{fmtDelta(metrics.growth)}</strong></div>
      </div>

      <div className="drawer-actions">
        <Button variant="primary" onClick={() => onAsk({ id: product.id, name: product.name })}>
          <Sparkles /> 生成优化建议
        </Button>
        <Button onClick={() => navigate(`/sales?range=${range}&channel=${channel}`)}>
          <ExternalLink /> 查看销售分析
        </Button>
      </div>
    </Drawer>
  );
}
