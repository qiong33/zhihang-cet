import {getDocument,GlobalWorkerOptions} from "./pdf.min.mjs";
GlobalWorkerOptions.workerSrc="/pdf.worker.min.mjs";
const el=id=>document.getElementById(id);
const catalog=await (await fetch("/papers.json")).json();
const ids=Object.keys(catalog);
const fields=["level","year","month","set"];
const params=new URLSearchParams(location.search);
const initial=Object.hasOwn(catalog,params.get("id"))?params.get("id"):null;
if(initial)el("level").value=initial[0];
if(params.get("kind")==="answer")el("kind").value="answer";
let key="",pageNumber=1,pageCount=1,doc=null,loadTask=null,generation=0,drawId=0;
function options(chosen){
  let matches=ids.filter(id=>id[0]===el("level").value);
  fields.slice(1).forEach((name,i)=>{
    const select=el(name),old=chosen?.[i+1]??select.value;
    const values=[...new Set(matches.map(id=>id.split("-")[i+1]))].sort((a,b)=>name==="set"?a-b:b-a);
    select.replaceChildren(...values.map(v=>new Option(name==="set"?"第 "+v+" 套":Number(v)+(name==="year"?" 年":" 月"),v)));
    if(values.includes(old))select.value=old;
    matches=matches.filter(id=>id.split("-")[i+1]===select.value);
  });
  key=matches[0];
}
function nav(){
  el("num").value=pageNumber;el("num").max=pageCount;el("total").textContent=pageCount;
  el("prev").disabled=pageNumber<=1;el("next").disabled=pageNumber>=pageCount;
  history.replaceState(null,"","?"+new URLSearchParams({id:key,kind:el("kind").value,page:pageNumber}));
}
function error(){el("status").textContent="原卷暂时无法显示，请重试或下载原始 PDF 阅读。";el("sheet").hidden=true}
async function draw(){
  if(!doc)return;
  const token=++drawId,sequence=generation;
  el("status").textContent="正在排版第 "+pageNumber+" 页…";
  try{
    const pdfPage=await doc.getPage(pageNumber);
    if(token!==drawId||sequence!==generation)return;
    const sheet=el("sheet");sheet.hidden=false;
    const pad=parseFloat(getComputedStyle(sheet).paddingLeft)*2;
    const width=Math.max(160,sheet.clientWidth-pad)*Number(el("zoom").value);
    const original=pdfPage.getViewport({scale:1});
    const view=pdfPage.getViewport({scale:width/original.width*Math.min(devicePixelRatio||1,2)});
    const canvas=document.createElement("canvas");
    canvas.width=Math.ceil(view.width);canvas.height=Math.ceil(view.height);canvas.style.width=width+"px";
    canvas.setAttribute("aria-label",document.title+"，第 "+pageNumber+" 页");
    await pdfPage.render({canvasContext:canvas.getContext("2d"),viewport:view}).promise;
    if(token!==drawId||sequence!==generation)return;
    sheet.replaceChildren(canvas);sheet.scrollLeft=0;el("status").textContent="";
  }catch(e){if(token===drawId&&sequence===generation)error()}
}
async function load(start=1){
  const seq=++generation;
  doc=null;const previous=loadTask;loadTask=null;
  if(previous)previous.destroy().catch(()=>{});
  const kind=el("kind").value;
  pageCount=catalog[key][kind==="answer"?1:0];pageNumber=Math.max(1,Math.min(pageCount,parseInt(start)||1));nav();
  const [level,year,month,set]=key.split("-");
  const title="英语"+(level==="4"?"四":"六")+"级"+year+"年"+Number(month)+"月第"+set+"套真题"+(kind==="answer"?"及答案解析":"")+"（整卷）";
  document.title=title+" · 整卷阅读";el("source").href="https://downloads.lazynote.cn/cet"+level+"/"+[year,month,set].join("-")+"/"+encodeURIComponent(title+".pdf");
  el("sheet").replaceChildren();el("sheet").hidden=false;el("status").textContent="正在打开"+title+"…";
  try{
    loadTask=getDocument({url:"/original/"+key+"-"+kind+".pdf",isEvalSupported:false,cMapUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",cMapPacked:true,standardFontDataUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/"});
    const loaded=await loadTask.promise;if(seq!==generation)return;
    doc=loaded;pageCount=doc.numPages;pageNumber=Math.min(pageNumber,pageCount);nav();await draw();
  }catch(e){if(seq===generation)error()}
}
function go(n){pageNumber=Math.max(1,Math.min(pageCount,parseInt(n)||1));nav();draw()}
for(const name of fields)el(name).onchange=()=>{options();load()};
el("kind").onchange=()=>load();el("zoom").onchange=draw;
el("prev").onclick=()=>go(pageNumber-1);el("next").onclick=()=>go(pageNumber+1);
el("jump").onsubmit=e=>{e.preventDefault();go(el("num").value)};
let timer;window.addEventListener("resize",()=>{clearTimeout(timer);timer=setTimeout(draw,150)});
options(initial?.split("-"));load(params.get("page"));

