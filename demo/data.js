/**
 * AI Commerce Hub — Demo mock data
 * 所有金额单位：元；所有指标口径尽量保持一致，仅用于界面演示。
 */
const DEMO = (() => {
  const ranges = {
    today: {
      label: "今日",
      compare: "较昨日",
      sales: 168752,
      orders: 1268,
      visitors: 44648,
      conversion: 2.84,
      grossMargin: 38.6,
      salesGrowth: 12.5,
      ordersGrowth: 8.3,
      visitorsGrowth: 15.2,
      conversionGrowth: 0.6,
    },
    "7d": {
      label: "近7天",
      compare: "较上周",
      sales: 1086420,
      orders: 8420,
      visitors: 296500,
      conversion: 2.84,
      grossMargin: 38.2,
      salesGrowth: 9.8,
      ordersGrowth: 6.4,
      visitorsGrowth: 11.2,
      conversionGrowth: 0.2,
    },
    "30d": {
      label: "近30天",
      compare: "较上月",
      sales: 5086900,
      orders: 40200,
      visitors: 1425000,
      conversion: 2.82,
      grossMargin: 38.4,
      salesGrowth: 14.6,
      ordersGrowth: 10.1,
      visitorsGrowth: 9.4,
      conversionGrowth: 0.3,
    },
  };

  const channels = [
    { id: "taobao", name: "淘宝", share: 0.38, color: "#F97316", growth: 14.2, convFactor: 1.02 },
    { id: "jd", name: "京东", share: 0.22, color: "#EF4444", growth: 9.6, convFactor: 1.18 },
    { id: "pdd", name: "拼多多", share: 0.15, color: "#F43F5E", growth: 21.4, convFactor: 0.78 },
    { id: "douyin", name: "抖音", share: 0.13, color: "#0F172A", growth: 32.8, convFactor: 0.92 },
    { id: "other", name: "其他", share: 0.12, color: "#94A3B8", growth: 4.1, convFactor: 0.86 },
  ];

  const products = [
    { id: "p1", name: "蓝牙耳机 Pro", category: "数码配件", qty: 12536, sales: 1245600, margin: 42.8, refund: 1.8, stock: 286, safety: 200, growth: 18.2, tone: "blue" },
    { id: "p2", name: "轻量跑鞋", category: "运动户外", qty: 8762, sales: 876200, margin: 35.6, refund: 3.2, stock: 64, safety: 80, growth: 86.5, tone: "teal" },
    { id: "p3", name: "磁吸手机壳", category: "数码配件", qty: 6341, sales: 528300, margin: 51.2, refund: 1.2, stock: 512, safety: 180, growth: 6.4, tone: "violet" },
    { id: "p4", name: "快充充电宝", category: "数码配件", qty: 5962, sales: 478600, margin: 28.9, refund: 2.4, stock: 18, safety: 60, growth: -3.1, tone: "amber" },
    { id: "p5", name: "城市机能卫衣", category: "服饰鞋包", qty: 4763, sales: 381200, margin: 39.4, refund: 4.6, stock: 142, safety: 100, growth: 12.7, tone: "rose" },
    { id: "p6", name: "智能手环", category: "数码配件", qty: 4210, sales: 336800, margin: 33.5, refund: 2.1, stock: 98, safety: 120, growth: 9.3, tone: "indigo" },
    { id: "p7", name: "防晒外套", category: "服饰鞋包", qty: 3890, sales: 272300, margin: 44.1, refund: 5.8, stock: 210, safety: 120, growth: -6.2, tone: "sky" },
    { id: "p8", name: "便携咖啡杯", category: "家居生活", qty: 3420, sales: 239400, margin: 46.7, refund: 1.6, stock: 320, safety: 160, growth: 21.4, tone: "emerald" },
    { id: "p9", name: "桌面收纳盒", category: "家居生活", qty: 2980, sales: 178800, margin: 48.3, refund: 0.9, stock: 430, safety: 180, growth: 3.8, tone: "cyan" },
    { id: "p10", name: "运动水壶", category: "运动户外", qty: 2650, sales: 132500, margin: 41.2, refund: 2.8, stock: 76, safety: 100, growth: 15.1, tone: "lime" },
  ];

  const categories = [
    { name: "数码配件", sales: 2589300, share: 50.9, growth: 15.8, color: "#2563EB" },
    { name: "运动户外", sales: 1008700, share: 19.8, growth: 24.6, color: "#14B8A6" },
    { name: "服饰鞋包", sales: 653500, share: 12.8, growth: 5.2, color: "#7C3AED" },
    { name: "家居生活", sales: 418200, share: 8.2, growth: 11.9, color: "#F59E0B" },
    { name: "其他", sales: 417200, share: 8.2, growth: 2.4, color: "#94A3B8" },
  ];

  const inventoryAlerts = [
    { id: "p4", name: "快充充电宝", stock: 18, safety: 60, days: 1.8, level: "high", note: "预计 2 天内售罄" },
    { id: "p2", name: "轻量跑鞋", stock: 64, safety: 80, days: 4.2, level: "high", note: "大促放量中，优先补货" },
    { id: "p10", name: "运动水壶", stock: 76, safety: 100, days: 6.8, level: "medium", note: "低于安全库存" },
    { id: "p6", name: "智能手环", stock: 98, safety: 120, days: 8.4, level: "medium", note: "关注下周动销" },
  ];

  const insights = [
    {
      tag: "增长机会",
      tone: "teal",
      title: "运动鞋正在加速放量",
      text: "近 30 天销售额环比增长 86.5%，但库存仅剩 64 件，建议同步加投与补货。",
      evidence: "商品排行 · 轻量跑鞋",
    },
    {
      tag: "利润优化",
      tone: "violet",
      title: "手机壳适合做组合销售",
      text: "毛利率 51.2%，销量排名第 3，可与充电宝、耳机组成配件套装提升客单价。",
      evidence: "商品排行 · 磁吸手机壳",
    },
    {
      tag: "库存风险",
      tone: "amber",
      title: "充电宝库存进入警戒线",
      text: "当前库存 18 件，按近 14 日动销测算仅可售 1.8 天，存在断货风险。",
      evidence: "库存预警 · 快充充电宝",
    },
  ];

  const imports = [
    { id: "IMP-20261024-018", file: "orders_20261024.csv", type: "订单", rows: 1248, failed: 3, status: "成功", time: "10-24 18:42", operator: "运营管理员" },
    { id: "IMP-20261023-012", file: "products_master.xlsx", type: "商品", rows: 48, failed: 0, status: "成功", time: "10-23 09:15", operator: "运营管理员" },
    { id: "IMP-20261022-009", file: "traffic_20261022.csv", type: "流量", rows: 720, failed: 12, status: "部分成功", time: "10-22 21:08", operator: "数据分析师" },
    { id: "IMP-20261021-006", file: "inventory_snapshot.xlsx", type: "库存", rows: 48, failed: 1, status: "成功", time: "10-21 10:31", operator: "运营管理员" },
  ];

  const fieldMapping = [
    { source: "order_no", target: "order_id", type: "文本", status: "已映射" },
    { source: "pay_time", target: "paid_at", type: "日期时间", status: "已映射" },
    { source: "channel_name", target: "channel", type: "枚举", status: "已映射" },
    { source: "goods_id", target: "product_id", type: "文本", status: "需确认" },
    { source: "pay_amount", target: "total_amount", type: "金额（分）", status: "已映射" },
    { source: "refund_money", target: "refund_amount", type: "金额（分）", status: "已映射" },
  ];

  const validationErrors = [
    { row: 128, field: "order_id", value: "ORD-20261024-00918", reason: "订单号重复，已存在相同记录", level: "error" },
    { row: 306, field: "paid_at", value: "2026/13/24 09:12", reason: "日期格式无法解析", level: "error" },
    { row: 512, field: "product_id", value: "SKU-UNKNOWN-77", reason: "商品 ID 不存在于商品主表", level: "warning" },
  ];

  const trend7d = {
    labels: ["10-18", "10-19", "10-20", "10-21", "10-22", "10-23", "10-24"],
    sales: [138400, 142800, 146500, 150200, 157468, 182300, 168752],
    orders: [1020, 1080, 1100, 1140, 1381, 1431, 1268],
    visitors: [38200, 39800, 40500, 41200, 44100, 48052, 44648],
  };

  const trendToday = {
    labels: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
    sales: [8200, 14600, 18200, 21500, 24800, 28600, 31200, 21652],
    orders: [62, 110, 138, 162, 187, 215, 235, 159],
    visitors: [2200, 3800, 4900, 5600, 6400, 7200, 8100, 6448],
  };

  function build30d() {
    const labels = [];
    const raw = [];
    const start = new Date(2026, 8, 25);
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(start.getTime() + i * 86400000);
      labels.push(`${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      raw.push(0.78 + 0.28 * Math.sin(i / 3.4) + i * 0.011 + ((i * 7) % 5) * 0.016);
    }
    const targetSales = 5086900;
    const targetOrders = 40200;
    const targetVisitors = 1425000;
    const scale = (arr, target) => {
      const sum = arr.reduce((a, b) => a + b, 0);
      const out = arr.map((v) => Math.round((v / sum) * target));
      out[out.length - 1] += target - out.reduce((a, b) => a + b, 0);
      return out;
    };
    return {
      labels,
      sales: scale(raw, targetSales),
      orders: scale(raw.map((v, i) => v * (0.9 + (i % 4) * 0.04)), targetOrders),
      visitors: scale(raw.map((v, i) => v * (1.02 + (i % 3) * 0.02)), targetVisitors),
    };
  }

  const trend = {
    today: trendToday,
    "7d": trend7d,
    "30d": build30d(),
  };

  const ai = {
    welcome: `
      <div class="answer-head">
        <span class="badge badge-violet">AI 经营分析</span>
        <h4>下午好，我是你的经营分析助手</h4>
      </div>
      <p>我会先调用指标工具核对数据，再给出结论、证据和可执行建议。当前分析范围以右上角的日期与渠道筛选为准。</p>
      <div class="capability-grid">
        <div><span>01</span>经营异动归因</div>
        <div><span>02</span>商品增长机会</div>
        <div><span>03</span>库存与退款风险</div>
        <div><span>04</span>运营计划生成</div>
      </div>
      <p class="muted-line">所有数字来自数据工具，模型只负责解释，不会直接修改价格、库存或投放。</p>
    `,
    decline: `
      <div class="answer-head">
        <span class="badge badge-amber">单日异动</span>
        <h4>单日回落 7.4%，更像促销后的正常回撤</h4>
      </div>
      <p>昨日（10-24）全渠道销售额 <strong>¥168,752</strong>，环比 10-23 的 ¥182,300 下降 <strong>7.4%</strong>；不过近 7 天累计仍增长 9.8%，更像促销脉冲后的正常回撤。回落主要集中在淘宝渠道，抖音渠道保持增长。</p>
      <div class="answer-kpis">
        <div><span>全渠道销售额</span><strong>¥168,752</strong><em class="down">-7.4%</em></div>
        <div><span>淘宝渠道</span><strong>¥64,126</strong><em class="down">-12.1%</em></div>
        <div><span>抖音渠道</span><strong>¥21,938</strong><em class="up">+32.8%</em></div>
      </div>
      <div class="answer-section">
        <h5>数据依据</h5>
        <ul class="evidence-list">
          <li><span class="evidence-ref">E1</span>销售额趋势：10-23 ¥182,300 → 10-24 ¥168,752</li>
          <li><span class="evidence-ref">E2</span>渠道占比：淘宝 38%，环比 -12.1%；抖音 13%，环比 +32.8%</li>
          <li><span class="evidence-ref">E3</span>访客数：44,648，环比 -7.1%；转化率 2.84%，环比 -0.14pp</li>
        </ul>
      </div>
      <div class="answer-section">
        <h5>可能原因</h5>
        <div class="cause-row"><span>淘宝流量下滑叠加转化率走弱</span><span class="confidence mid">中可信</span></div>
        <div class="cause-row"><span>10-23 存在促销脉冲，次日回落属于正常波动</span><span class="confidence high">高可信</span></div>
        <div class="cause-row"><span>缺少广告花费与竞品价格数据，无法判断投放或价格因素</span><span class="confidence low">证据不足</span></div>
      </div>
      <div class="answer-section">
        <h5>建议动作</h5>
        <ol class="action-list">
          <li><span class="priority p0">P0</span><div><strong>检查淘宝主推计划</strong><p>核对近 3 日关键词出价与预算消耗，优先恢复访客量。</p></div></li>
          <li><span class="priority p1">P1</span><div><strong>复用抖音增长素材</strong><p>将抖音高转化的短视频素材同步到淘宝逛逛，测试 3 天。</p></div></li>
          <li><span class="priority p2">P2</span><div><strong>补齐广告与竞品数据</strong><p>当前无法验证投放和价格因素，建议接入广告花费表。</p></div></li>
        </ol>
      </div>
      <div class="answer-gaps"><strong>需要补充：</strong>广告花费、竞品价格、淘宝分时流量来源。缺少这些数据时，不会对具体原因下定论。</div>
      <div class="answer-actions"><button class="btn btn-soft" data-action="save-report">保存报告</button><button class="btn btn-primary" data-action="open-plan">生成运营计划</button></div>
    `,
    promotion: `
      <div class="answer-head">
        <span class="badge badge-teal">增长机会</span>
        <h4>优先推广运动鞋与手机壳，但节奏要分开</h4>
      </div>
      <p>近 30 天，轻量跑鞋销售额 ¥876,200，环比增长 86.5%，处于明显放量期；磁吸手机壳毛利率 51.2%，适合承担利润。两者建议采用不同打法。</p>
      <div class="answer-kpis">
        <div><span>轻量跑鞋</span><strong>¥876,200</strong><em class="up">+86.5%</em></div>
        <div><span>磁吸手机壳</span><strong>¥528,300</strong><em class="up">+6.4%</em></div>
        <div><span>手机壳毛利率</span><strong>51.2%</strong><em class="up">高于均值 12.8pp</em></div>
      </div>
      <div class="answer-section">
        <h5>数据依据</h5>
        <ul class="evidence-list">
          <li><span class="evidence-ref">E1</span>商品排行：轻量跑鞋销售额第 2，增长率第 1</li>
          <li><span class="evidence-ref">E2</span>库存：跑鞋仅剩 64 件，可售 4.2 天</li>
          <li><span class="evidence-ref">E3</span>毛利：手机壳 51.2%，高于全店平均 38.4%</li>
        </ul>
      </div>
      <div class="answer-section">
        <h5>建议动作</h5>
        <ol class="action-list">
          <li><span class="priority p0">P0</span><div><strong>跑鞋先补货再放量</strong><p>按近 14 日动销补至 21 天安全库存，避免大促断货。</p></div></li>
          <li><span class="priority p1">P1</span><div><strong>手机壳做配件组合</strong><p>与充电宝、耳机组成“通勤三件套”，目标客单价提升 18%。</p></div></li>
          <li><span class="priority p2">P2</span><div><strong>跑鞋素材复用</strong><p>把抖音高转化素材复用到京东、淘宝，控制 7 天测试预算。</p></div></li>
        </ol>
      </div>
      <div class="answer-gaps"><strong>需要补充：</strong>各渠道广告 ROI、竞品同款价格带，用于确定放量上限。</div>
      <div class="answer-actions"><button class="btn btn-soft" data-action="save-report">保存报告</button><button class="btn btn-primary" data-action="open-plan">生成运营计划</button></div>
    `,
    inventory: `
      <div class="answer-head">
        <span class="badge badge-danger">库存风险</span>
        <h4>2 个 SKU 进入高风险区，充电宝最紧急</h4>
      </div>
      <p>按近 14 日日均销量测算，快充充电宝仅可售 1.8 天，轻量跑鞋可售 4.2 天。两者都在放量期，断货会直接影响本周销售。</p>
      <div class="answer-kpis">
        <div><span>快充充电宝</span><strong>18 件</strong><em class="down">可售 1.8 天</em></div>
        <div><span>轻量跑鞋</span><strong>64 件</strong><em class="down">可售 4.2 天</em></div>
        <div><span>高风险 SKU</span><strong>2 个</strong><em class="down">建议今日处理</em></div>
      </div>
      <div class="answer-section">
        <h5>数据依据</h5>
        <ul class="evidence-list">
          <li><span class="evidence-ref">E1</span>库存表：充电宝 18 件，安全库存 60 件</li>
          <li><span class="evidence-ref">E2</span>库存表：跑鞋 64 件，安全库存 80 件</li>
          <li><span class="evidence-ref">E3</span>近 14 日日均销量：充电宝 10.0 件/日，跑鞋 15.2 件/日</li>
        </ul>
      </div>
      <div class="answer-section">
        <h5>建议动作</h5>
        <ol class="action-list">
          <li><span class="priority p0">P0</span><div><strong>充电宝今日补货</strong><p>建议补货 220 件，覆盖 21 天动销；同步暂停大额投放。</p></div></li>
          <li><span class="priority p0">P0</span><div><strong>跑鞋补货 320 件</strong><p>大促放量期，按 21 天安全库存补货，并设置库存预警。</p></div></li>
          <li><span class="priority p2">P2</span><div><strong>建立周度库存例会</strong><p>每周一检查可售天数 < 7 天的 SKU。</p></div></li>
        </ol>
      </div>
      <div class="answer-gaps"><strong>需要补充：</strong>供应商交期、在途库存与退货入库计划，才能给出精确补货时点。</div>
      <div class="answer-actions"><button class="btn btn-soft" data-action="save-report">保存报告</button><button class="btn btn-primary" data-action="open-plan">生成运营计划</button></div>
    `,
    margin: `
      <div class="answer-head">
        <span class="badge badge-violet">利润诊断</span>
        <h4>充电宝和智能手环是“高销售、低毛利”重点</h4>
      </div>
      <p>快充充电宝销售额 ¥478,600，但毛利率仅 28.9%；智能手环销售额 ¥336,800，毛利率 33.5%。两者都低于全店平均 38.4%，需要检查价格带与成本。</p>
      <div class="answer-kpis">
        <div><span>快充充电宝</span><strong>28.9%</strong><em class="down">低于均值 9.5pp</em></div>
        <div><span>智能手环</span><strong>33.5%</strong><em class="down">低于均值 4.9pp</em></div>
        <div><span>可优化毛利额</span><strong>¥42,800</strong><em class="up">按 +3pp 测算</em></div>
      </div>
      <div class="answer-section">
        <h5>数据依据</h5>
        <ul class="evidence-list">
          <li><span class="evidence-ref">E1</span>商品毛利排行：充电宝 28.9%，智能手环 33.5%</li>
          <li><span class="evidence-ref">E2</span>全店平均毛利率 38.4%，数码配件品类 42.1%</li>
          <li><span class="evidence-ref">E3</span>两者合计销售额 ¥815,400，占近 30 天 16.0%</li>
        </ul>
      </div>
      <div class="answer-section">
        <h5>建议动作</h5>
        <ol class="action-list">
          <li><span class="priority p1">P1</span><div><strong>重谈采购成本</strong><p>以近 30 天销量为筹码，目标成本下降 3%-5%。</p></div></li>
          <li><span class="priority p1">P1</span><div><strong>调整组合价</strong><p>用高毛利手机壳做搭售，避免直接降价损伤毛利。</p></div></li>
          <li><span class="priority p2">P2</span><div><strong>监控价格带</strong><p>补充竞品价格数据，判断是否有提价空间。</p></div></li>
        </ol>
      </div>
      <div class="answer-gaps"><strong>需要补充：</strong>采购成本明细、平台佣金、物流费用，用于从简化毛利升级为净利分析。</div>
      <div class="answer-actions"><button class="btn btn-soft" data-action="save-report">保存报告</button><button class="btn btn-primary" data-action="open-plan">生成运营计划</button></div>
    `,
    plan: `
      <div class="answer-head">
        <span class="badge badge-blue">运营计划</span>
        <h4>明日运营计划已生成：先保库存，再做增长</h4>
      </div>
      <p>基于今日经营数据，明天的主线是“补库存、稳淘宝、放抖音”。以下动作按影响与紧急度排序，全部需要人工确认后执行。</p>
      <div class="plan-grid">
        <div class="plan-priority p0"><span>P0</span><strong>保供给</strong><p>充电宝补货 220 件，跑鞋补货 320 件；暂停充电宝大额投放。</p></div>
        <div class="plan-priority p1"><span>P1</span><strong>稳基本盘</strong><p>检查淘宝主推计划，恢复访客量；复用抖音高转化素材。</p></div>
        <div class="plan-priority p2"><span>P2</span><strong>提利润</strong><p>上线手机壳 + 充电宝 + 耳机组合，目标客单价 +18%。</p></div>
      </div>
      <div class="answer-section">
        <h5>预期与验证</h5>
        <ul class="evidence-list">
          <li><span class="evidence-ref">目标</span>明日销售额 ≥ ¥175,000，淘宝访客恢复至 42,000+</li>
          <li><span class="evidence-ref">验证</span>明晚 20:00 复盘库存、访客、转化率三项指标</li>
          <li><span class="evidence-ref">边界</span>不自动改价、不自动补货、不自动调整广告预算</li>
        </ul>
      </div>
      <div class="answer-actions"><button class="btn btn-soft" data-action="save-report">保存报告</button><button class="btn btn-primary" data-action="open-plan">查看完整计划</button></div>
    `,
    fallback: `
      <div class="answer-head">
        <span class="badge badge-blue">经营分析</span>
        <h4>先给你一个基于当前数据的经营概览</h4>
      </div>
      <p>当前筛选范围内，销售额 ¥168,752，订单量 1,268，转化率 2.84%。整体处于增长区间，但淘宝渠道和部分 SKU 的库存需要关注。</p>
      <div class="answer-kpis">
        <div><span>销售额</span><strong>¥168,752</strong><em class="up">+12.5%</em></div>
        <div><span>订单量</span><strong>1,268</strong><em class="up">+8.3%</em></div>
        <div><span>转化率</span><strong>2.84%</strong><em class="up">+0.6pp</em></div>
      </div>
      <div class="answer-section">
        <h5>可以继续问我</h5>
        <ul class="evidence-list">
          <li><span class="evidence-ref">01</span>某个商品/渠道为什么涨跌</li>
          <li><span class="evidence-ref">02</span>哪些商品值得推广或优化</li>
          <li><span class="evidence-ref">03</span>库存、退款、毛利风险</li>
          <li><span class="evidence-ref">04</span>生成明日/本周运营计划</li>
        </ul>
      </div>
      <p class="muted-line">我会先查询数据工具，再给出结论；证据不足时会明确说明。</p>
    `,
  };

  return {
    ranges,
    channels,
    products,
    categories,
    inventoryAlerts,
    insights,
    imports,
    fieldMapping,
    validationErrors,
    trend,
    ai,
    meta: {
      store: "示例旗舰店",
      dateRange: "2026-10-18 至 2026-10-24",
      updatedAt: "2026-10-24 18:42",
      productCount: 48,
      skuCount: 126,
    },
  };
})();
