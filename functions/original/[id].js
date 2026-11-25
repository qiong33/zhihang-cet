import catalog from "../../papers.json";
export async function onRequest({request,params}){
  const match=/^([46]-\d{4}-\d{2}-\d+)-(paper|answer)\.pdf$/.exec(params.id);
  if(!match || !Object.hasOwn(catalog,match[1]))return new Response("Unknown paper",{status:404});
  if(!["GET","HEAD"].includes(request.method))return new Response(null,{status:405});
  const [level,year,month,set]=match[1].split("-");
  const title="英语"+(level==="4"?"四":"六")+"级"+year+"年"+Number(month)+"月第"+set+"套真题"+(match[2]==="answer"?"及答案解析":"")+"（整卷）.pdf";
  const url="https://downloads.lazynote.cn/cet"+level+"/"+[year,month,set].join("-")+"/"+encodeURIComponent(title);
  const headers=new Headers();
  const range=request.headers.get("range");
  if(range)headers.set("Range",range);
  const source=await fetch(url,{method:request.method,headers});
  if(!source.ok)return new Response("Original PDF unavailable",{status:502});
  const out=new Headers({"Content-Type":"application/pdf","Content-Disposition":"inline; filename*=UTF-8''"+encodeURIComponent(title),"Cache-Control":"public, max-age=86400","X-Content-Type-Options":"nosniff"});
  for(const key of ["content-length","content-range","accept-ranges","etag","last-modified"])if(source.headers.has(key))out.set(key,source.headers.get(key));
  return new Response(source.body,{status:source.status,headers:out});
}
