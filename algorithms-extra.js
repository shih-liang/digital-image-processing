// Algorithms for the additional step-by-step demonstrations. Each returns a list of states for the demo timeline.
(function(){
'use strict';
const X={};

// LZW encoding with a, b, c, d = 0..3, CLEAR = 4, EOI = 5, new entries from 6 (matches the chapter 7 worked example).
X.lzw=function(msg){
 const dict=new Map([['a',0],['b',1],['c',2],['d',3]]);let next=6,cur='';const out=[4],states=[];
 for(const ch of msg)if(!dict.has(ch))throw Error('只允许 a、b、c、d 四个字符');
 states.push({i:-1,cur:'',ch:'',act:'start',out:[...out],dict:new Map(dict)});
 for(let i=0;i<msg.length;i++){const ch=msg[i],cand=cur+ch;
  if(dict.has(cand)){states.push({i,cur,ch,cand,act:'extend',out:[...out],dict:new Map(dict)});cur=cand}
  else{out.push(dict.get(cur));dict.set(cand,next);states.push({i,cur,ch,cand,act:'emit',code:dict.get(cur),added:[cand,next],out:[...out],dict:new Map(dict)});next++;cur=ch}}
 out.push(dict.get(cur),5);states.push({i:msg.length,cur,act:'end',code:dict.get(cur),out:[...out],dict:new Map(dict)});
 return {msg,states,out};
};

// Orthonormal 8x8 DCT, coefficient ordering and reconstruction.
const N=8,a=u=>u?Math.sqrt(2/N):Math.sqrt(1/N),cosT=[...Array(N)].map((_,x)=>[...Array(N)].map((_,u)=>Math.cos((2*x+1)*u*Math.PI/(2*N))));
X.dct2=f=>{const F=[...Array(N)].map(()=>Array(N).fill(0));for(let u=0;u<N;u++)for(let v=0;v<N;v++){let s=0;for(let x=0;x<N;x++)for(let y=0;y<N;y++)s+=f[x][y]*cosT[x][u]*cosT[y][v];F[u][v]=a(u)*a(v)*s}return F};
X.idct2=(F,keep)=>{const f=[...Array(N)].map(()=>Array(N).fill(0));for(let x=0;x<N;x++)for(let y=0;y<N;y++){let s=0;for(let u=0;u<N;u++)for(let v=0;v<N;v++)if(keep[u][v])s+=a(u)*a(v)*F[u][v]*cosT[x][u]*cosT[y][v];f[x][y]=s}return f};
X.zigzag=()=>{const o=[];for(let s=0;s<2*N-1;s++){const cells=[];for(let u=0;u<N;u++){const v=s-u;if(v>=0&&v<N)cells.push([u,v])}if(s%2===0)cells.reverse();o.push(...cells)}return o};
X.blocks={
 edge:()=>[...Array(N)].map((_,x)=>[...Array(N)].map((_,y)=>x+y<7?52:196)),
 ramp:()=>[...Array(N)].map((_,x)=>[...Array(N)].map((_,y)=>60+14*x+6*y)),
 texture:()=>[...Array(N)].map((_,x)=>[...Array(N)].map((_,y)=>Math.round(128+70*Math.cos(Math.PI*(2*y+1)*5/16)+20*Math.cos(Math.PI*(2*x+1)/16))))
};
X.dctStates=function(kind,order){
 const f=X.blocks[kind](),F=X.dct2(f);let seq=X.zigzag();
 if(order==='magnitude')seq=[...seq].sort((p,q)=>Math.abs(F[q[0]][q[1]])-Math.abs(F[p[0]][p[1]]));
 const total=F.flat().reduce((s,c)=>s+c*c,0),states=[];
 for(let k=1;k<=64;k++){const keep=[...Array(N)].map(()=>Array(N).fill(false));seq.slice(0,k).forEach(([u,v])=>keep[u][v]=true);
  const r=X.idct2(F,keep);let se=0;for(let x=0;x<N;x++)for(let y=0;y<N;y++)se+=(f[x][y]-r[x][y])**2;
  const kept=seq.slice(0,k).reduce((s,[u,v])=>s+F[u][v]**2,0);
  states.push({k,keep,r,mse:se/64,mseCoef:(total-kept)/64,energy:kept/total,last:seq[k-1]})}
 return {f,F,seq,states};
};

// Region growing on the chapter 9 8x8 matrix. Each round tests the current frontier in row-column order;
// a pixel that fails is tested again in later rounds. "mean" updates the region mean after every accepted pixel.
X.regionMatrix=[[2,0,0,0,1,0,1,2],[0,1,2,8,9,2,1,3],[1,0,0,7,8,0,2,1],[0,6,7,5,6,9,7,0],[2,7,6,8,7,6,8,2],[1,0,4,6,5,0,3,1],[1,0,1,8,7,2,1,0],[0,2,1,9,7,0,1,2]];
X.regionGrow=function(rule,T,conn,seed=[4,3]){
 const g=X.regionMatrix,R=g.length,C=g[0].length,inR=[...Array(R)].map(()=>Array(C).fill(false));
 const nb=conn===8?[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]:[[-1,0],[1,0],[0,-1],[0,1]];
 inR[seed[0]][seed[1]]=true;let sum=g[seed[0]][seed[1]],n=1;const states=[{type:'seed',p:seed,mean:sum,n,inR:inR.map(r=>[...r])}];
 for(let round=1;round<100;round++){
  const front=[];for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(!inR[r][c]&&nb.some(([dr,dc])=>inR[r+dr]?.[c+dc]))front.push([r,c]);
  let added=0;
  for(const [r,c] of front){const ref=rule==='mean'?sum/n:g[seed[0]][seed[1]],ok=Math.abs(g[r][c]-ref)<=T+1e-9&&nb.some(([dr,dc])=>inR[r+dr]?.[c+dc]);
   if(ok){inR[r][c]=true;sum+=g[r][c];n++;added++}
   states.push({type:'test',round,p:[r,c],ref,ok,mean:sum/n,n,inR:inR.map(x=>[...x])})}
  if(!added){states.push({type:'done',round,mean:sum/n,n,inR:inR.map(x=>[...x])});break}
 }
 return {g,states,seed};
};

// Canny hysteresis linking on a non-maximum-suppressed magnitude grid (8-connectivity).
X.hysteresisData={
 page:[[20,20,20,20,20],[120,60,60,20,60],[20,20,20,20,20],[20,60,60,20,20]],
 large:[[10,20,15,10,20,10,15,10,20,10],[15,130,70,60,20,10,60,65,20,15],[10,20,20,55,15,20,10,20,15,10],[20,15,10,20,75,80,140,20,10,20],[10,20,15,10,20,15,20,70,15,10],[15,10,55,60,20,10,15,20,65,150],[10,20,15,20,10,20,10,15,20,10]]
};
X.hysteresis=function(kind,TH,TL){
 const g=X.hysteresisData[kind],R=g.length,C=g[0].length,cls=g.map(r=>r.map(v=>v>=TH?'strong':v>=TL?'weak':'low'));
 const keep=g.map(r=>r.map(()=>false)),states=[{type:'input'},{type:'classify',cls}];const queue=[];
 for(let r=0;r<R;r++)for(let c=0;c<C;c++)if(cls[r][c]==='strong'){keep[r][c]=true;queue.push([r,c])}
 states.push({type:'seeds',keep:keep.map(x=>[...x]),queue:queue.length});
 while(queue.length){const [r,c]=queue.shift(),added=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const y=r+dr,x=c+dc;if((dr||dc)&&cls[y]?.[x]==='weak'&&!keep[y][x]){keep[y][x]=true;queue.push([y,x]);added.push([y,x])}}
  states.push({type:'visit',p:[r,c],added,keep:keep.map(x=>[...x])})}
 states.push({type:'final',keep:keep.map(x=>[...x])});
 return {g,cls,states,TH,TL};
};

// K-means on the gray levels of a small image.
X.kmeansImage=(()=>{let s=7;const rnd=()=>(s=(s*1103515245+12345)%2147483648)/2147483648;const img=[];
 for(let r=0;r<10;r++){const row=[];for(let c=0;c<12;c++){let base=55;if((r-4.5)**2/9+(c-3.5)**2/7<1)base=135;if(r>=2&&r<=7&&c>=7&&c<=10)base=205;row.push(Math.max(0,Math.min(255,Math.round(base+(rnd()-0.5)*44))))}img.push(row)}return img})();
X.kmeans=function(K,init){
 const v=X.kmeansImage.flat(),lo=Math.min(...v),hi=Math.max(...v);
 let m=init==='first'?v.slice(0,K).map((x,i)=>x+i*0.5):[...Array(K)].map((_,i)=>lo+(hi-lo)*(i+0.5)/K);
 const states=[{type:'init',m:[...m],lab:null}];let lab=null;
 for(let it=1;it<=30;it++){
  const nl=v.map(x=>{let b=0;for(let k=1;k<K;k++)if(Math.abs(x-m[k])<Math.abs(x-m[b]))b=k;return b});
  const changed=lab?nl.filter((l,i)=>l!==lab[i]).length:v.length;lab=nl;
  const sse=v.reduce((s,x,i)=>s+(x-m[lab[i]])**2,0);states.push({type:'assign',it,m:[...m],lab,changed,sse});
  if(!changed&&it>1){states.push({type:'done',it,m:[...m],lab,sse});break}
  m=m.map((old,k)=>{const xs=v.filter((_,i)=>lab[i]===k);return xs.length?xs.reduce((p,q)=>p+q,0)/xs.length:old});
  states.push({type:'update',it,m:[...m],lab,sse:v.reduce((s,x,i)=>s+(x-m[lab[i]])**2,0)});
 }
 return {v,states,K};
};

// Backpropagation on the two-layer scalar network of chapter 10.
X.backprop=function(x,y,eta){
 const p={w1:1,b1:0,w2:0.5,b2:0},z=p.w1*x+p.b1,h=Math.max(0,z),yh=p.w2*h+p.b2,L=0.5*(yh-y)**2;
 const dy=yh-y,dw2=dy*h,db2=dy,dh=dy*p.w2,dz=dh*(z>0?1:0),dw1=dz*x,db1=dz;
 const q={w1:p.w1-eta*dw1,b1:p.b1-eta*db1,w2:p.w2-eta*dw2,b2:p.b2-eta*db2};
 const z2=q.w1*x+q.b1,h2=Math.max(0,z2),yh2=q.w2*h2+q.b2,L2=0.5*(yh2-y)**2;
 return {x,y,eta,p,z,h,yh,L,dy,dw2,db2,dh,dz,dw1,db1,q,z2,h2,yh2,L2};
};

// Greedy NMS within one class.
X.iou=(a,b)=>{const w=Math.max(0,Math.min(a.x2,b.x2)-Math.max(a.x1,b.x1)),h=Math.max(0,Math.min(a.y2,b.y2)-Math.max(a.y1,b.y1)),i=w*h,u=(a.x2-a.x1)*(a.y2-a.y1)+(b.x2-b.x1)*(b.y2-b.y1)-i;return u?i/u:0};
X.nmsBoxes=[{id:'A',x1:20,y1:30,x2:110,y2:120,s:0.92},{id:'B',x1:30,y1:36,x2:118,y2:128,s:0.81},{id:'C',x1:14,y1:42,x2:98,y2:130,s:0.67},{id:'D',x1:100,y1:44,x2:182,y2:132,s:0.88},{id:'E',x1:108,y1:52,x2:192,y2:140,s:0.60},{id:'F',x1:150,y1:140,x2:212,y2:192,s:0.35}];
X.nms=function(thr,minScore){
 const boxes=X.nmsBoxes.map(b=>({...b})),status=Object.fromEntries(boxes.map(b=>[b.id,b.s<minScore?'low':'cand']));
 const states=[{type:'start',status:{...status}}];
 const order=boxes.filter(b=>status[b.id]==='cand').sort((p,q)=>q.s-p.s);states.push({type:'sort',order:order.map(b=>b.id),status:{...status}});
 for(;;){const top=order.find(b=>status[b.id]==='cand');if(!top)break;status[top.id]='keep';
  const rows=order.filter(b=>status[b.id]==='cand').map(b=>({id:b.id,iou:X.iou(top,b)}));states.push({type:'pick',top:top.id,rows,status:{...status}});
  rows.forEach(r=>{if(r.iou>thr)status[r.id]='sup'});states.push({type:'suppress',top:top.id,rows,status:{...status}})}
 states.push({type:'done',status:{...status}});return {boxes,states,thr,minScore};
};

window.AlgorithmsExtra=X;
})();
