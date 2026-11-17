import React,{useEffect,useMemo,useRef,useState} from 'react';import{createRoot}from'react-dom/client';import{LayoutDashboard,Lightbulb,Layers3,Sparkles,CalendarDays,ChartNoAxesCombined,Library,Search,Bell,Plus,ChevronDown,Heart,Archive,Trash2,PenLine,ArrowRight,Bookmark,ExternalLink,Copy,Check,Menu,X,Upload,Download,TrendingUp,Eye,Users,Send,Filter,Clock,FileText,Video,Link2,MoreHorizontal,Star,BarChart3}from'lucide-react';import './index.css';
type Idea={id:string;title:string;description:string;source:string;url:string;attachment:string;platform:string;category:string;tags:string;priority:string;status:string;favorite:boolean;created:string};type Topic={id:string;title:string;platform:string;status:string;category:string;hook:string;created:string};type Content={id:string;title:string;platform:string;status:string;date:string;script:string;views:number;likes:number;comments:number;followers:number};type Breakdown={id:string;title:string;url:string;platform:string;hook:string;structure:string;lesson:string};type Data={ideas:Idea[];topics:Topic[];contents:Content[];breakdowns:Breakdown[]};const uid=()=>Math.random().toString(36).slice(2,10);const today=()=>new Date().toISOString().slice(0,10);const dateAfter=(n:number)=>{let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
const legacyExamples:Data={ideas:[{id:'i1',title:'早晨10分钟重启状态的5个小习惯',description:'记录真实晨间流程，用快速转场展示前后状态',source:'日常观察',url:'',attachment:'',platform:'小红书',category:'Personal Growth',tags:'晨间,习惯,成长',priority:'高',status:'待整理',favorite:true,created:today()},{id:'i2',title:'通勤包里真正用得上的美妆好物',description:'不做夸张种草，突出使用场景和实际效果',source:'粉丝评论',url:'',attachment:'',platform:'抖音',category:'Beauty',tags:'通勤,好物',priority:'中',status:'待整理',favorite:false,created:today()},{id:'i3',title:'周末独处充电日 Vlog',description:'生活方式短片，加入自然环境音和真实旁白',source:'个人灵感',url:'',attachment:'',platform:'TikTok',category:'Lifestyle',tags:'vlog,独处',priority:'高',status:'已整理',favorite:true,created:dateAfter(-1)}],topics:[{id:'t1',title:'早晨10分钟重启状态的5个小习惯',platform:'小红书',status:'准备创作',category:'Personal Growth',hook:'不是自律让我改变，而是这10分钟。',created:today()},{id:'t2',title:'平价通勤妆容：5分钟完成',platform:'抖音',status:'待评估',category:'Beauty',hook:'每天迟到的人，试试这个顺序。',created:today()}],contents:[{id:'c1',title:'周末独处充电日 Vlog',platform:'TikTok',status:'待发布',date:dateAfter(1),script:'镜头1：窗边晨光；镜头2：咖啡和读书；镜头3：散步；结尾：给自己一点空间。',views:0,likes:0,comments:0,followers:0},{id:'c2',title:'我的三款空瓶护肤品',platform:'小红书',status:'已发布',date:dateAfter(-2),script:'分享实际使用感受、肤质和适用人群。',views:12840,likes:926,comments:84,followers:56},{id:'c3',title:'下班后的治愈仪式',platform:'抖音',status:'已发布',date:dateAfter(-5),script:'用生活片段记录下班后恢复能量的方式。',views:8920,likes:643,comments:38,followers:29}],breakdowns:[{id:'b1',title:'高完播率 Vlog 的开场节奏',url:'',platform:'TikTok',hook:'前三秒抛出强烈对比',structure:'痛点 → 过程 → 转折 → 结果',lesson:'开头直接给结果画面，再解释过程'}]};const nav=[['首页',LayoutDashboard],['灵感中心',Lightbulb],['选题爆款拆解',Layers3],['AI 创作中心',Sparkles],['发布计划',CalendarDays],['数据复盘',ChartNoAxesCombined],['我的内容库',Library],['原版每日打卡',Check],['每日趋势',TrendingUp]] as const;const platforms=['小红书','抖音','TikTok','Instagram','其他'];const categories=['Lifestyle','Personal Growth','Beauty','其他'];const topicStatuses=['待评估','准备创作','创作中','已完成','暂缓'];const contentStatuses=['草稿','制作中','待发布','已发布'];const fmt=(n:number)=>n.toLocaleString('zh-CN');const emptyData: Data = { ideas: [], topics: [], contents: [], breakdowns: [] };

function withoutExamples<T extends { id: string }>(
  records: T[],
  examples: T[],
  dateField?: keyof T,
): T[] {
  return records.filter(record => {
    const example = examples.find(item => item.id === record.id);
    if (!example) return true;
    const keys = Object.keys(example) as (keyof T)[];
    return Object.keys(record).length !== keys.length
      || keys.some(key => key !== dateField && record[key] !== example[key]);
  });
}

function read(): Data {
  try {
    const raw = localStorage.getItem('xx-creator-v1');
    if (!raw) return emptyData;
    const data: Data = JSON.parse(raw);
    return {
      ...data,
      ideas: withoutExamples(data.ideas, legacyExamples.ideas, 'created'),
      topics: withoutExamples(data.topics, legacyExamples.topics, 'created'),
      contents: withoutExamples(data.contents, legacyExamples.contents, 'date'),
      breakdowns: withoutExamples(data.breakdowns, legacyExamples.breakdowns),
    };
  } catch {
    return emptyData;
  }
}
type DouyinReview = {
  schema: 'douyin-review-v1';
  start: string;
  end: string;
  metrics: Record<string, string>;
  works: { title: string; views: string; followers: string; completion: string }[];
  insight: string;
  plan: { date: string; task: string }[];
};

const douyinReviewKey = 'xx-douyin-review-v1';
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

function parseDouyinReview(raw: string): DouyinReview {
  const data: unknown = JSON.parse(raw);
  const date = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  const rows = (value: unknown, keys: string[]) =>
    Array.isArray(value) && value.every(row => isObject(row) && keys.every(key => typeof row[key] === 'string'));

  if (!isObject(data) || data.schema !== 'douyin-review-v1' || !date(data.start) || !date(data.end)
    || !isObject(data.metrics) || !Object.keys(data.metrics).length
    || !Object.values(data.metrics).every(value => typeof value === 'string')
    || !rows(data.works, ['title', 'views', 'followers', 'completion'])
    || typeof data.insight !== 'string' || !rows(data.plan, ['date', 'task'])) {
    throw new Error('文件格式不符合抖音复盘要求');
  }
  return data as DouyinReview;
}

function DouyinReviewPanel() {
  const [review, setReview] = useState<DouyinReview | null>(() => {
    try {
      const saved = localStorage.getItem(douyinReviewKey);
      return saved ? parseDouyinReview(saved) : null;
    } catch {
      return null;
    }
  });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState('');
  const saveReview = (raw: string) => {
    if (raw.length > 500_000) throw new Error('文件过大');
    const next = parseDouyinReview(raw);
    localStorage.setItem(douyinReviewKey, JSON.stringify(next));
    setReview(next);
    setStatus('已导入并保存在当前浏览器。');
  };

  return <section className="panel p-5 mb-5" aria-labelledby="douyin-review-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="h2" id="douyin-review-title">抖音创作者中心复盘</h2>
        <p className="muted mt-1">{review ? `${review.start} 至 ${review.end} · 导入快照` : '导入抖音账号数据、重点作品和 7 天内容计划。'}</p>
        <p className="muted mt-1">数据保存在当前浏览器。更新时导入新的复盘文件。</p>
      </div>
      <div className="flex flex-wrap gap-2"><label className="btn secondary cursor-pointer focus-within:ring-2 focus-within:ring-brand">
        {busy ? '正在导入…' : '导入抖音复盘'}
        <input className="sr-only" type="file" accept=".json,application/json" disabled={busy} onChange={async event => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          if (!file) return;
          setBusy(true);
          try {
            if (file.size > 500_000) throw new Error('文件过大');
            saveReview(await file.text());
          } catch {
            setStatus('无法导入。请检查复盘 JSON 文件格式及浏览器存储权限。');
          } finally {
            input.value = '';
            setBusy(false);
          }
        }}/>
      </label>
      <button className="btn secondary" aria-expanded={pasteOpen} onClick={() => setPasteOpen(!pasteOpen)}>粘贴复盘数据</button></div>
    </div>
    {pasteOpen && <div className="space-y-2 mt-3">
      <label className="block text-sm font-medium">复盘 JSON
        <textarea className="field mt-1" rows={3} value={paste} onChange={event => setPaste(event.target.value)}/>
      </label>
      <button className="btn primary" disabled={!paste.trim()} onClick={() => {
        try {
          saveReview(paste);
          setPaste('');
          setPasteOpen(false);
        } catch {
          setStatus('无法导入。请检查复盘 JSON 格式及浏览器存储权限。');
        }
      }}>保存抖音复盘</button>
    </div>}
    <p className="muted mt-2" role="status">{status}</p>
    {review && <>
      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {Object.entries(review.metrics).map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3">
          <dt className="muted">{label}</dt><dd className="font-semibold mt-1">{value}</dd>
        </div>)}
      </dl>
      <p className="text-sm mt-4">{review.insight}</p>
      <h3 className="font-semibold mt-5 mb-2">重点作品</h3>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{['作品', '累计播放', '累计吸粉', '完播率'].map(label =>
          <th className="p-2" scope="col" key={label}>{label}</th>)}</tr></thead>
        <tbody>{review.works.map(work => <tr className="border-t border-slate-100" key={work.title}>
          <th className="p-2 font-medium" scope="row">{work.title}</th>
          <td className="p-2">{work.views}</td><td className="p-2">{work.followers}</td><td className="p-2">{work.completion}</td>
        </tr>)}</tbody>
      </table></div>
      <h3 className="font-semibold mt-5 mb-2">7 天内容计划</h3>
      <ol className="space-y-2 text-sm">{review.plan.map(item => <li key={item.date}>
        <time className="font-medium mr-2" dateTime={item.date}>{item.date.slice(5)}</time>{item.task}
      </li>)}</ol>
    </>}
  </section>;
}

function App(){const [data,setData]=useState<Data>(read),[page,setPage]=useState(() => new URLSearchParams(window.location.search).get('view') === 'script' ? 'AI 创作中心' : '首页'),[search,setSearch]=useState(''),[modal,setModal]=useState(''),[editing,setEditing]=useState(''),[toast,setToast]=useState(''),[mobile,setMobile]=useState(false),[tab,setTab]=useState('我的选题'),[board,setBoard]=useState(false),[filter,setFilter]=useState('全部'),[sort,setSort]=useState('最新'),[selected,setSelected]=useState<string[]>([]),[draft,setDraft]=useState(''),[aiTitle,setAiTitle]=useState(''),[aiPlatform,setAiPlatform]=useState('抖音'),[aiTone,setAiTone]=useState('真实自然'),[aiResult,setAiResult]=useState(''),[newItem,setNewItem]=useState<Record<string,string>>({});useEffect(()=>{localStorage.setItem('xx-creator-v1',JSON.stringify(data))},[data]);const notify=(s:string)=>{setToast(s);setTimeout(()=>setToast(''),2600)};const open=(type:string,item?:Record<string,any>)=>{setModal(type);setEditing(item?.id||'');setNewItem(item?Object.fromEntries(Object.entries(item).map(([k,v])=>[k,String(v)])):{platform:'小红书',category:'Lifestyle',priority:'中',status:type==='topic'?'待评估':type==='content'?'草稿':'待整理',date:today()})};const close=()=>{setModal('');setEditing('')};const saveItem=()=>{if(!newItem.title?.trim()){notify('请填写标题');return}const key=modal==='idea'?'ideas':modal==='topic'?'topics':modal==='content'?'contents':'breakdowns';const item:any={...newItem,id:editing||uid(),created:newItem.created||today()};if(key==='ideas'){item.favorite=newItem.favorite==='true';item.source??='';item.url??='';item.description??='';item.tags??='';item.attachment??=''}if(key==='contents'){item.views=Number(newItem.views||0);item.likes=Number(newItem.likes||0);item.comments=Number(newItem.comments||0);item.followers=Number(newItem.followers||0);item.script??=''}setData(d=>({...d,[key]:editing?(d[key] as any[]).map(x=>x.id===editing?item:x):[item,...d[key]]}));close();notify(editing?'已保存修改':'创建成功')};const remove=(key:keyof Data,id:string)=>{if(!confirm('确定删除这条记录吗？'))return;setData(d=>({...d,[key]:d[key].filter(x=>x.id!==id)}));notify('已删除')};const update=(key:keyof Data,id:string,changes:Record<string,any>)=>setData(d=>({...d,[key]:d[key].map(x=>x.id===id?{...x,...changes}:x)}));const convert=(idea:Idea)=>{setData(d=>({...d,topics:[{id:uid(),title:idea.title,platform:idea.platform,category:idea.category,status:'待评估',hook:idea.description,created:today()},...d.topics],ideas:d.ideas.map(i=>i.id===idea.id?{...i,status:'已转选题'}:i)}));notify('已转入我的选题')};const start=(topic:Topic)=>{setData(d=>({...d,contents:[{id:uid(),title:topic.title,platform:topic.platform,status:'草稿',date:today(),script:topic.hook,views:0,likes:0,comments:0,followers:0},...d.contents],topics:d.topics.map(t=>t.id===topic.id?{...t,status:'创作中'}:t)}));setPage('AI 创作中心');setAiTitle(topic.title);notify('已创建创作草稿')};const published=data.contents.filter(c=>c.status==='已发布'),upcoming=data.contents.filter(c=>c.status==='待发布'),totals={views:published.reduce((a,c)=>a+c.views,0),engagement:published.reduce((a,c)=>a+c.likes+c.comments,0),followers:published.reduce((a,c)=>a+c.followers,0),count:published.length};const field=(key:string,label:string,kind='text',options?:string[])=> <label className="block"><span className="text-xs font-semibold text-slate-600">{label}</span>{options?<select className="field mt-1" value={newItem[key]||options[0]} onChange={e=>setNewItem(p=>({...p,[key]:e.target.value}))}>{options.map(o=><option key={o}>{o}</option>)}</select>:kind==='textarea'?<textarea rows={3} className="field mt-1" value={newItem[key]||''} onChange={e=>setNewItem(p=>({...p,[key]:e.target.value}))}/>:<input type={kind} className="field mt-1" value={newItem[key]||''} onChange={e=>setNewItem(p=>({...p,[key]:e.target.value}))}/>}</label>;const heading=(title:string,sub:string,button?:string,action?:()=>void)=><div className="flex flex-wrap justify-between items-start gap-3 mb-6"><div><h1 className="text-2xl font-bold">{title}</h1><p className="muted mt-1">{sub}</p></div>{button&&<button onClick={action} className="btn primary"><Plus size={17}/>{button}</button>}</div>;const tag=(s:string)=><span className={'pill '+(s==='高'||s==='已发布'||s==='已完成'?'bg-emerald-50 text-emerald-700':s==='待发布'||s==='准备创作'?'bg-amber-50 text-amber-700':'bg-slate-100 text-slate-600')}>{s}</span>;const empty=(s:string)=><div className="text-center py-14 text-slate-400"><Lightbulb className="mx-auto mb-3" size={28}/>{s}</div>;
const home=<>{heading('早上好，创作者 ✨','把灵感变成作品，把每一次创作变成成长。','写下我的思路',()=>setPage('AI 创作中心'))}<div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">{[['总曝光量',fmt(totals.views),Eye,'本地已发布内容累计'],['总互动量',fmt(totals.engagement),Heart,'点赞 + 评论'],['新增粉丝',fmt(totals.followers),Users,'记录内容带来的增长'],['发布内容数',fmt(totals.count),Send,'已发布作品总数']].map(([name,value,Icon,desc]:any)=><div className="panel p-5" key={name}><div className="flex items-center justify-between"><span className="muted">{name}</span><Icon size={19} className="text-brand"/></div><div className="text-3xl font-bold mt-4">{value}</div><div className="text-xs text-slate-400 mt-2">{desc} · 上周对比待录入</div></div>)}</div><div className="grid lg:grid-cols-5 gap-5"><div className="lg:col-span-3 space-y-5"><section className="panel p-5"><div className="flex justify-between mb-4"><h2 className="h2">今日灵感</h2><button className="text-sm text-brand" onClick={()=>setPage('灵感中心')}>查看全部 →</button></div>{data.ideas.filter(i=>i.status!=='已归档').slice(0,3).map(i=><div className="py-3 border-b last:border-0 border-slate-100 flex items-center gap-3" key={i.id}><span className="rounded-xl bg-amber-50 text-amber-600 p-2"><Lightbulb size={17}/></span><div className="flex-1 min-w-0"><div className="font-medium truncate">{i.title}</div><div className="text-xs text-slate-400 mt-1">{i.platform} · {i.category}</div></div><button className="text-xs text-brand" onClick={()=>convert(i)}>转选题</button></div>)}<button className="btn secondary mt-4" onClick={()=>open('idea')}><Plus size={15}/>快速记录灵感</button></section><section className="panel p-5"><div className="flex justify-between mb-4"><h2 className="h2">待发表内容</h2><button className="text-sm text-brand" onClick={()=>setPage('发布计划')}>发布计划 →</button></div>{upcoming.length?upcoming.map(c=><div className="flex items-center justify-between py-3 border-b last:border-0" key={c.id}><div><div className="font-medium">{c.title}</div><div className="text-xs text-slate-400 mt-1">{c.platform} · 计划 {c.date}</div></div>{tag(c.status)}</div>):empty('暂无待发表内容')}</section></div><div className="lg:col-span-2 space-y-5"><section className="panel p-5"><h2 className="h2 mb-4">本周发布安排</h2>{data.contents.filter(c=>c.date>=dateAfter(-7)&&c.date<=dateAfter(7)).slice(0,5).map(c=><div key={c.id} className="flex gap-3 py-3 border-b last:border-0"><div className="bg-soft text-brand rounded-xl px-3 py-2 text-center text-xs font-bold">{c.date.slice(5)}</div><div className="min-w-0"><div className="text-sm font-medium truncate">{c.title}</div><div className="text-xs text-slate-400 mt-1">{c.platform} · {c.status}</div></div></div>)}<button className="text-sm text-brand mt-4" onClick={()=>setPage('发布计划')}>打开日程 →</button></section><section className="panel p-5"><h2 className="h2 mb-4">常用创作入口</h2><div className="grid grid-cols-2 gap-3">{[['记灵感',Lightbulb,()=>open('idea')],['新建选题',Layers3,()=>open('topic')],['写脚本',Sparkles,()=>setPage('AI 创作中心')],['安排发布',CalendarDays,()=>open('content')]].map(([t,I,fn]:any)=><button key={t} onClick={fn} className="bg-paper rounded-xl py-5 flex flex-col items-center gap-2 text-sm font-medium"><I className="text-brand" size={21}/>{t}</button>)}</div></section></div></div></>;
const ideasFiltered=useMemo(()=>data.ideas.filter(i=>(filter==='全部'||filter===i.status||filter===i.platform||filter==='已收藏'&&i.favorite)&&[i.title,i.description,i.tags,i.category,i.source].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sort==='最早'?a.created.localeCompare(b.created):sort==='优先级'?(['高','中','低'].indexOf(a.priority)-['高','中','低'].indexOf(b.priority)):b.created.localeCompare(a.created)),[data.ideas,filter,search,sort]);const ideas=<>{heading('灵感中心','捕捉每一个灵感，让好点子随时有处安放。','新建灵感',()=>open('idea'))}<div className="panel p-4 mb-5 flex flex-wrap gap-3 items-center"><div className="relative flex-1 min-w-48"><Search size={16} className="absolute top-3 left-3 text-slate-400"/><input className="field pl-9" placeholder="搜索标题、标签、描述…" value={search} onChange={e=>setSearch(e.target.value)}/></div><select className="field w-auto" value={filter} onChange={e=>setFilter(e.target.value)}>{['全部','已收藏','待整理','已整理','已转选题','已归档',...platforms].map(x=><option key={x}>{x}</option>)}</select><select className="field w-auto" value={sort} onChange={e=>setSort(e.target.value)}>{['最新','最早','优先级'].map(x=><option key={x}>{x}</option>)}</select>{selected.length>0&&<button className="btn secondary" onClick={()=>{setData(d=>({...d,ideas:d.ideas.map(i=>selected.includes(i.id)?{...i,status:'已归档'}:i)}));setSelected([]);notify('批量归档成功')}}><Archive size={15}/>归档 {selected.length} 条</button>}</div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{ideasFiltered.map(i=><article className="panel p-5" key={i.id}><div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(i.id)} onChange={e=>setSelected(p=>e.target.checked?[...p,i.id]:p.filter(x=>x!==i.id))}/>{tag(i.platform)}{tag(i.priority+'优先级')}</div><button title="收藏" onClick={()=>update('ideas',i.id,{favorite:!i.favorite})}><Heart size={18} className={i.favorite?'fill-rose-400 text-rose-400':'text-slate-300'}/></button></div><h3 className="font-semibold text-base leading-relaxed">{i.title}</h3><p className="muted mt-2 line-clamp-2 min-h-10">{i.description||'暂无描述'}</p><div className="flex gap-2 flex-wrap my-4">{i.tags.split(',').filter(Boolean).map(t=><span className="pill bg-paper text-slate-500" key={t}>#{t.trim()}</span>)}</div><div className="text-xs text-slate-400 mb-4">{i.source||'个人记录'} · {i.created} · {i.status}</div>{i.url&&<a href={i.url} target="_blank" rel="noreferrer" className="text-xs text-brand flex items-center gap-1 mb-3"><ExternalLink size={13}/>打开来源</a>}<div className="flex items-center gap-2 border-t pt-3 border-slate-100"><button className="btn primary flex-1 !py-2" onClick={()=>convert(i)}>转选题 <ArrowRight size={14}/></button><button title="编辑" onClick={()=>open('idea',i)} className="p-2 text-slate-500"><PenLine size={16}/></button><button title="归档" onClick={()=>update('ideas',i.id,{status:'已归档'})} className="p-2 text-slate-500"><Archive size={16}/></button><button title="删除" onClick={()=>remove('ideas',i.id)} className="p-2 text-rose-400"><Trash2 size={16}/></button></div></article>)}</div>{!ideasFiltered.length&&empty('没有找到匹配的灵感')}</>;
const topics=<>{heading('选题爆款拆解','从好点子到好作品，每一步都有迹可循。',tab==='我的选题'?'新建选题':'新增拆解',()=>open(tab==='我的选题'?'topic':'breakdown'))}<div className="flex justify-between flex-wrap gap-3 mb-5"><div className="flex bg-white rounded-xl p-1 border border-slate-100">{['我的选题','爆款拆解'].map(t=><button key={t} onClick={()=>setTab(t)} className={'px-5 py-2 rounded-lg text-sm '+(tab===t?'bg-soft text-brand font-semibold':'text-slate-500')}>{t}</button>)}</div>{tab==='我的选题'&&<div className="flex gap-2"><button onClick={()=>setBoard(false)} className={'btn '+(!board?'primary':'secondary')}>列表</button><button onClick={()=>setBoard(true)} className={'btn '+(board?'primary':'secondary')}>看板</button></div>}</div>{tab==='我的选题'?board?<div className="grid md:grid-cols-3 xl:grid-cols-5 gap-3 items-start">{topicStatuses.map(s=><div key={s} className="rounded-2xl bg-slate-100/70 p-3 min-h-48"><div className="font-semibold text-sm mb-3">{s} <span className="text-slate-400">{data.topics.filter(t=>t.status===s).length}</span></div>{data.topics.filter(t=>t.status===s).map(t=><div className="panel p-3 mb-2" key={t.id}><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-slate-400 mt-2">{t.platform}</div><select className="field !p-1 mt-3" value={t.status} onChange={e=>update('topics',t.id,{status:e.target.value})}>{topicStatuses.map(s=><option key={s}>{s}</option>)}</select><button className="text-xs text-brand mt-3" onClick={()=>start(t)}>开始创作 →</button></div>)}</div>)}</div>:<div className="panel overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr>{['选题','平台','方向','状态','操作'].map(x=><th className="p-4 font-medium" key={x}>{x}</th>)}</tr></thead><tbody>{data.topics.map(t=><tr key={t.id} className="border-t border-slate-100"><td className="p-4 font-medium">{t.title}</td><td className="p-4">{t.platform}</td><td className="p-4">{t.category}</td><td className="p-4"><select className="field !p-2" value={t.status} onChange={e=>update('topics',t.id,{status:e.target.value})}>{topicStatuses.map(s=><option key={s}>{s}</option>)}</select></td><td className="p-4 whitespace-nowrap"><button onClick={()=>start(t)} className="text-brand mr-3">开始创作</button><button onClick={()=>open('topic',t)} className="text-slate-500 mr-3">编辑</button><button onClick={()=>remove('topics',t.id)} className="text-rose-400">删除</button></td></tr>)}</tbody></table>{!data.topics.length&&empty('还没有选题')}</div>:<div className="grid md:grid-cols-2 gap-4">{data.breakdowns.map(b=><div className="panel p-5" key={b.id}><div className="flex justify-between items-start">{tag(b.platform)}<div className="flex gap-3"><button onClick={()=>open('breakdown',b)}><PenLine size={16}/></button><button onClick={()=>remove('breakdowns',b.id)}><Trash2 size={16}/></button></div></div><h3 className="font-bold text-lg mt-3">{b.title}</h3>{[['开头 Hook',b.hook],['内容结构',b.structure],['可复用经验',b.lesson]].map(([k,v])=><p className="text-sm mt-3" key={k}><span className="text-slate-400">{k}：</span>{v}</p>)}{b.url&&<a className="text-brand text-sm mt-4 inline-flex items-center gap-1" target="_blank" rel="noreferrer" href={b.url}>查看原视频 <ExternalLink size={14}/></a>}</div>)}{!data.breakdowns.length&&empty('暂无爆款拆解')}</div>}</>;
const [scriptDetails, setScriptDetails] = useState('');
const [scriptProgress, setScriptProgress] = useState('');
const [scriptError, setScriptError] = useState('');
const scriptWorker = useRef<Worker | null>(null);
const scriptRunning = useRef(false);

useEffect(() => () => {
  scriptWorker.current?.terminate();
  scriptWorker.current = null;
  scriptRunning.current = false;
}, []);

const generate = () => {
  const topic = aiTitle.trim();
  const details = scriptDetails.trim();
  if ((!topic && !details) || scriptRunning.current) return;
  setScriptError('');
  if (!('gpu' in navigator)) {
    setScriptError('当前浏览器无法使用 WebGPU。请在支持 WebGPU 的电脑 Chrome 中打开，确认已启用图形加速。');
    return;
  }
  scriptRunning.current = true;
  setScriptProgress('正在启动 AI…');

  function stop(message?: string) {
    scriptRunning.current = false;
    setScriptProgress('');
    if (message) setScriptError(message);
  }

  try {
    if (!scriptWorker.current) {
      const worker = new Worker(new URL('./script-ai.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => {
        if (data.type === 'progress') setScriptProgress(data.text);
        if (data.type === 'result') {
          setAiResult(data.text);
          stop();
        }
        if (data.type === 'error') stop(data.text);
      };
      worker.onerror = () => {
        worker.terminate();
        scriptWorker.current = null;
        stop('无法启动 AI。请刷新网页后再试。');
      };
      scriptWorker.current = worker;
    }
    scriptWorker.current.postMessage({ topic, platform: aiPlatform, tone: aiTone, details });
  } catch {
    stop('无法启动 AI。请刷新网页后再试。');
  }
};
function saveScriptDraft() {
  const script = aiResult.trim();
  if (!script) return notify('请先生成或填写脚本');
  const titleLine = script.match(/^\s*(?:\*\*|#+\s*)?标题[：:]\s*([^\n]+)/m)?.[1];
  const title = aiTitle.trim() || titleLine?.replace(/\*\*/g, '').trim() || '短视频脚本';
  setData(current => ({
    ...current,
    contents: [{
      id: uid(), title, platform: aiPlatform, status: '草稿', date: today(),
      script, views: 0, likes: 0, comments: 0, followers: 0,
    }, ...current.contents],
  }));
  notify('已保存到内容库');
}

useEffect(() => {
  if (page !== 'AI 创作中心' || window.location.hash !== '#script-references') return;
  document.getElementById('script-references')?.scrollIntoView();
}, [page]);

const ai = <>
  <div className="flex flex-wrap items-start justify-between gap-2">
    {heading('AI 创作中心', '把零散想法整理成一条能直接拍的短视频。')}
    <a className="btn secondary mb-4" href="#script-references"><FileText size={17}/>看文字版拍法</a>
  </div>
  <div className="grid gap-5 lg:grid-cols-5">
    <div className="panel space-y-4 p-6 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="h2">我的思路</h2>
        <button type="button" className="text-sm text-brand disabled:opacity-50"
          disabled={!!scriptProgress || !!scriptDetails.trim()}
          onClick={() => setScriptDetails('想拍回美国上班第一天，像跟朋友聊天。\n能拍出门、通勤、下班后的镜头。\n最想讲的是重新适应上班节奏的感觉。\n结尾可以问大家，长假回来最难适应什么？')}>
          填入示范思路
        </button>
      </div>
      <label className="block">
        <span className="sr-only">我的思路</span>
        <textarea className="field min-h-48 !leading-7" rows={8} maxLength={3000}
          value={scriptDetails} disabled={!!scriptProgress}
          onChange={e => setScriptDetails(e.target.value)}
          placeholder="随手写下你想讲什么、发生了什么、能拍什么。几句碎片也可以，不用先写好标题。" />
      </label>
      <label className="block text-sm font-medium">创作主题（可选）
        <input className="field mt-2" value={aiTitle} maxLength={500} disabled={!!scriptProgress}
          onChange={e => setAiTitle(e.target.value)} placeholder="例如：回美国上班第一天" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium">发布平台
          <select className="field mt-2" value={aiPlatform} disabled={!!scriptProgress}
            onChange={e => setAiPlatform(e.target.value)}>
            {platforms.map(platform => <option key={platform}>{platform}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">表达风格
          <select className="field mt-2" value={aiTone} disabled={!!scriptProgress}
            onChange={e => setAiTone(e.target.value)}>
            {['真实自然','轻松有趣','干货专业','温柔治愈'].map(tone => <option key={tone}>{tone}</option>)}
          </select>
        </label>
      </div>
      <button type="button" className="btn primary w-full"
        disabled={(!aiTitle.trim() && !scriptDetails.trim()) || !!scriptProgress} onClick={generate}>
        <Sparkles size={17}/>{scriptProgress ? '生成中…' : 'AI 整理成完整脚本'}
      </button>
      <p className="text-xs leading-relaxed text-slate-500">首次使用需要联网下载模型。请用支持 WebGPU 的电脑浏览器。</p>
      {scriptProgress && <p role="status" className="text-sm text-slate-600">{scriptProgress}</p>}
      {scriptError && <p role="alert" className="text-sm text-rose-700">{scriptError}</p>}
    </div>
    <div className="panel flex flex-col p-6 lg:col-span-3">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="h2">脚本编辑器</h2>
        <div className="flex gap-2">
          <button type="button" className="btn secondary !py-2" disabled={!aiResult.trim() || !!scriptProgress}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(aiResult);
                notify('已复制');
              } catch {
                notify('请在编辑器内手动复制');
              }
            }}><Copy size={15}/>复制</button>
          <button type="button" className="btn primary !py-2" disabled={!aiResult.trim() || !!scriptProgress}
            onClick={saveScriptDraft}><Bookmark size={15}/>保存草稿</button>
        </div>
      </div>
      <textarea aria-label="完整脚本" className="field min-h-96 flex-1 !leading-7" value={aiResult}
        disabled={!!scriptProgress} onChange={e => setAiResult(e.target.value)}
        placeholder="完整脚本会显示在这里，包括标题、开场、分镜、口播和结尾。"/>
    </div>
  </div>
  <section id="script-references" className="panel mt-5 scroll-mt-20 p-6" aria-labelledby="script-references-title">
    <h2 id="script-references-title" className="h2 mb-4">文字版拍法参考</h2>
    <div className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold">上班日常 Vlog</h3>
        <a className="mt-2 inline-flex items-center gap-2 text-sm text-brand"
          href="https://www.youtube.com/watch?v=G95UnUuBaTA" target="_blank" rel="noopener noreferrer">
          <Video size={16}/>观看 Rebekah Joy 的参考视频 <ExternalLink size={14}/>
        </a>
        <h4 className="mt-4 text-sm font-semibold">文字示范 · 回美国上班第一天</h4>
        <ol className="mt-3 space-y-3 text-sm leading-relaxed">
          <li><strong>0–3 秒 · 开场</strong><br/>镜头：特写拍手拿钥匙，切到门关上的瞬间。<br/>口播：「回美国上班第一天，我想看看自己多久能找回上班的节奏。」</li>
          <li><strong>3–12 秒 · 通勤</strong><br/>镜头：拍走出家门的脚步，再接等车时的街景。<br/>口播：「先从最熟悉的一件事开始，走一遍平时上班的路。」</li>
          <li><strong>12–30 秒 · 工作日</strong><br/>镜头：拍打开记事本、写下第一件事。<br/>口播：「今天我先做的是（换成你的真实任务）。这个动作做完，我才有了回到工作日的感觉。」</li>
          <li><strong>30–45 秒 · 下班收尾</strong><br/>镜头：拍回到家把钥匙放回桌上，呼应开场。<br/>口播：「第一天就这么过完了。你长假回来，最难找回的是哪个节奏？」</li>
        </ol>
        <p className="muted mt-3">转场可以用关门声，把出门和回家两个镜头接起来。</p>
      </article>
      <article className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold">带情绪主线的上班 Vlog</h3>
        <a className="mt-2 inline-flex items-center gap-2 text-sm text-brand"
          href="https://www.youtube.com/watch?v=ZeLnr3AkRLg" target="_blank" rel="noopener noreferrer">
          <Video size={16}/>观看参考视频 <ExternalLink size={14}/>
        </a>
        <h4 className="mt-4 text-sm font-semibold">文字示范 · 上班提不起劲的一天</h4>
        <ol className="mt-3 space-y-3 text-sm leading-relaxed">
          <li><strong>0–3 秒 · 开场</strong><br/>镜头：拍你坐在门边穿鞋，停一下再站起来。<br/>口播：「今天坐在门口，鞋都穿好了，我还是不想出门。」</li>
          <li><strong>3–12 秒 · 交代状态</strong><br/>镜头：拍等车时的侧脸，留一秒环境声。<br/>口播：「路还是那条路，就是今天人到了，状态还没到。」</li>
          <li><strong>12–30 秒 · 一个小变化</strong><br/>镜头：拍在纸上圈出一件小事，做完后划掉。<br/>口播：「我就挑了一件能做完的小事。写下来，做完，划掉。然后再看下一件。」</li>
          <li><strong>30–45 秒 · 回到感受</strong><br/>镜头：拍下班路上的第一眼街景。<br/>口播：「今天也没突然变得很有干劲，但我把这一天过完了。你没状态的时候，会先做哪件小事？」</li>
        </ol>
        <p className="muted mt-3">选一个你当天真的做过的小动作来拍，收尾说当时的真实感受。</p>
      </article>
    </div>
  </section>
</>;
const schedule=<>{heading('发布计划','统一安排多平台内容，追踪每条作品的发布状态。','安排新内容',()=>open('content'))}<div className="grid md:grid-cols-4 gap-3 mb-5">{contentStatuses.map(s=><div className="panel p-4" key={s}><div className="muted">{s}</div><div className="text-2xl font-bold mt-2">{data.contents.filter(c=>c.status===s).length}</div></div>)}</div><div className="panel overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr>{['内容','平台','计划日期','状态','操作'].map(t=><th key={t} className="p-4">{t}</th>)}</tr></thead><tbody>{[...data.contents].sort((a,b)=>a.date.localeCompare(b.date)).map(c=><tr className="border-t border-slate-100" key={c.id}><td className="p-4 font-medium">{c.title}</td><td className="p-4">{c.platform}</td><td className="p-4"><input type="date" className="field !p-2" value={c.date} onChange={e=>update('contents',c.id,{date:e.target.value})}/></td><td className="p-4"><select className="field !p-2" value={c.status} onChange={e=>update('contents',c.id,{status:e.target.value})}>{contentStatuses.map(s=><option key={s}>{s}</option>)}</select></td><td className="p-4"><button className="text-brand mr-4" onClick={()=>open('content',c)}>编辑</button><button className="text-rose-400" onClick={()=>remove('contents',c.id)}>删除</button></td></tr>)}</tbody></table></div></>;
const analytics=<>{heading('数据复盘','记录真实发布表现，找到适合自己的内容方向。')}<DouyinReviewPanel/><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">{[['累计曝光',totals.views],['累计互动',totals.engagement],['新增粉丝',totals.followers],['已发布内容',totals.count]].map(([t,n])=><div className="panel p-5" key={t}><div className="muted">{t}</div><div className="text-3xl font-bold mt-3">{fmt(Number(n))}</div></div>)}</div><div className="panel p-6 mb-5"><h2 className="h2 mb-4">内容曝光对比</h2><div className="space-y-4">{published.length?published.map(c=><div key={c.id}><div className="flex justify-between text-sm mb-1"><span className="truncate max-w-2/3">{c.title}</span><b>{fmt(c.views)}</b></div><div className="h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full" style={{width:`${totals.views?Math.max(3,c.views/Math.max(...published.map(x=>x.views))*100):0}%`}}/></div></div>):empty('发布内容后可以查看数据对比')}</div></div><div className="panel overflow-x-auto"><div className="flex justify-between items-center p-5"><h2 className="h2">作品数据明细</h2><button className="btn secondary" onClick={()=>{const rows=[['标题','平台','日期','曝光','点赞','评论','新增粉丝'],...published.map(c=>[c.title,c.platform,c.date,c.views,c.likes,c.comments,c.followers])];const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='creator-analytics.csv';a.click();URL.revokeObjectURL(a.href)}}><Download size={15}/>导出 CSV</button></div><table className="w-full text-sm"><thead className="bg-slate-50"><tr>{['标题','平台','曝光','点赞','评论','新增粉丝','操作'].map(x=><th className="p-4 text-left text-slate-500" key={x}>{x}</th>)}</tr></thead><tbody>{published.map(c=><tr className="border-t border-slate-100" key={c.id}><td className="p-4 font-medium">{c.title}</td><td className="p-4">{c.platform}</td>{[c.views,c.likes,c.comments,c.followers].map((n,i)=><td className="p-4" key={i}>{fmt(n)}</td>)}<td className="p-4"><button className="text-brand" onClick={()=>open('content',c)}>录入/编辑</button></td></tr>)}</tbody></table></div><p className="text-xs text-slate-400 mt-4">数据来自你手动录入的作品表现，不是平台自动同步；未录入上周历史数据，因此暂不显示虚构的环比趋势。</p></>;
const legacy=<>{heading('原版每日打卡','保留原网站的 7 天挑战、任务编辑、笔记、视频表现与分析。')}<div className="panel p-3"><div className="flex justify-between items-center p-3"><span className="text-sm text-slate-500">与原网站使用相同的浏览器本地数据键；请在原网站相同域名下打开。</span><a className="text-brand text-sm" href="./legacy-checkin.html" target="_blank" rel="noreferrer">单独打开 ↗</a></div><iframe title="原版每日打卡" src="./legacy-checkin.html" className="w-full border-0 rounded-xl" style={{height:'1250px'}} /></div></>;
const [trendData,setTrendData]=useState<any>(null);const [trendError,setTrendError]=useState('');const [trendPlatform,setTrendPlatform]=useState('douyin');useEffect(()=>{if(page!=='每日趋势')return;let active=true;setTrendData(null);setTrendError('');fetch('./data/'+(trendPlatform==='douyin'?'douyin':'xiaohongshu')+'.json?ts='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(j=>{if(active)setTrendData(j)}).catch(e=>{if(active)setTrendError('尚未配置真实数据或读取失败：'+e.message)});return()=>{active=false}},[page,trendPlatform]);
const trends=<>{heading('每日趋势','抖音和小红书真实数据入口；仅显示后台成功采集的数据，不生成虚构热榜。')}<div className="flex gap-2 mb-5">{[['douyin','抖音'],['xiaohongshu','小红书']].map(([id,name])=><button key={id} className={'btn '+(trendPlatform===id?'primary':'secondary')} onClick={()=>setTrendPlatform(id)}>{name}</button>)}</div><div className="panel p-6"><div className="flex justify-between items-center mb-4"><h2 className="h2">{trendPlatform==='douyin'?'抖音':'小红书'} · Daily Trends</h2><span className="muted">{trendData?.fetched_at||trendData?.updated_at||'未同步'}</span></div>{trendError?<p className="muted">{trendError}。请先配置 GitHub Actions 与第三方 API。</p>:!trendData?<p className="muted">正在读取数据…</p>:!Array.isArray(trendData.items)||!trendData.items.length?<p className="muted">当前没有已验证的热点数据。请检查数据源和同步日志。</p>:<div className="space-y-3">{trendData.items.map((it:any,i:number)=><div className="border border-slate-100 rounded-xl p-4" key={i}><div className="flex justify-between gap-3"><div><div className="font-semibold">{it.title||it.name||it.word||it.keyword||'未命名热点'}</div><p className="muted mt-1">{it.heat||it.hot_value||it.score?'热度：'+(it.heat||it.hot_value||it.score):'热度未提供'}</p></div>{/^https:\/\//.test(it.url||it.source_url||'')&&<a className="text-brand text-sm" href={it.url||it.source_url} target="_blank" rel="noopener noreferrer">查看来源 ↗</a>}</div><button className="text-brand text-sm mt-3" onClick={()=>{const title=it.title||it.name||it.word||it.keyword;if(!title)return;setData(d=>({...d,ideas:[{id:uid(),title,description:'来自每日趋势，采集于 '+(trendData.fetched_at||trendData.updated_at||'未知时间'),source:'Daily Trends',url:it.url||it.source_url||'',attachment:'',platform:trendPlatform==='douyin'?'抖音':'小红书',category:'其他',tags:'趋势',priority:'中',status:'待整理',favorite:false,created:today()},...d.ideas]}));notify('已加入灵感中心')}}>＋ 保存到灵感中心</button></div>)}</div>}</div></>;
const library=<>{heading('我的内容库','脚本、素材链接与已发布作品统一归档。','新建内容',()=>open('content'))}<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{data.contents.map(c=><div className="panel p-5" key={c.id}><div className="flex justify-between">{tag(c.platform)}{tag(c.status)}</div><h3 className="font-semibold mt-4">{c.title}</h3><p className="muted line-clamp-3 mt-2 min-h-16">{c.script||'暂无脚本，点击编辑补充。'}</p><div className="text-xs text-slate-400 mt-3">{c.date}</div><div className="border-t border-slate-100 mt-4 pt-3 flex gap-3"><button className="text-brand text-sm" onClick={()=>open('content',c)}>编辑内容</button><button className="text-rose-400 text-sm" onClick={()=>remove('contents',c.id)}>删除</button></div></div>)}</div></>;
return <div className="min-h-screen"><aside className={'fixed inset-y-0 left-0 w-[232px] bg-white border-r border-slate-100 z-30 flex flex-col p-4 transition-transform lg:translate-x-0 '+(mobile?'translate-x-0':'-translate-x-full')}><div className="flex items-center justify-between px-2 py-5 mb-5"><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center"><Sparkles size={20}/></div><div><div className="font-bold text-lg">XX Studio</div><div className="text-[10px] tracking-widest text-slate-400">CREATOR WORKSPACE</div></div></div><button className="lg:hidden" onClick={()=>setMobile(false)}><X size={20}/></button></div><div className="mini px-3 mb-3">工作空间</div><nav className="space-y-1">{nav.map(([n,I])=><button key={n} className={'nav '+(page===n?'active':'')} onClick={()=>{setPage(n);setMobile(false);setFilter('全部');setSearch('')}}><I size={19}/>{n}</button>)}</nav><div className="mt-auto p-4 bg-soft rounded-2xl"><div className="text-sm font-bold text-brand">✨ 让灵感持续发生</div><p className="text-xs text-slate-500 mt-2 leading-5">从记录想法，到完成每一次发布。</p><button className="btn primary w-full mt-3 !py-2" onClick={()=>open('idea')}><Plus size={15}/>记录灵感</button></div><div className="text-xs text-slate-400 text-center mt-4">本地保存 · v1.0</div></aside>{mobile&&<div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={()=>setMobile(false)}/>}<div className="lg:ml-[232px]"><header className="sticky top-0 z-10 h-[76px] bg-white/95 backdrop-blur border-b border-slate-100 px-5 md:px-9 flex items-center justify-between"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={()=>setMobile(true)}><Menu size={22}/></button><span className="text-sm text-slate-500">工作空间</span><span className="text-slate-300">/</span><span className="font-semibold text-sm">{page}</span></div><div className="flex items-center gap-3"><span className="text-xs text-slate-400 hidden sm:block">{new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})}</span><button title="快速添加灵感" className="btn secondary !p-2.5" onClick={()=>open('idea')}><Plus size={18}/></button><div className="h-9 w-9 rounded-full bg-rose-100 text-rose-600 grid place-items-center font-semibold">C</div></div></header><main className="max-w-[1500px] mx-auto p-5 md:p-9">{page==='首页'?home:page==='灵感中心'?ideas:page==='选题爆款拆解'?topics:page==='AI 创作中心'?ai:page==='发布计划'?schedule:page==='数据复盘'?analytics:page==='原版每日打卡'?legacy:page==='每日趋势'?trends:library}</main></div>{toast&&<div className="fixed z-50 bottom-6 right-6 rounded-xl bg-ink text-white shadow-xl px-5 py-3 text-sm flex gap-2 items-center"><Check size={16}/>{toast}</div>}{modal&&<div className="fixed z-40 inset-0 bg-ink/40 flex items-center justify-center p-4" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-auto"><div className="sticky top-0 bg-white flex justify-between items-center px-6 py-5 border-b"><h2 className="text-xl font-bold">{editing?'编辑':'新建'}{modal==='idea'?'灵感':modal==='topic'?'选题':modal==='content'?'内容':'爆款拆解'}</h2><button onClick={close}><X size={20}/></button></div><div className="p-6 grid grid-cols-2 gap-4">{<div className="col-span-2">{field('title','标题 *')}</div>}{modal==='idea'?<><div className="col-span-2">{field('description','描述','textarea')}</div>{field('source','灵感来源')}{field('platform','平台','text',platforms)}{field('category','内容方向','text',categories)}{field('priority','优先级','text',['高','中','低'])}{field('status','状态','text',['待整理','已整理','已转选题','已归档'])}<div className="col-span-2">{field('tags','标签（用逗号分隔）')}</div><div className="col-span-2">{field('url','来源链接','url')}</div><div className="col-span-2">{field('attachment','附件链接（云盘或素材地址）','url')}</div></>:modal==='topic'?<>{field('platform','平台','text',platforms)}{field('category','方向','text',categories)}{field('status','状态','text',topicStatuses)}<div className="col-span-2">{field('hook','核心卖点 / Hook','textarea')}</div></>:modal==='breakdown'?<>{field('platform','平台','text',platforms)}<div className="col-span-2">{field('url','原视频链接','url')}</div><div className="col-span-2">{field('hook','前三秒 Hook','textarea')}</div><div className="col-span-2">{field('structure','内容结构','textarea')}</div><div className="col-span-2">{field('lesson','可复用经验','textarea')}</div></>:<>{field('platform','平台','text',platforms)}{field('status','状态','text',contentStatuses)}{field('date','计划发布日期','date')}<div className="col-span-2">{field('script','脚本 / 素材说明','textarea')}</div>{['views','likes','comments','followers'].map((k,i)=> <React.Fragment key={k}>{field(k,['曝光量','点赞数','评论数','新增粉丝'][i],'number')}</React.Fragment>)}</>}</div><div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3"><button className="btn secondary" onClick={close}>取消</button><button className="btn primary" onClick={saveItem}>保存记录</button></div></div></div>}</div>}
createRoot(document.getElementById('root')!).render(<App/>);
