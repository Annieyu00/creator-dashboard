import { CreateMLCEngine } from '@mlc-ai/web-llm';

const modelId = 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
const instructions = [
  '你是中文短视频编导。根据用户提供的选题、平台和风格，写一条约45秒的可拍摄脚本。',
  '输出一个标题，然后按 0–3 秒、3–15 秒、15–35 秒、35–45 秒四段写作。',
  '每段必须有具体画面和可以直接说出口的中文口播。第一句要切入具体场景。',
  '最后一句自然邀请互动。不要编造第一人称经历、数据或商业承诺；需要真实细节时用【填入真实细节】。',
  '使用简体中文和纯文本。只输出脚本。'
].join('\n');
let engine;

self.onmessage = async ({ data: { topic, platform, tone } }) => {
  try {
    engine ??= await CreateMLCEngine(modelId, {
      initProgressCallback: ({ progress }) => {
        const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
        self.postMessage({ type: 'progress', text: '正在下载或加载模型 ' + percent + '%' });
      }
    });
    self.postMessage({ type: 'progress', text: 'AI 正在写脚本…' });
    const result = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: instructions },
        { role: 'user', content: JSON.stringify({ topic, platform, tone }) }
      ],
      max_tokens: 850,
      temperature: 0.65
    });
    const text = result.choices[0]?.message.content?.trim();
    if (!text) throw new Error('No script generated');
    self.postMessage({ type: 'result', text });
  } catch {
    self.postMessage({
      type: 'error',
      text: 'AI 生成失败。请确认网络可下载模型，且浏览器已启用图形加速，然后重试。'
    });
  }
};
