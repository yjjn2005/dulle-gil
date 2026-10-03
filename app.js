(function(){
var T=window.TRAIL_DATA;
// 코스별 고유 색상(인접 코스끼리 구분되도록 배치)
var PAL=["#e6194b","#2e9e5b","#4363d8","#f58231","#911eb4","#008b8b","#9a6324","#d81b9b","#8b0000","#6b8e23","#1f3a93","#e08a00","#00a3a3","#7b1fa2","#c2185b","#2e7d32","#5d4037","#0277bd","#ef6c00","#6a1b9a","#455a64"];
function col(no){return PAL[(no-1)%PAL.length]}
var map,lines=[],flagMarkers=[],labels=[],info,sel=null,filter="전체",done={},Label=null,base=null;
var NEAR=[7,8,9,10];
try{done=JSON.parse(localStorage.getItem("dulle_done")||"{}")}catch(e){done={}}
function save(){try{localStorage.setItem("dulle_done",JSON.stringify(done))}catch(e){}}
function is23(no){return no===2||no===3}
function course(no){return T.courses.filter(function(x){return x.no===no})[0]}
function hm(m){return Math.floor(m/60)+"시간"+(m%60?(" "+m%60+"분"):"")}
function flagSvg(color,big){
  var w=big?34:26,h=big?44:34;
  var s='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 26 34"><rect x="3" y="2" width="2.6" height="31" rx="1" fill="#333"/><path d="M5.6 3 L23 8.5 L5.6 15 Z" fill="'+color+'" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  return {url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(s),scaledSize:new google.maps.Size(w,h),anchor:new google.maps.Point(4,h-1)};
}
var TH=7; // 일치 판정 기준(±%)
function f1(n){return Number(n).toFixed(1)}
function sgn(n){return (n>0?"+":(n<0?"−":""))+Math.abs(n)}
function cmp(c){
  if(is23(c.no)&&T.combined23){
    var b=T.combined23,d=+(b.osmKm-b.officialKm).toFixed(1),p=Math.round(d/b.officialKm*100);
    return {kind:"mismatch",cls:"warn",off:b.officialKm,map:b.osmKm,diff:d,pct:p,scope:"2·3코스 합산",
      badge:"노선 불일치 · 참고선만 표시",
      text:"공식 2코스+3코스 합 "+f1(b.officialKm)+"km  vs  지도(구 노선) "+f1(b.osmKm)+"km  →  차이 "+sgn(d)+"km ("+sgn(p)+"%)",
      why:"지도 자료가 서울둘레길 개편(2024년) 이전 노선이라 새 2·3코스와 노선이 다른 것으로 추정됩니다(원인 미확인). 회색 점선은 위치 참고용이며 실제 코스가 아닙니다."};
  }
  if(c.osmKm==null) return {kind:"none",cls:"warn",badge:"지도 경로 없음",text:"공식 "+c.km+"km · 지도 경로 자료 준비 중",why:""};
  var d2=+(c.osmKm-c.km).toFixed(1),p2=Math.round(d2/c.km*100);
  if(c.approx) return {kind:"approx",cls:"est",off:c.km,map:c.osmKm,diff:d2,pct:p2,scope:"",badge:"근사선 · 길이만 비교(검증 아님)",
      text:"공식 "+f1(c.km)+"km  vs  근사선 "+f1(c.osmKm)+"km  →  차이 "+sgn(d2)+"km ("+sgn(p2)+"%)",
      why:"안양천 중심선을 따라 그린 근사선이라 실제 둘레길 위치·길이와 다를 수 있습니다."};
  var ok=Math.abs(p2)<=TH;
  return {kind:ok?"ok":"warn",cls:ok?"ok":"warn",off:c.km,map:c.osmKm,diff:d2,pct:p2,scope:"",
      badge:ok?"일치 (±"+TH+"% 이내)":"거리 차이 확인필요 (±"+TH+"% 초과)",
      text:"공식 "+f1(c.km)+"km  vs  지도 "+f1(c.osmKm)+"km  →  차이 "+sgn(d2)+"km ("+sgn(p2)+"%)",
      why:ok?(c.note?c.note+".":""):"지도 경로가 공식 코스보다 "+(d2<0?"짧습니다(일부 구간 누락 가능).":"깁니다(우회·중복 구간 포함 가능).")+" 원인은 확인하지 못했습니다."};
}
function status(c){var k=cmp(c);return {t:k.badge,cls:k.cls}}
function distText(c){return "공식 "+c.km+"km · 걷기 "+hm(c.min)}
function visible(c){
  if(filter==="전체") return true;
  if(filter==="수서역 근처") return NEAR.indexOf(c.no)>=0;
  return c.level===filter;
}
function renderChips(){
  var el=document.getElementById("chips");el.innerHTML="";
  ["전체","수서역 근처","초급","중급","상급"].forEach(function(n){
    var b=document.createElement("button");b.className="chip"+(n===filter?" on":"");b.textContent=n;
    b.onclick=function(){filter=n;sel=null;renderChips();renderAll();};el.appendChild(b);
  });
}
function renderProgress(){
  var km=0,n=0;T.courses.forEach(function(c){if(done[c.no]){km+=c.km;n++;}});
  document.getElementById("progress").textContent="완주 "+n+"/21코스 · 누적 "+km.toFixed(1)+" / "+T.officialTotalKm+"km (공식거리 기준, 구간 중복 제외)";
}
// 수서역 기준 하루 동선 요약
function renderDetail(){
  var el=document.getElementById("detail");
  if(!sel){el.style.display="none";el.innerHTML="";return;}
  var c=course(sel),a=c.accessMin,tot=a[0]+a[1]+c.min,k=cmp(c);
  el.style.display="block";
  el.innerHTML='<div class="dt"><span class="dot" style="background:'+col(c.no)+'">'+c.no+'</span> '+c.name+' <span class="tag">'+c.level+'</span> <span class="x" id="dclose">닫기 ✕</span></div>'+
   '<ol class="route">'+
   '<li><b>수서역 출발</b> → '+c.start+' 도착 <span class="m">약 '+a[0]+'분(추정)</span></li>'+
   '<li><b>'+c.no+'코스 출발</b> '+c.start+' → <b>'+c.no+'코스 도착</b> '+c.end+' <span class="m">'+c.km+'km · 걷기 '+hm(c.min)+'</span></li>'+
   '<li>'+c.end+' 출발 → <b>수서역 도착</b> <span class="m">약 '+a[1]+'분(추정)</span></li></ol>'+
   '<div class="sum">하루 합계 약 '+hm(tot)+' (이동 '+(a[0]+a[1])+'분 + 걷기 '+hm(c.min)+') · 코스 '+c.km+'km로 하루 상한 20km 이내</div>'+
   '<div class="cmpbox '+k.cls+'"><b>거리 대조 · '+k.badge+'</b><br>'+k.text+(k.why?'<br><span class="why">'+k.why+'</span>':'')+'</div>';
  document.getElementById("dclose").onclick=function(){sel=null;renderAll();};
}
function renderList(){
  var el=document.getElementById("list");el.innerHTML="";var cnt=0;
  T.courses.forEach(function(c){
    if(!visible(c)) return; cnt++;
    var k=cmp(c),d=document.createElement("div");d.className="card"+(sel===c.no?" sel":"");
    d.innerHTML='<div class="num" style="background:'+col(c.no)+'">'+(done[c.no]?"✓":c.no)+'</div><div class="info"><div class="nm">'+c.no+'코스 '+c.name+' <span class="tag">'+c.level+'</span></div>'+
      '<div class="sub"><b>출발</b> '+c.start+' → <b>도착</b> '+c.end+'</div><div class="sub">'+distText(c)+'</div>'+
      '<div class="cmpline '+k.cls+'">'+(k.scope?k.scope+" · ":"")+k.text+'</div>'+
      '<div class="sub">수서역→출발 약 '+c.accessMin[0]+'분 · 도착→수서역 약 '+c.accessMin[1]+'분 (추정)</div>'+
      '<div style="margin-top:4px"><span class="tag '+k.cls+'">'+k.badge+'</span></div></div>';
    d.querySelector(".info").onclick=function(){selectCourse(c.no)};
    d.querySelector(".num").onclick=function(){selectCourse(c.no)};
    var b=document.createElement("button");b.className="done"+(done[c.no]?" on":"");b.textContent=done[c.no]?"완주":"걸었음";
    b.onclick=function(e){e.stopPropagation();if(done[c.no])delete done[c.no];else done[c.no]=1;save();renderAll();};
    d.appendChild(b);el.appendChild(d);
  });
  document.getElementById("count").textContent="("+cnt+"개)";
}
// 거리 대조표
var showCmp=false;
function renderCompare(){
  var el=document.getElementById("compare");
  document.getElementById("cmpbtn").className="chip"+(showCmp?" on":"");
  if(!showCmp){el.style.display="none";el.innerHTML="";return;}
  var rows="",n={ok:0,warn:0,approx:0,mismatch:0,none:0};
  var list=T.courses.filter(function(c){return c.no!==3});
  list.forEach(function(c){
    var k=cmp(c);n[k.kind]=(n[k.kind]||0)+1;
    var lab=c.no===2?"2+3코스(합산)":(c.no+"코스 "+c.name);
    rows+='<tr class="'+k.cls+'" data-no="'+c.no+'"><td>'+lab+'</td><td>'+f1(k.off!=null?k.off:c.km)+'</td><td>'+(k.map!=null?f1(k.map):"-")+'</td><td>'+(k.diff!=null?sgn(f1(k.diff)*1===0?0:f1(k.diff))+" ("+sgn(k.pct)+"%)":"-")+'</td><td>'+k.badge+'</td></tr>';
  });
  el.style.display="block";
  el.innerHTML='<div class="cmphead">공식 거리 vs 지도 거리 대조 <span class="x" id="cmpclose">닫기 ✕</span></div>'+
   '<div class="cmpsum">판정 기준: 차이 ±'+TH+'% 이내면 일치 · 일치 '+n.ok+' / 확인필요 '+n.warn+' / 근사선 '+n.approx+' / 노선 불일치 '+n.mismatch+'</div>'+
   '<table class="cmp"><thead><tr><th>코스</th><th>공식 km</th><th>지도 km</th><th>차이</th><th>판정</th></tr></thead><tbody>'+rows+'</tbody></table>'+
   '<div class="cmpnote">· 공식: 서울둘레길 누리집·숲나들e 안내거리 / 지도: OpenStreetMap 경로를 직접 합산한 거리<br>· 2·3코스는 지도 자료가 구 노선이라 개별 비교가 불가능해 합산으로만 비교합니다.<br>· 14코스는 직접 그린 근사선이라 길이가 비슷해도 검증된 경로가 아닙니다.</div>';
  document.getElementById("cmpclose").onclick=function(){showCmp=false;renderCompare();};
  Array.prototype.forEach.call(el.querySelectorAll("tbody tr"),function(tr){tr.onclick=function(){selectCourse(+tr.getAttribute("data-no"))};});
}
function latlngs(p){return p.map(function(x){return{lat:x[0],lng:x[1]}})}
function dashed(path,color,opacity,scale,rep){
  var l=new google.maps.Polyline({map:map,path:latlngs(path),strokeColor:color,strokeOpacity:0,zIndex:1,
    icons:[{icon:{path:"M 0,-1 0,1",strokeOpacity:opacity,strokeColor:color,scale:scale},offset:"0",repeat:rep||"12px"}]});
  lines.push(l);return l;
}
function clearMap(){
  lines.forEach(function(l){l.setMap(null)});lines=[];
  flagMarkers.forEach(function(m){m.setMap(null)});flagMarkers=[];
  clearLabels();
}
function clearLabels(){labels.forEach(function(l){l.setMap(null)});labels=[];}
function flagVisible(f){
  if(f.base) return true;
  var a=course(f.arrive),d=course(f.depart);
  return (a&&visible(a))||(d&&visible(d));
}
function drawAll(){
  if(!map) return; clearMap();
  T.courses.forEach(function(c){
    if(!visible(c)||!c.path) return;
    var isSel=sel===c.no,dim=(sel&&!isSel),cc=col(c.no);
    if(done[c.no]){lines.push(new google.maps.Polyline({map:map,path:latlngs(c.path),strokeColor:"#000",strokeOpacity:dim?0.15:0.4,strokeWeight:(isSel?8:5)+5,zIndex:0}));}
    var l;
    if(c.approx){l=dashed(c.path,cc,dim?0.35:0.95,isSel?4:3,"11px");}
    else{l=new google.maps.Polyline({map:map,path:latlngs(c.path),strokeColor:cc,strokeOpacity:dim?0.3:0.95,strokeWeight:isSel?8:5,zIndex:isSel?10:1});lines.push(l);}
    l.addListener("click",function(){selectCourse(c.no)});
  });
  if(T.courses.some(function(c){return visible(c)&&is23(c.no)})&&T.combined23){
    var on=is23(sel);dashed(T.combined23.path,"#666",on?1:0.8,on?4:3,"12px");
  }
  // 선택 코스: 수서역 ↔ 출발/도착 연결선(직선 표시)
  if(sel&&base){
    var c=course(sel),cc=col(sel),s=startPos(sel),e=endPos(sel);
    if(s&&dist(base,s)>150) dashed([base,s],cc,0.9,2,"7px");
    if(e&&dist(base,e)>150) dashed([e,base],cc,0.9,2,"7px");
  }
  T.flags.forEach(function(f){
    if(!f.pos||!flagVisible(f)) return;
    var relevant=!sel||f.base||f.arrive===sel||f.depart===sel;
    var m=new google.maps.Marker({map:map,position:{lat:f.pos[0],lng:f.pos[1]},title:f.name,icon:flagSvg(f.base?"#e8590c":col(f.depart),!!f.base),zIndex:f.base?100:50,opacity:relevant?(f.approx?0.7:1):0.4});
    m.addListener("click",function(){info.setContent(bubbleHtml(f,false));info.open(map,m)});
    flagMarkers.push(m);
  });
  drawLabels();
}
function dist(a,b){var R=6371008.8,r=Math.PI/180,x=Math.sin((b[0]-a[0])*r/2),y=Math.sin((b[1]-a[1])*r/2);var h=x*x+Math.cos(a[0]*r)*Math.cos(b[0]*r)*y*y;return 2*R*Math.asin(Math.sqrt(h));}
function startPos(no){var f=T.flags.filter(function(x){return x.depart===no&&x.pos})[0];return f?f.pos:null}
function endPos(no){var f=T.flags.filter(function(x){return x.arrive===no&&x.pos})[0];return f?f.pos:null}
function chip(no,txt,strong){return '<div class="bl'+(strong?" st":"")+'"><i style="background:'+col(no)+'"></i>'+(strong?"▶ ":"")+no+'코스 '+txt+'</div>';}
function bubbleHtml(f,compact){
  if(compact){return '<div class="bl cp"><i style="background:'+col(f.arrive)+'"></i>'+f.arrive+'코스 도착<br><i style="background:'+col(f.depart)+'"></i>'+f.depart+'코스 출발</div>';}
  var h='<div class="bt">'+f.name+(f.base?" · 출발·귀환 기준":"")+'</div>';
  var A=chip(f.arrive,"도착",sel===f.arrive),D=chip(f.depart,"출발",sel===f.depart);
  h+=(sel===f.depart)?(D+A):(A+D);
  if(f.note) h+='<div class="bn">'+f.note+'</div>';
  return h;
}
function drawLabels(){
  clearLabels();
  if(!map||!Label) return;
  var z=map.getZoom(),compact=(!sel&&z<12);
  T.flags.forEach(function(f){
    if(!f.pos||!flagVisible(f)) return;
    var rel=!sel||f.base||f.arrive===sel||f.depart===sel;
    if(!rel) return;
    var full=f.base||!compact;
    var l=new Label(f.pos,bubbleHtml(f,!full),f.base?"#e8590c":col(sel&&f.arrive===sel?f.arrive:f.depart),f.base?-46:-36);
    l.setMap(map);labels.push(l);
  });
  if(T.combined23&&T.courses.some(function(c){return visible(c)&&is23(c.no)})){
    var b=T.combined23,m=b.path[Math.floor(b.path.length/2)],d=+(b.osmKm-b.officialKm).toFixed(1),p=Math.round(d/b.officialKm*100);
    var lr=new Label(m,'<div class="bt">2·3코스 통합 참고선 (구 노선)</div><div class="bl">지도 '+f1(b.osmKm)+'km vs 공식 합 '+f1(b.officialKm)+'km</div><div class="bl st">차이 '+sgn(d)+'km ('+sgn(p)+'%) · 실제 노선 아님</div>',"#666",-14);
    lr.setMap(map);labels.push(lr);
  }
  if(sel&&base){ // 연결선 중간 말풍선(이동시간)
    var c=course(sel),a=c.accessMin,s=startPos(sel),e=endPos(sel);
    function mid(p,q){return [(p[0]+q[0])/2,(p[1]+q[1])/2]}
    if(s&&dist(base,s)>150){var l1=new Label(mid(base,s),'<div class="bl">수서역 → '+c.no+'코스 출발<br>약 '+a[0]+'분(추정·직선 표시)</div>',col(sel),0,true);l1.setMap(map);labels.push(l1);}
    if(e&&dist(base,e)>150){var l2=new Label(mid(base,e),'<div class="bl">'+c.no+'코스 도착 → 수서역<br>약 '+a[1]+'분(추정·직선 표시)</div>',col(sel),0,true);l2.setMap(map);labels.push(l2);}
  }
}
function fit(points){
  var b=new google.maps.LatLngBounds();points.forEach(function(p){b.extend({lat:p[0],lng:p[1]})});map.fitBounds(b,60);
}
function selectCourse(no){
  sel=no;renderAll();
  var c=course(no),pts=[];
  if(c.path)pts=c.path.slice();else if(is23(no)&&T.combined23)pts=T.combined23.path.slice();
  var s=startPos(no),e=endPos(no);
  if(s)pts.push(s);if(e)pts.push(e);if(base&&(s||e))pts.push(base);
  if(pts.length)fit(pts);
}
function renderAll(){renderList();renderProgress();renderCompare();renderDetail();drawAll();}
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
  var bf=T.flags.filter(function(f){return f.base})[0];base=bf?bf.pos:null;
  var all=[];T.courses.forEach(function(c){if(c.path)all=all.concat(c.path)});if(T.combined23)all=all.concat(T.combined23.path);fit(all);
  map.addListener("zoom_changed",function(){drawLabels()});
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
document.getElementById("foot").innerHTML="모든 일정은 수서역 출발·귀환 기준. 경로: OpenStreetMap 기여자(ODbL) · 거리·난이도: 서울둘레길 누리집·숲나들e · 수서역 이동시간은 지하철 노선 기준 추정치(±15분), 지도의 수서역 연결선은 직선 표시(실제 경로 아님).<br>2·3코스는 개별 경로 없이 구 노선 기준 통합 참고선만 표시(새 노선과 다름). 14코스는 안양천 중심선과 한강변을 이은 근사선. 근사 표시: 상계동 나들이철쭉동산(2·3코스 경계)은 공식 거리 비율로 추정한 위치. 거리 대조표에서 공식·지도 거리 차이를 확인할 수 있습니다. 미확인: "+T.unknown.join(", ")+".";
document.getElementById("cmpbtn").onclick=function(){showCmp=!showCmp;renderCompare();if(showCmp)document.getElementById("sheet").scrollTop=0;};
document.getElementById("legend").innerHTML='<span><b class="ln"></b> 실선: 지도 경로</span><span><b class="ln dash"></b> 색 점선: 근사선(14코스)</span><span><b class="ln dash gr"></b> 회색 점선: 2·3코스 구 노선 참고선(실제 아님)</span>';
renderChips();renderAll();loadMaps();
})();
