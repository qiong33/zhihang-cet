const levelNames = ['四级','六级'];
function studyBank(param,query){
  const sentences = param === 'sentences';
  const level = query.level === '6' ? 1 : 0;
  const topic = Math.min(STUDY_TOPICS.length-1,Math.max(0,Number(query.topic)||0))|0;
  const base = '#/study/'+(sentences?'sentences':'words');
  const href=(lv,more='')=>base+'?level='+(lv?6:4)+more;
  const term=(query.q||'').trim().toLowerCase();
  const rows=STUDY_WORDS[level].filter(r=>!term||r[0].includes(term)||r[1].includes(term));
  const pages=Math.max(1,Math.ceil(rows.length/32));
  const page=Math.max(1,Math.min(pages,parseInt(query.page)||1));
  const suffix='&q='+encodeURIComponent(term);
  const tag=(active,url,label)=>'<a class="chip '+(active?'on':'')+'" href="'+esc(url)+'">'+esc(label)+'</a>';
  let content;
  if(sentences){
    const [labels,examples]=STUDY_TOPICS[topic];
    content='<div class="bank-tabs">'+STUDY_TOPICS.map(([h],i)=>tag(i===topic,href(level,'&topic='+i),h[0])).join('')+'</div><h2>'+labels[level+1]+'</h2>'+
    examples.slice(level*6,level*6+6).map(([en,zh])=>'<article class="card study-line"><p lang="en">'+esc(en)+'</p><details><summary>查看译文</summary><p>'+esc(zh)+'</p></details></article>').join('')+
    '<a class="btn btn-outline" href="#/sentence/s1">继续学习长难句拆解</a>';
  }else{
    const pager='<div class="bank-tabs">'+(page>1?tag(false,href(level,suffix+'&page='+(page-1)),'上一页'):'')+'<span>'+page+' / '+pages+'</span>'+(page<pages?tag(false,href(level,suffix+'&page='+(page+1)),'下一页'):'')+'</div>';
    content='<form id="wordSearch" class="searchbox"><input aria-label="搜索本级单词" type="search" placeholder="搜索本级英文或中文释义" value="'+esc(term)+'"><button class="btn btn-primary btn-sm">查词</button></form><p class="note-text">'+rows.length+' 个词条 · 每页 32 个</p>'+pager+
    '<div class="word-list">'+rows.slice((page-1)*32,page*32).map(([w,m])=>'<a class="card study-line" href="#/word/'+encodeURIComponent(w)+'"><strong lang="en">'+esc(w)+'</strong><p>'+esc(m)+'</p></a>').join('')+'</div>'+
    (!rows.length?'<p>本级没有匹配词条，请试试另一种拼写或释义。</p>':'')+pager+
    '<p class="note-text">词条选自 <a href="https://github.com/RealKai42/qwerty-learner">Qwerty Learner 四六级词库</a>，跨级去重。各级参考 <a href="https://github.com/hermitdave/FrequencyWords">FrequencyWords</a> 通用英语词频安排学习顺序。</p>';
  }
  app.innerHTML='<div class="container study-bank"><div class="page-head"><div class="crumbs"><a href="#/home">首页</a> / 专项训练</div><h1>'+(sentences?'专题例句':'四六级高频词汇')+'</h1></div><div class="bank-tabs">'+levelNames.map((n,i)=>tag(level===i,href(i,sentences?'&topic='+topic:''),n+(sentences?'例句':'词汇'))).join('')+'</div>'+content+'</div>';
  const form=document.getElementById('wordSearch');
  if(form)form.onsubmit=e=>{e.preventDefault();location.hash=href(level,'&q='+encodeURIComponent(form.querySelector('input').value.trim()))};
}
for(const [i,rows] of STUDY_WORDS.entries())for(const [w,mean,ph] of rows){
  if(!Object.hasOwn(WORDS,w))WORDS[w]={w,mean,ph:ph?'/'+ph+'/':'',level:levelNames[i]+'词汇',pos:'',ctx:'',points:[],examples:[]};
  WORDS[w].bank=i;
}


