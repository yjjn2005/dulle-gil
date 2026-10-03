(function(){
var SEOUL=window.TRAIL_DATA, GG=window.GG_DATA;
var PAL=["#e6194b","#2e9e5b","#4363d8","#f58231","#911eb4","#008b8b","#9a6324","#d81b9b","#8b0000","#6b8e23","#1f3a93","#e08a00","#00a3a3","#7b1fa2","#c2185b","#2e7d32","#5d4037","#0277bd","#ef6c00","#6a1b9a","#455a64"];
var GGCOL={"경기 평화누리길":["#1565c0","#5aa9e6"],"경기 숲길":["#2e7d32","#7cb342"],"경기 물길":["#00838f","#26c6da"],"경기 갯길":["#d84315","#ffa726"]};
function sCol(c){return PAL[(c.no-1)%PAL.length]}
function gCol(c){var p=GGCOL[c.dstrct]||["#555","#999"];return p[c.no%2]}
var REGIONS=[["서울",{c:[37.55,126.99],z:11}],["경기",{c:[37.55,127.2],z:9}],["인천",{c:[37.47,126.65],z:10}],["강원",{c:[37.8,128.3],z:8}],["충청",{c:[36.55,127.3],z:8}],["경상",{c:[36.0,128.8],z:8}],["전라",{c:[35.3,127.0],z:8}],["제주",{c:[33.38,126.55],z:10}],["울릉도",{c:[37.50,130.87],z:11}]];
var DSET={};
if(SEOUL) DSET["서울"]={id:"seoul",title:"서울둘레길",d:SEOUL,color:sCol,minZ:0,
  chips:[["전체",function(){return true}],["수서역 근처",function(c){return [7,8,9,10].indexOf(c.no)>=0}],["초급",function(c){return c.level==="초급"}],["중급",function(c){return c.level==="중급"}],["상급",function(c){return c.level==="상급"}]],
  legend:'<span><b class="ln"></b> 실선: 지도 경로</span><span><b class="ln dash"></b> 색 점선: 근사선(14코스)</span><span><b class="ln dash gr"></b> 회색 점선: 2·3코스 구 노선 참고선(실제 아님)</span>',
  foot:"모든 일정은 수서역 출발·귀환 기준. 경로: OpenStreetMap 기여자(ODbL) · 거리·난이도: 서울둘레길 누리집·숲나들e · 수서역 이동시간은 지하철 노선 기준 추정치(±15분), 지도의 수서역 연결선은 직선 표시(실제 경로 아님).<br>2·3코스는 개별 경로 없이 구 노선 기준 통합 참고선만 표시(새 노선과 다름). 14코스는 안양천 중심선과 한강변을 이은 근사선. 근사 표시: 상계동 나들이철쭉동산(2·3코스 경계)은 공식 거리 비율로 추정한 위치."};
if(GG) DSET["경기"]={id:"gyeonggi",title:"경기둘레길",d:GG,color:gCol,minZ:10,
  chips:[["전체",function(){return true}],["수서역 근처(직선 40km 이내)",function(c){return Math.min(c.dist[0],c.dist[1])<=40}],["하루 20km 이내",function(c){return c.km<=20}],["쉬움 이하",function(c){return c.level==="매우쉬움"||c.level==="쉬움"}],["보통",function(c){return c.level==="보통"}],["어려움 이상",function(c){return c.level==="어려움"||c.level==="매우어려움"}],["평화누리길",function(c){return c.dstrct==="경기 평화누리길"}],["숲길",function(c){return c.dstrct==="경기 숲길"}],["물길",function(c){return c.dstrct==="경기 물길"}],["갯길",function(c){return c.dstrct==="경기 갯길"}]],
  legend:'<span><b class="ln" style="border-top-color:#1565c0"></b> 평화누리길</span><span><b class="ln" style="border-top-color:#2e7d32"></b> 숲길</span><span><b class="ln" style="border-top-color:#00838f"></b> 물길</span><span><b class="ln" style="border-top-color:#d84315"></b> 갯길</span><span>(진한색·연한색 번갈아 코스 구분)</span>',
  foot:"모든 일정은 수서역 출발·귀환 기준. 경로·거리·시간·난이도: 경기둘레길 누리집(ggtour.or.kr, 2026-10-04 확인). 공식 코스 합계 835.8km(누리집 목록 합산, 기사에 나온 860km와 다름). 수서역 이동시간은 직선거리 기반 개략 추정치라 실제와 크게 다를 수 있고, 연결선은 직선 표시입니다.<br>37코스는 공식 좌표가 역방향이라 방향을 뒤집었습니다. 우회·통제 공지가 있는 코스는 표시된 노선에 우회가 반영되지 않았을 수 있으니 출발 전 누리집 공지를 확인하세요."};
var region="서울",DS=null,map,lines=[],flagMarkers=[],labels=[],info,sel=null,filterIdx=0,done={},Label=null,base=null,showCmp=false,TH=7;
function dkey(){return DS&&DS.id==="seoul"?"dulle_done":"dulle_done_"+(DS?DS.id:"x")}
function loadDone(){try{done=JSON.parse(localStorage.getItem(dkey())||"{}")}catch(e){done={}}}
function save(){try{localStorage.setItem(dkey(),JSON.stringify(done))}catch(e){}}
function courses(){return DS?DS.d.courses:[]}
function flags(){return DS?DS.d.flags:[]}
function course(no){return courses().filter(function(x){return x.no===no})[0]}
function col(no){var c=course(no);return c?DS.color(c):"#555"}
function is23(no){return DS&&DS.id==="seoul"&&(no===2||no===3)}
function hm(m){return Math.floor(m/60)+"시간"+(m%60?(" "+m%60+"분"):"")}
function f1(n){return Number(n).toFixed(1)}
function sgn(n){return (n>0?"+":(n<0?"−":""))+Math.abs(n)}
function accessNote(){return DS.id==="seoul"?"(추정)":"(직선거리 기반 개략 추정)"}
// ---- 대중교통 실측(ODsay) ----
var ACC={},accBusy=false;
try{ACC=JSON.parse(JSON.stringify(window.ACCESS_DATA||{}))}catch(e){ACC={}}
try{var _st=JSON.parse(localStorage.getItem("dulle_access_v1")||"{}");for(var _k in _st)ACC[_k]=_st[_k];}catch(e){}
function saveAcc(){try{localStorage.setItem("dulle_access_v1",JSON.stringify(ACC))}catch(e){}}
function r4(x){return Math.round(x*10000)/10000}
function rk(a,b){return r4(a[0])+","+r4(a[1])+">"+r4(b[0])+","+r4(b[1])}
function legs(c){
  var s=startPos(c.no),e=endPos(c.no);
  var l0=(s&&base&&dist(base,s)>150)?[base,s]:null, l1=(e&&base&&dist(base,e)>150)?[e,base]:null;
  return [l0,l1];
}
function legInfo(c,i){var l=legs(c)[i];return l?(ACC[rk(l[0],l[1])]||null):null}
function accOf(c){
  var L=legs(c),m=c.accessMin.slice(),real=[false,false],r=[legInfo(c,0),legInfo(c,1)];
  for(var i=0;i<2;i++){
    if(!L[i]){m[i]=0;real[i]=true;continue;}
    if(r[i]&&r[i].t!=null){m[i]=r[i].t;real[i]=true;}
    else if(r[i]&&r[i].err==="near"){m[i]=Math.min(m[i],10);real[i]=true;}
  }
  return {m:m,real:real,r:r};
}
function accLabel(o){var n=(o.real[0]?1:0)+(o.real[1]?1:0);return n===2?"대중교통 실측":(n===1?"일부 실측":"개략 추정")}
function legText(c,i){
  var L=legs(c),r=legInfo(c,i),est=c.accessMin[i];
  if(!L[i]) return "0분 (수서역과 같은 위치)";
  if(r&&r.t!=null) return "<b>실측 "+r.t+"분</b>"+(r.tr!=null?" · 환승 "+r.tr+"회":"")+(r.pay?" · "+Number(r.pay).toLocaleString()+"원":"")+(r.sum?" · "+r.sum:"")+' <span class="why">(개략 추정 '+est+"분 → 차이 "+sgn(r.t-est)+"분"+(r.ts?" · 조회 "+r.ts.slice(0,16).replace("T"," "):"")+")</span>";
  if(r&&r.err==="near") return "출발·도착이 500m 이내 — 도보 가능";
  if(r&&r.err==="none") return '<b>대중교통 경로 없음</b> — 택시·자가용 필요 <span class="why">(ODsay 조회 결과)</span>';
  if(r&&r.err==="api") return "조회 실패: "+(r.msg||r.code||"원인 미상");
  return "미확인 · 개략 추정 "+est+'분 <span class="why">(길찾기 API 확인 전)</span>';
}
function odsayCall(from,to){
  var key=window.ODSAY_API_KEY;
  var url="https://api.odsay.com/v1/api/searchPubTransPathT?SX="+from[1]+"&SY="+from[0]+"&EX="+to[1]+"&EY="+to[0]+"&OPT=0&SearchType=0&apiKey="+encodeURIComponent(key);
  return fetch(url).then(function(r){return r.json()}).then(function(j){
    if(j.error){
      var e=j.error,e0=Array.isArray(e)?e[0]:e,code=String((e0&&(e0.code))||""),msg=(e0&&(e0.msg||e0.message))||"";
      if(code==="-98") return {err:"near"};
      if(code==="-99"||code==="-9"||code==="-3") return {err:"none"};
      return {err:"api",code:code,msg:msg};
    }
    var p=(j.result&&j.result.path)||[];
    if(!p.length) return {err:"none"};
    var best=p.reduce(function(a,b){return b.info.totalTime<a.info.totalTime?b:a});
    var i=best.info,rides=(i.busTransitCount||0)+(i.subwayTransitCount||0);
    var names=[];(best.subPath||[]).forEach(function(sp){
      if(sp.trafficType===1&&sp.lane&&sp.lane[0]) names.push(sp.lane[0].name);
      else if(sp.trafficType===2&&sp.lane&&sp.lane[0]) names.push((sp.lane[0].busNo||"버스")+"번");
    });
    return {t:i.totalTime,tr:Math.max(0,rides-1),pay:i.payment,walk:i.totalWalk,sum:names.join(" → "),ts:new Date().toISOString()};
  });
}
function setAccMsg(t){var el=document.getElementById("accmsg");if(el)el.innerHTML=t||""}
function runLegs(list,force){
  if(accBusy) return;
  if(!window.ODSAY_API_KEY){setAccMsg("ODsay 키가 설정되지 않았습니다. config.js의 ODSAY_API_KEY에 키를 넣으면 대중교통 실측이 가능합니다.");return;}
  var tasks=[];
  list.forEach(function(c){legs(c).forEach(function(l){if(!l)return;var k=rk(l[0],l[1]);var cached=ACC[k];
    if(force||!cached||cached.err==="api"||(cached.ts&&Date.now()-Date.parse(cached.ts)>86400000)) tasks.push([k,l]);});});
  var seen={};tasks=tasks.filter(function(t){if(seen[t[0]])return false;seen[t[0]]=1;return true});
  if(!tasks.length){setAccMsg("이미 조회한 구간입니다(24시간 이내). 다시 조회하려면 코스 상세의 확인 버튼을 누르세요.");return;}
  accBusy=true;var i=0,fail=0;
  (function next(){
    if(i>=tasks.length){accBusy=false;saveAcc();setAccMsg("길찾기 확인 완료 "+tasks.length+"구간"+(fail?" · 실패 "+fail:"")+" (ODsay · 조회 시각 기준 시간표)");renderAll();return;}
    setAccMsg("ODsay 길찾기 조회 중 "+(i+1)+"/"+tasks.length+" …");
    var t=tasks[i++];
    odsayCall(t[1][0],t[1][1]).then(function(res){
      ACC[t[0]]=res;
      if(res.err==="api"&&/key|auth|인증|권한|ApiKey/i.test((res.msg||"")+(res.code||""))){accBusy=false;saveAcc();setAccMsg("키 인증 실패: "+(res.msg||res.code)+" — ODsay 콘솔에서 키와 허용 URL(https://yjjn2005.github.io)을 확인하세요.");renderAll();return;}
      if(res.err==="api") fail++;
      setTimeout(next,250);
    }).catch(function(){
      ACC[t[0]]={err:"api",msg:"네트워크·CORS 오류"};fail++;
      if(fail>=3){accBusy=false;saveAcc();setAccMsg("조회 실패가 반복됩니다 — 네트워크 또는 ODsay 허용 URL 설정을 확인하세요.");renderAll();return;}
      setTimeout(next,250);
    });
  })();
}

function flagSvg(color,big){
  var w=big?34:26,h=big?44:34;
  var s='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 26 34"><rect x="3" y="2" width="2.6" height="31" rx="1" fill="#333"/><path d="M5.6 3 L23 8.5 L5.6 15 Z" fill="'+color+'" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  return {url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(s),scaledSize:new google.maps.Size(w,h),anchor:new google.maps.Point(4,h-1)};
}
function cmp(c){
  var cb=DS.d.combined23;
  if(is23(c.no)&&cb){
    var d=+(cb.osmKm-cb.officialKm).toFixed(1),p=Math.round(d/cb.officialKm*100);
    return {kind:"mismatch",cls:"warn",off:cb.officialKm,map:cb.osmKm,diff:d,pct:p,badge:"노선 불일치 · 참고선만 표시",
      text:"공식 2코스+3코스 합 "+f1(cb.officialKm)+"km  vs  지도(구 노선) "+f1(cb.osmKm)+"km  →  차이 "+sgn(d)+"km ("+sgn(p)+"%)",
      why:"지도 자료가 서울둘레길 개편(2024년) 이전 노선이라 새 2·3코스와 노선이 다른 것으로 추정됩니다(원인 미확인). 회색 점선은 위치 참고용이며 실제 코스가 아닙니다."};
  }
  if(c.osmKm==null) return {kind:"none",cls:"warn",badge:"지도 경로 없음",text:"공식 "+f1(c.km)+"km · 지도 경로 자료 준비 중",why:""};
  var d2=+(c.osmKm-c.km).toFixed(1),p2=Math.round(d2/c.km*100);
  if(c.approx) return {kind:"approx",cls:"est",off:c.km,map:c.osmKm,diff:d2,pct:p2,badge:"근사선 · 길이만 비교(검증 아님)",
    text:"공식 "+f1(c.km)+"km  vs  근사선 "+f1(c.osmKm)+"km  →  차이 "+sgn(d2)+"km ("+sgn(p2)+"%)",why:"안양천 중심선을 따라 그린 근사선이라 실제 둘레길 위치·길이와 다를 수 있습니다."};
  var ok=Math.abs(p2)<=TH,src=DS.id==="seoul"?"지도":"노선 좌표";
  return {kind:ok?"ok":"warn",cls:ok?"ok":"warn",off:c.km,map:c.osmKm,diff:d2,pct:p2,
    badge:ok?"일치 (±"+TH+"% 이내)":"거리 차이 확인필요 (±"+TH+"% 초과)",
    text:"공식 "+f1(c.km)+"km  vs  "+src+" "+f1(c.osmKm)+"km  →  차이 "+sgn(d2)+"km ("+sgn(p2)+"%)",
    why:ok?(c.note?c.note+".":""):src+" 거리가 공식 안내보다 "+(d2<0?"짧습니다(일부 구간 누락·우회 가능).":"깁니다(우회·중복 구간 포함 가능).")+" 원인은 확인하지 못했습니다."};
}
function visible(c){return DS.chips[filterIdx][1](c)}
function renderRegions(){
  var el=document.getElementById("regions");el.innerHTML="";
  REGIONS.forEach(function(r){
    var b=document.createElement("button"),has=!!DSET[r[0]];
    b.className="reg"+(r[0]===region?" on":"")+(has?"":" soon");b.textContent=r[0];
    b.onclick=function(){setRegion(r[0])};el.appendChild(b);
  });
}
function renderChips(){
  var el=document.getElementById("chips");el.innerHTML="";
  if(!DS){return;}
  DS.chips.forEach(function(ch,i){
    var b=document.createElement("button");b.className="chip"+(i===filterIdx?" on":"");b.textContent=ch[0];
    b.onclick=function(){filterIdx=i;sel=null;renderChips();renderAll();};el.appendChild(b);
  });
}
function renderProgress(){
  var el=document.getElementById("progress");
  if(!DS){el.textContent="";return;}
  var km=0,n=0;courses().forEach(function(c){if(done[c.no]){km+=c.km;n++;}});
  el.textContent=DS.title+" 완주 "+n+"/"+courses().length+"코스 · 누적 "+km.toFixed(1)+" / "+f1(DS.d.officialTotalKm)+"km (공식거리 기준, 구간 중복 제외)";
}
function noticeHtml(c){
  if(!c.notices||!c.notices.length) return "";
  return '<div class="cmpbox est"><b>우회·통제 공지 '+c.notices.length+'건</b><br>'+c.notices.map(function(t){return "· "+t}).join("<br>")+'<br><span class="why">표시된 노선에는 우회가 반영되지 않았을 수 있습니다. 출발 전 경기둘레길 누리집 공지를 확인하세요.</span></div>';
}
function renderDetail(){
  var el=document.getElementById("detail");
  if(!DS||!sel){el.style.display="none";el.innerHTML="";return;}
  var c=course(sel),o=accOf(c),a=o.m,tot=a[0]+a[1]+c.min,k=cmp(c),sd=DS.id==="gyeonggi"?c.dist:null;
  el.style.display="block";
  var over=c.km>20?'<span class="why">⚠ 코스 '+c.km+'km — 하루 상한 20km 초과: 구간 분할 또는 숙박형으로 나눠야 합니다.</span>':"코스 "+c.km+"km로 하루 상한 20km 이내";
  el.innerHTML='<div class="dt"><span class="dot" style="background:'+col(c.no)+'">'+c.no+'</span> '+c.no+'코스 '+c.name+' <span class="tag">'+c.level+'</span> <span class="x" id="dclose">닫기 ✕</span></div>'+
   '<ol class="route">'+
   '<li><b>수서역 출발</b> → '+c.start+' 도착 <span class="m">약 '+a[0]+'분 ('+(o.real[0]?"실측":"개략 추정")+')'+(sd?" · 직선 "+sd[0]+"km":"")+'</span></li>'+
   '<li><b>'+c.no+'코스 출발</b> '+c.start+' → <b>'+c.no+'코스 도착</b> '+c.end+' <span class="m">'+c.km+'km · 걷기 '+hm(c.min)+'</span></li>'+
   '<li>'+c.end+' 출발 → <b>수서역 도착</b> <span class="m">약 '+a[1]+'분 ('+(o.real[1]?"실측":"개략 추정")+')'+(sd?" · 직선 "+sd[1]+"km":"")+'</span></li></ol>'+
   '<div class="sum">하루 합계 약 '+hm(tot)+' (이동 '+(a[0]+a[1])+'분 + 걷기 '+hm(c.min)+') · '+over+'</div>'+
   '<div class="cmpbox est"><b>대중교통 이동시간 (ODsay 길찾기)</b><br>수서역 → 출발: '+legText(c,0)+'<br>도착 → 수서역: '+legText(c,1)+
   '<br><button class="chip" id="accone" style="margin-top:6px">이 코스 길찾기 API로 확인</button>'+
   '<div class="why">ODsay 결과는 조회한 시각의 시간표 기준이라 요일·시간대에 따라 달라질 수 있습니다. 대중교통 경로가 없으면 택시·자가용 이동이 필요합니다.</div></div>'+
   '<div class="cmpbox '+k.cls+'"><b>거리 대조 · '+k.badge+'</b><br>'+k.text+(k.why?'<br><span class="why">'+k.why+'</span>':'')+'</div>'+noticeHtml(c);
  document.getElementById("dclose").onclick=function(){sel=null;renderAll();};
  var ob=document.getElementById("accone");if(ob)ob.onclick=function(){runLegs([c],true)};
}
function renderList(){
  var el=document.getElementById("list");el.innerHTML="";
  if(!DS){
    el.innerHTML='<div class="empty"><b>'+region+'</b> 지역은 자료 준비 중입니다.<br>공식 노선 자료를 확인한 뒤 순차적으로 추가합니다.<br>확인되지 않은 코스를 임의로 채우지 않습니다.</div>';
    document.getElementById("count").textContent="";return;
  }
  var cnt=0;
  courses().forEach(function(c){
    if(!visible(c)) return; cnt++;
    var k=cmp(c),d=document.createElement("div");d.className="card"+(sel===c.no?" sel":"");
    var extra="";
    if(c.km>20) extra+='<span class="tag warn">20km 초과 · 분할 필요</span> ';
    if(c.notices&&c.notices.length) extra+='<span class="tag est">우회 공지 '+c.notices.length+'건</span> ';
    d.innerHTML='<div class="num" style="background:'+col(c.no)+'">'+(done[c.no]?"✓":c.no)+'</div><div class="info"><div class="nm">'+c.no+'코스 '+c.name+' <span class="tag">'+c.level+'</span></div>'+
      '<div class="sub"><b>출발</b> '+c.start+' → <b>도착</b> '+c.end+'</div><div class="sub">공식 '+f1(c.km)+'km · 걷기 '+hm(c.min)+'</div>'+
      '<div class="cmpline '+k.cls+'">'+k.text+'</div>'+
      '<div class="sub">수서역→출발 약 '+accOf(c).m[0]+'분 · 도착→수서역 약 '+accOf(c).m[1]+'분 ('+accLabel(accOf(c))+')</div>'+
      '<div style="margin-top:4px"><span class="tag '+k.cls+'">'+k.badge+'</span> '+extra+'</div></div>';
    d.querySelector(".info").onclick=function(){selectCourse(c.no)};
    d.querySelector(".num").onclick=function(){selectCourse(c.no)};
    var b=document.createElement("button");b.className="done"+(done[c.no]?" on":"");b.textContent=done[c.no]?"완주":"걸었음";
    b.onclick=function(e){e.stopPropagation();if(done[c.no])delete done[c.no];else done[c.no]=1;save();renderAll();};
    d.appendChild(b);el.appendChild(d);
  });
  document.getElementById("count").textContent="("+cnt+"개)";
}
function renderCompare(){
  var el=document.getElementById("compare"),btn=document.getElementById("cmpbtn");
  btn.style.display=DS?"inline-block":"none";
  btn.className="chip"+(showCmp?" on":"");
  if(!DS||!showCmp){el.style.display="none";el.innerHTML="";return;}
  var rows="",n={ok:0,warn:0,approx:0,mismatch:0,none:0};
  var list=courses().filter(function(c){return !(DS.id==="seoul"&&c.no===3)});
  list.forEach(function(c){
    var k=cmp(c);n[k.kind]=(n[k.kind]||0)+1;
    var lab=(DS.id==="seoul"&&c.no===2)?"2+3코스(합산)":(c.no+"코스 "+c.name);
    rows+='<tr class="'+k.cls+'" data-no="'+c.no+'"><td>'+lab+'</td><td>'+f1(k.off!=null?k.off:c.km)+'</td><td>'+(k.map!=null?f1(k.map):"-")+'</td><td>'+(k.diff!=null?sgn(f1(k.diff)*1===0?0:f1(k.diff))+" ("+sgn(k.pct)+"%)":"-")+'</td><td>'+k.badge+'</td></tr>';
  });
  el.style.display="block";
  el.innerHTML='<div class="cmphead">공식 거리 vs 지도 거리 대조 <span class="x" id="cmpclose">닫기 ✕</span></div>'+
   '<div class="cmpsum">판정 기준: 차이 ±'+TH+'% 이내면 일치 · 일치 '+n.ok+' / 확인필요 '+n.warn+' / 근사선 '+n.approx+' / 노선 불일치 '+n.mismatch+'</div>'+
   '<table class="cmp"><thead><tr><th>코스</th><th>공식 km</th><th>지도 km</th><th>차이</th><th>판정</th></tr></thead><tbody>'+rows+'</tbody></table>'+
   '<div class="cmpnote">· 공식: '+(DS.id==="seoul"?"서울둘레길 누리집·숲나들e 안내거리 / 지도: OpenStreetMap 경로를 직접 합산한 거리":"경기둘레길 누리집 안내거리 / 지도: 같은 누리집의 노선 좌표를 직접 합산한 거리")+(DS.id==="seoul"?"<br>· 2·3코스는 지도 자료가 구 노선이라 개별 비교가 불가능해 합산으로만 비교합니다.<br>· 14코스는 직접 그린 근사선이라 길이가 비슷해도 검증된 경로가 아닙니다.":"")+'</div>';
  document.getElementById("cmpclose").onclick=function(){showCmp=false;renderCompare();};
  Array.prototype.forEach.call(el.querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){selectCourse(+tr.getAttribute("data-no"))};});
}
function latlngs(p){return p.map(function(x){return{lat:x[0],lng:x[1]}})}
function dashed(path,color,opacity,scale,rep){
  var l=new google.maps.Polyline({map:map,path:latlngs(path),strokeColor:color,strokeOpacity:0,zIndex:1,
    icons:[{icon:{path:"M 0,-1 0,1",strokeOpacity:opacity,strokeColor:color,scale:scale},offset:"0",repeat:rep||"12px"}]});
  lines.push(l);return l;
}
function clearLabels(){labels.forEach(function(l){l.setMap(null)});labels=[];}
function clearMap(){
  lines.forEach(function(l){l.setMap(null)});lines=[];
  flagMarkers.forEach(function(m){m.setMap(null)});flagMarkers=[];
  clearLabels();
}
function flagVisible(f){
  if(f.base) return true;
  var a=course(f.arrive),d=course(f.depart);
  return (a&&visible(a))||(d&&visible(d));
}
function dist(a,b){var R=6371008.8,r=Math.PI/180,x=Math.sin((b[0]-a[0])*r/2),y=Math.sin((b[1]-a[1])*r/2);var h=x*x+Math.cos(a[0]*r)*Math.cos(b[0]*r)*y*y;return 2*R*Math.asin(Math.sqrt(h));}
function startPos(no){var f=flags().filter(function(x){return x.depart===no&&x.pos})[0];return f?f.pos:null}
function endPos(no){var f=flags().filter(function(x){return x.arrive===no&&x.pos})[0];return f?f.pos:null}
function drawAll(){
  if(!map) return; clearMap();
  if(!DS) return;
  courses().forEach(function(c){
    if(!visible(c)||!c.path) return;
    var isSel=sel===c.no,dim=(sel&&!isSel),cc=DS.color(c),w=DS.id==="gyeonggi"?4:5;
    if(done[c.no]){lines.push(new google.maps.Polyline({map:map,path:latlngs(c.path),strokeColor:"#000",strokeOpacity:dim?0.15:0.4,strokeWeight:(isSel?8:w)+5,zIndex:0}));}
    var l;
    if(c.approx){l=dashed(c.path,cc,dim?0.35:0.95,isSel?4:3,"11px");}
    else{l=new google.maps.Polyline({map:map,path:latlngs(c.path),strokeColor:cc,strokeOpacity:dim?0.3:0.95,strokeWeight:isSel?8:w,zIndex:isSel?10:1});lines.push(l);}
    l.addListener("click",function(){selectCourse(c.no)});
  });
  var cb=DS.d.combined23;
  if(cb&&courses().some(function(c){return visible(c)&&is23(c.no)})){var on=is23(sel);dashed(cb.path,"#666",on?1:0.8,on?4:3,"12px");}
  if(sel&&base){
    var cc2=col(sel),s=startPos(sel),e=endPos(sel);
    if(s&&dist(base,s)>150) dashed([base,s],cc2,0.9,2,"7px");
    if(e&&dist(base,e)>150) dashed([e,base],cc2,0.9,2,"7px");
  }
  flags().forEach(function(f){
    if(!f.pos||!flagVisible(f)) return;
    var relevant=!sel||f.base||f.arrive===sel||f.depart===sel;
    var m=new google.maps.Marker({map:map,position:{lat:f.pos[0],lng:f.pos[1]},title:f.name,icon:flagSvg(f.base?"#e8590c":col(f.depart),!!f.base),zIndex:f.base?100:50,opacity:relevant?(f.approx?0.7:1):0.4});
    m.addListener("click",function(){info.setContent(bubbleHtml(f,false));info.open(map,m)});
    flagMarkers.push(m);
  });
  drawLabels();
}
function chip(no,txt,strong){return '<div class="bl'+(strong?" st":"")+'"><i style="background:'+col(no)+'"></i>'+(strong?"▶ ":"")+no+'코스 '+txt+'</div>';}
function bubbleHtml(f,compact){
  if(f.base&&!f.arrive) return '<div class="bt">'+f.name+' · 출발·귀환 기준</div>';
  if(compact) return '<div class="bl cp"><i style="background:'+col(f.arrive)+'"></i>'+f.arrive+'코스 도착<br><i style="background:'+col(f.depart)+'"></i>'+f.depart+'코스 출발</div>';
  var h='<div class="bt">'+f.name+(f.base?" · 출발·귀환 기준":"")+'</div>';
  var A=chip(f.arrive,"도착",sel===f.arrive),D=chip(f.depart,"출발",sel===f.depart);
  h+=(sel===f.depart)?(D+A):(A+D);
  if(f.note) h+='<div class="bn">'+f.note+'</div>';
  return h;
}
function drawLabels(){
  clearLabels();
  if(!map||!Label||!DS) return;
  var z=map.getZoom(),compact=(!sel&&z<12);
  flags().forEach(function(f){
    if(!f.pos||!flagVisible(f)) return;
    var rel=!sel||f.base||f.arrive===sel||f.depart===sel;
    if(!rel) return;
    if(!f.base&&!sel&&z<DS.minZ) return;
    var full=f.base||!compact;
    var l=new Label(f.pos,bubbleHtml(f,!full),f.base?"#e8590c":col(sel&&f.arrive===sel?f.arrive:f.depart),f.base?-46:-36);
    l.setMap(map);labels.push(l);
  });
  var cb=DS.d.combined23;
  if(cb&&courses().some(function(c){return visible(c)&&is23(c.no)})){
    var m=cb.path[Math.floor(cb.path.length/2)],d=+(cb.osmKm-cb.officialKm).toFixed(1),p=Math.round(d/cb.officialKm*100);
    var lr=new Label(m,'<div class="bt">2·3코스 통합 참고선 (구 노선)</div><div class="bl">지도 '+f1(cb.osmKm)+'km vs 공식 합 '+f1(cb.officialKm)+'km</div><div class="bl st">차이 '+sgn(d)+'km ('+sgn(p)+'%) · 실제 노선 아님</div>',"#666",-14);
    lr.setMap(map);labels.push(lr);
  }
  if(sel&&base){
    var c=course(sel),oo=accOf(c),a=oo.m,s=startPos(sel),e=endPos(sel);
    function mid(p,q){return [(p[0]+q[0])/2,(p[1]+q[1])/2]}
    if(s&&dist(base,s)>150){var l1=new Label(mid(base,s),'<div class="bl">수서역 → '+c.no+'코스 출발<br>약 '+a[0]+'분('+(oo.real[0]?"실측":"추정")+'·직선 표시)</div>',DS.color(c),0,true);l1.setMap(map);labels.push(l1);}
    if(e&&dist(base,e)>150){var l2=new Label(mid(base,e),'<div class="bl">'+c.no+'코스 도착 → 수서역<br>약 '+a[1]+'분('+(oo.real[1]?"실측":"추정")+'·직선 표시)</div>',DS.color(c),0,true);l2.setMap(map);labels.push(l2);}
  }
}
function fit(points){
  var b=new google.maps.LatLngBounds();points.forEach(function(p){b.extend({lat:p[0],lng:p[1]})});map.fitBounds(b,60);
}
function fitAll(){
  var all=[];courses().forEach(function(c){if(c.path&&visible(c))all=all.concat(c.path)});
  if(DS.d.combined23)all=all.concat(DS.d.combined23.path);
  if(base)all.push(base);
  if(all.length)fit(all);
}
function selectCourse(no){
  sel=no;renderAll();
  var c=course(no),pts=[];
  if(c.path)pts=c.path.slice();else if(is23(no)&&DS.d.combined23)pts=DS.d.combined23.path.slice();
  var s=startPos(no),e=endPos(no);
  if(s)pts.push(s);if(e)pts.push(e);if(base&&(s||e))pts.push(base);
  if(pts.length)fit(pts);
}
function renderAll(){renderRegions();renderList();renderProgress();renderCompare();renderDetail();drawAll();}
function setRegion(r){
  region=r;DS=DSET[r]||null;sel=null;filterIdx=0;showCmp=false;
  loadDone();
  var bf=DS?flags().filter(function(f){return f.base})[0]:null;base=bf?bf.pos:null;
  document.getElementById("legend").innerHTML=DS?DS.legend:"";
  document.getElementById("foot").innerHTML=DS?DS.foot:"";
  renderChips();renderAll();
  if(map){
    if(DS) fitAll();
    else{var cfg=REGIONS.filter(function(x){return x[0]===r})[0][1];map.setCenter({lat:cfg.c[0],lng:cfg.c[1]});map.setZoom(cfg.z);}
  }
  var sh=document.getElementById("sheet");if(sh)sh.scrollTop=0;
}
function defineLabel(){
  function L(pos,html,color,offY,mid){google.maps.OverlayView.call(this);this.pos=pos;this.html=html;this.color=color;this.offY=offY||0;this.mid=!!mid;this.div=null;}
  L.prototype=Object.create(google.maps.OverlayView.prototype);
  L.prototype.onAdd=function(){var d=document.createElement("div");d.className="bub"+(this.mid?" mid":"");d.style.borderColor=this.color;d.innerHTML=this.html;this.div=d;this.getPanes().floatPane.appendChild(d);};
  L.prototype.draw=function(){if(!this.div)return;var p=this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(this.pos[0],this.pos[1]));if(!p)return;this.div.style.left=p.x+"px";this.div.style.top=(p.y+this.offY)+"px";};
  L.prototype.onRemove=function(){if(this.div&&this.div.parentNode)this.div.parentNode.removeChild(this.div);this.div=null;};
  return L;
}
window.initMap=function(){
  document.getElementById("maperr").style.display="none";
  map=new google.maps.Map(document.getElementById("map"),{center:{lat:37.55,lng:126.99},zoom:11,gestureHandling:"greedy",mapTypeControl:false,streetViewControl:false,fullscreenControl:false});
  info=new google.maps.InfoWindow();Label=defineLabel();
  map.addListener("zoom_changed",function(){drawLabels()});
  if(DS) fitAll();
  drawAll();
};
window.gm_authFailure=function(){var e=document.getElementById("maperr");e.style.display="flex";e.textContent="지도 인증 실패 — 구글맵 키의 허용 주소(yjjn2005.github.io)에서 열어야 합니다.";};
function loadMaps(){
  var k=window.GOOGLE_MAPS_API_KEY;
  if(!k){document.getElementById("maperr").textContent="config.js에 구글맵 키가 없습니다.";return;}
  var s=document.createElement("script");s.async=true;
  s.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(k)+"&callback=initMap&loading=async&language=ko&region=KR";
  s.onerror=function(){document.getElementById("maperr").textContent="구글맵 스크립트를 불러오지 못했습니다(네트워크 확인).";};
  document.head.appendChild(s);
}
document.getElementById("accbtn").onclick=function(){if(!DS)return;runLegs(courses().filter(visible),false)};
document.getElementById("cmpbtn").onclick=function(){showCmp=!showCmp;renderCompare();if(showCmp)document.getElementById("sheet").scrollTop=0;};
setRegion("서울");
loadMaps();
})();
