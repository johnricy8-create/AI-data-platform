import ReactECharts from "echarts-for-react";
import type { ChannelRow, SalesData, Trend } from "../lib/api";
import { fmtDate, fmtMoney, fmtNum, fmtPct } from "../lib/format";

const textMuted = "#94A3B8";
const gridLine = "#EEF3FA";

function axisMoney(value: number): string {
  if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
  return String(value);
}

export function TrendChart({
  data,
  height = 280,
  showPrevious = true,
}: {
  data: Trend;
  height?: number;
  showPrevious?: boolean;
}) {
  const option: any = {
    animationDuration: 600,
    color: ["#2563EB", "#B6C7DD", "#14B8A6"],
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      padding: [9, 11],
      textStyle: { color: "#fff", fontSize: 11 },
      formatter: (params: any[]) => {
        const index = params[0]?.dataIndex ?? 0;
        return `<div style="font-weight:700;margin-bottom:5px">${data.labels[index] || ""}</div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:#93C5FD">销售额</span><b>${fmtMoney(data.sales[index])}</b></div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:#5EEAD4">订单量</span><b>${fmtNum(data.orders[index])}</b></div>`;
      },
    },
    legend: {
      top: 0,
      right: 4,
      itemWidth: 7,
      itemHeight: 7,
      icon: "circle",
      itemGap: 12,
      textStyle: { color: "#64748B", fontSize: 10 },
      data: showPrevious ? ["本期销售额", "上期销售额", "订单量"] : ["销售额", "订单量"],
    },
    grid: { left: 8, right: 10, top: 36, bottom: 5, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.labels.map(fmtDate),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 9, interval: data.labels.length > 14 ? 4 : 0, margin: 10 },
    },
    yAxis: [
      {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 9, formatter: axisMoney },
        splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
      },
      {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: textMuted, fontSize: 9 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: showPrevious ? "本期销售额" : "销售额",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2.6, color: "#2563EB" },
        itemStyle: { color: "#2563EB" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(37,99,235,.22)" },
              { offset: 0.7, color: "rgba(37,99,235,.045)" },
              { offset: 1, color: "rgba(37,99,235,0)" },
            ],
          },
        },
        data: data.sales,
      },
      ...(showPrevious
        ? [
            {
              name: "上期销售额",
              type: "line",
              smooth: true,
              showSymbol: false,
              lineStyle: { width: 1.4, color: "#B6C7DD", type: "dashed" },
              itemStyle: { color: "#B6C7DD" },
              data: data.previous_sales,
            },
          ]
        : []),
      {
        name: "订单量",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.8, color: "#14B8A6" },
        itemStyle: { color: "#14B8A6" },
        data: data.orders,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

export function ScatterChart({
  data,
  height = 300,
}: {
  data: Array<{ id: string; name: string; sales: number; margin: number; qty: number }>;
  height?: number;
}) {
  const salesValues = data.map((item) => item.sales / 10000);
  const margins = data.map((item) => item.margin);
  const avgSales = salesValues.reduce((sum, value) => sum + value, 0) / Math.max(salesValues.length, 1);
  const avgMargin = margins.reduce((sum, value) => sum + value, 0) / Math.max(margins.length, 1);
  const maxSales = Math.ceil(Math.max(...salesValues, 1) / 20) * 20 + 15;
  const maxMargin = 60;
  const minMargin = 20;
  const topNames = new Set([...data].sort((a, b) => b.sales - a.sales).slice(0, 3).map((item) => item.name));

  const option: any = {
    animationDuration: 550,
    tooltip: {
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      padding: [8, 10],
      textStyle: { color: "#fff", fontSize: 10 },
      formatter: (params: any) =>
        `<b>${params.name}</b><br/>销售额 ¥${Number(params.value[0]).toFixed(1)}万<br/>毛利率 ${Number(params.value[1]).toFixed(1)}%<br/>销量 ${fmtNum(params.value[2])}`,
    },
    grid: { left: 6, right: 26, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: "value",
      min: 0,
      max: maxSales,
      name: "销售额（万元）",
      nameLocation: "middle",
      nameGap: 24,
      nameTextStyle: { color: textMuted, fontSize: 8 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 8 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    yAxis: {
      type: "value",
      min: minMargin,
      max: maxMargin,
      name: "毛利率（%）",
      nameTextStyle: { color: textMuted, fontSize: 8 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 8 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    series: [
      {
        type: "scatter",
        data: data.map((item) => ({
          name: item.name,
          value: [item.sales / 10000, item.margin, item.qty],
          itemStyle: {
            color:
              item.sales / 10000 >= avgSales
                ? item.margin >= avgMargin
                  ? "#2563EB"
                  : "#F59E0B"
                : item.margin >= avgMargin
                  ? "#14B8A6"
                  : "#94A3B8",
            borderColor: "#fff",
            borderWidth: 1.5,
            shadowBlur: 8,
            shadowColor: "rgba(37,99,235,.12)",
          },
        })),
        symbolSize: (value: number[]) => Math.max(11, Math.min(29, Math.sqrt(value[2]) / 4)),
        label: {
          show: true,
          position: "right",
          distance: 4,
          color: "#475569",
          fontSize: 8,
          formatter: (params: any) => (topNames.has(params.name) ? params.name : ""),
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#CBD5E1", type: "dashed", width: 1 },
          label: { show: false },
          data: [{ xAxis: avgSales }, { yAxis: avgMargin }],
        },
        markArea: {
          silent: true,
          label: { show: true, color: "#A8B6C9", fontSize: 8, position: "insideTopLeft" },
          data: [
            [{ name: "明星", xAxis: avgSales, yAxis: avgMargin }, { xAxis: maxSales, yAxis: maxMargin }],
            [{ name: "金牛", xAxis: avgSales, yAxis: minMargin }, { xAxis: maxSales, yAxis: avgMargin }],
            [{ name: "潜力", xAxis: 0, yAxis: avgMargin }, { xAxis: avgSales, yAxis: maxMargin }],
            [{ name: "调整", xAxis: 0, yAxis: minMargin }, { xAxis: avgSales, yAxis: avgMargin }],
          ].map((area, index) => [
            {
              ...area[0],
              itemStyle: {
                color: [
                  "rgba(37,99,235,.035)",
                  "rgba(245,158,11,.04)",
                  "rgba(20,184,166,.04)",
                  "rgba(148,163,184,.035)",
                ][index],
              },
            },
            area[1],
          ]),
        },
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

export function CategoryPie({ data, height = 220 }: { data: SalesData["categories"]; height?: number }) {
  const option: any = {
    tooltip: {
      trigger: "item",
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 10 },
      formatter: (params: any) => `${params.name}<br/>${fmtMoney(params.value)} · ${params.percent}%`,
    },
    legend: {
      bottom: 0,
      left: "center",
      itemWidth: 7,
      itemHeight: 7,
      icon: "circle",
      textStyle: { color: "#64748B", fontSize: 9 },
    },
    color: ["#2563EB", "#14B8A6", "#7C3AED", "#F59E0B", "#94A3B8"],
    series: [
      {
        type: "pie",
        radius: ["48%", "70%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        data: data.map((item) => ({ name: item.name, value: item.sales })),
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

export function RefundChart({ data, height = 210 }: { data: Trend; height?: number }) {
  const option: any = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 10 },
      formatter: (params: any[]) => {
        const index = params[0]?.dataIndex ?? 0;
        return `${data.labels[index] || ""}<br/>退款金额 <b>${fmtMoney(data.refunds[index])}</b>`;
      },
    },
    grid: { left: 8, right: 20, top: 10, bottom: 4, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.labels.map(fmtDate),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 8, interval: data.labels.length > 14 ? 4 : 0 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 8, formatter: axisMoney },
      splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#F43F5E" },
        itemStyle: { color: "#F43F5E" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(244,63,94,.18)" },
              { offset: 1, color: "rgba(244,63,94,0)" },
            ],
          },
        },
        data: data.refunds,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

export function ProductTrendChart({ data, height = 170 }: { data: { labels: string[]; sales: number[] }; height?: number }) {
  const option: any = {
    grid: { left: 34, right: 34, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      textStyle: { color: "#fff", fontSize: 9 },
      formatter: (params: any[]) => {
        const index = params[0]?.dataIndex ?? 0;
        return `${data.labels[index] || ""}<br/><b>${fmtMoney(data.sales[index])}</b>`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.labels.map(fmtDate),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textMuted, fontSize: 8, interval: 0 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 2, color: "#14B8A6" },
        itemStyle: { color: "#14B8A6" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(20,184,166,.22)" },
              { offset: 1, color: "rgba(20,184,166,0)" },
            ],
          },
        },
        data: data.sales,
      },
    ],
  };
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate />;
}

export function ChannelBars({
  channels,
  total,
  active,
}: {
  channels: ChannelRow[];
  total: number;
  active?: string;
}) {
  return (
    <>
      <div className="channel-total">
        <strong>{fmtMoney(total)}</strong>
        <span>总销售额</span>
      </div>
      <div className="channel-list">
        {channels.map((channel) => (
          <div
            key={channel.name}
            className={`channel-row ${active === channel.name ? "is-active" : ""} ${
              active && active !== channel.name ? "is-dim" : ""
            }`}
          >
            <div className="channel-name">
              <span className="channel-dot" style={{ background: channelColor(channel.name) }} />
              {channel.name}
            </div>
            <div className="channel-track">
              <div
                className="channel-fill"
                style={{ width: `${Math.min(100, channel.share)}%`, background: channelColor(channel.name) }}
              />
            </div>
            <div className="channel-num">
              <strong>{fmtPct(channel.share, 1)}</strong>
              <span style={{ display: "block", fontSize: 8 }}>{fmtMoney(channel.sales)}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function channelColor(name: string): string {
  return (
    {
      淘宝: "#F97316",
      京东: "#EF4444",
      拼多多: "#F43F5E",
      抖音: "#0F172A",
      其他: "#94A3B8",
    }[name] || "#94A3B8"
  );
}

export function Funnel({ status }: { status: SalesData["status"] }) {
  const max = Math.max(...status.map((item) => item.count), 1);
  const total = status.reduce((sum, item) => sum + item.count, 0) || 1;
  return (
    <div className="funnel">
      {status.map((item) => (
        <div className="funnel-row" key={item.status}>
          <span className="funnel-label">{item.label}</span>
          <div className="funnel-track">
            <div className="funnel-fill" style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} />
          </div>
          <span className="funnel-value">
            {fmtNum(item.count)}
            <small style={{ display: "block", color: "var(--muted-2)", fontWeight: 400 }}>
              {((item.count / total) * 100).toFixed(1)}%
            </small>
          </span>
        </div>
      ))}
    </div>
  );
}
