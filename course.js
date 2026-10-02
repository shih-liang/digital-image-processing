(() => {
'use strict';
const stage=document.querySelector('#presentation'),chapter=document.querySelector('#chapter'),fullscreen=document.querySelector('#fullscreen');
const help=document.querySelector('#help');
const META=window.COURSE_META,all=Object.values(window.COURSE).flat();
const chapterTotal={},numberInChapter=all.map(l=>chapterTotal[l.chapter]=(chapterTotal[l.chapter]||0)+1);
const indexOf=id=>all.findIndex(x=>x.id===id);
let current=0;const slides=new Map(),revealed=new Map();
const HEAD=22,FOOT=22;

function sectionLabel(l){const m=META[l.chapter];return l.section>=0?`${l.chapter}.${l.section+1} ${m.sections[l.section]}`:''}
function chrome(slide,l,i){
 const head=document.createElement('div');head.className='slide-head';head.innerHTML=`<span>${sectionLabel(l)}</span>`;
 const foot=document.createElement('div');foot.className='slide-foot';foot.innerHTML=`<span>第 ${l.chapter} 章 · ${META[l.chapter].name}</span><span class="pg">${numberInChapter[i]} / ${chapterTotal[l.chapter]}</span>`;
 slide.append(head,foot);
 if(l.prompt){const p=document.createElement('button');p.className='reveal-prompt';p.type='button';p.textContent=l.prompt;if(l.promptLow)p.classList.add('low');p.onclick=e=>{e.stopPropagation();step(slide,i)};slide.append(p)}
}
function steps(slide){return Math.max(0,...[...slide.querySelectorAll('[data-step]')].map(e=>+e.dataset.step))}
function applySteps(slide,i){const n=revealed.get(i)||0;slide.querySelectorAll('[data-step]').forEach(e=>e.classList.toggle('step-hidden',+e.dataset.step>n));const p=slide.querySelector('.reveal-prompt');if(p)p.hidden=n>=1}
function step(slide,i){revealed.set(i,(revealed.get(i)||0)+1);applySteps(slide,i);resize()}

function build(l,i){
 const slide=document.createElement('section');slide.id=l.id;slide.className='slide';slide.setAttribute('aria-label',l.title);slide.dataset.chapter=l.chapter;if(l.kind)slide.dataset.kind=l.kind;
 slide.style.setProperty('--accent',META[l.chapter].color);
 if(l.demo){slide.classList.add('interactive');slide.dataset.demo=l.demo;slide.dataset.width='1600';slide.dataset.height='960';slide.style.width='1600px';slide.style.height='960px';}
 else{slide.dataset.width='960';slide.dataset.height='540';slide.innerHTML=`<div class="canvas">${l.html}</div>`;}
 return slide;
}
function mount(slide,l,i){if(l.demo)window.Demos.mount(slide,l);chrome(slide,l,i);applySteps(slide,i);
 slide.querySelectorAll('[data-goto]').forEach(a=>{const k=indexOf(a.dataset.goto),pg=a.querySelector('.toc-pg');if(pg&&k>=0)pg.textContent=numberInChapter[k]})}

// Layout of absolutely positioned source boxes: boxes whose text needs more room grow, and boxes below them in the same column move down.
function layout(slide){
 const canvas=slide.querySelector('.canvas');if(!canvas)return;
 const flow=canvas.querySelector(':scope > .flow');
 if(flow){canvas.style.top='0px';slide.dataset.height=Math.max(540,Math.ceil(flow.scrollHeight));slide.style.height=slide.dataset.height+'px';return}
 const boxes=[...canvas.querySelectorAll(':scope > .obj')];
 boxes.forEach(b=>{if(!b.dataset.o)b.dataset.o=JSON.stringify(['left','top','width','height'].map(k=>parseFloat(b.style[k])));const r=JSON.parse(b.dataset.o);b.style.top=r[1]+'px';b.style.height=r[3]+'px';b.classList.remove('collapsed')});
 const proj=true;
 const items=boxes.map(b=>{const [x,y,w,h]=JSON.parse(b.dataset.o),c=b.querySelector(':scope > .text-content,.source-table'),cs=getComputedStyle(b);
  const paras=c&&c.classList.contains('text-content')?[...c.children]:[];
  const empty=proj&&paras.length>0&&paras.every(p=>p.classList.contains('detail'));
  const shortened=proj&&b.querySelector('.detail');
  const need=c?c.getBoundingClientRect().height+parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom):h;
  return {b,x,y,w,h,need,empty,shortened}});
 // Boxes that overlap in the source (labels on pictures, stacked shapes) move together.
 const parent=items.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 items.forEach((a,i)=>items.forEach((b,j)=>{if(j<=i)return;if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>1)parent[find(i)]=find(j)}));
 const groups=new Map();items.forEach((it,i)=>{const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(it)});
 const clusters=[...groups.values()].map(m=>{
  const single=m.length===1;
  m.forEach(it=>{it.newH=it.empty?0:(single&&it.shortened)?Math.max(it.need,Math.min(it.h,it.need+12)):Math.max(it.h,it.need)});
  const top=Math.min(...m.map(it=>it.y)),bottom=Math.max(...m.map(it=>it.y+it.h)),x0=Math.min(...m.map(it=>it.x)),x1=Math.max(...m.map(it=>it.x+it.w));
  return {m,top,bottom,x0,x1,growth:Math.max(...m.map(it=>it.y+it.newH))-bottom,empty:m.every(it=>it.empty)}}).sort((a,b)=>a.top-b.top||a.x0-b.x0);
 const below=(a,c)=>a.bottom<=c.top+1&&Math.min(a.x1,c.x1)-Math.max(a.x0,c.x0)>4;
 clusters.forEach(c=>{if(c.empty){const gaps=clusters.filter(d=>below(c,d)).map(d=>d.top-c.bottom);c.growth=-(c.bottom-c.top)-(gaps.length?Math.min(20,Math.max(0,Math.min(...gaps))):0)}});
 clusters.forEach((c,k)=>{const above=clusters.slice(0,k).filter(a=>below(a,c));const near=above.filter(a=>!above.some(o=>o!==a&&below(a,o)&&Math.min(o.x1,a.x1)-Math.max(o.x0,a.x0)>4&&Math.min(o.x1,c.x1)-Math.max(o.x0,c.x0)>4));
  c.shift=near.length?Math.max(...near.map(a=>a.shift+a.growth)):0;
  if(!proj)c.shift=Math.max(0,c.shift);
  c.m.forEach(it=>{it.b.style.top=(it.y+c.shift)+'px';it.b.style.height=it.newH+'px';it.b.classList.toggle('collapsed',it.empty)})});
 const visible=items.filter(it=>!it.empty);
 const minTop=Math.min(...visible.map(it=>parseFloat(it.b.style.top)));
 const offset=Math.max(0,HEAD+4-minTop);canvas.style.top=offset+'px';
 const bottom=Math.max(...visible.map(it=>parseFloat(it.b.style.top)+it.newH));
 slide.dataset.height=Math.max(540,Math.ceil(offset+bottom+FOOT+4));slide.style.height=slide.dataset.height+'px';
}
function fit(slide,box){
 slide.style.transform='none';if(!slide.classList.contains('interactive'))layout(slide);
 const w=+slide.dataset.width,h=+slide.dataset.height,s=Math.min(box.clientWidth/w,box.clientHeight/h);
 slide.style.transform=`scale(${s})`;slide.style.left=(box.clientWidth-w*s)/2+'px';slide.style.top=(box.clientHeight-h*s)/2+'px';
}
function resize(){const slide=slides.get(current);if(slide)fit(slide,stage)}


function show(index,{updateHash=true}={}){
 index=Math.max(0,Math.min(all.length-1,index));window.Demos.stopAll();
 const old=slides.get(current);if(old){old.hidden=true;old.setAttribute('aria-hidden','true')}
 current=index;const l=all[current];let slide=slides.get(current);
 if(!slide){slide=build(l,current);stage.append(slide);slides.set(current,slide);mount(slide,l,current)}
 slide.hidden=false;slide.removeAttribute('aria-hidden');stage.setAttribute('aria-label',l.title);chapter.value=String(l.chapter);
 if(updateHash)history.replaceState(null,'','#'+l.id);
 document.title=l.title+' · 数字图像处理';resize();
}
function go(delta){
 if(delta>0){const slide=slides.get(current);if(slide&&(revealed.get(current)||0)<steps(slide)){step(slide,current);return}}
 show(current+delta);
}
function route(){const hash=location.hash.slice(1),m=hash.match(/^demo-(\w+)$/),i=all.findIndex(x=>m?x.demo===m[1]:x.id===hash);show(i<0?0:i,{updateHash:false})}
async function toggleFullscreen(){try{if(document.fullscreenElement===stage)await document.exitFullscreen();else await stage.requestFullscreen()}catch{document.querySelector('#fullscreen-status').textContent='浏览器未能进入全屏。请使用浏览器菜单中的全屏功能。'}}


fullscreen.onclick=toggleFullscreen;chapter.onchange=()=>show(all.findIndex(x=>x.chapter===+chapter.value));
document.querySelector('#toc-btn').onclick=()=>show(indexOf(`c${all[current].chapter}-toc`));
document.querySelector('#help-btn').onclick=()=>{help.hidden=!help.hidden};help.onclick=()=>{help.hidden=true};
let pointer;
stage.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,button:e.button}});
stage.addEventListener('click',e=>{
 const g=e.target.closest('[data-goto]');if(g){const k=indexOf(g.dataset.goto);if(k>=0)show(k);return}
 if(e.defaultPrevented||e.button!==0||e.target.closest('button,input,select,textarea,label,summary,a,[data-no-turn],#notes'))return;
 if(pointer&&(Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y)>5||pointer.button!==0))return;if(window.getSelection()?.toString())return;go(1)});
document.addEventListener('keydown',e=>{
 if(e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,select,textarea,[contenteditable="true"]'))return;
 if(e.code==='Space'&&e.target.closest('button,summary'))return;
 if(!help.hidden&&e.code!=='Slash'){help.hidden=true;if(e.code==='Escape')return}
 if(['ArrowRight','ArrowDown','PageDown','Space'].includes(e.code)){e.preventDefault();go(1)}
 else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.code)){e.preventDefault();go(-1)}
 else if(e.code==='Home'){e.preventDefault();show(all.findIndex(x=>x.chapter===all[current].chapter))}
 else if(e.code==='End'){e.preventDefault();show(all.findLastIndex(x=>x.chapter===all[current].chapter))}
 else if(e.code==='KeyF'){e.preventDefault();toggleFullscreen()}
 else if(e.code==='KeyT'){e.preventDefault();show(indexOf(`c${all[current].chapter}-toc`))}
 else if(e.code==='Slash'){e.preventDefault();help.hidden=!help.hidden}
 else if(e.code==='Escape'&&document.fullscreenElement===stage){e.preventDefault();document.exitFullscreen()}
});
document.addEventListener('fullscreenchange',resize);addEventListener('resize',resize);addEventListener('hashchange',route);document.addEventListener('visibilitychange',()=>{if(document.hidden)window.Demos.stopAll()});document.fonts.ready.then(resize);
window.CourseApp={show,go,resize,all,get current(){return current},get slide(){return slides.get(current)}};route();
})();
