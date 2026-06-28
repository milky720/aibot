# 🤖 Dify Chatbot

基于 React + Vite 构建的 AI 对话助手，接入 [Dify](https://dify.ai) API，支持流式和非流式两种响应模式。

## ✨ 功能

- **流式响应** — SSE 实时逐字输出 AI 回复
- **阻塞模式** — 等待完整响应后一次性展示
- **会话管理** — 新建/切换/查看历史对话
- **消息历史** — 自动加载历史消息记录
- **Markdown 渲染** — 支持代码块、粗体、链接等格式
- **响应式 UI** — 侧边栏 + 聊天区布局，简洁美观

## 📸 截图

```
┌─────────────┬──────────────────────────┐
│  会话列表     │   🤖 有什么我可以帮助你的？   │
│              │                          │
│  + 新对话    │   ┌──────────────────┐   │
│              │   │ 用户消息           │   │
│ 💬 对话 1   │   └──────────────────┘   │
│ 💬 对话 2   │   ┌──────────────────┐   │
│ 💬 对话 3   │   │ AI 回复 (Markdown)│   │
│              │   └──────────────────┘   │
│              │                          │
│  [✓] 流式   │   [________输入框_______] ➤ │
└─────────────┴──────────────────────────┘
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆仓库
git clone git@github.com:milky720/aibot.git
cd aibot

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 http://localhost:5173

## 📦 项目结构

```
aibot/
├── index.html                     # 入口 HTML
├── package.json                   # 项目配置
├── vite.config.js                 # Vite 配置
├── README.md
└── src/
    ├── main.jsx                   # React 入口
    ├── App.jsx                    # 主应用组件（状态管理）
    ├── App.css                    # 全局样式
    └── api/
    │   └── dify.js                # Dify API 客户端
    └── components/
        ├── ChatMessage.jsx        # 消息气泡组件
        ├── ChatInput.jsx          # 输入框组件
        ├── ConversationList.jsx   # 侧边栏会话列表
        └── ReactMarkdown.jsx      # Markdown 渲染器
```

## 🔌 API 接口

项目对接 Dify Chat API，包括以下端点：

| 方法   | 路径               | 说明               |
| ------ | ------------------ | ------------------ |
| POST   | `/chat-messages`   | 发送聊天消息       |
| GET    | `/conversations`   | 获取会话列表       |
| GET    | `/messages`        | 获取消息历史       |

API 配置在 `src/api/dify.js` 中：

```js
const BASE_URL = 'https://api.dify.ai/v1';
const API_KEY = 'your-api-key-here';
```

> ⚠️ **安全提醒**：生产环境中请将 API Key 放在后端服务中，不要暴露在前端代码里。

## 🛠️ 技术栈

- **React 19** — UI 框架
- **Vite 5** — 构建工具
- **SSE (Server-Sent Events)** — 流式数据传输
- **原生 Fetch API** — HTTP 请求
- **CSS3** — 样式（无 UI 库依赖）

## 📄 License

MIT
