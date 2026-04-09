# 📊 IELTS 成绩追踪器

一款智能化的雅思备考工具，帮助你追踪听、读、写、说四项分数变化，并提供 AI 驱动的写作反馈。

---

## ✨ 功能特点

### 📝 记录测试
- 直接输入**听力**（S1–S4）和**阅读**（P1–P3）各部分原始分数，系统自动换算成标准分
- 支持**写作**和**口语**分数录入
- 可选记录阅读用时，监控做题节奏

### 📈 我的进度
- **科目分数趋势图** — 按剑桥书号顺序展示听/读/写/说四项分数变化，支持滚轮缩放，hover 显示录入日期
- **学习日志** — 逐 section（听力）和逐 passage（阅读）追踪学习步骤
  - 听力：Done → Intensive → Shadowing
  - 阅读：Done → Vocab → Review（点击计数增加，右键点击计数减少）
- **详细记录表** — 支持按书本筛选、按时间或书号排序（升序/降序）
- 录入不完整的记录（某 section/passage 小分为空）分数以**灰色**显示

### 🤖 AI 写作评分
- **头脑风暴** — 根据 Task 2 题目生成逻辑大纲和词汇搭配建议
- **作文评分** — Gemini 提供标量分数估算、逐项 Criteria 反馈，以及范文润色建议

---

## 🛠 技术栈

| | |
|---|---|
| **框架** | React 19 + Vite |
| **样式** | Tailwind CSS |
| **图表** | ECharts 5（原生使用，无封装库） |
| **图标** | Lucide React |
| **AI** | Google Gemini API (`gemini-2.5-flash-preview-09-2025`) |
| **存储** | localStorage（所有数据保存在浏览器本地） |

---

## 🚀 快速开始

### 1. 安装

```bash
git clone <仓库地址>
cd ielts-tracker
npm install
```

### 2. 配置 API Key

打开 `src/utils/geminiApi.js`，填入你的 Gemini API Key：

```js
const apiKey = "YOUR_GEMINI_API_KEY_HERE";
```

前往 [Google AI Studio](https://aistudio.google.com/apikey) 获取 Key。

### 3. 运行

```bash
npm run dev
```

在浏览器中打开 [http://localhost:5173](http://localhost:5173)。

---

## 📸 截图

> 截图待补充 — 启动开发服务器后自行探索！

### 记录测试页面

### 我的进度页面

### AI 写作评分页面

---

## 📁 项目结构

```
src/
  App.jsx                  # 根组件，标签页路由，toast 提示
  main.jsx                 # 入口文件
  index.css                # Tailwind 基础样式
  components/
    ScoreInputForm.jsx      # "记录测试" 标签页 — 分数录入表单
    WritingGrader.jsx       # "AI 写作评分" 标签页
    ProgressDashboard.jsx   # "我的进度" 标签页 — 统计卡、图表、学习日志、记录表
    ProgressLineChart.jsx   # 基于 ECharts 的折线图组件
    StudyLog.jsx            # 学习步骤追踪（听力 & 阅读）
  hooks/
    useRecords.js           # 考试成绩的 localStorage 持久化
    useStudyProgress.js     # 学习步骤的 localStorage 持久化
  utils/
    scoring.js              # 原始分数 → 标准分转换
    geminiApi.js            # Gemini API 调用（头脑风暴 + 评分）
    eventBus.js             # 轻量级事件总线，用于跨组件同步
```

---

## 📋 数据结构

**考试成绩**（`localStorage: ielts_tracker_records`）

```json
{
  "id": "uuid",
  "date": "2026-04-08",
  "timestamp": 1744128000000,
  "book": 11,
  "testNum": 2,
  "listeningRaw": 35,
  "lBand": 7.0,
  "listeningSections": [9, 9, 8, 9],
  "readingRaw": 33,
  "rBand": 7.0,
  "readingPassages": [11, 11, 11],
  "readingTime": 55,
  "wBand": 6.5,
  "sBand": 6.5,
  "overallBand": 6.75
}
```

**学习进度**（`localStorage: ielts_study_progress`）

```json
{
  "11-2": {
    "listening": [
      { "done": true, "intensive": false, "shadowing": false },
      { "done": true, "intensive": true, "shadowing": false },
      { "done": false, "intensive": false, "shadowing": false },
      { "done": false, "intensive": false, "shadowing": false }
    ],
    "reading": [
      { "done": true, "vocab": false, "review": 3 },
      { "done": true, "vocab": true, "review": 1 },
      { "done": false, "vocab": false, "review": 0 }
    ]
  }
}
```

---

## 🔮 计划

- [ ] 口语模拟计时器
- [ ] 导出进度报告为 PDF
- [ ] 云端同步（可选）
