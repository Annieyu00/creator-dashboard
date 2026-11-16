# XX Studio · 自媒体创作工作台

React 18 + TypeScript + Vite + Tailwind CSS，简体中文，响应式布局。

## 启动

需要 Node.js 18+：

```bash
npm install
npm run dev
```

打开终端显示的本地地址（通常为 http://localhost:5173）。

生产构建：`npm run build`，静态文件位于 `dist/`。Vite `base: './'` 兼容 GitHub Pages 子路径部署。

## 已实现

- 首页数据概览、今日灵感、待发布内容、本周安排、快捷入口
- 灵感 CRUD、收藏、搜索、筛选、排序、批量归档、转选题、来源和附件 URL
- 选题列表/看板、状态管理、开始创作、爆款拆解记录
- 本地脚本模板生成、编辑、复制、保存到内容库
- 发布计划与状态管理、手动录入作品数据、曝光对比、CSV 导出
- 内容库管理、浏览器 localStorage 持久化

## 重要说明

这是可运行的前端 MVP，不是已接入生产服务的 SaaS。数据存储在当前浏览器 localStorage 中，清除浏览器数据会丢失记录，暂不支持多设备同步。内置示例数据仅用于演示。首页指标是已发布内容的累计数据，不会伪装成「本周/上周」真实趋势。

AI 创作中心目前是**本地模板**，不调用 OpenAI。抖音/小红书真实 Daily Trends 尚未接入：需要核验第三方 API 权限与响应格式，随后通过后端或 GitHub Actions 安全调用；**不要把 API Key 放在前端代码里**。没有真实附件上传服务，当前支持附件 URL。

## 下一步生产化

1. Supabase Auth + Postgres + Storage，实现账号、跨设备同步和附件上传。
2. GitHub Actions 或服务端任务接入已验证的抖音/小红书 API，缓存趋势并记录采集时间。
3. 后端代理 OpenAI API，支持真正的 AI 生成和额度限制。
4. 周报表与上周对比需添加历史快照，不能从累计值臆造。


## 与旧 Creator Dashboard 整合

- 左侧「原版每日打卡」直接嵌入 `legacy-checkin.html`，保留原有功能和 `creator-challenge-2026-v2`、`creator-idea-library-v1` 本地存储键。
- 「每日趋势」读取 `data/douyin.json` 和 `data/xiaohongshu.json`；默认是未配置空数据，绝不伪造热点。接入 API 时由服务器端或 GitHub Actions 更新这两个 JSON 文件。
- 新版灵感与内容数据使用 `xx-creator-v1`，旧版数据不会被清除或覆盖。两个界面暂未自动双向同步，需手动迁移需要的内容。
- **重要**：localStorage 只在同源下共享。要读取原 GitHub Pages 网站已有的数据，应部署到同一个 `https://annieyu00.github.io/creator-dashboard/` 地址。首次部署前请备份原 `index.html` 并导出原网站数据。
- 不要把第三方 API 密钥放入网页或仓库；在 GitHub Actions Secrets 中配置。
