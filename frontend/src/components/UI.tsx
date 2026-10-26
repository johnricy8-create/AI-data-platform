import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Inbox,
  Package,
  X,
} from "lucide-react";
import { cn } from "../lib/format";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {actions ? <div className="head-actions">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("card", className)}>
      {title ? (
        <div className="card-head">
          <div>
            <h3 className="card-title">{title}</h3>
            {subtitle ? <p className="card-sub">{subtitle}</p> : null}
          </div>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("card-body", flush && "flush", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: ReactNode;
  tone?: "gray" | "blue" | "teal" | "violet" | "amber" | "danger" | "success";
  className?: string;
}) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function Button({
  children,
  variant = "ghost",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "soft" | "ghost" | "danger";
}) {
  return (
    <button
      type={type}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "soft" && "btn-soft",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "btn-ghost",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Sparkline({ values, color = "#2563EB" }: { values: number[]; color?: string }) {
  if (!values.length) return null;
  const width = 78;
  const height = 26;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (width - pad * 2) / Math.max(values.length - 1, 1);
  const points = values.map((value, index) => {
    const x = pad + index * step;
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(" L")}`;
  const area = `${line} L${width - pad},${height} L${pad},${height} Z`;
  const id = `spark-${color.replace("#", "")}-${values.length}-${Math.round(values[0] || 0)}`;
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  icon,
  accent,
  growth,
  compare,
  spark,
  suffix = "%",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  accent: "blue" | "teal" | "violet" | "amber";
  growth: number;
  compare: string;
  spark?: number[];
  suffix?: string;
}) {
  const up = growth >= 0;
  const digits = suffix === "pp" ? 2 : 1;
  return (
    <article className={`kpi-card accent-${accent}`}>
      <div className="kpi-top">
        <span className="kpi-icon">{icon}</span>
        <span className="kpi-label">{label}</span>
        <span className="kpi-menu">···</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-foot">
        <span className={`delta ${up ? "up" : "down"}`}>
          {up ? <ArrowUpRight /> : <ArrowDownRight />}
          {up ? "+" : "-"}
          {Math.abs(growth).toFixed(digits)}
          {suffix}
        </span>
        <span>{compare}</span>
        {spark ? <Sparkline values={spark} color={up ? "#2563EB" : "#EF4444"} /> : null}
      </div>
    </article>
  );
}

export function ProductThumb({ tone = "blue", size }: { tone?: string; size?: "lg" }) {
  return (
    <span className={`product-thumb tone-${tone}`} style={size === "lg" ? { width: 46, height: 46, borderRadius: 12 } : undefined}>
      <Package />
    </span>
  );
}

export function LoadingPage() {
  return (
    <div className="page-loading">
      <div className="kpi-grid">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="skeleton skeleton-kpi" />
        ))}
      </div>
      <div className="grid-12">
        <div className="skeleton skeleton-chart span-8" />
        <div className="skeleton skeleton-chart span-4" />
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <AlertTriangle />
      <strong>数据加载失败</strong>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="soft" onClick={onRetry}>
          重新加载
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Inbox />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function Modal({
  title,
  subtitle,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={cn("modal", wide && "wide")} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="关闭">
            <X />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  );
}

export function Confidence({ value }: { value: "high" | "medium" | "low" }) {
  const label = value === "high" ? "高可信" : value === "medium" ? "中可信" : "证据不足";
  return <span className={`confidence ${value === "high" ? "high" : value === "medium" ? "mid" : "low"}`}>{label}</span>;
}

export function Priority({ value }: { value: "P0" | "P1" | "P2" }) {
  return <span className={`priority ${value.toLowerCase()}`}>{value}</span>;
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h5 className="muted-line" style={{ margin: 0, color: "var(--muted-2)", fontWeight: 700, letterSpacing: ".6px" }}>
        {children}
      </h5>
      {sub ? <p className="muted-line" style={{ margin: "3px 0 0" }}>{sub}</p> : null}
    </div>
  );
}
