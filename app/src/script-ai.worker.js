import { CreateMLCEngine } from '@mlc-ai/web-llm';

const modelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
const instructions = [
  '你是中文短视频编导，交付一条 45 秒左右、能用手机拍的脚本。用创作者的说话方式，句子短，有具体动作。',
  '用户的 details 可能是零散念头、具体经历、想说的话和可用素材。先从中提炼一条主线，再把能支持主线的细节排进合适的镜头。没有 topic 时，从 details 拟定标题。',
  '围绕选题讲清楚一件事。选题是教程就给可执行步骤；是生活记录就抓住一件具体小事；是观点分享就先说结论再举例。',
  '把用户给出的真实细节用进镜头或台词。不得把猜测写成事实。缺少个人经历时，可以建议怎么拍，口播用真实的观察、提问或【填入真实细节】。',
  '开场第一句就给出这个选题独有的场景、问题或反差。删掉“今天给大家分享”“你知道吗”“跟我一起看看”等铺垫。',
  '用 0–3 秒、3–15 秒、15–35 秒、35–45 秒四段。每段两行，分别以“镜头：”和“口播：”开头。镜头写一个能拍到的动作或物件，口播写逐字台词。',
  '最后用一个紧扣话题的问题或自然的收尾。每段推进内容，不重复开场。输出简体中文，第一行用“标题：”开头，随后只写四段完整脚本。'
].join('\n');
const detailedInstructions = [
  '先写“为什么可能火”，引用输入里一处具体内容或已提供的指标，并注明哪些判断需要验证。只把链接当来源标记，不能声称看过视频画面、评论或后台。',
  '再写“怎么借鉴”，给两个可直接应用到用户选题的动作，并解释如何改成本人的表达。学习结构、节奏和镜头功能，避免照搬原句或冒用原作者经历。没有参考资料就省略爆款分析，集中写用户选题。',
  '接着写“标题：”和“封面：”。把脚本写成 0–3、3–10、10–20、20–32、32–48、48–60 秒六段。每段各写四行，以“镜头：”“口播：”“字幕：”“剪辑：”开头。',
  '镜头写景别、动作和道具，口播给完整可念的句子，字幕提炼一行关键词，剪辑写明确的切镜或声音提示。前 3 秒给具体钩子，最后邀请观众回答一个明确的问题。'
].join('\n');

let engine;

async function writeScript(messages, temperature, detailed) {
  const result = await engine.chat.completions.create({
    messages,
    max_tokens: detailed ? 2100 : 900,
    temperature
  });
  return result.choices[0]?.message.content?.trim() ?? '';
}

function completeScript(text, detailed) {
  const fields = detailed ? ['镜头', '口播', '字幕', '剪辑'] : ['镜头', '口播'];
  return fields.every(field =>
    (text.match(new RegExp(field + '[：:]', 'g'))?.length ?? 0) >= (detailed ? 6 : 4)
  );
}

self.onmessage = async ({ data: { topic, platform, tone, details, detailed, topicHook, reference } }) => {
  try {
    engine ??= await CreateMLCEngine(modelId, {
      initProgressCallback: ({ progress }) => {
        const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
        self.postMessage({ type: 'progress', text: '正在下载或加载模型 ' + percent + '%' });
      }
    });
    self.postMessage({ type: 'progress', text: 'AI 正在写脚本…' });
    const brief = JSON.stringify({ topic, platform, tone, details, topicHook, reference });
    const messages = [
      { role: 'system', content: detailed ? instructions.split('\n').slice(0, 5).join('\n') + '\n' + detailedInstructions : instructions },
      { role: 'user', content: brief }
    ];
    const draft = await writeScript(messages, 0.55, detailed);
    if (!draft) throw new Error('No script generated');

    self.postMessage({ type: 'progress', text: '正在精修开场、镜头和口播…' });
    let script = draft;
    try {
      const edited = await writeScript([
        ...messages,
        { role: 'assistant', content: draft },
        { role: 'user', content: (detailed ? '重写并交付完整六段，每段须有镜头、口播、字幕和剪辑。保留传播线索及借鉴建议。' : '重写并交付完整四段。') + '把空泛台词换成与原选题有关的具体句子，检查镜头能实际拍摄，口播念起来像真人。用上我提供的细节，删掉原资料里没有的个人经历和数字。只输出成稿。' }
      ], 0.35, detailed);
      if (completeScript(edited, detailed)) script = edited;
    } catch {
      // Keep the draft if the revision fails.
    }

    if (!completeScript(script, detailed)) {
      self.postMessage({
        type: 'error',
        text: detailed ? 'AI 没有生成完整的六段脚本。请精简思路或参考内容后重试。' : 'AI 没有生成完整的四段脚本。请调整思路里的文字后重试。'
      });
      return;
    }
    self.postMessage({ type: 'result', text: script });
  } catch {
    self.postMessage({
      type: 'error',
      text: 'AI 生成失败。请确认网络可下载模型，且浏览器已启用图形加速，然后重试。'
    });
  }
};
