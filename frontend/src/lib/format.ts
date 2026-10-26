import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const integer = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });

export function fmtMoney(value: number | null | undefined): string {
  return `¥${integer.format(Math.round(Number(value || 0)))}`;
}

export function fmtMoney2(value: number | null | undefined): string {
  return `¥${decimal.format(Number(value || 0))}`;
}

export function fmtNum(value: number | null | undefined): string {
  return integer.format(Math.round(Number(value || 0)));
}

export function fmtPct(value: number | null | undefined, digits = 2): string {
  return `${Number(value || 0).toFixed(digits)}%`;
}

export function fmtDelta(value: number | null | undefined, suffix = "%"): string {
  const number = Number(value || 0);
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)}${suffix}`;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")}`;
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, "0")} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function fmtSeconds(ms: number | null | undefined): string {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export const rangeOptions: Array<{ value: string; label: string }> = [
  { value: "today", label: "今日" },
  { value: "7d", label: "近7天" },
  { value: "30d", label: "近30天" },
  { value: "90d", label: "近90天" },
];

export const rangeLabel: Record<string, string> = {
  today: "今日",
  "7d": "近7天",
  "30d": "近30天",
  "90d": "近90天",
};

export const channelOptions = ["全部渠道", "淘宝", "京东", "拼多多", "抖音", "其他"];

export function channelValue(label: string): string {
  return label === "全部渠道" ? "all" : label;
}

export function channelLabel(value: string): string {
  return value === "all" ? "全部渠道" : value;
}
