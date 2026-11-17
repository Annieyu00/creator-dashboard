import styles from './video-breakdown.css?inline';
import markup from './video-breakdown.html?raw';

export function mountVideoBreakdown(host, onReference) {
  const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = styles;
  const template = document.createElement('template');
  template.innerHTML = markup;
  root.replaceChildren(style, template.content.cloneNode(true));
  initializeVideoBreakdown(root, onReference);
  return () => root.replaceChildren();
}

function initializeVideoBreakdown(root, onReference) {
var $ = function (id) { return root.getElementById(id);};

/* ---------- helpers ---------- */
function parseNum(s) {
if (!s) return null;
s = String(s).replace(/[,，\s]/g, "").trim();
if (!s) return null;
var m = s.match(/^([\d.]+)\s*(亿|万|w|W|k|K|千)?$/);
if (!m) { var n = parseFloat(s); return isNaN(n)? null: n;}
var v = parseFloat(m[1]);
var u = m[2] || "";
if (u === "亿") v *= 100000000;
else if (u === "万" || u === "w" || u === "W") v *= 10000;
else if (u === "k" || u === "K" || u === "千") v *= 1000;
return Math.round(v);
}
function fmtNum(n) {
if (n == null) return "—";
if (n >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, "") + "亿";
if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, "") + "万";
return String(n);
}
function pct(x) { return (x * 100).toFixed(2).replace(/\.?0+$/, "") + "%";}
function esc(s) {
return String(s).replace(/[&<>"']/g, function (c) {
return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c];
});
}
function fmtTime(sec) {
sec = Math.round(sec);
var m = Math.floor(sec / 60), s = sec % 60;
return m + ":" + (s < 10? "0": "") + s;
}
function toast(msg) {
var t = $("toast"); t.textContent = msg; t.classList.add("show");
setTimeout(function () { t.classList.remove("show");}, 1800);
}

/* ---------- text analysis ---------- */
var PAIN = ["没流量", "不涨粉", "没人看", "卖不出去", "不出单", "踩坑", "被坑", "后悔", "焦虑", "迷茫", "失败", "亏", "浪费", "没效果", "没用", "太难", "不会", "没钱", "穷", "累", "加班", "被裁", "失业", "内卷", "容貌焦虑", "身材焦虑", "脱发", "长痘", "胖", "黑眼圈", "毛孔", "卡粉"];
var CONTRAST = ["没想到", "竟然", "结果", "原来", "其实", "但是", "不过", "然而", "反而", "真相", "最后才发现", "万万没想到"];
var CTA = ["关注", "点赞", "收藏", "评论区", "转发", "分享给", "链接", "下单", "购买", "橱窗", "私信", "扣1", "扣 1", "留言", "订阅", "一键三连", "小黄车", "拍下"];
var METHOD = ["第一", "第二", "第三", "首先", "其次", "步骤", "方法", "技巧", "招", "点", "秘诀", "公式", "记住", "学会", "教你", "做法", "关键是", "核心是", "重点是"];
var STORY = ["我之前", "我以前", "当时我", "那时候", "我曾经", "亲身", "我试了", "我用了", "后来我", "我的经历", "真实经历"];
var EMOTIONS = [
{ name: "震惊 / 反差", words: ["震惊", "没想到", "竟然", "哇", "天呐", "绝了", "离谱", "惊呆", "不敢相信", "太牛"]},
{ name: "焦虑 / 危机感", words: ["焦虑", "危险", "警告", "再不", "来不及", "淘汰", "危机", "怕", "担心", "严重"]},
{ name: "共鸣 / 扎心", words: ["谁懂", "打工人", "普通人", "谁不是", "太真实", "说的是我", "破防", "扎心", "成年人", "社畜"]},
{ name: "好奇 / 悬念", words: ["秘密", "真相", "为什么", "到底", "背后", "没人告诉", "不为人知", "究竟"]},
{ name: "爽感 / 逆袭", words: ["逆袭", "翻身", "赢", "爽", "成功", "月入", "赚", "暴富", "上岸", "自由"]},
{ name: "愤怒 / 不平", words: ["凭什么", "气死", "无语", "太过分", "骗局", "割韭菜", "黑心", "坑人"]}
];

function splitSentences(text) {
var raw = text.replace(/\r/g, "").split(/\n+/);
var out = [];
raw.forEach(function (line) {
var parts = line.split(/(?<=[。！？!?；;…])\s*/);
parts.forEach(function (p) {
p = p.trim().replace(/^[#＃>\-\d.、\s]+/, "").trim();
if (p.length >= 2) out.push(p);
});
});
return out;
}
function hasAny(s, list) {
for (var i = 0; i < list.length; i++) if (s.indexOf(list[i])!== -1) return list[i];
return null;
}
function detectHook(first) {
var hits = [];
if (/\d/.test(first)) hits.push({ t: "数字锚点", d: "用具体数字（数量、金额、时间）降低理解成本，第一眼就让人知道「能得到什么」。"});
if (/[？?]/.test(first) || /为什么|怎么|如何|到底/.test(first)) hits.push({ t: "提问钩子", d: "抛一个观众自己也答不上来的问题，大脑会自动想看完找答案。"});
if (/别|不要|千万|禁止|停止|劝你|警告/.test(first)) hits.push({ t: "否定警告", d: "「别再…」式开头制造纠错冲动，观众怕自己正在犯错，会停下来确认。"});
if (hasAny(first, CONTRAST)) hits.push({ t: "反差悬念", d: "先给一个违背预期的说法，把「为什么」留到后面揭晓，拉完播。"});
if (hasAny(first, PAIN)) hits.push({ t: "痛点直击", d: "第一句就点名观众正在受的罪，共鸣感让划走的手指停住。"});
if (/如果|只要|当你/.test(first)) hits.push({ t: "条件代入", d: "「如果你也…」让观众自动对号入座，觉得这条就是拍给自己的。"});
if (/免费|省钱|赚钱|涨粉|变美|瘦|白|送/.test(first)) hits.push({ t: "利益承诺", d: "开头直接许诺收益或结果，先给甜头再讲过程。"});
if (/我用|我靠|我把|亲测|实测/.test(first)) hits.push({ t: "亲测背书", d: "用自己的结果开场，先建立可信度，再讲方法。"});
if (/最后|结尾|看到最后|一定要看完/.test(first)) hits.push({ t: "完播引导", d: "明示结尾有关键信息，直接为完播率服务。"});
return hits;
}
function roleOf(sent, idx, total) {
if (hasAny(sent, CTA)) return { role: "结尾引导", cls: 5, view: "近景 + 手势", act: "看向镜头，手指指向关注/收藏按钮位置，语速放慢说完最后一句"};
if (idx === 0) return { role: "开头钩子", cls: 1, view: "特写直视镜头", act: "第一帧就开口，画面上压大号标题字，不留片头空镜"};
if (hasAny(sent, CONTRAST)) return { role: "转折反差", cls: 2, view: "近景，轻微推近", act: "语气加重转折词，停顿半秒，字幕给转折词加颜色"};
if (hasAny(sent, PAIN)) return { role: "痛点共鸣", cls: 2, view: "中景，展示问题场景", act: "把问题拍出来给观众看：特写问题部位/现场，别只用嘴说"};
if (hasAny(sent, METHOD)) return { role: "干货方法", cls: 3, view: "中景演示 + 字幕编号", act: "边说边做，屏幕角上标「1/2/3」编号，动作跟上台词"};
if (hasAny(sent, STORY)) return { role: "案例故事", cls: 4, view: "近景讲述，可插入旧素材", act: "语气放缓像讲真事，有前后对比素材就插对比画面"};
if (idx === total - 1) return { role: "收尾总结", cls: 6, view: "近景", act: "回扣开头的问题，一句话收住，不要拖长"};
return { role: "内容展开", cls: 6, view: "中景", act: "保持语速，关键句配字幕强调"};
}
function keywords(text) {
var stop = "的了是我在和就都而及与着或一个没有我们你们他们这那之也把被让给对从向到为以上中里时后前第很更还又再只便已于之乎者也吗呢吧啊呀哦嗯嗯这个那个什么怎么这样那样因为所以但是如果虽然自己大家知道觉得真的就是可以需要应该可能一定不要不是没有";
var grams = {};
var clean = text.replace(/[^一-龥a-zA-Z0-9]/g, "");
for (var n = 2; n <= 3; n++) {
for (var i = 0; i + n <= clean.length; i++) {
var g = clean.substr(i, n);
var bad = false;
for (var j = 0; j < g.length; j++) if (stop.indexOf(g[j])!== -1) { bad = true; break;}
if (!bad) grams[g] = (grams[g] || 0) + 1;
}
}
var arr = Object.keys(grams).filter(function (k) { return grams[k] >= 2;});
arr.sort(function (a, b) { return grams[b] * b.length - grams[a] * a.length;});
var picked = [];
for (var k = 0; k < arr.length && picked.length < 6; k++) {
var w = arr[k], overlap = false;
for (var q = 0; q < picked.length; q++) if (picked[q].indexOf(w)!== -1 || w.indexOf(picked[q])!== -1) { overlap = true; break;}
if (!overlap) picked.push(w);
}
return picked;
}

/* ---------- demo ---------- */
$("btnDemo").addEventListener("click", function () {
resetLinkSummary();
$("fUrl").value = "";
$("fTitle").value = "普通人做自媒体，千万别一上来就买设备";
$("fPlatform").value = "抖音";
$("fTopic").value = "新手直播带货";
$("fScript").value = [
"普通人做自媒体，千万别一上来就买设备，我第一条视频就是用旧手机拍的。",
"我知道你肯定踩过这个坑，还没开始赚钱，先花了三千块买相机买灯，结果拍了三条就放弃了。",
"其实观众根本不在乎你用什么设备，他们只在乎前3秒你有没有说中他们的问题。",
"记住三个要点，第一，先把开头第一句写好再开机，第二，一条视频只讲一个点，第三，拍完立刻发，不要存着等完美。",
"我靠这个方法，三个月从0做到10万粉，一分钱设备都没添。",
"你现在用的什么手机拍视频？评论区告诉我，关注我，下条讲怎么用一部手机打出好看的灯光。"
].join("\n");
$("fViews").value = "107.9万";
$("fLikes").value = "8.6万";
$("fComments").value = "4200";
$("fShares").value = "1.5万";
$("formErr").classList.remove("show");
toast("示例已载入，点「开始拆解」");
});
$("btnClear").addEventListener("click", function () {
resetLinkSummary();
$("results").classList.remove("show");
$("emptyState").style.display = "";
lastReference = lastReport = "";
["fTitle", "fUrl", "fTopic", "fScript", "fViews", "fLikes", "fComments", "fShares"].forEach(function (id) { $(id).value = "";});
$("formErr").classList.remove("show");
});

/* ---------- analyze ---------- */
var lastReport = "";
var lastReference = "";
var linkReference = "";
var linkRequest = 0;

function resetLinkSummary() {
  linkRequest += 1;
  linkReference = "";
  $("linkSummary").hidden = true;
  $("btnAnalyze").disabled = false;
  $("btnAnalyze").textContent = "开始拆解";
}

function getYouTubeId(value) {
  const shareUrl = value.match(/https?:\/\/[^\s，。！？、]+/i)?.[0];
  if (!shareUrl) return "";
  try {
    const url = new URL(shareUrl);
    const host = url.hostname.toLowerCase();
    const id = host === "youtu.be" ? url.pathname.split("/")[1] :
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host) ?
        (url.pathname === "/watch" ? url.searchParams.get("v") :
          url.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]) : "";
    return id && /^[\w-]{11}$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

async function analyzePublicLink(value) {
  const error = $("formErr");
  const id = getYouTubeId(value);
  if (!id) {
    error.textContent = "这个平台还不能从链接读取正文。链接会保留，可以粘贴字幕或口播继续拆解。";
    error.classList.add("show");
    return;
  }

  const request = ++linkRequest;
  const button = $("btnAnalyze");
  button.disabled = true;
  button.textContent = "正在读取公开标题…";
  error.classList.remove("show");
  const source = "https://www.youtube.com/watch?v=" + id;
  try {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.search = new URLSearchParams({ url: source, format: "json" });
    const result = await fetch(endpoint, {
      credentials: "omit", signal: AbortSignal.timeout(10000)
    });
    if (!result.ok) throw Error("YouTube title unavailable");
    const data = await result.json();
    if (typeof data.title !== "string" || !data.title.trim()) throw Error("Missing title");
    if (request !== linkRequest) return;

    const title = data.title.trim();
    const author = typeof data.author_name === "string" ? data.author_name : "";
    const hooks = detectHook(title).map(hook => hook.t);
    const topic = $("fTopic").value.trim();
    const containsNumber = /\d/.test(title);
    const observation = hooks.length
      ? "标题里的吸引点：" + hooks.join("、") + "。"
      : containsNumber ? "标题里的数字让观众提前知道内容的范围或数量。"
      : "可以从标题拆出它承诺回答的问题，再看这个问题对谁有用。";
    const adaptation = (topic ? "用在「" + topic + "」：" : "借鉴方法：") + (containsNumber
      ? "把你能实际讲清的经验或步骤写进标题，开场先展示其中一个结果。"
      : "用自己的真实场景替换原标题中的场景，再用一句话说清观众看完会得到什么。");

    $("linkTitle").textContent = title;
    $("linkAuthor").textContent = author ? "YouTube · " + author : "YouTube";
    $("linkObservation").textContent = observation;
    $("linkAdaptation").textContent = adaptation;
    $("linkSummary").hidden = false;
    linkReference = [
      "资料范围：只读取了公开视频标题和作者。没有字幕、画面、互动数据。",
      "参考链接：" + source,
      "参考标题：" + title,
      observation,
      adaptation
    ].join("\n");
  } catch {
    if (request !== linkRequest) return;
    error.textContent = "YouTube 没有返回标题。请确认视频公开且可嵌入，或粘贴字幕继续。";
    error.classList.add("show");
  } finally {
    if (request === linkRequest) {
      button.disabled = false;
      button.textContent = "开始拆解";
    }
  }
}

$("fUrl").addEventListener("input", resetLinkSummary);
$("btnUseLink").addEventListener("click", () => {
  if (linkReference) onReference(linkReference);
});
$("btnAnalyze").addEventListener("click", function () {
var title = $("fTitle").value.trim();
var sourceUrl = $("fUrl").value.trim();
var platform = $("fPlatform").value;
var topic = $("fTopic").value.trim();
var script = $("fScript").value.trim();
var err = $("formErr");
if (!script && sourceUrl) {
  resetLinkSummary();
  $("results").classList.remove("show");
  void analyzePublicLink(sourceUrl);
  return;
}
if (!script) {
err.textContent = "请粘贴视频字幕、口播或镜头笔记。链接用来标记来源。";
err.classList.add("show");
$("fScript").focus();
return;
}
resetLinkSummary();
err.classList.remove("show");

var sents = splitSentences(script);
if (sents.length < 2) sents = [script];
var views = parseNum($("fViews").value);
var likes = parseNum($("fLikes").value);
var comments = parseNum($("fComments").value);
var shares = parseNum($("fShares").value);

/* timing: ~4.2 chars/sec spoken Chinese */
var totalChars = script.replace(/\s/g, "").length;
var totalSec = Math.max(5, totalChars / 4.2);
var segs = [], acc = 0;
sents.forEach(function (s, i) {
var sec = Math.max(1.6, (s.replace(/\s/g, "").length / totalChars) * totalSec);
var r = roleOf(s, i, sents.length);
segs.push({ text: s, sec: sec, start: acc, role: r.role, cls: r.cls, view: r.view, act: r.act});
acc += sec;
});

/* --- verdict --- */
var hookHits = detectHook(sents[0]);
var emoHits = [];
EMOTIONS.forEach(function (e) { if (hasAny(script, e.words)) emoHits.push(e.name);});
var kw = keywords(script);
var hasCTA =!!hasAny(script, CTA);
var hasMethod = segs.some(function (s) { return s.role === "干货方法";});
var hasPain = segs.some(function (s) { return s.role === "痛点共鸣";});
var likeRate = (views && likes)? likes / views: null;
var commentRate = (views && comments)? comments / views: null;
var shareRate = (views && shares)? shares / views: null;
var engageRate = (views && (likes || comments || shares))? ((likes || 0) + (comments || 0) + (shares || 0)) / views: null;

var verdictBits = [];
if (hookHits.length) verdictBits.push("开头用了「" + hookHits[0].t + "」");
if (hasPain && hasMethod) verdictBits.push("结构是完整的痛点 → 方法型");
else if (hasMethod) verdictBits.push("干货密度高");
if (shareRate!= null && shareRate >= 0.01) verdictBits.push("转发率较高，值得观察内容中便于分享的部分");
else if (commentRate!= null && commentRate >= 0.003) verdictBits.push("评论率较高，可结合评论内容判断话题性");
else if (likeRate!= null && likeRate >= 0.05) verdictBits.push("点赞率较高，可结合观众反馈判断共鸣点");
$("vTitle").textContent = (title || "这条视频") + " · " + platform;
$("vText").textContent = "可能的传播线索：" + (verdictBits.length? verdictBits.join("；") + "。": "现有字幕和数据暂未显示明确的传播线索。") +
" 全文约 " + totalChars + " 字，口播时长约 " + Math.round(totalSec) + " 秒，共 " + segs.length + " 段。";

/* --- metrics --- */
var mg = $("metricGrid"); mg.innerHTML = "";
function metricCard(label, val, rate, judge) {
var d = document.createElement("div"); d.className = "metric";
var tagHtml = "";
if (rate!= null && judge) {
var lv = rate >= judge.good? ["强", "good"]: rate >= judge.mid? ["不错", "mid"]: ["偏弱", "low"];
tagHtml = '<span class="tag ' + lv[1] + '">' + lv[0] + '</span>';
}
d.innerHTML = '<div class="mv">' + esc(val) + '</div><div class="ml">' + esc(label) + '</div>' + tagHtml;
mg.appendChild(d);
}
if (views) {
metricCard("播放量", fmtNum(views), null, null);
if (likes) metricCard("点赞 · 赞播比 " + pct(likeRate), fmtNum(likes), likeRate, { good: 0.05, mid: 0.03});
if (comments) metricCard("评论 · 评论率 " + pct(commentRate), fmtNum(comments), commentRate, { good: 0.005, mid: 0.002});
if (shares) metricCard("转发 · 转发率 " + pct(shareRate), fmtNum(shares), shareRate, { good: 0.01, mid: 0.004});
if (engageRate!= null) metricCard("总互动率", pct(engageRate), engageRate, { good: 0.08, mid: 0.04});
$("metricNote").innerHTML = "";
$("secMetrics").style.display = "";
} else {
$("secMetrics").style.display = "none";
}

/* --- hook --- */
$("hookQuote").textContent = "“" + sents[0] + "”";
var hc = $("hookChips"); hc.innerHTML = "";
if (hookHits.length) {
hookHits.forEach(function (h) {
var c = document.createElement("span"); c.className = "chip"; c.textContent = h.t; hc.appendChild(c);
});
$("hookNote").innerHTML = hookHits.map(function (h) { return "<b>" + esc(h.t) + "</b>：" + esc(h.d);}).join("<br>");
} else {
var c2 = document.createElement("span"); c2.className = "chip plain"; c2.textContent = "未识别到强钩子套路";
hc.appendChild(c2);
$("hookNote").textContent = "第一句是平铺直叙的陈述，没有数字、提问、痛点或反差。这条能爆更多靠题材或账号权重——你复刻时反而要给它补一个强钩子（见下方方案）。";
}
if (emoHits.length) {
$("hookNote").innerHTML += "<br><b>情绪点</b>：全文命中 " + emoHits.join("、") + "，情绪是观众停留和转发的燃料。";
}

/* --- structure --- */
$("structSub").textContent = "按语义把全文切成 " + segs.length + " 段，时长按字数比例估算：";
var bar = $("segBar"); bar.innerHTML = "";
var list = $("segList"); list.innerHTML = "";
segs.forEach(function (s) {
var d = document.createElement("div");
d.className = "bg-c" + s.cls;
d.style.width = (s.sec / totalSec * 100) + "%";
d.textContent = s.sec / totalSec > 0.18? s.role: "";
d.title = s.role;
bar.appendChild(d);
var row = document.createElement("div"); row.className = "seg";
row.innerHTML = '<div><div class="role role-c' + s.cls + '">' + esc(s.role) + '</div>' +
'<div class="time">' + fmtTime(s.start) + " – " + fmtTime(s.start + s.sec) + '</div></div>' +
"<p>" + esc(s.text) + "</p>";
list.appendChild(row);
});

/* --- why / fix --- */
var why = [], fix = [];
if (hookHits.length >= 2) why.push("<b>钩子叠加</b>：第一句同时用了 " + hookHits.map(function (h) { return h.t;}).join(" + ") + "，多重理由让观众停下来。");
else if (hookHits.length === 1) why.push("<b>钩子明确</b>：开头用「" + hookHits[0].t + "」锁定目标人群，前 3 秒不浪费。");
else fix.push("<b>补强钩子</b>：原片开头偏平，你拍时把结论或痛点提到第一句，别从背景讲起。");
if (hasPain && hasMethod) why.push("<b>痛点 → 方法闭环</b>：先扎心再给解法，观众既有共鸣又有收获，收藏和转发都有理由。");
if (hasMethod) why.push("<b>干货可收藏</b>：文中出现明确的方法/步骤信号，观众会收藏「以后照着做」，收藏权重推高推荐。");
else fix.push("<b>加干货锚点</b>：原文方法感不强，你的版本里把步骤编号说出来（第一、第二、第三），收藏率会明显不同。");
if (emoHits.length >= 2) why.push("<b>情绪浓度高</b>：全文叠了 " + emoHits.join("、") + " 等 " + emoHits.length + " 种情绪，情绪越浓，评论区越热闹。");
else if (emoHits.length === 1) why.push("<b>情绪点单一但准</b>：主打「" + emoHits[0] + "」，人群定位反而更聚焦。");
else fix.push("<b>加情绪词</b>：原文情绪偏平，你说台词时加入亲身感受和评价词，别只念信息。");
if (shareRate!= null && shareRate >= 0.01) why.push("<b>转发率 " + pct(shareRate) + "</b>：内容有「转给某个朋友正好用得上」的属性，这是它出圈的关键。");
if (commentRate!= null && commentRate >= 0.003) why.push("<b>评论率 " + pct(commentRate) + "</b>：结尾或文中留了讨论口子，评论权重把视频继续往上推。");
if (likeRate!= null && likeRate >= 0.05) why.push("<b>赞播比 " + pct(likeRate) + "</b>：认同感强，点赞是观众最低成本的表态。");
if (totalSec >= 20 && totalSec <= 75) why.push("<b>时长在甜区</b>：约 " + Math.round(totalSec) + " 秒，信息量够又不拖，完播率容易跑满。");
if (totalSec > 120) fix.push("<b>压缩时长</b>：原文约 " + Math.round(totalSec) + " 秒偏长，你的版本砍掉重复论证，目标控制在 90 秒内。");
if (totalSec < 12) fix.push("<b>信息量偏少</b>：原文很短，靠的是单点爆发；你复刻时至少补一段方法或案例，撑起收藏率。");
if (hasCTA) why.push("<b>结尾有引导</b>：文中有明确的关注/评论/收藏引导，把流量沉淀成了粉丝和互动。");
else fix.push("<b>补结尾引导</b>：原文没有 CTA，你的版本结尾加一句具体问题引导评论，再顺手提关注，别只说「谢谢观看」。");
if (!why.length) why.push("这条的爆发点不在文本套路上，可能来自题材热度、画面表现或账号权重；复刻时重点学它的选题角度，结构按下方方案补强。");
if (!fix.length) fix.push("结构已经比较完整，你的版本注意别丢元素：钩子、痛点、方法、引导四件套一个都不能少。");
$("whyList").innerHTML = why.map(function (w) { return "<li>" + w + "</li>";}).join("");
$("fixList").innerHTML = fix.map(function (w) { return "<li>" + w + "</li>";}).join("");

/* --- your version --- */
var myTopic = topic || "（你的主题）";
$("planSub").textContent = "把原结构换成你的主题「" + myTopic + "」，钩子给你 3 个版本挑，分镜逐镜头照着拍。";
var altHooks = [
{ t: "痛点型（学原片钩子）", p: "做" + myTopic + "，最怕的不是没天赋，是一开始就走错路——我把踩过的坑都替你踩完了。"},
{ t: "提问型", p: "为什么你做" + myTopic + "一直没效果？大概率不是不努力，是第一步就错了。"},
{ t: "数字结果型", p: myTopic + "只记住 3 点就够了，尤其第 2 点，90% 的新手都会忽略。"}
];
if (hookHits.length && hookHits[0].t === "提问钩子") altHooks[0] = { t: "提问型（学原片钩子）", p: altHooks[1].p};
var ha = $("hookAlts"); ha.innerHTML = "";
altHooks.forEach(function (h) {
var d = document.createElement("div"); d.className = "hook-alt";
d.innerHTML = '<div class="ht">' + esc(h.t) + "</div><p>" + esc(h.p) + "</p>";
ha.appendChild(d);
});

var viewsCycle = segs.map(function (s) { return s;});
var sl = $("shotList"); sl.innerHTML = "";
var mdShots = [];
segs.forEach(function (s, i) {
var line = s.text;
if (i === 0) line = altHooks[0].p + "（原钩子参考：”" + s.text + "“）";
var row = document.createElement("div"); row.className = "shot";
row.innerHTML =
'<div><div class="no">' + (i + 1) + '</div><div class="tm">' + fmtTime(s.start) + "–" + fmtTime(s.start + s.sec) + "</div></div>" +
'<div class="view shot-view">' + esc(s.view) + '</div>' +
'<div class="act shot-act">' + esc(s.act) + '</div>' +
'<div class="line">' + esc(line) + "</div>";
sl.appendChild(row);
mdShots.push({ n: i + 1, t: fmtTime(s.start) + "–" + fmtTime(s.start + s.sec), role: s.role, view: s.view, act: s.act, line: line});
});

var checks = [
"手机后置摄像头擦干净，竖屏 9:16，分辨率调到 1080p 以上",
"光源在脸的正前方（窗边或环形灯），避免顶光和背光",
"收音：安静房间 + 领夹麦或耳机麦，离嘴别超过一臂",
"第一句台词单独多录 3 遍，挑语气最冲的一条放开头",
"每个干货点说完停顿半秒，方便后期上字幕编号",
"结尾引导单独录一条，看着镜头说完再停 1 秒才关机",
"拍之前把分镜表打开放在镜头旁边，逐条对照着拍",
"背景里只留和主题有关的东西，杂物先清走"
];
$("checkList").innerHTML = checks.map(function (c) { return "<li>" + esc(c) + "</li>";}).join("");

var coverWord = (kw[0] || myTopic).slice(0, 6);
var tags = kw.slice(0, 4).map(function (k) { return "#" + k;}).join(" ");
$("pubList").innerHTML =
"<div><dt>标题公式</dt><dd>人群/主题 + 痛点或数字 + 结果承诺，例如：「" + esc(myTopic) + "新手必看：3 个坑别踩」</dd></div>" +
"<div><dt>封面大字</dt><dd>3–6 个字，只放一个信息点，例如：「" + esc(coverWord) + "」配一张表情明确的脸部特写</dd></div>" +
"<div><dt>话题标签</dt><dd>" + esc(tags || "#" + myTopic) + "，再补 1–2 个平台当下的话题标签</dd></div>" +
"<div><dt>置顶评论</dt><dd>把结尾的问题复制到置顶评论，自己先回一条，给评论区起个头</dd></div>";

/* --- markdown report --- */
var md = [];
md.push("# 爆款拆解：" + (title || "未命名视频") + "（" + platform + "）\n");
md.push($("vText").textContent + "\n");
if (views) {
md.push("## 数据");
md.push("- 播放 " + fmtNum(views) + (likes? "｜点赞 " + fmtNum(likes) + "（赞播比 " + pct(likeRate) + "）": "") + (comments? "｜评论 " + fmtNum(comments) + "（评论率 " + pct(commentRate) + "）": "") + (shares? "｜转发 " + fmtNum(shares) + "（转发率 " + pct(shareRate) + "）": ""));
}
md.push("\n## 开头钩子\n第一句：”" + sents[0] + "“");
md.push(hookHits.length? "钩子类型：" + hookHits.map(function (h) { return h.t;}).join("、"): "钩子类型：未识别到强套路");
if (emoHits.length) md.push("情绪点：" + emoHits.join("、"));
if (kw.length) md.push("高频词：" + kw.join("、"));
md.push("\n## 结构");
segs.forEach(function (s) { md.push("- " + s.text);});
md.push("\n## 为什么能爆");
why.forEach(function (w) { md.push("- " + w.replace(/<[^>]+>/g, ""));});
md.push("\n## 可优化");
fix.forEach(function (w) { md.push("- " + w.replace(/<[^>]+>/g, ""));});
md.push("\n## 照着拍（主题：" + myTopic + "）");
md.push("\n### 钩子备选");
altHooks.forEach(function (h) { md.push("- " + h.p);});
md.push("\n### 分镜表");
mdShots.forEach(function (s) { md.push(s.n + ". [" + s.t + "｜" + s.role + "｜" + s.view + "] " + s.line + "（拍法：" + s.act + "）");});
md.push("\n### 拍摄清单");
checks.forEach(function (c) { md.push("- [] " + c);});
if (sourceUrl) md.splice(1, 0, "参考视频：" + sourceUrl);
lastReport = md.join("\n");
lastReference = [
  "参考标题：" + (title || "未填写"),
  "参考链接：" + (sourceUrl || "未填写"),
  "参考开场：" + sents[0].slice(0, 220),
  "拆解结构：" + segs.slice(0, 14).map(function (s) { return s.role; }).join(" → "),
  "可观察的情绪：" + (emoHits.join("、") || "未识别"),
  "可见的内容线索：" + sents.slice(1, 6).map(s => s.slice(0, 130)).join(" / "),
  "用户填入的数据：" + (views ? "播放 " + fmtNum(views) : "播放未提供") +
    (likes != null ? "，点赞 " + fmtNum(likes) : "") +
    (comments != null ? "，评论 " + fmtNum(comments) : "") +
    (shares != null ? "，转发 " + fmtNum(shares) : "")
].join("\n");

$("emptyState").style.display = "none";
$("results").classList.add("show");
$("results").scrollIntoView({ behavior: "smooth", block: "start"});
});

$("btnUseReference").addEventListener("click", function () {
  if (lastReference) onReference(lastReference);
});

$("btnCopy").addEventListener("click", function () {
if (!lastReport) return;
function done() { toast("拆解 + 方案已复制");}
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(lastReport).then(done, function () { fallback();});
} else fallback();
function fallback() {
var ta = document.createElement("textarea");
ta.value = lastReport; ta.style.position = "fixed"; ta.style.opacity = "0";
root.appendChild(ta); ta.select();
try { document.execCommand("copy"); done();} catch (e) { toast("复制失败，请用下载");}
root.removeChild(ta);
}
});
$("btnDownload").addEventListener("click", function () {
if (!lastReport) return;
var blob = new Blob([lastReport], { type: "text/markdown;charset=utf-8"});
var a = document.createElement("a");
a.href = URL.createObjectURL(blob);
a.download = "爆款拆解.md";
root.appendChild(a); a.click();
setTimeout(function () { URL.revokeObjectURL(a.href); root.removeChild(a);}, 400);
toast("已下载 Markdown");
});
}
