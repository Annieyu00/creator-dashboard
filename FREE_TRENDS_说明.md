# 免费趋势自动更新

- 主来源：UAPI `/api/v1/misc/hotboard?type=douyin|xiaohongshu`
- 备用来源：60s API `/v2/douyin`、`/v2/xiaohongshu`
- 每日约 4 次：UTC 00:17、06:17、12:17、18:17。GitHub Actions 定时器可能延迟或漏跑。
- 手动执行：GitHub → Actions → **Sync free Douyin & Xiaohongshu trends** → Run workflow。
- 成功写入网站已有的 `data/douyin.json` 和 `data/xiaohongshu.json`。不改动 `app/src/main.tsx`、旧打卡页面和本地记录。
- 只显示收到的真实标题和来源返回的热度。网页中的“实时”代表上次成功采集快照，不代表持续推送。
- 任何接口出错、限流或返回空列表都会尝试备用源。两者均失败则保留最近一次成功的数据，不伪造条目。检查 Actions 日志确认原因。
- 免费公共接口可能改变、限流或终止，且官方授权、商用展示权和长期可用性未得到保证。请遵守提供方及原平台条款。
- 该流程无需 API 密钥，不会自动抓取个人帐号的播放量、粉丝或作品统计。
