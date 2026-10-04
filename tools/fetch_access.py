#!/usr/bin/env python3
"""수서역 ↔ 코스 출발·도착 대중교통 이동시간을 ODsay로 조회해 access-data.js 에 저장.
사용: python3 tools/fetch_access.py [--dry] [--force] [--max N]
- 키는 config.js 의 ODSAY_API_KEY 를 읽는다. (허용 도메인 yjjn2005.github.io 기준으로 Origin/Referer 지정)
- 일일 호출 한도(429)가 나오면 즉시 중단하고, 지금까지의 결과는 저장한다. 다시 실행하면 이어서 조회한다.
"""
import sys,os,re,json,math,time,datetime,urllib.parse,urllib.request
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def load(fn):
    s=open(os.path.join(ROOT,fn),encoding='utf-8').read(); return json.loads(s[s.index('=')+1:].rstrip().rstrip(';'))
cfg=open(os.path.join(ROOT,'config.js'),encoding='utf-8').read()
KEY=re.search(r'ODSAY_API_KEY\s*=\s*"([^"]+)"',cfg).group(1)
S=load('data.js'); G=load('gg-data.js')
try: ACC=load('access-data.js')
except Exception: ACC={}
args=sys.argv[1:]; DRY='--dry' in args; FORCE='--force' in args
MAX=int(args[args.index('--max')+1]) if '--max' in args else 10**9
def hav(a,b):
    R=6371008.8
    la1,lo1,la2,lo2=map(math.radians,[a[0],a[1],b[0],b[1]])
    x=math.sin((la2-la1)/2)**2+math.cos(la1)*math.cos(la2)*math.sin((lo2-lo1)/2)**2
    return 2*R*math.asin(math.sqrt(x))
def r4(x): return round(x*10000)/10000
def rk(a,b): return f"{r4(a[0])},{r4(a[1])}>{r4(b[0])},{r4(b[1])}"
legs={}
def collect(D):
    base=[f for f in D['flags'] if f.get('base')][0]['pos']
    for c in D['courses']:
        no=c['no']
        s=[f['pos'] for f in D['flags'] if f.get('depart')==no and f.get('pos')]
        e=[f['pos'] for f in D['flags'] if f.get('arrive')==no and f.get('pos')]
        s=s[0] if s else None; e=e[0] if e else None
        if s and hav(base,s)>150: legs[rk(base,s)]=(base,s)
        if e and hav(base,e)>150: legs[rk(e,base)]=(e,base)
collect(S); collect(G)
def call(a,b):
    url=("https://api.odsay.com/v1/api/searchPubTransPathT?SX=%s&SY=%s&EX=%s&EY=%s&OPT=0&SearchType=0&apiKey=%s"%(b and a[1],a[0],b[1],b[0],urllib.parse.quote(KEY,safe='')))
    req=urllib.request.Request(url,headers={"Origin":"https://yjjn2005.github.io","Referer":"https://yjjn2005.github.io/dulle-gil/"})
    with urllib.request.urlopen(req,timeout=25) as r: return json.loads(r.read().decode('utf-8'))
def parse(j):
    if "error" in j:
        e=j["error"]; e0=e[0] if isinstance(e,list) else e
        code=str(e0.get("code","")); msg=e0.get("msg") or e0.get("message") or ""
        if code=="429" or "quota" in msg.lower(): return {"err":"quota","msg":msg}
        if code=="-98": return {"err":"near"}
        if code in("-99","-9","-3"): return {"err":"none"}
        return {"err":"api","code":code,"msg":msg}
    p=(j.get("result") or {}).get("path") or []
    if not p: return {"err":"none"}
    best=min(p,key=lambda x:x["info"]["totalTime"]); i=best["info"]
    rides=(i.get("busTransitCount") or 0)+(i.get("subwayTransitCount") or 0)
    names=[]
    for sp in best.get("subPath",[]):
        if sp.get("trafficType")==1 and sp.get("lane"): names.append(sp["lane"][0].get("name"))
        elif sp.get("trafficType")==2 and sp.get("lane"): names.append((sp["lane"][0].get("busNo") or "버스")+"번")
    return {"t":i["totalTime"],"tr":max(0,rides-1),"pay":i.get("payment"),"walk":i.get("totalWalk"),"sum":" → ".join(n for n in names if n)}
todo=[k for k in legs if FORCE or k not in ACC or ACC[k].get("err")=="api"]
print("전체 구간",len(legs),"· 이미 조회",len(legs)-len(todo),"· 조회할 구간",len(todo))
if DRY: sys.exit(0)
ts=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y-%m-%dT%H:%M:%S')
def save():
    open(os.path.join(ROOT,'access-data.js'),'w',encoding='utf-8').write(
      '// 수서역 대중교통 실측(ODsay) 결과: {"출발lat,lng>도착lat,lng":{t:분,tr:환승,pay:요금,sum:"노선",ts:"조회시각(KST)"}}\n'
      'window.ACCESS_DATA='+json.dumps(ACC,ensure_ascii=False,separators=(',',':'))+';\n')
n=0
for k in todo[:MAX]:
    a,b=legs[k]
    try: r=parse(call(a,b))
    except Exception as ex: r={"err":"api","msg":str(ex)[:60]}
    if r.get("err")=="quota":
        print("일일 호출 한도 초과 — 중단(내일 다시 실행)"); break
    if "t" in r: r["ts"]=ts
    ACC[k]=r; n+=1
    if n%10==0: save(); print(n,"/",len(todo))
    time.sleep(0.3)
save()
ok=sum(1 for v in ACC.values() if "t" in v); no=sum(1 for v in ACC.values() if v.get("err")=="none"); nr=sum(1 for v in ACC.values() if v.get("err")=="near")
print("저장 완료 · 실측",ok,"· 경로없음",no,"· 500m이내",nr)
