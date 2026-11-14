"""Daily authorized-feed updater. Never fabricates trend rankings."""
import os,json,datetime,urllib.request,pathlib,re
ROOT=pathlib.Path(__file__).parent
DEST=ROOT/'data'/'trends.json'
NOW=datetime.datetime.now(datetime.timezone.utc).isoformat()
URL=os.getenv('TREND_FEED_URL','').strip()
TOKEN=os.getenv('TREND_FEED_TOKEN','').strip()
ALLOWED={'Lifestyle','Personal Growth','Beauty'}
def safe_url(u): return isinstance(u,str) and u.startswith('https://')
def read_feed():
    if not safe_url(URL): raise ValueError('TREND_FEED_URL must be an authorized HTTPS JSON feed')
    req=urllib.request.Request(URL,headers={'Accept':'application/json','User-Agent':'CreatorDashboard/5.0'})
    if TOKEN: req.add_header('Authorization','Bearer '+TOKEN)
    with urllib.request.urlopen(req,timeout=25) as r:
        if int(r.headers.get('Content-Length','0'))>2_000_000: raise ValueError('Feed too large')
        raw=r.read(2_000_001)
    if len(raw)>2_000_000: raise ValueError('Feed too large')
    return json.loads(raw)
def normalize(raw):
    if not isinstance(raw,dict) or not isinstance(raw.get('items'),list): raise ValueError('Expected JSON object with items array')
    out=[]; seen=set()
    for x in raw['items'][:100]:
        if not isinstance(x,dict):continue
        title=str(x.get('title','')).strip()[:160]; source=str(x.get('source_url','')).strip()
        category=str(x.get('category','')).strip()
        if not title or not safe_url(source) or category not in ALLOWED or source in seen:continue
        seen.add(source)
        item={'title':title,'category':category,'source_url':source,'source_name':str(x.get('source_name','Authorized feed'))[:70], 'observed_at':str(x.get('observed_at',NOW))[:45], 'metric_label':str(x.get('metric_label',''))[:40], 'metric_value':str(x.get('metric_value',''))[:40], 'hook':'','shooting_idea':''}
        out.append(item)
    return out[:20]
def enrich(items):
    if not os.getenv('OPENAI_API_KEY') or not items:return items
    try:
        from openai import OpenAI
        client=OpenAI()
        prompt='For each supplied trend item, return a JSON object with key ideas, an array in identical order of objects containing hook and shooting_idea. Each hook should be an original English hook (max 25 words); shooting_idea should be practical Chinese filming directions (max 80 Chinese chars). Target US TikTok Lifestyle/Personal Growth/Beauty creator. Do not invent metrics or claim trends beyond the supplied records. Data: '+json.dumps(items,ensure_ascii=False)
        resp=client.responses.create(model=os.getenv('OPENAI_MODEL','gpt-4.1-mini'),input=prompt+' Return JSON only.')
        txt=resp.output_text.strip();txt=re.sub(r'^```(?:json)?\s*|\s*```$','',txt)
        ideas=json.loads(txt)['ideas']
        if len(ideas)==len(items):
            for item,idea in zip(items,ideas):
                item['hook']=str(idea.get('hook',''))[:250]
                item['shooting_idea']=str(idea.get('shooting_idea',''))[:400]
    except Exception as e: print('AI enhancement unavailable:',str(e)[:200])
    return items

def main():
    if not URL:
        print('No TREND_FEED_URL configured. Preserving existing data; no fabricated trends.')
        if not DEST.exists():DEST.write_text(json.dumps({'status':'unconfigured','updated_at':None,'items':[]},ensure_ascii=False,indent=2),encoding='utf-8')
        return
    try:
        items=enrich(normalize(read_feed()))
        if not items:raise ValueError('No valid trend items returned')
        DEST.write_text(json.dumps({'status':'live','updated_at':NOW,'items':items},ensure_ascii=False,indent=2),encoding='utf-8')
        print('Updated',len(items),'verified-source items')
    except Exception as e:
        print('Update failed, keeping last successful snapshot:',str(e)[:300])
        raise
if __name__=='__main__':main()
