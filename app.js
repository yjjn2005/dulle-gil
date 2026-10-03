(function(){
var T=window.TRAIL_DATA, COLORS={"초급":"#2e9e5b","중급":"#f08a00","상급":"#d93636"};
var map,lines={},flagMarkers=[],info,sel=null,filter="전체",done={};
var NEAR=[7,8,9,10]; // 수서역 인접 코스(8·9 직접, 7·10 연속)
try{done=JSON.parse(localStorage.getItem("dulle_done")||"{}")}catch(e){done={}}
function save(){try{localStorage.setItem("dulle_done",JSON.stringify(done))}catch(e){}}
function flagSvg(color,big){
  var w=big?34:26,h=big?44:34;
  var s='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 26 34"><rect x="3" y="2" width="2.6" height="31" rx="1" fill="#333"/><path d="M5.6 3 L23 8.5 L5.6 15 Z" fill="'+color+'" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  return {url:"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(s),scaledSize:new google.maps.Size(w,h),anchor:new google.maps.Point(4,h-1)};
}
function status(c){
  if(!c.path) return c.no<=3?{t:"통합선(분할 미확정)",cls:"est"}:{t:"자료 준비 중",cls:"warn"};
  return c.status==="일치"?{t:"지도·공식 거리 일치",cls:"ok"}:{t:"거리 차이 확인필요",cls:"warn"};
}
function distText(c){
  var s="공식 "+c.km+"km · "+Math.floor(c.min/60)+"시간"+(c.min%60?(" "+c.min%60+"분"):"");
  if(c.osmKm) s+=" · 지도 "+c.osmKm+"km";
  return s;
}
function visible(c){
  if(filter==="전체") return true;
  if(filter==="수서역 근처") return NEAR.indexOf(c.no)>=0;
  return c.level===filter;
}
function renderChips(){
  var el=document.getElementById("chips");el.innerHTML="";
  ["전체","수서역 근처","초급","중급","상급"].forEach(function(n){
    var b=document.createElement("button");b.className="chip"+(n===filter?" on":"");b.textContent=n;
    b.onclick=function(){filter=n;sel=null;renderChips();renderList();drawAll();};el.appendChild(b);
  });
}
function renderProgress(){
  var km=0,n=0;T.courses.forEach(function(c){if(done[c.no]){km+=c.km;n++;}});
  document.getElementById("progress").textContent="완주 "+n+"/21코스 · 누적 "+km.toFixed(1)+" / "+T.officialTotalKm+"km (공식거리 기준, 구간 중복 제외)";
}
function renderList(){
  var el=document.getElementById("list");el.innerHTML="";var cnt=0;
  T.courses.forEach(function(c){
    if(!visible(c)) return; cnt++;
    var st=status(c),d=document.createElement("div");d.className="card"+(sel===c.no?" sel":"");
    d.innerHTML='<div class="num" style="background:'+COLORS[c.level]+'">'+c.no+'</div><div class="info"><div class="nm">'+c.name+' <span class="tag">'+c.level+'</span></div>'+
      '<div class="sub">'+c.start+' → '+c.end+'</div><div class="sub">'+distText(c)+'</div>'+
      '<div class="sub">수서역 이동 약 '+c.accessMin[0]+'분 + 귀가 '+c.accessMin[1]+'분 (추정)</div>'+
      '<div style="margin-top:4px"><span class="tag '+st.cls+'">'+st.t+'</span></div></div>';
    d.querySelector(".info").onclick=function(){selectCourse(c.no)};
    d.querySelector(".num").onclick=function(){selectCourse(c.no)};
    var b=document.createElement("button");b.className="done"+(done[c.no]?" on":"");b.textContent=done[c.no]?"완주":"걸었음";
    b.onclick=function(e){e.stopPropagation();if(done[c.no])delete done[c.no];else done[c.no]=1;save();renderProgress();renderList();drawAll();};
    d.appendChild(b);el.appendChild(d);
  });
  document.getElementById("count").textContent="("+cnt+"개)";
}
function clearMap(){Object.keys(lines).forEach(function(k){lines[k].setMap(null)});lines={};flagMarkers.forEach(function(m){m.setMap(null)});flagMarkers=[];}
function drawAll(){
  if(!map) return; clearMap();
  T.courses.forEach(function(c){
    if(!visible(c)||!c.path) return;
    var isSel=sel===c.no,col=done[c.no]?"#7a3fb0":COLORS[c.level];
    lines[c.no]=new google.maps.Polyline({map:map,path:c.path.map(function(p){return{lat:p[0],lng:p[1]}}),strokeColor:col,strokeOpacity:(sel&&!isSel)?0.35:0.95,strokeWeight:isSel?8:5,zIndex:isSel?10:1});
    lines[c.no].addListener("click",function(){selectCourse(c.no)});
  });
  var any=T.courses.some(function(c){return visible(c)&&c.no<=3});
  if(any&&filter!=="수서역 근처"){
    var b=T.combined123;
    lines[0]=new google.maps.Polyline({map:map,path:b.path.map(function(p){return{lat:p[0],lng:p[1]}}),strokeColor:"#888",strokeOpacity:0,zIndex:1,
      icons:[{icon:{path:"M 0,-1 0,1",strokeOpacity:1,strokeColor:"#666",scale:3},offset:"0",repeat:"12px"}]});
  }
  T.flags.forEach(function(f){
    if(!f.pos) return;
    var m=new google.maps.Marker({map:map,position:{lat:f.pos[0],lng:f.pos[1]},title:f.name,icon:flagSvg(f.base?"#e8590c":"#1f4e9c",!!f.base),zIndex:f.base?100:50,
      label:f.base?{text:"수서역",color:"#e8590c",fontWeight:"700",fontSize:"13px",className:"flaglabel"}:null});
    m.addListener("click",function(){info.setContent('<b>'+f.name+'</b><br>'+f.note);info.open(map,m)});
    flagMarkers.push(m);
  });
}
function fit(points){
  var b=new google.maps.LatLngBounds();points.forEach(function(p){b.extend({lat:p[0],lng:p[1]})});map.fitBounds(b,40);
}
function selectCourse(no){
  sel=no;renderList();drawAll();
  var c=T.courses.filter(function(x){return x.no===no})[0];
  if(c.path)fit(c.path);else if(no<=3)fit(T.combined123.path);
  else{var a=T.flags.filter(function(f){return f.pos}).map(function(f){return f.pos});fit(a);}
}
window.initMap=function(){
  document.getElementById("maperr").style.display="none";
  map=new google.maps.Map(document.getElementById("map"),{center:{lat:37.55,lng:126.99},zoom:11,gestureHandling:"greedy",mapTypeControl:false,streetViewControl:false,fullscreenControl:false});
  info=new google.maps.InfoWindow();
  var all=[];T.courses.forEach(function(c){if(c.path)all=all.concat(c.path)});all=all.concat(T.combined123.path);fit(all);
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
document.getElementById("foot").innerHTML="경로: OpenStreetMap 기여자(ODbL) · 거리·난이도: 서울둘레길 누리집·숲나들e · 수서역 이동시간은 지하철 노선 기준 추정치(±15분).<br>자료 없음: 1·2·3코스 개별 선(통합선만 표시), 14코스 선. 미확인 위치: "+T.unknown.join(", ")+".";
renderChips();renderList();renderProgress();loadMaps();
})();
