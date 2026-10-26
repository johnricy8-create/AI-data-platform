import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, ShieldCheck, ShoppingBag, Target, Users, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { useFilters } from "../context/Filters";
import { channelLabel, fmtMoney, fmtNum, fmtPct, rangeLabel } from "../lib/format";
import { Button, Card, ErrorState, KpiCard, LoadingPage, PageHeader } from "../components/UI";
import { CategoryPie, ChannelBars, Funnel, RefundChart, TrendChart } from "../components/Charts";

export function SalesPage() {
  const { range, channel } = useFilters();
  const query = useQuery({
    queryKey: ["sales", range, channel],
    queryFn: () => api.sales({ range, channel }),
  });

  if (query.isLoading) {
    return (
      <>
        <PageHeader eyebrow="Sales" title="销售分析" subtitle="正在汇总销售结构…" />
        <LoadingPage />
      </>
    );
  }

  if (query.isError || !query.data) {
    return (
      <>
        <PageHeader eyebrow="Sales" title="销售分析" subtitle="从趋势、渠道、品类与订单状态拆解销售。" />
        <ErrorState message={query.error instanceof Error ? query.error.message : "未知错误"} onRetry={() => query.refetch()} />
      </>
    );
  }

  const data = query.data;
  const kpis = data.kpis;
  const scope = channel === "all" ? "全渠道" : channelLabel(channel);
  const compare = range === "today" ? "较昨日" : range === "7d" ? "较上周" : range === "30d" ? "较上月" : "较上期";

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="销售分析"
        subtitle={`拆解 ${scope} 的销售趋势、渠道结构、品类贡献与订单状态。范围：${rangeLabel[range]}`}
        actions={
          <Button onClick={() => toast.success("销售分析报表已生成（演示导出）")}>
            <Download /> 导出销售报表
          </Button>
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
          spark={data.trend.sales.slice(-7)}
        />
        <KpiCard
          label="订单量"
          value={fmtNum(kpis.orders)}
          icon={<ShoppingBag />}
          accent="teal"
          growth={kpis.orders_growth}
          compare={compare}
          spark={data.trend.orders.slice(-7)}
        />
        <KpiCard
          label="访客数"
          value={fmtNum(kpis.visitors)}
          icon={<Users />}
          accent="violet"
          growth={kpis.visitors_growth}
          compare={compare}
          spark={data.trend.visitors.slice(-7)}
        />
        <KpiCard
          label="转化率"
          value={fmtPct(kpis.conversion)}
          icon={<Target />}
          accent="amber"
          growth={kpis.conversion_growth}
          compare={compare}
          spark={data.trend.conversion}
          suffix="pp"
        />
      </div>

      <div className="grid-12">
        <Card
          className="span-8"
          title="销售趋势"
          subtitle={`销售额、订单量与上期对比 · ${rangeLabel[range]}`}
          actions={<span className="badge badge-blue">{rangeLabel[range]}</span>}
        >
          <TrendChart data={data.trend} height={320} />
        </Card>

        <Card
          className="span-4"
          title="渠道销售占比"
          subtitle="渠道贡献与结构"
          actions={<span className="badge badge-gray">{data.channels.length} 个渠道</span>}
        >
          <ChannelBars channels={data.channels} total={kpis.sales} active={channel !== "all" ? channel : undefined} />
          <div className="channel-foot">
            <ShieldCheck /> 渠道口径统一，支持后续接入平台 API
          </div>
        </Card>

        <Card
          className="span-4"
          title="品类销售结构"
          subtitle="按净销售额统计"
          actions={<span className="badge badge-violet">品类</span>}
        >
          <CategoryPie data={data.categories} height={250} />
        </Card>

        <Card
          className="span-4"
          title="订单状态分布"
          subtitle="订单数与占比 · 含取消订单"
          actions={<span className="badge badge-gray">{data.status.length} 种状态</span>}
        >
          <Funnel status={data.status} />
          <div className="channel-foot">
            <ShieldCheck /> 销售口径仅包含已支付/已发货/已完成/退款相关订单
          </div>
        </Card>

        <Card
          className="span-4"
          title="退款趋势"
          subtitle="退款金额按日汇总"
          actions={<span className="badge badge-danger">退款</span>}
        >
          <RefundChart data={data.trend} height={250} />
          <div className="channel-foot">
            <ShieldCheck /> 退款率 {fmtPct(kpis.refund_rate)} · 退款金额 {fmtMoney(kpis.refund_amount)}
          </div>
        </Card>
      </div>

      <div className="data-note">
        <ShieldCheck /> 数据范围：{data.range.start} 至 {data.range.end} · {scope} · 所有指标由 SQL 指标层计算。
      </div>
    </>
  );
}
