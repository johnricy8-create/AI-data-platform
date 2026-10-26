import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  Menu,
  RefreshCw,
  Sparkles,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useFilters } from "../context/Filters";
import { channelOptions, channelValue, rangeOptions } from "../lib/format";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "数据中心",
    items: [
      { to: "/", label: "经营概览", icon: LayoutDashboard },
      { to: "/products", label: "商品分析", icon: Boxes },
      { to: "/sales", label: "销售分析", icon: ChartNoAxesCombined },
    ],
  },
  {
    label: "数据资产",
    items: [
      { to: "/import", label: "数据接入", icon: Upload },
      { to: "/reports", label: "报告中心", icon: FileText },
    ],
  },
  {
    label: "智能应用",
    items: [{ to: "/ai", label: "AI 运营助手", icon: Sparkles, badge: "AI" }],
  },
];

const pageMeta: Record<string, { title: string; crumb: string }> = {
  "/": { title: "经营概览", crumb: "经营概览" },
  "/products": { title: "商品分析", crumb: "商品分析" },
  "/sales": { title: "销售分析", crumb: "销售分析" },
  "/import": { title: "数据接入", crumb: "数据接入" },
  "/ai": { title: "AI 运营助手", crumb: "AI 运营助手" },
  "/reports": { title: "报告中心", crumb: "报告中心" },
};

export function Layout() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { range, channel, setRange, setChannel } = useFilters();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const meta = pageMeta[location.pathname] || pageMeta["/"];

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast.success("数据已刷新");
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="logo-mark">
            <ChartNoAxesCombined />
          </div>
          <div>
            <div className="brand-title">AI 电商数据中台</div>
            <div className="brand-sub">COMMERCE INTELLIGENCE</div>
          </div>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          <div className="workspace-main">
            <div className="workspace-name">示例旗舰店</div>
            <div className="workspace-meta">全渠道 · 实时聚合</div>
          </div>
          <ChevronDown />
        </div>

        <nav>
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-caption">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="nav-icon">
                      <Icon />
                    </span>
                    <span>{item.label}</span>
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-note">
            <Sparkles />
            <div>
              <strong>智谱 GLM 已接入</strong>
              GLM-4.7-Flash 为主模型，失败时自动降级；分析只读，不自动执行。
            </div>
          </div>
          <div className="user-card">
            <div className="user-avatar">运</div>
            <div>
              <div className="user-name">运营管理员</div>
              <div className="user-role">示例旗舰店</div>
            </div>
            <LogOut />
          </div>
        </div>
      </aside>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen((value) => !value)} aria-label="打开导航">
              {sidebarOpen ? <X /> : <Menu />}
            </button>
            <div className="breadcrumb">
              <span>数据中心</span>
              <ChevronRight />
              <strong className="crumb-page">{meta.crumb}</strong>
            </div>
            <div className="header-date">
              <CalendarDays /> 演示数据 · 实时聚合
            </div>
          </div>
          <div className="topbar-right">
            <label className="filter-pill">
              <CalendarDays />
              <select value={range} onChange={(event) => setRange(event.target.value as typeof range)} aria-label="日期范围">
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-pill">
              <Filter />
              <select value={channel} onChange={(event) => setChannel(event.target.value)} aria-label="渠道筛选">
                {channelOptions.map((label) => (
                  <option key={label} value={channelValue(label)}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className={`icon-btn ${refreshing ? "spinning" : ""}`} onClick={refresh} aria-label="刷新数据">
              <RefreshCw />
            </button>
            <button
              className="icon-btn"
              onClick={() => toast.info("当前有 4 个库存预警，建议优先处理")}
              aria-label="通知"
            >
              <Bell />
            </button>
            <span className="demo-pill">
              <span />
              GLM
            </span>
            <div className="avatar" title="运营管理员">
              运
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function SidebarHelp() {
  return (
    <div className="sidebar-note">
      <CircleHelp />
      <div>
        <strong>需要帮助？</strong>
        在 AI 助手中直接提问，或查看报告中心的历史分析。
      </div>
    </div>
  );
}

export function VisitorCounter() {
  return (
    <span className="badge badge-gray">
      <UsersRound /> 全渠道
    </span>
  );
}

export function DatabaseHint() {
  return (
    <span className="badge badge-gray">
      <Database /> SQL 指标层
    </span>
  );
}
