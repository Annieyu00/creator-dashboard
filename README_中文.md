# Creator Dashboard 5.0 — B 自动版（低成本）

本项目以 Dashboard 4.0 为基础，保留原有打卡、编辑、分析和每日灵感功能，新增「真实来源趋势」区域。

## 重要：当前状态

**可运行**：网页、原有打卡、JSON 趋势显示、定时更新程序、AI 可选分析。

**尚未启用真实自动趋势**：需要你提供**合法授权的 HTTPS JSON 趋势接口**。项目不会虚构 TikTok 热榜；未配置时明确显示“尚未配置”。TikTok Creative Center 网页并非无需授权的通用开放趋势 API。

## 注册 / 授权清单

1. 注册 GitHub： https://github.com/ 。新建一个仓库（建议 private 用于代码，但 GitHub Pages 发布后网页和趋势 JSON 仍可公开访问；不应上传个人敏感数据）。
2. 将此文件夹所有内容上传到仓库根目录，包含隐藏目录 `.github/workflows/`。
3. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **Deploy from a branch**，选择 `main` / `/ (root)` 并保存。等部署完成，访问 `https://你的用户名.github.io/仓库名/`。
4. 选择合法趋势提供方，确认其授权范围、更新频率、区域过滤和 JSON API 规格。把它配置成符合下文 schema 的 HTTPS JSON URL（可由你自己的服务适配转换）。**不要直接把 Creative Center 网页地址当成 JSON API**。
5. 在 GitHub 仓库 **Settings → Secrets and variables → Actions → New repository secret**：添加 `TREND_FEED_URL`（必需），如接口要求 Bearer token 再添加 `TREND_FEED_TOKEN`。不要把 token 放进网页或提交到仓库。
6. 可选：注册 https://platform.openai.com/ ，开通 API 计费并创建密钥，作为 `OPENAI_API_KEY` secret。ChatGPT 订阅与 API 计费分开。未提供时网页仍能显示真实趋势，只是不自动生成 Hook 和拍摄方案。
7. 在仓库 **Actions → Daily Creator Trends → Run workflow** 手动测试；成功后将每天美国洛杉矶时间 08:00 运行（GitHub 定时可能延迟）。查看 `data/trends.json` 的 `status` 是否为 `live`。

## 数据源格式（提供方或适配器需输出）

```json
{
  "items": [
    {
      "title": "Real observed trend name",
      "category": "Beauty",
      "source_url": "https://your-provider.example/trends/real-item",
      "source_name": "Authorized provider",
      "observed_at": "2026-11-14T08:00:00-08:00",
      "metric_label": "views",
      "metric_value": "125000"
    }
  ]
}
```

`category` 只能是 `Lifestyle`、`Personal Growth`、`Beauty`。`source_url` 必须是 HTTPS。仅提供链接不等于已经验证真实热度，必须确保提供方返回真实数据及相应观测时间。没有数据就显示空状态，不使用假榜单。

## 本地运行

- 直接双击 `index.html` 可以使用原有 Dashboard 功能；若浏览器阻止读取 JSON，请使用页面中的文件选择器导入 `data/trends.json`。
- 推荐在项目目录运行 `python3 -m http.server 8000`，然后访问 `http://localhost:8000/`。
- 更新程序：`python3 update_trends.py`。无数据源时不生成虚假数据。
- 接口及密钥使用环境变量配置；GitHub Actions 自动运行。

## 安全和数据说明

- 原有打卡记录使用浏览器 localStorage。换域名（本地文件→GitHub Pages）不会自动迁移，请先在旧版导出 JSON，再在新版导入；如果旧版没有导入按钮，请保留原网页和备份。
- GitHub Pages 上的 `data/trends.json` 是公开文件，不要存放 API key、私人账号分析、邮箱或敏感数据。
- AI 分析基于输入的趋势元数据，并不自动观看视频内容。不得将生成的 Hook 或拍摄建议标记为平台官方结论。
- 第三方服务可能收费；GitHub Actions、Pages 的额度和规则以账户实际显示为准。
