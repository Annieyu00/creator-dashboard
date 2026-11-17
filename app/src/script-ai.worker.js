import { CreateMLCEngine } from '@mlc-ai/web-llm';

const modelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
const instructions = [
  '你是中文短视频编导，交付一条 45 秒左右、能用手机拍的脚本。用创作者的说话方式，句子短，有具体动作。',
  '围绕选题讲清楚一件事。选题是教程就给可执行步骤；是生活记录就抓住一件具体小事；是观点分享就先说结论再举例。',
  '把用户给出的真实细节用进镜头或台词。不得把猜测写成事实。缺少个人经历时，可以建议怎么拍，口播用真实的观察、提问或【填入真实细节】。',
  '开场第一句就给出这个选题独有的场景、问题或反差。删掉“今天给大家分享”“你知道吗”“跟我一起看看”等铺垫。',
  '用 0–3 秒、3–15 秒、15–35 秒、35–45 秒四段。每段两行，分别以“镜头：”和“口播：”开头。镜头写一个能拍到的动作或物件，口播写逐字台词。',
  '最后用一个紧扣话题的问题或自然的收尾。每段推进内容，不重复开场。输出简体中文，只有标题和四段脚本。'
].join('\n');
let engine;

async function writeScript(messages, temperature) {
  const result = await engine.chat.completions.create({
    messages,
    max_tokens: 900,
    temperature
  });
  return result.choices[0]?.message.content?.trim() ?? '';
}

function completeScript(text) {
  return (text.match(/镜头[：:]/g)?.length ?? 0) >= 4 &&
    (text.match(/口播[：:]/g)?.length ?? 0) >= 4;
}

self.onmessage = async ({ data: { topic, platform, tone, details } }) => {
  try {
    engine ??= await CreateMLCEngine(modelId, {
      initProgressCallback: ({ progress }) => {
        const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
        self.postMessage({ type: 'progress', text: '正在下载或加载模型 ' + percent + '%' });
      }
    });
    self.postMessage({ type: 'progress', text: 'AI 正在写脚本…' });
    const brief = JSON.stringify({ topic, platform, tone, details });
    const messages = [
      { role: 'system', content: instructions },
      { role: 'user', content: brief }
    ];
    const draft = await writeScript(messages, 0.55);
    if (!draft) throw new Error('No script generated');

    self.postMessage({ type: 'progress', text: '正在精修开场、镜头和口播…' });
    let script = draft;
    try {
      const edited = await writeScript([
        ...messages,
        { role: 'assistant', content: draft },
        { role: 'user', content: '重写并交付完整四段。把空泛台词换成与原选题有关的具体句子，检查镜头能实际拍摄，口播念起来像真人。用上我提供的细节，删掉原资料里没有的个人经历和数字。只输出成稿。' }
      ], 0.35);
      if (completeScript(edited)) script = edited;
    } catch {
      // Keep the draft if the revision fails.
    }

    if (!completeScript(script)) {
      self.postMessage({
        type: 'error',
        text: 'AI 没有生成完整的四段脚本。请补一句真实细节后重试。'
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
