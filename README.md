# AI 电商数据中台

基于 **React + FastAPI + SQLite + 智谱 GLM** 的 AI 电商数据中台 MVP。

从 CSV / Excel / Word / PPT / PDF 数据接入开始，完成数据清洗、指标计算、经营大屏、商品分析、销售分析、AI 查数归因、运营计划与报告沉淀的完整闭环。

> 当前数据为本地生成的演示数据；所有指标由 SQL 指标层计算，AI 只负责解释和建议，不会自动改价、改库存或调整投放。

---

## 1. 功能

| 页面 | 能力 |
|---|---|
| 经营概览 | 销售额 / 订单 / 访客 / 转化率、销售趋势、渠道占比、热销商品、AI 建议、快捷问答 |
| 商品分析 | 销售额 / 销量 / 毛利 / 退款率排行、销售-毛利四象限、库存预警、商品详情抽屉、AI 诊断 |
| 销售分析 | 销售趋势、渠道结构、品类结构、订单状态分布、退款趋势 |
| 数据接入 | CSV / Excel / Word / PPT / PDF 上传、字段校验、行级错误、导入历史、质量评分、模板下载 |
| AI 运营助手 | 自然语言提问、意图识别、工具取数、结构化报告、证据 ID、置信度、一键运营计划 |
| 报告中心 | 历史报告、报告详情、Markdown 导出 |

### AI 能力

- 主模型：`glm-4.7-flash`
- 自动降级：`glm-4.5-air` → `glm-4.6`（主模型限流或不可用时）
- 输出经过 Pydantic / 规则校验，结论必须引用证据 ID
- 无 Key 或调用失败时自动降级为规则分析，不阻塞页面
- 只读分析，价格 / 库存 / 投放动作需人工确认

---

## 2. 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19、TypeScript、Vite、Tailwind CSS、ECharts、TanStack Query、React Router |
| 后端 | Python 3.12、FastAPI、SQLAlchemy 2.0、Pandas、Pydantic |
| 文档解析 | openpyxl、xlrd、python-docx、python-pptx、pdfplumber |
| AI | 智谱 BigModel（OpenAI 兼容接口）、LangGraph、httpx、json-repair |
| 数据库 | SQLite（开发）/ PostgreSQL（后续） |
| 测试 | pytest |

---

## 3. 目录

```text
AI数据中台/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # overview / products / sales / imports / ai
│   │   ├── agent/             # provider / prompts / tools / LangGraph workflow
│   │   ├── core/              # 配置
│   │   ├── db/                # 模型、会话、样例数据生成
│   │   ├── services/          # 指标、AI、导入
│   │   └── main.py
│   ├── tests/
│   ├── data/                  # SQLite 数据库（gitignore）
│   ├── .env                   # 本地密钥（gitignore）
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── components/        # 布局、UI、图表、报告卡
│   │   ├── context/           # 日期 / 渠道筛选
│   │   ├── lib/               # API 客户端、格式化
│   │   └── pages/             # 6 个页面
│   └── vite.config.ts
├── demo/                      # 早期静态 Demo（可保留作视觉参考）
├── docs/设计方案.md
├── scripts/
└── README.md
```

---

## 4. 快速启动

### 最简启动（推荐）

在资源管理器里双击项目根目录的：

```text
start.bat
```

或者在项目根目录执行：

```powershell
.\start.bat
```

它会自动检查并启动：

- 后端：`http://127.0.0.1:8011`
- 前端：`http://127.0.0.1:5173`

停止服务：

```powershell
.\stop.bat
```

如果端口已被占用，先执行 `.\stop.bat`，再执行 `.\start.bat`。

### 手动启动（两个 PowerShell 窗口）

**窗口 1：后端**

```powershell
cd D:\AI数据中台\backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8011
```

**窗口 2：前端**

```powershell
cd D:\AI数据中台\frontend
npm run dev
```

打开 `http://127.0.0.1:5173`。

> 注意：后端命令必须在 `backend` 目录执行，前端命令必须在 `frontend` 目录执行；不要在项目根目录直接运行 `uvicorn` 或 `npm run dev`。

如果提示 `uv` 不是可识别的命令，使用完整路径：

```powershell
cd D:\AI数据中台\backend
& "$env:USERPROFILE\.local\bin\uv.exe" run uvicorn app.main:app --host 127.0.0.1 --port 8011
```

如果 PowerShell 提示“禁止运行脚本”，改用 `start.bat`，或执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\dev.ps1
```

### 环境要求

- Node.js 20+
- uv（会自动使用 Python 3.12）
- Windows PowerShell

### 安装

```powershell
cd D:\AI数据中台\backend
uv sync

cd D:\AI数据中台\frontend
npm install
```

### 配置 AI

复制 `backend/.env.example` 为 `backend/.env`，填入智谱 API Key：

```dotenv
ZHIPU_API_KEY=your_api_key
ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
ZHIPU_MODEL=glm-4.7-flash
ZHIPU_FALLBACK_MODELS=glm-4.5-air,glm-4.6
DATABASE_URL=sqlite:///./data/app.db
AI_MODE=zhipu
```

> `.env` 已在 `.gitignore` 中，密钥不会进入前端或版本库。

### 启动

```powershell
# 终端 1：后端
cd backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8011 --reload

# 终端 2：前端
cd frontend
npm run dev
```

打开 `http://127.0.0.1:5173`。

也可以直接运行：

```powershell
.\scripts\dev.ps1
```

### 首次数据

后端首次启动时自动生成 75 天演示数据；也可以手动重建：

```powershell
cd backend
uv run python -m app.db.seed
```

### 生产构建

```powershell
cd frontend
npm run build

# 重启后端，FastAPI 会自动托管 frontend/dist
cd ..\backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8011
```

打开 `http://127.0.0.1:8011`。

---

## 5. API

后端启动后访问 `http://127.0.0.1:8011/docs` 查看 Swagger。

主要接口：

```text
GET  /api/v1/health
GET  /api/v1/meta/filters
GET  /api/v1/overview?range=7d&channel=淘宝
GET  /api/v1/products?range=30d
GET  /api/v1/products/{id}
GET  /api/v1/inventory/alerts
GET  /api/v1/sales?range=30d
GET  /api/v1/imports
GET  /api/v1/imports/formats
POST /api/v1/imports                (multipart: file, data_type)
GET  /api/v1/imports/template/{type}
POST /api/v1/ai/chat
GET  /api/v1/ai/health
GET  /api/v1/ai/reports
GET  /api/v1/ai/reports/{id}
GET  /api/v1/ai/reports/{id}/markdown
```

日期范围支持 `today` / `7d` / `30d` / `90d`，也支持 `start`、`end` 自定义。

---

## 6. 数据导入格式

| 格式 | 处理方式 | 状态 |
|---|---|---|
| `.csv` | 直接读取，支持 UTF-8 / GBK | 已支持 |
| `.xlsx` | openpyxl 直接读取，支持中英文字段名 | 已实测 |
| `.xls` | xlrd 旧版 Excel 读取 | 已支持 |
| `.docx` | python-docx 提取段落与表格 → AI 结构化 | 已实测 |
| `.pptx` | python-pptx 提取幻灯片文本与表格 → AI 结构化 | 已实测 |
| `.pdf` | pdfplumber 提取文本与表格 → AI 结构化 | 已实测 |
| `.doc` / `.ppt` | 旧版二进制；安装 LibreOffice 后自动转换，否则提示另存为 docx/pptx | 需转换 |
| 扫描版 PDF | 当前未接入 OCR | 暂不支持 |

文档导入流程：

```text
上传文档
  → 抽取表格 / 文本
  → 智谱 GLM 转成目标标准字段
  → 行级校验（必填、日期、金额、商品 ID、状态）
  → 写入 SQLite
  → 返回成功/失败数与抽取元数据
```

实测结果：

- Excel：2 行，约 0.5 秒
- Word：2 行，约 4.5 秒
- PPT：1 行，约 2.6 秒
- PDF：1 行，约 2.2 秒

说明：

- 文档中的金额单位按「元」解析，入库时转「分」。
- 订单文档支持 `product_id`，也支持商品名称自动匹配已有商品。
- 中文表头（订单号、日期、渠道、状态、商品ID、数量、单价、成本价等）会自动映射。
- 旧版 `.doc` / `.ppt` 在未安装 LibreOffice 的环境中会返回明确错误，不会静默失败。
- 抽取结果会记录 `extraction` 元数据：格式、页码/页数、表格数、模型、Token、耗时、警告。

---

## 7. 指标口径

| 指标 | 口径 |
|---|---|
| 净销售额 | 订单金额 − 优惠 − 退款，排除未支付/已取消 |
| 订单量 | 同口径去重订单数 |
| 访客数 | 流量表按日期/渠道求和 |
| 转化率 | 订单量 ÷ 访客数（同范围） |
| 客单价 | 净销售额 ÷ 订单量 |
| 毛利额 | 净销售额 − 销售成本（含退款冲回） |
| 毛利率 | 毛利额 ÷ 净销售额 |
| 退款率 | 退款金额 ÷ 支付金额 |
| 库存预警 | 库存 < 安全库存，或可售天数 < 7 天 |

金额在数据库中以「分」存储，API 转元；所有核心指标由 SQL 计算，AI 不参与算数。

---

## 8. 数据模型

`products`、`orders`、`order_items`、`traffic_daily`、`inventory`、`import_jobs`、`ai_reports`。

- `orders` / `order_items` 支持商品级退款
- `import_jobs` 保存导入任务和行级错误
- `ai_reports` 保存问题、范围、报告 JSON、模型、Token、耗时
- 订单按 `order_id` 幂等，商品/库存按 `product_id` 更新，流量按日期+渠道覆盖

---

## 9. 测试

```powershell
cd backend
uv run pytest
```

覆盖：净销售额 / 订单 / 转化率 / 毛利率口径、趋势、商品排行、库存预警、AI 报告格式归一化、Word/PPT 表格抽取、中文 Excel 表头映射。

---

## 10. 安全与边界

- API Key 只存在于后端 `.env`
- AI 工具只读，不接受模型生成任意 SQL
- 每条结论要求引用证据 ID，证据不足会明确说明
- 不自动改价、不自动补货、不自动调整广告预算
- 文件大小限制 20MB
- 支持 CSV / Excel / Word / PPT / PDF；扫描件 PDF 暂未接入 OCR
- 旧版 `.doc` / `.ppt` 需转换或安装 LibreOffice

---

## 11. 后续扩展

- PostgreSQL + Alembic 迁移
- 登录与多用户权限
- 真实平台 API（淘宝 / 京东 / 拼多多 / 抖音）
- 定时同步、日报、库存异常检测
- RAG 知识库与多 Agent 协作
- 广告费用、佣金、物流费用，升级净利分析
