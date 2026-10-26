/* =========================================================
   AI Commerce Hub — Demo application
   Vanilla JS + ECharts. 仅用于视觉与交互预览。
   ========================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const ICONS = {
  logo: '<path d="M5 17V11"/><path d="M10 17V7"/><path d="M15 17V9"/><path d="M20 17V5"/><path d="M3.5 20h17"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><rect x="14" y="14" width="7" height="7" rx="1.4"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/>',
  upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M5 20h14"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  sparkles: '<path d="M12 3l1.9 4.1L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.9L12 3Z"/><path d="M19 15l.9 1.9L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-1.1L19 15Z"/><path d="M5 15l.7 1.5L7.2 17l-1.5.7L5 19.2l-.7-1.5L2.8 17l1.5-.5L5 15Z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  arrowUpRight: '<path d="M7 17 17 7"/><path d="M7 7h10v10"/>',
  arrowDownRight: '<path d="M7 7l10 10"/><path d="M17 7v10H7"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
  cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M20 9h3"/><path d="M20 14h3"/><path d="M1 9h3"/><path d="M1 14h3"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
  trending: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  package: '<path d="M16.5 9.4 7.5 4.2"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
  store: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9v11h18V9"/><path d="M9 20v-6h6v6"/><path d="M3 9h18"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  logOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10Z"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/>',
  sliders: '<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  circle: '<circle cx="12" cy="12" r="9"/>',
};

function icon(name, extra = "") {
  return `<svg ${extra} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.circle}</svg>`;
}

const state = {
  page: "overview",
  range: "7d",
  channel: "all",
  productTab: "sales",
  selectedProduct: null,
  importState: "idle",
  importStep: 0,
  importResult: null,
  chat: [],
  chatBusy: false,
  planOpen: false,
  sidebarOpen: false,
  pendingQuestion: null,
};

let pageCharts = [];
let drawerChart = null;
let sparkSeq = 0;
let chatRequestSeq = 0;

const nf = new Intl.NumberFormat("zh-CN");

function num(value) {
  return nf.format(Math.round(value));
}

function money(value) {
  return `¥${nf.format(Math.round(value))}`;
}

function pct(value, digits = 1) {
  return `${Number(value).toFixed(digits)}%`;
}

function signed(value, digits = 1) {
  return `${value >= 0 ? "+" : ""}${Number(value).toFixed(digits)}%`;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function productById(id) {
  return DEMO.products.find((p) => p.id === id);
}

function currentChannel() {
  return state.channel === "all" ? null : DEMO.channels.find((c) => c.id === state.channel);
}

function getRangeData() {
  const base = DEMO.ranges[state.range];
  const channel = currentChannel();
  const factor = channel ? channel.share : 1;
  const convFactor = channel ? channel.convFactor : 1;
  const growthShift = channel ? (channel.growth - 12) * 0.18 : 0;
  return {
    ...base,
    sales: base.sales * factor,
    orders: Math.round(base.orders * factor),
    visitors: Math.round(base.visitors * factor),
    conversion: base.conversion * convFactor,
    salesGrowth: base.salesGrowth + growthShift,
    ordersGrowth: base.ordersGrowth + growthShift * 0.6,
    visitorsGrowth: base.visitorsGrowth + growthShift * 0.8,
    conversionGrowth: base.conversionGrowth + (channel ? (channel.convFactor - 1) * 2 : 0),
    channel,
    factor,
  };
}

function getTrendData() {
  const source = DEMO.trend[state.range];
  const factor = state.channel === "all" ? 1 : currentChannel().share;
  const labels = source.labels.slice();
  const sales = source.sales.map((v) => Math.round(v * factor));
  const orders = source.orders.map((v) => Math.round(v * factor));
  const visitors = source.visitors.map((v) => Math.round(v * factor));
  return { labels, sales, orders, visitors };
}

function channelSales(channel) {
  return getRangeData().sales * channel.share;
}

function pageTitle() {
  return {
    overview: "经营概览",
    products: "商品分析",
    import: "数据接入",
    ai: "AI 运营助手",
  }[state.page] || "经营概览";
}

function rangeLabel() {
  return DEMO.ranges[state.range].label;
}

function sparkline(values, color) {
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
    return [x, y];
  });
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${(width - pad).toFixed(1)},${height} L${pad},${height} Z`;
  const id = `spark-${++sparkSeq}`;
  return `
    <svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity=".24"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <path d="${area}" fill="url(#${id})"/>
      <path d="${line}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

/* =========================================================
   Shell renderers
   ========================================================= */
function renderSidebar() {
  const groups = [
    {
      label: "数据中心",
      items: [
        { id: "overview", label: "经营概览", icon: "grid" },
        { id: "products", label: "商品分析", icon: "box" },
        { id: "sales", label: "销售分析", icon: "chart", disabled: true },
      ],
    },
    {
      label: "数据资产",
      items: [
        { id: "import", label: "数据接入", icon: "upload" },
        { id: "reports", label: "报告中心", icon: "file", disabled: true },
      ],
    },
    {
      label: "智能应用",
      items: [{ id: "ai", label: "AI 运营助手", icon: "sparkles" }],
    },
  ];

  const nav = groups.map((group) => `
    <div class="nav-group">
      <div class="nav-caption">${group.label}</div>
      ${group.items.map((item) => `
        <div class="nav-item ${state.page === item.id ? "active" : ""} ${item.disabled ? "disabled" : ""}"
             data-nav="${item.id}" ${item.disabled ? 'data-disabled="true"' : ""}>
          <span class="nav-icon">${icon(item.icon)}</span>
          <span>${item.label}</span>
          ${item.disabled ? '<span class="nav-badge">正式版</span>' : ""}
        </div>
      `).join("")}
    </div>
  `).join("");

  return `
    <div class="brand">
      <div class="logo-mark">${icon("logo")}</div>
      <div>
        <div class="brand-title">AI 电商数据中台</div>
        <div class="brand-sub">COMMERCE INTELLIGENCE</div>
      </div>
    </div>

    <div class="workspace">
      <span class="workspace-dot"></span>
      <div class="workspace-main">
        <div class="workspace-name">${DEMO.meta.store}</div>
        <div class="workspace-meta">全渠道 · 演示空间</div>
      </div>
      ${icon("chevronDown")}
    </div>

    <nav>${nav}</nav>

    <div class="sidebar-foot">
      <div class="sidebar-note">
        ${icon("info")}
        <div>
          <strong>Demo 说明</strong>
          当前聚焦 4 个核心页面，正式版将开放销售分析与报告中心。
        </div>
      </div>
      <div class="user-card">
        <div class="user-avatar">运</div>
        <div>
          <div class="user-name">运营管理员</div>
          <div class="user-role">示例旗舰店</div>
        </div>
        ${icon("logOut")}
      </div>
    </div>
  `;
}

function renderTopbar() {
  const rangeOptions = Object.entries(DEMO.ranges)
    .map(([key, item]) => `<option value="${key}" ${state.range === key ? "selected" : ""}>${item.label}</option>`)
    .join("");
  const channelOptions = [
    `<option value="all" ${state.channel === "all" ? "selected" : ""}>全部渠道</option>`,
    ...DEMO.channels.map((channel) => `<option value="${channel.id}" ${state.channel === channel.id ? "selected" : ""}>${channel.name}</option>`),
  ].join("");

  return `
    <div class="topbar-left">
      <button class="mobile-menu" data-action="toggle-sidebar" aria-label="打开导航">${icon("menu")}</button>
      <div class="breadcrumb">
        <span>数据中心</span>
        ${icon("chevronRight")}
        <strong class="crumb-page">${pageTitle()}</strong>
      </div>
      <div class="header-date">${icon("calendar")} 演示数据 · 更新于 18:42</div>
    </div>
    <div class="topbar-right">
      <label class="filter-pill">
        ${icon("calendar")}
        <select data-filter="range" aria-label="日期范围">${rangeOptions}</select>
      </label>
      <label class="filter-pill">
        ${icon("filter")}
        <select data-filter="channel" aria-label="渠道筛选">${channelOptions}</select>
      </label>
      <button class="icon-btn" data-action="refresh" aria-label="刷新数据">${icon("refresh")}</button>
      <button class="icon-btn" data-action="notifications" aria-label="通知">${icon("bell")}</button>
      <span class="demo-pill"><span></span>DEMO</span>
      <div class="avatar" title="运营管理员">运</div>
    </div>
  `;
}

function pageHead({ eyebrow, title, subtitle, actions = "" }) {
  return `
    <div class="page-head">
      <div>
        <div class="eyebrow">${eyebrow}</div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="head-actions">${actions}</div>
    </div>
  `;
}

/* =========================================================
   Overview
   ========================================================= */
function kpiCard({ label, value, iconName, accent, growth, compare, spark, sparkColor, deltaSuffix = "%" }) {
  const isUp = growth >= 0;
  return `
    <article class="kpi-card accent-${accent}">
      <div class="kpi-top">
        <span class="kpi-icon">${icon(iconName)}</span>
        <span class="kpi-label">${label}</span>
        <span class="kpi-menu">${icon("more")}</span>
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-foot">
        <span class="delta ${isUp ? "up" : "down"}">
          ${icon(isUp ? "arrowUpRight" : "arrowDownRight")}
          ${isUp ? "+" : ""}${Math.abs(growth).toFixed(1)}${deltaSuffix}
        </span>
        <span>${compare}</span>
        ${sparkline(spark, sparkColor)}
      </div>
    </article>
  `;
}

function renderOverview() {
  const range = getRangeData();
  const trend = getTrendData();
  const sparkValues = trend.sales.slice(-7);
  const channel = currentChannel();
  const scopeLabel = channel ? channel.name : "全渠道";

  const kpis = [
    {
      label: `${range.label}销售额`,
      value: money(range.sales),
      iconName: "wallet",
      accent: "blue",
      growth: range.salesGrowth,
      compare: range.compare,
      spark: sparkValues,
      sparkColor: "#2563EB",
    },
    {
      label: `${range.label}订单数`,
      value: num(range.orders),
      iconName: "bag",
      accent: "teal",
      growth: range.ordersGrowth,
      compare: range.compare,
      spark: trend.orders.slice(-7),
      sparkColor: "#0D9488",
    },
    {
      label: `${range.label}访客数`,
      value: num(range.visitors),
      iconName: "users",
      accent: "violet",
      growth: range.visitorsGrowth,
      compare: range.compare,
      spark: trend.visitors.slice(-7),
      sparkColor: "#7C3AED",
    },
    {
      label: `${range.label}转化率`,
      value: pct(range.conversion, 2),
      iconName: "target",
      accent: "amber",
      growth: range.conversionGrowth,
      compare: range.compare,
      spark: trend.orders.map((v, i) => v / Math.max(trend.visitors[i], 1) * 100),
      sparkColor: "#D97706",
      deltaSuffix: "pp",
    },
  ];

  const totalSales = trend.sales.reduce((sum, value) => sum + value, 0);
  const avgSales = totalSales / trend.labels.length;
  const peakIndex = trend.sales.indexOf(Math.max(...trend.sales));
  const avgLabel = state.range === "today" ? "时均销售额" : "日均销售额";

  const channelRows = DEMO.channels.map((item) => {
    const isActive = state.channel === item.id;
    const isDim = state.channel !== "all" && !isActive;
    return `
      <div class="channel-row ${isActive ? "is-active" : ""} ${isDim ? "is-dim" : ""}">
        <div class="channel-name"><span class="channel-dot" style="background:${item.color}"></span>${item.name}</div>
        <div class="channel-track">
          <div class="channel-fill" style="width:${item.share * 100}%;background:${item.color}"></div>
        </div>
        <div class="channel-num">
          <strong>${Math.round(item.share * 100)}%</strong>
          <span style="display:block;font-size:8px">${money(channelSales(item))}</span>
        </div>
      </div>
    `;
  }).join("");

  const hotProducts = [...DEMO.products].sort((a, b) => b.sales - a.sales).slice(0, 8).map((product, index) => `
    <tr data-action="open-product" data-id="${product.id}">
      <td><span class="rank ${index < 3 ? "top" : ""}">${index + 1}</span></td>
      <td>
        <div class="product-cell">
          <span class="product-thumb tone-${product.tone}">${icon("package")}</span>
          <div>
            <div class="product-name">${product.name}</div>
            <div class="product-meta">${product.category}</div>
          </div>
        </div>
      </td>
      <td class="num">${num(product.qty)}</td>
      <td class="num strong">${money(product.sales)}</td>
      <td class="num">${pct(product.margin)}</td>
      <td class="num">
        <span class="delta ${product.growth >= 0 ? "up" : "down"}">
          ${icon(product.growth >= 0 ? "arrowUpRight" : "arrowDownRight")}
          ${Math.abs(product.growth).toFixed(1)}%
        </span>
      </td>
    </tr>
  `).join("");

  const insights = DEMO.insights.map((item, index) => `
    <div class="insight-item">
      <div class="insight-index">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <div class="insight-title">
          ${item.title}
          <span class="badge badge-${item.tone}">${item.tag}</span>
        </div>
        <p class="insight-text">${item.text}</p>
        <div class="insight-evidence">${icon("database")} ${item.evidence}</div>
      </div>
    </div>
  `).join("");

  return `
    ${pageHead({
      eyebrow: "Overview",
      title: "经营概览",
      subtitle: `一眼看清 ${scopeLabel} 的经营健康度、增长来源与待处理风险。`,
      actions: `
        <button class="btn btn-ghost" data-action="export">${icon("download")} 导出日报</button>
        <button class="btn btn-primary" data-action="open-plan">${icon("sparkles")} 生成运营计划</button>
      `,
    })}

    <div class="kpi-grid">
      ${kpis.map(kpiCard).join("")}
    </div>

    <div class="grid-12">
      <section class="card span-8">
        <div class="card-head">
          <div>
            <h3 class="card-title">销售趋势</h3>
            <p class="card-sub">销售额与订单量 · ${range.label} · ${scopeLabel}</p>
          </div>
          <div class="card-actions">
            <span class="badge badge-blue">${range.label}</span>
            <span class="link" data-nav="products">商品分析 ${icon("chevronRight")}</span>
          </div>
        </div>
        <div class="card-body" style="padding-bottom:4px">
          <div id="trendChart" class="chart"></div>
        </div>
        <div class="trend-summary">
          <div class="trend-stat"><span>本期累计销售额</span><strong>${money(totalSales)}</strong><em class="up">${signed(range.salesGrowth)}</em></div>
          <div class="trend-stat"><span>${avgLabel}</span><strong>${money(avgSales)}</strong></div>
          <div class="trend-stat"><span>峰值日期</span><strong>${trend.labels[peakIndex]}</strong></div>
        </div>
      </section>

      <section class="card span-4">
        <div class="card-head">
          <div>
            <h3 class="card-title">渠道销售占比</h3>
            <p class="card-sub">${range.label} · 各渠道贡献</p>
          </div>
          <span class="badge badge-gray">${DEMO.channels.length} 个渠道</span>
        </div>
        <div class="card-body" style="padding-bottom:14px">
          <div class="channel-total"><strong>${money(range.sales)}</strong><span>总销售额</span></div>
          <div class="channel-list">${channelRows}</div>
          <div class="channel-foot">${icon("trending")} 抖音渠道增长最快，环比 +32.8%</div>
        </div>
      </section>

      <section class="card span-8">
        <div class="card-head">
          <div>
            <h3 class="card-title">热销商品排行</h3>
            <p class="card-sub">近 30 天销售额 · 点击商品查看经营诊断</p>
          </div>
          <div class="card-actions">
            <span class="link" data-nav="products">全部商品 ${icon("chevronRight")}</span>
          </div>
        </div>
        <div class="card-body flush" style="padding-top:10px">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th style="width:38px">#</th>
                  <th>商品</th>
                  <th class="num">销量</th>
                  <th class="num">销售额</th>
                  <th class="num">毛利率</th>
                  <th class="num">趋势</th>
                </tr>
              </thead>
              <tbody>${hotProducts}</tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <span class="muted-2" style="font-size:9px">近 30 天 · 共 ${DEMO.meta.productCount} 个在售商品</span>
          <span class="link" data-nav="products">查看完整排行 ${icon("arrowRight")}</span>
        </div>
      </section>

      <div class="span-4 stack">
        <section class="ai-card">
          <div class="card-head">
            <div class="ai-card-title">
              <span class="ai-badge">${icon("sparkles")}</span>
              <div>
                <h3 class="card-title">AI 运营建议</h3>
                <p class="card-sub">基于经营指标与商品数据</p>
              </div>
            </div>
            <span class="badge badge-violet">AI</span>
          </div>
          <div class="insight-list">${insights}</div>
          <div class="ai-footer">
            <button class="btn btn-primary btn-block" data-action="open-plan">${icon("sparkles")} 一键生成运营计划</button>
          </div>
        </section>

        <section class="card">
          <div class="mini-chat">
            <div class="mini-chat-head">${icon("sparkles")} 智能问答</div>
            <form class="mini-chat-form" data-mini-chat-form>
              <input name="question" placeholder="问问你的经营数据..." autocomplete="off"/>
              <button type="submit" aria-label="发送">${icon("send")}</button>
            </form>
            <div class="mini-chat-hint">例如：哪些商品存在库存风险？</div>
          </div>
        </section>
      </div>
    </div>

    <div class="channel-foot" style="margin-top:18px;padding-top:0;border-top:0">
      ${icon("shield")} 数据范围：${DEMO.meta.dateRange} · ${scopeLabel} · 演示数据；所有指标由程序计算，AI 仅负责解释。
    </div>
  `;
}

/* =========================================================
   Products
   ========================================================= */
function sortedProducts() {
  const list = [...DEMO.products];
  const key = state.productTab;
  return list.sort((a, b) => b[key] - a[key]);
}

function renderProducts() {
  const sorted = sortedProducts();
  const tabs = [
    { id: "sales", label: "销售额" },
    { id: "qty", label: "销量" },
    { id: "margin", label: "毛利率" },
    { id: "refund", label: "退款率" },
  ];

  const rows = sorted.slice(0, 8).map((product, index) => {
    const lowStock = product.stock < product.safety;
    return `
      <tr data-action="open-product" data-id="${product.id}">
        <td>
          <div class="product-cell">
            <span class="rank ${index < 3 ? "top" : ""}">${index + 1}</span>
            <span class="product-thumb tone-${product.tone}">${icon("package")}</span>
            <div>
              <div class="product-name">${product.name}</div>
              <div class="product-meta">${product.category} · SKU ${String(index + 1).padStart(3, "0")}</div>
            </div>
          </div>
        </td>
        <td class="num">${num(product.qty)}</td>
        <td class="num strong">${money(product.sales)}</td>
        <td class="num">
          <span style="color:${product.margin >= 40 ? "#047857" : product.margin < 32 ? "#BE123C" : "var(--text-2)"};font-weight:650">${pct(product.margin)}</span>
        </td>
        <td class="num">${pct(product.refund)}</td>
        <td class="num">
          <span style="display:inline-flex;align-items:center;gap:4px;color:${lowStock ? "#BE123C" : "var(--text-2)"};font-weight:${lowStock ? 700 : 500}">
            ${num(product.stock)}
            ${lowStock ? `<span style="width:5px;height:5px;background:#EF4444;border-radius:50%"></span>` : ""}
          </span>
        </td>
        <td class="num">
          <span class="delta ${product.growth >= 0 ? "up" : "down"}">
            ${icon(product.growth >= 0 ? "arrowUpRight" : "arrowDownRight")}
            ${Math.abs(product.growth).toFixed(1)}%
          </span>
        </td>
      </tr>
    `;
  }).join("");

  const inventory = DEMO.inventoryAlerts.map((item) => {
    const ratio = Math.min(100, Math.round((item.stock / item.safety) * 100));
    const levelMap = { high: "高风险", medium: "关注", low: "健康" };
    return `
      <div class="inventory-item" data-action="stock-plan" data-name="${esc(item.name)}">
        <div class="inventory-top">
          <span class="inventory-name">
            ${item.name}
            <span class="tag ${item.level === "high" ? "red" : "amber"}">${levelMap[item.level]}</span>
          </span>
          <span class="muted-2" style="font-size:9px">${item.stock} / ${item.safety}</span>
        </div>
        <div class="inventory-bar">
          <div class="inventory-fill ${item.level === "medium" ? "medium" : ""}" style="width:${ratio}%"></div>
        </div>
        <div class="inventory-meta">
          <span>可售 ${item.days} 天</span>
          <span>${item.note}</span>
        </div>
      </div>
    `;
  }).join("");

  return `
    ${pageHead({
      eyebrow: "Products",
      title: "商品分析",
      subtitle: "从销售额、毛利、退款与库存四个维度，找到值得加注和需要调整的商品。",
      actions: `
        <button class="btn btn-ghost" data-action="export-products">${icon("download")} 导出商品报表</button>
        <button class="btn btn-primary" data-action="ai-product-list">${icon("sparkles")} 生成选品建议</button>
      `,
    })}

    <div class="mini-kpi-grid">
      <div class="mini-kpi accent-blue">
        <span class="mini-kpi-icon">${icon("package")}</span>
        <div><span>在售商品</span><strong>${DEMO.meta.productCount}<em class="up">+4</em></strong></div>
      </div>
      <div class="mini-kpi accent-teal">
        <span class="mini-kpi-icon">${icon("trending")}</span>
        <div><span>热销商品</span><strong>12<em class="up">+2</em></strong></div>
      </div>
      <div class="mini-kpi accent-amber">
        <span class="mini-kpi-icon">${icon("alert")}</span>
        <div><span>库存预警</span><strong>${DEMO.inventoryAlerts.length}<em class="up">-2</em></strong></div>
      </div>
      <div class="mini-kpi accent-violet">
        <span class="mini-kpi-icon">${icon("pie")}</span>
        <div><span>平均毛利率</span><strong>38.4%<em class="up">+1.2pp</em></strong></div>
      </div>
    </div>

    <div class="grid-12">
      <section class="card span-8">
        <div class="card-head">
          <div>
            <h3 class="card-title">商品经营排行</h3>
            <p class="card-sub">近 30 天 · 点击右上角切换排序</p>
          </div>
          <div class="tabs">
            ${tabs.map((tab) => `<button class="tab ${state.productTab === tab.id ? "active" : ""}" data-product-tab="${tab.id}">${tab.label}</button>`).join("")}
          </div>
        </div>
        <div class="card-body flush" style="padding-top:11px">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>商品</th>
                  <th class="num">销量</th>
                  <th class="num">销售额</th>
                  <th class="num">毛利率</th>
                  <th class="num">退款率</th>
                  <th class="num">库存</th>
                  <th class="num">趋势</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
        <div class="card-footer">
          <span class="muted-2" style="font-size:9px">展示前 8 个商品 · 共 ${DEMO.meta.productCount} 个</span>
          <span class="link" data-action="view-all-products">查看全部 ${icon("arrowRight")}</span>
        </div>
      </section>

      <div class="span-4 stack">
        <section class="card">
          <div class="card-head">
            <div>
              <h3 class="card-title">销售-毛利四象限</h3>
              <p class="card-sub">气泡大小代表销量 · 近 30 天</p>
            </div>
            <span class="badge badge-blue">四象限</span>
          </div>
          <div class="card-body" style="padding:6px 8px 10px">
            <div id="scatterChart" class="chart" style="height:292px"></div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h3 class="card-title">库存预警</h3>
              <p class="card-sub">低于安全库存或可售天数 &lt; 7 天</p>
            </div>
            <span class="badge badge-danger">${DEMO.inventoryAlerts.length} 个</span>
          </div>
          <div class="inventory-list">${inventory}</div>
        </section>
      </div>
    </div>

    <div class="diagnosis-strip" style="margin-top:20px">
      <div class="diagnosis-cell">
        <span>${icon("trending")} 增长最快</span>
        <strong>轻量跑鞋 · +86.5%</strong>
        <p>处于放量期，建议先补货再加大投放，避免断货损失。</p>
      </div>
      <div class="diagnosis-cell">
        <span>${icon("pie")} 利润优化</span>
        <strong>快充充电宝 · 毛利率 28.9%</strong>
        <p>低于全店均值 9.5pp，优先重谈采购成本或做组合搭售。</p>
      </div>
      <div class="diagnosis-cell">
        <span>${icon("alert")} 库存风险</span>
        <strong>2 个 SKU 可售不足 5 天</strong>
        <p>充电宝与跑鞋进入高风险区，建议今日生成补货计划。</p>
      </div>
    </div>
  `;
}

/* =========================================================
   Import
   ========================================================= */
function importStepClass(index) {
  if (state.importState === "done" || index < state.importStep) return "done";
  if (state.importState === "running" && index === state.importStep) return "active";
  return "";
}

function renderImport() {
  const steps = ["读取文件", "字段映射", "数据校验", "写入数据库"];
  const stepHtml = steps.map((label, index) => {
    const cls = importStepClass(index);
    return `
      <div class="step ${cls}" data-import-step="${index}">
        <span class="step-dot">${cls === "done" ? icon("check") : index + 1}</span>
        <span>${label}</span>
      </div>
    `;
  }).join("");

  const result = state.importResult;
  const resultHtml = state.importState === "done" && result ? `
    <div class="import-result">
      <div class="import-result-head">${icon("checkCircle")} 导入完成 · ${esc(result.filename)}</div>
      <div class="import-result-stats">
        <span><strong>${num(result.rows)}</strong>成功</span>
        <span><strong style="color:#BE123C">${result.failed}</strong>失败</span>
        <span><strong>${result.score}</strong>质量评分</span>
        <span>耗时 <strong>2.4s</strong></span>
      </div>
      <div style="margin-top:8px">
        <button class="link" data-action="download-errors">${icon("download")} 下载 ${result.failed} 条错误明细</button>
      </div>
    </div>
  ` : "";

  const mappingRows = DEMO.fieldMapping.map((item) => `
    <tr>
      <td class="source-field">${item.source}</td>
      <td class="mapping-arrow">${icon("arrowRight")}</td>
      <td class="mapping-target">${item.target}</td>
      <td>${item.type}</td>
      <td><span class="tag ${item.status === "已映射" ? "green" : "amber"}">${item.status}</span></td>
    </tr>
  `).join("");

  const validationRows = DEMO.validationErrors.map((item) => `
    <div class="validation-item">
      <span class="validation-icon ${item.level}">${icon(item.level === "error" ? "alert" : "info")}</span>
      <div>
        <div class="validation-title">第 ${item.row} 行 · ${item.field}</div>
        <div class="validation-meta">${item.reason}<br><code>${esc(item.value)}</code></div>
      </div>
    </div>
  `).join("");

  const history = [
    ...(result ? [{
      id: "IMP-20261024-021",
      file: result.filename,
      type: "订单",
      rows: result.rows,
      failed: result.failed,
      status: "成功",
      time: "刚刚",
      operator: "运营管理员",
    }] : []),
    ...DEMO.imports,
  ];

  const historyRows = history.map((item) => `
    <tr data-action="view-job">
      <td><span class="mapping-target">${item.id}</span></td>
      <td>${icon("fileText")} <span style="margin-left:5px">${esc(item.file)}</span></td>
      <td><span class="tag blue">${item.type}</span></td>
      <td class="num">${num(item.rows)}</td>
      <td class="num" style="color:${item.failed > 0 ? "#BE123C" : "var(--muted)"}">${item.failed}</td>
      <td><span class="badge ${item.status === "成功" ? "badge-success" : "badge-amber"}">${item.status}</span></td>
      <td>${item.time}</td>
      <td>${item.operator}</td>
    </tr>
  `).join("");

  return `
    ${pageHead({
      eyebrow: "Data Ingestion",
      title: "数据接入",
      subtitle: "上传订单、商品、流量与库存文件，自动完成字段映射、质量校验和入库。",
      actions: `
        <button class="btn btn-ghost" data-action="spec">${icon("fileText")} 接入规范</button>
        <button class="btn btn-primary" data-action="download-template">${icon("download")} 下载模板</button>
      `,
    })}

    <div class="grid-12">
      <section class="card upload-card span-8">
        <div class="card-head">
          <div>
            <h3 class="card-title">上传数据文件</h3>
            <p class="card-sub">支持 CSV / XLSX · 单文件 ≤ 20MB · 演示模式不写入真实数据库</p>
          </div>
          <span class="badge badge-blue">CSV / XLSX</span>
        </div>
        <div class="dropzone" id="dropzone" data-action="pick-file" role="button" tabindex="0" aria-label="上传数据文件">
          <div class="dropzone-icon">${icon("upload")}</div>
          <h4>拖拽文件到这里，或点击选择文件</h4>
          <p>也可以 <button type="button" class="link" data-action="demo-upload">使用示例文件演示</button></p>
          <div class="format-chips">
            <span class="chip">订单 orders.csv</span>
            <span class="chip">商品 products.xlsx</span>
            <span class="chip">流量 traffic.csv</span>
            <span class="chip">库存 inventory.xlsx</span>
          </div>
        </div>
        <input id="fileInput" type="file" accept=".csv,.xlsx,.xls" hidden />
        <div class="upload-steps" id="importSteps">${stepHtml}</div>
        ${resultHtml}
        <div class="upload-spec">
          ${icon("shield")}
          文件仅用于本次演示预览；正式版会保存原始文件、校验报告与导入任务记录，支持按自然键幂等写入。
        </div>
      </section>

      <section class="card span-4">
        <div class="card-head">
          <div>
            <h3 class="card-title">数据质量概览</h3>
            <p class="card-sub">最近一次导入 · 订单数据</p>
          </div>
          <span class="badge badge-success">优秀</span>
        </div>
        <div class="card-body" style="padding-bottom:0">
          <div class="quality-ring">
            <div class="quality-ring-content">
              <strong>98.2</strong>
              <span>质量评分</span>
            </div>
          </div>
        </div>
        <div class="quality-dims">
          <div class="quality-dim"><span>完整性</span><div class="quality-dim-track"><div class="quality-dim-fill" style="width:99.2%"></div></div><strong>99.2%</strong></div>
          <div class="quality-dim"><span>唯一性</span><div class="quality-dim-track"><div class="quality-dim-fill" style="width:100%"></div></div><strong>100%</strong></div>
          <div class="quality-dim"><span>有效性</span><div class="quality-dim-track"><div class="quality-dim-fill" style="width:98.6%"></div></div><strong>98.6%</strong></div>
          <div class="quality-dim"><span>及时性</span><div class="quality-dim-track"><div class="quality-dim-fill" style="width:100%"></div></div><strong>100%</strong></div>
        </div>
      </section>

      <section class="card span-7">
        <div class="card-head">
          <div>
            <h3 class="card-title">字段映射预览</h3>
            <p class="card-sub">系统自动识别源字段，可在正式版中手动调整</p>
          </div>
          <span class="badge badge-amber">1 个需确认</span>
        </div>
        <div class="card-body flush" style="padding-top:11px">
          <div class="table-wrap">
            <table class="table mapping-table">
              <thead>
                <tr><th>源字段</th><th></th><th>标准字段</th><th>类型</th><th>状态</th></tr>
              </thead>
              <tbody>${mappingRows}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="card span-5">
        <div class="card-head">
          <div>
            <h3 class="card-title">校验结果</h3>
            <p class="card-sub">${DEMO.validationErrors.length} 个问题 · 3 条待处理</p>
          </div>
          <span class="badge badge-danger">3 条</span>
        </div>
        <div class="validation-list">${validationRows}</div>
        <div class="card-footer">
          <span class="muted-2" style="font-size:9px">错误行不会写入数据库</span>
          <button class="link" data-action="download-errors">${icon("download")} 下载明细</button>
        </div>
      </section>

      <section class="card span-12">
        <div class="card-head">
          <div>
            <h3 class="card-title">导入历史</h3>
            <p class="card-sub">最近 7 天 · 支持按文件、状态和操作人筛选（正式版）</p>
          </div>
          <span class="link" data-action="view-jobs">查看全部任务 ${icon("chevronRight")}</span>
        </div>
        <div class="card-body flush" style="padding-top:11px">
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr><th>任务 ID</th><th>文件</th><th>类型</th><th class="num">记录数</th><th class="num">失败</th><th>状态</th><th>时间</th><th>操作人</th></tr>
              </thead>
              <tbody>${historyRows}</tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;
}

/* =========================================================
   AI assistant
   ========================================================= */
function renderChatMessages() {
  const container = $("#chatMessages");
  if (!container) return;
  const messagesHtml = state.chat.map((message) => {
    if (message.role === "user") {
      return `
        <div class="msg user">
          <div class="msg-avatar user">你</div>
          <div class="msg-bubble">${esc(message.text)}</div>
        </div>
      `;
    }
    return `
      <div class="msg">
        <div class="msg-avatar">AI</div>
        <div class="msg-bubble">
          ${message.typing ? `
            <div style="display:flex;align-items:center;gap:8px">
              <div class="typing"><span></span><span></span><span></span></div>
              <span class="muted-line">正在调用指标工具...</span>
            </div>
          ` : message.html}
        </div>
      </div>
    `;
  }).join("");

  const starters = state.chat.length === 1 ? `
    <div class="chat-starter">
      <div class="chat-starter-head">${icon("sparkles")} 从这些问题开始，我会先查数再回答</div>
      <div class="chat-starter-grid">
        <button data-suggestion="昨天销售额为什么下降？">昨天销售额为什么下降？</button>
        <button data-suggestion="哪些商品值得重点推广？">哪些商品值得重点推广？</button>
        <button data-suggestion="哪些商品存在库存不足风险？">哪些商品存在库存不足风险？</button>
        <button data-suggestion="哪些商品销售额高但毛利率低？">哪些商品销售额高但毛利率低？</button>
      </div>
    </div>
  ` : "";

  container.innerHTML = messagesHtml + starters;

  // 回答较长时，优先把最后一条消息的标题滚动到可视区域顶部，
  // 而不是直接跳到最底部，避免用户错过结论。
  const lastMessage = container.querySelector(".msg:last-of-type");
  if (lastMessage) {
    const containerRect = container.getBoundingClientRect();
    const messageRect = lastMessage.getBoundingClientRect();
    container.scrollTop += messageRect.top - containerRect.top - 10;
  }
}

function renderAI() {
  const range = getRangeData();
  const suggestions = [
    "昨天销售额为什么下降？",
    "哪些商品值得重点推广？",
    "哪些商品存在库存不足风险？",
    "哪些商品销售额高但毛利率低？",
    "生成本周运营计划",
  ];

  return `
    ${pageHead({
      eyebrow: "AI Copilot",
      title: "AI 运营助手",
      subtitle: "先查数、再分析、后建议。每条结论都能回溯到具体的指标与数据范围。",
      actions: `
        <span class="badge badge-success">${icon("shield")} 只读分析</span>
        <span class="badge badge-violet">演示模式</span>
        <button class="btn btn-ghost btn-sm" data-action="new-chat">${icon("plus")} 新建对话</button>
      `,
    })}

    <div class="grid-12">
      <section class="card chat-card span-8">
        <div class="chat-head">
          <div class="chat-avatar">${icon("sparkles")}</div>
          <div>
            <div class="chat-title">经营分析助手</div>
            <div class="chat-status"><span></span> 在线 · 已连接指标工具</div>
          </div>
          <div class="chat-head-right">
            <span class="badge badge-gray">DeepSeek-V3 · Demo</span>
            <button class="icon-btn" data-action="new-chat" aria-label="新建对话">${icon("refresh")}</button>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages"></div>

        <div class="chat-suggestions">
          ${suggestions.map((question) => `<button class="suggestion" data-suggestion="${esc(question)}">${question}</button>`).join("")}
        </div>

        <form class="chat-input-wrap" data-chat-form>
          <div class="chat-input">
            <input id="chatInput" name="question" placeholder="问问经营数据，例如：为什么淘宝销售额下降？" autocomplete="off" />
            <button class="btn btn-primary" type="submit" aria-label="发送">${icon("send")}</button>
          </div>
          <div class="chat-hint">Enter 发送 · 结果仅供决策参考 · 不会自动执行任何操作</div>
        </form>
      </section>

      <div class="span-4 stack">
        <section class="card context-card">
          <div class="card-head">
            <div>
              <h3 class="card-title">分析上下文</h3>
              <p class="card-sub">本次回答使用的范围、工具与指标</p>
            </div>
            <span class="badge badge-gray">只读</span>
          </div>
          <div class="card-body">
            <div class="context-section">
              <div class="context-label">分析范围</div>
              <div class="context-value"><span>时间范围</span><strong>${range.label}</strong></div>
              <div class="context-value"><span>渠道</span><strong>${range.channel ? range.channel.name : "全部渠道"}</strong></div>
              <div class="context-value"><span>品类</span><strong>全部品类</strong></div>
              <div class="context-value"><span>对比口径</span><strong>${range.compare}</strong></div>
            </div>

            <div class="context-section">
              <div class="context-label">本次调用的数据工具</div>
              <div class="tool-row"><span class="tool-check">${icon("check")}</span> get_kpis <span class="tool-time">128ms</span></div>
              <div class="tool-row"><span class="tool-check">${icon("check")}</span> get_trend <span class="tool-time">96ms</span></div>
              <div class="tool-row"><span class="tool-check">${icon("check")}</span> get_product_ranking <span class="tool-time">142ms</span></div>
              <div class="tool-row"><span class="tool-check">${icon("check")}</span> get_inventory_risk <span class="tool-time">74ms</span></div>
            </div>

            <div class="context-section">
              <div class="context-label">关键指标快照</div>
              <div class="context-value"><span>销售额</span><strong>${money(range.sales)}</strong></div>
              <div class="context-value"><span>订单量</span><strong>${num(range.orders)}</strong></div>
              <div class="context-value"><span>转化率</span><strong>${pct(range.conversion, 2)}</strong></div>
              <div class="context-value"><span>毛利率</span><strong>${pct(range.grossMargin)}</strong></div>
            </div>

            <div class="context-section">
              <div class="context-label">安全边界</div>
              <div class="safety-note">
                <strong>只读分析</strong><br/>
                不改价格、不改库存、不调整广告预算；所有执行动作都需要人工确认。
              </div>
            </div>

            <div class="context-section">
              <div class="context-label">模型运行信息</div>
              <div class="context-value"><span>模式</span><strong>演示模式</strong></div>
              <div class="context-value"><span>平均耗时</span><strong>1.8s</strong></div>
              <div class="context-value"><span>本次 Token</span><strong>1,842</strong></div>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <div>
              <h3 class="card-title">可以这样问</h3>
              <p class="card-sub">用自然语言描述业务问题即可</p>
            </div>
            ${icon("help")}
          </div>
          <div class="card-body" style="padding-top:10px">
            <div class="evidence-list">
              <li><span class="evidence-ref">01</span>为什么某个渠道/商品涨跌？</li>
              <li><span class="evidence-ref">02</span>哪些商品值得推广或优化？</li>
              <li><span class="evidence-ref">03</span>库存、退款、毛利有哪些风险？</li>
              <li><span class="evidence-ref">04</span>帮我生成明日/本周运营计划</li>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

/* =========================================================
   Overlay: drawer & plan modal
   ========================================================= */
function renderDrawer(product) {
  const stockRisk = product.stock < product.safety;
  const diagnosis = product.id === "p2"
    ? "轻量跑鞋处于高速放量期，近 30 天销售额环比 +86.5%。但当前库存仅 64 件，可售约 4.2 天，建议先补货再加大投放，避免断货。"
    : product.id === "p4"
      ? "快充充电宝销售额稳定，但毛利率仅 28.9%，低于全店均值 9.5pp；同时库存 18 件、可售 1.8 天，属于利润与供给双重风险。"
      : product.id === "p3"
        ? "磁吸手机壳毛利率 51.2%，是全店利润贡献较高的 SKU。销量排名第 3，建议与充电宝、耳机做组合搭售，提升客单价。"
        : `${product.name}近 30 天销售额 ${money(product.sales)}，毛利率 ${pct(product.margin)}。${stockRisk ? "当前库存低于安全库存，建议关注补货节奏。" : "库存处于健康区间，可继续观察动销变化。"}`;

  const actionItems = stockRisk
    ? [
        { priority: "p0", title: "优先补货", text: "按近 14 日动销补至 21 天安全库存，避免断货。" },
        { priority: "p1", title: "控制放量节奏", text: "补货到仓前降低投放强度，优先保住高转化人群。" },
        { priority: "p2", title: "监控可售天数", text: "将可售天数低于 7 天设为库存预警线。" },
      ]
    : product.margin >= 45
      ? [
          { priority: "p1", title: "做组合搭售", text: "与充电宝、耳机组成配件套装，提升客单价。" },
          { priority: "p2", title: "测试价格带", text: "补齐竞品价格数据，小流量测试 3%-5% 提价空间。" },
          { priority: "p2", title: "监控退款率", text: "退款率低于 2%，保持当前商品描述与尺码说明。" },
        ]
      : [
          { priority: "p1", title: "重谈采购成本", text: "以近 30 天销量为筹码，目标成本下降 3%-5%。" },
          { priority: "p2", title: "组合销售", text: "用高毛利商品做搭售，避免直接降价损伤毛利。" },
          { priority: "p2", title: "补齐费用数据", text: "接入平台佣金、物流和广告费用，升级净利分析。" },
        ];
  const actionHtml = actionItems.map((item) => `
    <li>
      <span class="priority ${item.priority}">${item.priority.toUpperCase()}</span>
      <div><strong>${item.title}</strong><p>${item.text}</p></div>
    </li>
  `).join("");

  return `
    <div class="drawer-backdrop" data-action="close-drawer"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-label="${esc(product.name)} 经营详情">
      <div class="drawer-head">
        <div>
          <h3>商品经营详情</h3>
          <p>近 30 天 · 演示数据</p>
        </div>
        <button class="icon-btn" data-action="close-drawer" aria-label="关闭">${icon("x")}</button>
      </div>
      <div class="drawer-body">
        <div class="drawer-hero">
          <span class="product-thumb tone-${product.tone}">${icon("package")}</span>
          <div>
            <h4>${product.name}</h4>
            <p>${product.category} · SKU ${product.id.toUpperCase()}</p>
          </div>
          <span class="badge ${stockRisk ? "badge-danger" : "badge-success"}" style="margin-left:auto">${stockRisk ? "库存风险" : "库存健康"}</span>
        </div>

        <div class="drawer-kpis">
          <div><span>近30天销售额</span><strong>${money(product.sales)}</strong></div>
          <div><span>销量</span><strong>${num(product.qty)}</strong></div>
          <div><span>毛利率</span><strong>${pct(product.margin)}</strong></div>
          <div><span>当前库存</span><strong style="color:${stockRisk ? "#BE123C" : "var(--text)"}">${num(product.stock)}</strong></div>
        </div>

        <div class="card" style="box-shadow:none">
          <div class="card-head" style="padding:14px 15px 0">
            <div>
              <h3 class="card-title">近 7 天销售额</h3>
              <p class="card-sub">按商品动销等比拆分</p>
            </div>
            <span class="badge ${product.growth >= 0 ? "badge-success" : "badge-danger"}">${signed(product.growth)}</span>
          </div>
          <div class="card-body" style="padding:4px 6px 10px">
            <div id="productTrend" class="chart-sm"></div>
          </div>
        </div>

        <div class="ai-diagnosis">
          <div class="ai-diagnosis-head">${icon("sparkles")} AI 经营诊断</div>
          <p>${diagnosis}</p>
        </div>

        <div class="drawer-extra">
          <div><span>退款率</span><strong>${pct(product.refund)}</strong></div>
          <div><span>安全库存</span><strong>${num(product.safety)}</strong></div>
          <div><span>30天销量</span><strong>${num(product.qty)}</strong></div>
          <div><span>环比增长</span><strong style="color:${product.growth >= 0 ? "#047857" : "#BE123C"}">${signed(product.growth)}</strong></div>
        </div>

        <div class="answer-section" style="margin-top:14px">
          <h5>建议动作</h5>
          <ol class="action-list">${actionHtml}</ol>
        </div>

        <div class="drawer-actions">
          <button class="btn btn-primary" data-action="ai-product" data-id="${product.id}">${icon("sparkles")} 生成优化建议</button>
          <button class="btn btn-ghost" data-action="view-product-data">${icon("external")} 完整数据</button>
        </div>
      </div>
    </aside>
  `;
}

function renderPlanModal() {
  return `
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-label="运营计划">
        <div class="modal-head">
          <div>
            <h3>明日运营计划</h3>
            <p>2026-10-25 · 基于 10-24 经营数据 · 全部动作需人工确认</p>
          </div>
          <button class="icon-btn" data-action="close-plan" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="modal-body">
          <div class="plan-summary">
            明天的主线是 <strong>先保库存、再稳淘宝、后放抖音</strong>。预计可挽回 2 个高风险 SKU 的断货损失，并将淘宝访客恢复至 42,000+。
          </div>

          <div class="plan-block p0">
            <div class="plan-block-head"><span>P0</span><strong>保供给 · 今日完成</strong></div>
            <ul>
              <li>${icon("checkCircle")}<span>快充充电宝补货 <strong>220 件</strong>，覆盖 21 天动销；同步暂停大额投放。</span></li>
              <li>${icon("checkCircle")}<span>轻量跑鞋补货 <strong>320 件</strong>，按大促放量节奏设置库存预警。</span></li>
            </ul>
          </div>

          <div class="plan-block p1">
            <div class="plan-block-head"><span>P1</span><strong>稳基本盘 · 明日执行</strong></div>
            <ul>
              <li>${icon("checkCircle")}<span>检查淘宝主推计划的关键词出价与预算消耗，恢复访客量。</span></li>
              <li>${icon("checkCircle")}<span>复用抖音高转化短视频素材到淘宝逛逛，控制 3 天测试预算。</span></li>
            </ul>
          </div>

          <div class="plan-block">
            <div class="plan-block-head"><span style="color:#1D4ED8;background:#EAF1FF">P2</span><strong>提利润 · 本周验证</strong></div>
            <ul>
              <li>${icon("checkCircle")}<span>上线“手机壳 + 充电宝 + 耳机”通勤组合，目标客单价提升 18%。</span></li>
              <li>${icon("checkCircle")}<span>补充广告花费与竞品价格数据，为下一轮提价/降本提供依据。</span></li>
            </ul>
          </div>

          <div class="plan-evidence">
            <span>E1 · 销售额趋势</span>
            <span>E2 · 渠道占比</span>
            <span>E3 · 库存与可售天数</span>
            <span>E4 · 商品毛利排行</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" data-action="close-plan">关闭</button>
          <button class="btn btn-ghost" data-action="copy-plan">${icon("copy")} 复制计划</button>
          <button class="btn btn-primary" data-action="save-report">${icon("fileText")} 保存到报告中心</button>
        </div>
      </div>
    </div>
  `;
}

/* =========================================================
   Page orchestration
   ========================================================= */
function renderPage() {
  if (state.page === "products") return renderProducts();
  if (state.page === "import") return renderImport();
  if (state.page === "ai") return renderAI();
  return renderOverview();
}

function render() {
  disposeAllCharts();
  $("#sidebar").innerHTML = renderSidebar();
  $("#topbar").innerHTML = renderTopbar();
  $("#view").innerHTML = renderPage();
  $("#sidebar").classList.toggle("open", state.sidebarOpen);
  $("#sidebarOverlay").classList.toggle("show", state.sidebarOpen);

  renderOverlay();
  initPageCharts();

  if (state.page === "ai") {
    renderChatMessages();
    const input = $("#chatInput");
    if (input) input.value = "";
    if (state.pendingQuestion) {
      const question = state.pendingQuestion;
      state.pendingQuestion = null;
      setTimeout(() => sendChat(question), 180);
    }
  }

  document.body.classList.toggle("no-scroll", state.planOpen || Boolean(state.selectedProduct) || state.sidebarOpen);
}

function renderOverlay() {
  const overlay = $("#overlay");
  if (state.planOpen) {
    overlay.innerHTML = renderPlanModal();
  } else if (state.selectedProduct) {
    overlay.innerHTML = renderDrawer(state.selectedProduct);
  } else {
    overlay.innerHTML = "";
  }
  disposeDrawerChart();
  if (state.selectedProduct) initDrawerChart();
}

/* =========================================================
   Charts
   ========================================================= */
function disposeAllCharts() {
  pageCharts.forEach((chart) => chart && chart.dispose());
  pageCharts = [];
  disposeDrawerChart();
}

function disposeDrawerChart() {
  if (drawerChart) {
    drawerChart.dispose();
    drawerChart = null;
  }
}

function initPageCharts() {
  if (!window.echarts) return;
  const trendEl = $("#trendChart");
  if (trendEl) initTrendChart(trendEl);
  const scatterEl = $("#scatterChart");
  if (scatterEl) initScatterChart(scatterEl);
}

function initTrendChart(el) {
  const trend = getTrendData();
  const previous = trend.sales.map((value, index) => Math.round(value * (0.86 + (index % 3) * 0.025)));
  const interval = trend.labels.length > 14 ? 4 : 0;
  const chart = echarts.init(el, null, { renderer: "canvas" });
  chart.setOption({
    animationDuration: 720,
    animationEasing: "cubicOut",
    color: ["#2563EB", "#B6C7DD", "#14B8A6"],
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      padding: [9, 11],
      textStyle: { color: "#fff", fontSize: 11 },
      axisPointer: { type: "line", lineStyle: { color: "#CBD5E1", type: "dashed" } },
      formatter(params) {
        const index = params[0].dataIndex;
        return `
          <div style="font-weight:700;margin-bottom:5px">${trend.labels[index]}</div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:#93C5FD">本期销售额</span><b>${money(trend.sales[index])}</b></div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:#CBD5E1">上期销售额</span><b>${money(previous[index])}</b></div>
          <div style="display:flex;justify-content:space-between;gap:18px"><span style="color:#5EEAD4">订单量</span><b>${num(trend.orders[index])}</b></div>
        `;
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
      data: ["本期销售额", "上期销售额", "订单量"],
    },
    grid: { left: 8, right: 10, top: 36, bottom: 5, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: trend.labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 9, interval, margin: 10 },
    },
    yAxis: [
      {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#94A3B8",
          fontSize: 9,
          formatter(value) {
            if (value >= 10000) return `${(value / 10000).toFixed(0)}万`;
            return value;
          },
        },
        splitLine: { lineStyle: { color: "#EEF3FA", type: "dashed" } },
      },
      {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#94A3B8", fontSize: 9 },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: "本期销售额",
        type: "line",
        smooth: true,
        showSymbol: false,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { width: 2.6, color: "#2563EB", shadowColor: "rgba(37,99,235,.24)", shadowBlur: 10, shadowOffsetY: 5 },
        itemStyle: { color: "#2563EB" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(37,99,235,.22)" },
            { offset: 0.7, color: "rgba(37,99,235,.045)" },
            { offset: 1, color: "rgba(37,99,235,0)" },
          ]),
        },
        data: trend.sales,
      },
      {
        name: "上期销售额",
        type: "line",
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.4, color: "#B6C7DD", type: "dashed" },
        itemStyle: { color: "#B6C7DD" },
        data: previous,
      },
      {
        name: "订单量",
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 1.8, color: "#14B8A6" },
        itemStyle: { color: "#14B8A6" },
        data: trend.orders,
      },
    ],
  });
  pageCharts.push(chart);
}

function initScatterChart(el) {
  const products = DEMO.products;
  const avgSales = products.reduce((sum, product) => sum + product.sales, 0) / products.length / 10000;
  const avgMargin = products.reduce((sum, product) => sum + product.margin, 0) / products.length;
  const maxSales = Math.ceil(Math.max(...products.map((product) => product.sales / 10000)) / 20) * 20;
  const xMax = maxSales + 15;
  const minMargin = 20;
  const maxMargin = 60;
  const topNames = new Set([...products].sort((a, b) => b.sales - a.sales).slice(0, 3).map((product) => product.name));

  const data = products.map((product) => ({
    name: product.name,
    value: [product.sales / 10000, product.margin, product.qty],
    itemStyle: {
      color: product.sales / 10000 >= avgSales
        ? product.margin >= avgMargin ? "#2563EB" : "#F59E0B"
        : product.margin >= avgMargin ? "#14B8A6" : "#94A3B8",
      borderColor: "#fff",
      borderWidth: 1.5,
      shadowBlur: 8,
      shadowColor: "rgba(37,99,235,.12)",
    },
  }));

  const chart = echarts.init(el, null, { renderer: "canvas" });
  chart.setOption({
    animationDuration: 650,
    tooltip: {
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      padding: [9, 11],
      textStyle: { color: "#fff", fontSize: 10 },
      formatter(params) {
        return `<b>${params.name}</b><br/>销售额 ¥${params.value[0].toFixed(1)}万<br/>毛利率 ${params.value[1].toFixed(1)}%<br/>销量 ${num(params.value[2])}`;
      },
    },
    grid: { left: 6, right: 26, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: "value",
      min: 0,
      max: xMax,
      name: "销售额（万元）",
      nameLocation: "middle",
      nameGap: 24,
      nameTextStyle: { color: "#94A3B8", fontSize: 8 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 8 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    yAxis: {
      type: "value",
      min: minMargin,
      max: maxMargin,
      name: "毛利率（%）",
      nameTextStyle: { color: "#94A3B8", fontSize: 8 },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 8 },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    series: [{
      type: "scatter",
      data,
      symbolSize(value) {
        return Math.max(11, Math.min(29, Math.sqrt(value[2]) / 4));
      },
      label: {
        show: true,
        position: "right",
        distance: 4,
        color: "#475569",
        fontSize: 8,
        formatter(params) {
          return topNames.has(params.name) ? params.name : "";
        },
      },
      emphasis: { scale: 1.18 },
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
          [{ name: "明星", xAxis: avgSales, yAxis: avgMargin }, { xAxis: xMax, yAxis: maxMargin }],
          [{ name: "金牛", xAxis: avgSales, yAxis: minMargin }, { xAxis: xMax, yAxis: avgMargin }],
          [{ name: "潜力", xAxis: 0, yAxis: avgMargin }, { xAxis: avgSales, yAxis: maxMargin }],
          [{ name: "调整", xAxis: 0, yAxis: minMargin }, { xAxis: avgSales, yAxis: avgMargin }],
        ].map((area, index) => ([
          { ...area[0], itemStyle: { color: ["rgba(37,99,235,.035)", "rgba(245,158,11,.04)", "rgba(20,184,166,.04)", "rgba(148,163,184,.035)"][index] } },
          area[1],
        ])),
      },
    }],
  });
  pageCharts.push(chart);
}

function initDrawerChart() {
  if (!state.selectedProduct || !window.echarts) return;
  const el = $("#productTrend");
  if (!el) return;
  const product = state.selectedProduct;
  const factors = [0.78, 0.84, 0.9, 1.0, 1.08, 1.16, 1.22];
  const total = product.sales / 30 * 7;
  const raw = factors.map((factor) => factor * total / factors.reduce((a, b) => a + b, 0));
  const data = raw.map((value) => Math.round(value));
  const labels = DEMO.trend["7d"].labels;
  drawerChart = echarts.init(el, null, { renderer: "canvas" });
  drawerChart.setOption({
    animationDuration: 550,
    grid: { left: 24, right: 24, top: 12, bottom: 4, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#0B1B33",
      borderWidth: 0,
      padding: [7, 9],
      textStyle: { color: "#fff", fontSize: 9 },
      formatter(params) {
        return `${labels[params[0].dataIndex]}<br/><b>${money(data[params[0].dataIndex])}</b>`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94A3B8", fontSize: 8, interval: 0 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { lineStyle: { color: "#F1F5F9", type: "dashed" } },
    },
    series: [{
      type: "line",
      data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2, color: "#14B8A6" },
      itemStyle: { color: "#14B8A6" },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: "rgba(20,184,166,.22)" },
          { offset: 1, color: "rgba(20,184,166,0)" },
        ]),
      },
    }],
  });
}

/* =========================================================
   Chat
   ========================================================= */
function productAnswer(product) {
  const stockRisk = product.stock < product.safety;
  return `
    <div class="answer-head">
      <span class="badge badge-blue">单品诊断</span>
      <h4>${product.name}：${product.growth >= 0 ? "增长" : "承压"}中的${stockRisk ? "供给风险" : "利润机会"}</h4>
    </div>
    <p>近 30 天销售额 <strong>${money(product.sales)}</strong>，销量 ${num(product.qty)} 件，毛利率 ${pct(product.margin)}，退款率 ${pct(product.refund)}。${stockRisk ? `当前库存 ${product.stock} 件，已低于安全库存 ${product.safety} 件。` : "库存处于健康区间。"}</p>
    <div class="answer-kpis">
      <div><span>销售额</span><strong>${money(product.sales)}</strong><em class="${product.growth >= 0 ? "up" : "down"}">${signed(product.growth)}</em></div>
      <div><span>毛利率</span><strong>${pct(product.margin)}</strong><em class="${product.margin >= 38.4 ? "up" : "down"}">${product.margin >= 38.4 ? "高于" : "低于"}均值</em></div>
      <div><span>库存</span><strong>${num(product.stock)}</strong><em class="${stockRisk ? "down" : "up"}">${stockRisk ? "低于安全线" : "库存健康"}</em></div>
    </div>
    <div class="answer-section">
      <h5>数据依据</h5>
      <ul class="evidence-list">
        <li><span class="evidence-ref">E1</span>商品排行：销售额 ${money(product.sales)}，销量 ${num(product.qty)}</li>
        <li><span class="evidence-ref">E2</span>毛利与退款：毛利率 ${pct(product.margin)}，退款率 ${pct(product.refund)}</li>
        <li><span class="evidence-ref">E3</span>库存：${product.stock} 件，安全库存 ${product.safety} 件</li>
      </ul>
    </div>
    <div class="answer-section">
      <h5>建议动作</h5>
      <ol class="action-list">
        ${stockRisk ? `<li><span class="priority p0">P0</span><div><strong>优先补货</strong><p>按近 14 日动销补至 21 天安全库存，避免断货。</p></div></li>` : ""}
        <li><span class="priority p1">P1</span><div><strong>${product.margin >= 38.4 ? "做组合搭售" : "重谈采购成本"}</strong><p>${product.margin >= 38.4 ? "用高毛利商品带动客单价，避免直接降价。" : "以近 30 天销量为筹码，目标成本下降 3%-5%。"}</p></div></li>
        <li><span class="priority p2">P2</span><div><strong>补齐竞品与广告数据</strong><p>当前无法判断价格与投放因素，建议接入后做进一步归因。</p></div></li>
      </ol>
    </div>
    <div class="answer-gaps"><strong>需要补充：</strong>广告花费、竞品价格、供应商交期。缺少这些数据时，不对具体原因下定论。</div>
    <div class="answer-actions"><button class="btn btn-soft" data-action="save-report">保存报告</button><button class="btn btn-primary" data-action="open-plan">生成运营计划</button></div>
  `;
}

function getAIResponse(question) {
  const product = DEMO.products.find((item) => question.includes(item.name));
  if (product) return productAnswer(product);
  if (/(计划|明天|本周|怎么安排|明日)/.test(question)) return DEMO.ai.plan;
  if (/(库存|补货|缺货|售罄|安全库存)/.test(question)) return DEMO.ai.inventory;
  if (/(毛利|利润|成本|高销售)/.test(question)) return DEMO.ai.margin;
  if (/(推广|重点|选品|增长|机会|值得)/.test(question)) return DEMO.ai.promotion;
  if (/(下降|下滑|为什么|原因|异动|跌)/.test(question)) return DEMO.ai.decline;
  return DEMO.ai.fallback;
}

function sendChat(question) {
  const text = String(question || "").trim();
  if (!text || state.chatBusy) return;
  if (!state.chat.length) {
    state.chat.push({ role: "assistant", html: DEMO.ai.welcome });
  }

  state.chatBusy = true;
  const requestId = ++chatRequestSeq;
  state.chat.push({ role: "user", text });
  const typingMessage = { role: "assistant", typing: true };
  state.chat.push(typingMessage);
  renderChatMessages();

  const input = $("#chatInput");
  if (input) input.value = "";

  setTimeout(() => {
    if (requestId !== chatRequestSeq) return;
    const index = state.chat.indexOf(typingMessage);
    if (index !== -1) state.chat.splice(index, 1);
    state.chat.push({ role: "assistant", html: getAIResponse(text) });
    state.chatBusy = false;
    renderChatMessages();
  }, 1050);
}

function resetChat() {
  chatRequestSeq += 1;
  state.chatBusy = false;
  state.chat = [{ role: "assistant", html: DEMO.ai.welcome }];
}

/* =========================================================
   Import simulation
   ========================================================= */
function startImport(filename) {
  if (state.importState === "running") return;
  state.importState = "running";
  state.importStep = 0;
  state.importResult = null;
  state.page = "import";
  render();
  showToast(`开始解析 ${filename}`, "info");

  let step = 0;
  const timer = setInterval(() => {
    step += 1;
    state.importStep = step;
    if (state.page === "import") updateImportSteps();
    if (step >= 4) {
      clearInterval(timer);
      setTimeout(() => {
        state.importState = "done";
        state.importResult = { filename, rows: 1248, failed: 3, score: "98.2" };
        if (state.page === "import") render();
        showToast("导入完成：1,248 条成功，3 条待处理", "success");
      }, 450);
    }
  }, 620);
}

function updateImportSteps() {
  $$("[data-import-step]").forEach((el, index) => {
    el.classList.remove("active", "done");
    if (state.importState === "done" || index < state.importStep) {
      el.classList.add("done");
      const dot = el.querySelector(".step-dot");
      if (dot) dot.innerHTML = icon("check");
    } else if (state.importState === "running" && index === state.importStep) {
      el.classList.add("active");
      const dot = el.querySelector(".step-dot");
      if (dot) dot.textContent = String(index + 1);
    } else {
      const dot = el.querySelector(".step-dot");
      if (dot) dot.textContent = String(index + 1);
    }
  });
}

/* =========================================================
   Toast
   ========================================================= */
function showToast(message, type = "success") {
  const root = $("#toastRoot");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  const iconName = type === "warn" ? "alert" : type === "info" ? "info" : "checkCircle";
  toast.innerHTML = `${icon(iconName)}<span>${esc(message)}</span>`;
  root.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    toast.style.transition = "opacity .2s ease, transform .2s ease";
    setTimeout(() => toast.remove(), 220);
  }, 2800);
}

/* =========================================================
   Actions
   ========================================================= */
function navigate(page) {
  state.page = page;
  state.sidebarOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openProduct(product) {
  state.selectedProduct = product;
  state.planOpen = false;
  renderOverlay();
  document.body.classList.add("no-scroll");
}

function closeOverlay() {
  state.selectedProduct = null;
  state.planOpen = false;
  renderOverlay();
  document.body.classList.remove("no-scroll");
}

function goToAIWithQuestion(question) {
  state.pendingQuestion = question;
  state.selectedProduct = null;
  state.planOpen = false;
  state.page = "ai";
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function planAsText() {
  return `AI 电商数据中台 · 明日运营计划
日期：2026-10-25（基于 10-24 数据）

主线：先保库存、再稳淘宝、后放抖音

P0 保供给
- 快充充电宝补货 220 件，覆盖 21 天动销；暂停大额投放。
- 轻量跑鞋补货 320 件，设置库存预警。

P1 稳基本盘
- 检查淘宝主推计划的关键词出价与预算消耗。
- 复用抖音高转化短视频素材到淘宝逛逛，测试 3 天。

P2 提利润
- 上线“手机壳 + 充电宝 + 耳机”通勤组合，目标客单价 +18%。
- 补充广告花费与竞品价格数据。

数据依据：E1 销售额趋势、E2 渠道占比、E3 库存与可售天数、E4 商品毛利排行。
所有动作需人工确认，系统不会自动执行。`;
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast("运营计划已复制", "success"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast("运营计划已复制", "success");
  } catch (error) {
    showToast("复制失败，请手动选择文本", "warn");
  }
  textarea.remove();
}

function handleAction(action, element) {
  switch (action) {
    case "toggle-sidebar":
      state.sidebarOpen = !state.sidebarOpen;
      $("#sidebar").classList.toggle("open", state.sidebarOpen);
      $("#sidebarOverlay").classList.toggle("show", state.sidebarOpen);
      document.body.classList.toggle("no-scroll", state.sidebarOpen || state.planOpen || Boolean(state.selectedProduct));
      break;
    case "refresh": {
      const button = element;
      button.classList.add("spinning");
      setTimeout(() => {
        button.classList.remove("spinning");
        showToast("已同步最新演示数据", "success");
      }, 650);
      break;
    }
    case "notifications":
      showToast("2 个库存风险待处理，暂无其他新预警", "warn");
      break;
    case "export":
      showToast("经营日报已生成（Demo 演示）", "success");
      break;
    case "export-products":
      showToast("商品报表已生成（Demo 演示）", "success");
      break;
    case "open-plan":
      state.planOpen = true;
      state.selectedProduct = null;
      renderOverlay();
      document.body.classList.add("no-scroll");
      break;
    case "close-plan":
      state.planOpen = false;
      renderOverlay();
      document.body.classList.remove("no-scroll");
      break;
    case "copy-plan":
      copyText(planAsText());
      break;
    case "save-report":
      showToast("报告已保存到报告中心（正式版开放）", "success");
      break;
    case "new-chat":
      resetChat();
      render();
      showToast("已开启新对话", "info");
      break;
    case "pick-file":
      $("#fileInput").click();
      break;
    case "demo-upload":
      startImport("orders_20261024.csv");
      break;
    case "download-errors":
      showToast("错误明细已生成（Demo 演示）", "success");
      break;
    case "download-template":
      showToast("模板下载已开始（Demo 演示）", "success");
      break;
    case "spec":
      showToast("接入规范：CSV/XLSX，必填字段见模板说明", "info");
      break;
    case "open-product": {
      const product = productById(element.dataset.id);
      if (product) openProduct(product);
      break;
    }
    case "close-drawer":
      closeOverlay();
      break;
    case "ai-product": {
      const product = productById(element.dataset.id);
      if (product) goToAIWithQuestion(`请分析${product.name}的销售、毛利和库存表现，并给出优化建议`);
      break;
    }
    case "view-product-data":
      showToast("完整商品数据将在正式版开放", "info");
      break;
    case "stock-plan":
      showToast(`${element.dataset.name || "该商品"} 的补货建议已生成`, "success");
      break;
    case "view-all-products":
      showToast("共 48 个商品，Demo 展示前 8 个", "info");
      break;
    case "view-job":
      showToast("导入任务详情将在正式版开放", "info");
      break;
    case "view-jobs":
      showToast("任务列表将在正式版开放", "info");
      break;
    case "ai-product-list":
      goToAIWithQuestion("哪些商品值得重点推广？");
      break;
    default:
      break;
  }
}

/* =========================================================
   Events
   ========================================================= */
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    if (nav.dataset.disabled === "true") {
      showToast("该模块将在正式版开放，Demo 聚焦 4 个核心页面", "info");
      return;
    }
    navigate(nav.dataset.nav);
    return;
  }

  const suggestion = event.target.closest("[data-suggestion]");
  if (suggestion) {
    sendChat(suggestion.dataset.suggestion);
    return;
  }

  const productTab = event.target.closest("[data-product-tab]");
  if (productTab) {
    state.productTab = productTab.dataset.productTab;
    render();
    return;
  }

  const action = event.target.closest("[data-action]");
  if (action) {
    event.stopPropagation();
    handleAction(action.dataset.action, action);
    return;
  }

  if (event.target.classList.contains("modal-backdrop")) {
    state.planOpen = false;
    renderOverlay();
    document.body.classList.remove("no-scroll");
  }

  if (event.target.classList.contains("drawer-backdrop")) {
    closeOverlay();
  }
});

document.addEventListener("change", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (!filter) return;
  state[filter.dataset.filter] = filter.value;
  render();
});

document.addEventListener("submit", (event) => {
  const chatForm = event.target.closest("[data-chat-form]");
  if (chatForm) {
    event.preventDefault();
    const input = chatForm.querySelector("input");
    if (input) sendChat(input.value);
    return;
  }

  const miniForm = event.target.closest("[data-mini-chat-form]");
  if (miniForm) {
    event.preventDefault();
    const input = miniForm.querySelector("input");
    const question = input ? input.value.trim() : "";
    if (question) goToAIWithQuestion(question);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (state.planOpen || state.selectedProduct) {
      closeOverlay();
    }
    if (state.sidebarOpen) {
      state.sidebarOpen = false;
      $("#sidebar").classList.remove("open");
      $("#sidebarOverlay").classList.remove("show");
      document.body.classList.remove("no-scroll");
    }
  }
});

document.addEventListener("dragover", (event) => {
  const dropzone = event.target.closest("#dropzone");
  if (!dropzone) return;
  event.preventDefault();
  dropzone.classList.add("drag");
});

document.addEventListener("dragleave", (event) => {
  const dropzone = event.target.closest("#dropzone");
  if (!dropzone) return;
  dropzone.classList.remove("drag");
});

document.addEventListener("drop", (event) => {
  const dropzone = event.target.closest("#dropzone");
  if (!dropzone) return;
  event.preventDefault();
  dropzone.classList.remove("drag");
  const file = event.dataTransfer.files && event.dataTransfer.files[0];
  startImport(file ? file.name : "orders_20261024.csv");
});

document.addEventListener("change", (event) => {
  if (event.target.id === "fileInput") {
    const file = event.target.files && event.target.files[0];
    if (file) startImport(file.name);
  }
});

$("#sidebarOverlay").addEventListener("click", () => {
  state.sidebarOpen = false;
  $("#sidebar").classList.remove("open");
  $("#sidebarOverlay").classList.remove("show");
  document.body.classList.remove("no-scroll");
});

window.addEventListener("resize", () => {
  pageCharts.forEach((chart) => chart && chart.resize());
  if (drawerChart) drawerChart.resize();
});

/* =========================================================
   Boot
   ========================================================= */
const bootParams = new URLSearchParams(window.location.search);
const bootPage = bootParams.get("page");
if (["overview", "products", "import", "ai"].includes(bootPage)) state.page = bootPage;
const bootRange = bootParams.get("range");
if (bootRange && DEMO.ranges[bootRange]) state.range = bootRange;
const bootChannel = bootParams.get("channel");
if (bootChannel && (bootChannel === "all" || DEMO.channels.some((channel) => channel.id === bootChannel))) {
  state.channel = bootChannel;
}

resetChat();
render();
