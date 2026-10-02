/* Numerical teaching models. No media playback or network dependencies. */
(function(global){
'use strict';
const A={};
A.huffman=function(probs=[.4,.3,.1,.1,.06,.04]){
 const names=['a₂','a₆','a₁','a₄','a₃','a₅'];let id=0;
 let queue=probs.map((p,i)=>({id:id++,p,name:names[i],leaf:i}));const sort=q=>q.sort((a,b)=>a.p-b.p||a.id-b.id);sort(queue);
 const states=[{queue:queue.slice(),merged:null}];
 while(queue.length>1){const left=queue.shift(),right=queue.shift(),node={id:id++,p:left.p+right.p,left,right,name:''};queue.push(node);sort(queue);states.push({queue:queue.slice(),merged:node});}
 const codes=Array(probs.length);function walk(n,s){if(n.leaf!==undefined)codes[n.leaf]=s||'0';else{walk(n.left,s+'0');walk(n.right,s+'1')}}walk(queue[0],'');
 return {states,root:queue[0],names,probs,codes,entropy:-probs.reduce((s,p)=>s+p*Math.log2(p),0),average:probs.reduce((s,p,i)=>s+p*codes[i].length,0)};
};
A.arithmetic=function(message='ABA',p=.75){
 if(!/^[AB]{1,8}$/.test(message)||p<=0||p>=1)throw Error('请输入 1～8 个 A 或 B');
 let low=0,high=1;const states=[{low,high,prefix:'',split:p}];
 for(const symbol of message){const width=high-low,split=low+width*p;if(symbol==='A')high=split;else low=split;states.push({low,high,prefix:states.at(-1).prefix+symbol,split:low+(high-low)*p});}
 let bits=1,integer=0;for(;bits<40;bits++){integer=Math.ceil(low*2**bits-1e-12);if(integer/2**bits>=low-1e-14&&integer/2**bits<high-1e-14)break;}
 const code=integer/2**bits;let v=code,decoded='';const decode=[];
 for(let i=0;i<message.length;i++){const symbol=v<p?'A':'B';const next=symbol==='A'?v/p:(v-p)/(1-p);decode.push({v,symbol,next});v=next;decoded+=symbol;}
 return {message,p,states,low,high,code,bits,binary:integer.toString(2).padStart(bits,'0'),decode,decoded};
};
A.quantization=function(step=4,values=[1,3,7,12]){
 const levels=[];for(let x=0;x<=15;x+=step)levels.push(x);const bits=Math.ceil(Math.log2(levels.length));
 const rows=values.map(x=>{let i=0;levels.forEach((v,j)=>{if(Math.abs(v-x)<=Math.abs(levels[i]-x))i=j});return {x,q:levels[i],error:levels[i]-x,index:i,code:i.toString(2).padStart(bits,'0')}});
 const mse=rows.reduce((s,r)=>s+r.error**2,0)/rows.length;
 return {step,levels,bits,rows,mse,rmse:Math.sqrt(mse),psnr:mse?10*Math.log10(225/mse):Infinity,originalBits:4*values.length,encodedBits:bits*values.length};
};
A.inputMask=[[0,0,0,0,0,0,0],[0,1,1,1,0,0,0],[0,1,1,1,0,1,0],[0,1,1,1,0,1,0],[0,0,1,0,0,0,0],[0,0,0,0,1,0,0],[0,0,0,0,0,0,0]];
A.squareMask=Array.from({length:7},(_,y)=>Array.from({length:7},(_,x)=>+(x>=1&&x<=5&&y>=1&&y<=5)));
A.kernel=function(type='square'){return type==='vertical5'?[[0,-2],[0,-1],[0,0],[0,1],[0,2]]:type==='cross'?[[0,-1],[-1,0],[0,0],[1,0],[0,1]]:type==='vertical'?[[0,-1],[0,0],[0,1]]:[-1,0,1].flatMap(y=>[-1,0,1].map(x=>[x,y]));};
A.morphology=function(input=A.inputMask,op='erode',type='square'){
 const kernel=A.kernel(type),height=input.length,width=input[0].length;
 const at=(x,y)=>input[y]?.[x]??0;const states=[];
 const output=input.map((row,y)=>row.map((v,x)=>{const samples=kernel.map(([dx,dy])=>({x:x+(op==='erode'?dx:-dx),y:y+(op==='erode'?dy:-dy),v:at(x+(op==='erode'?dx:-dx),y+(op==='erode'?dy:-dy))}));const result=op==='erode'?+(samples.every(s=>s.v===1)):+(samples.some(s=>s.v===1));states.push({x,y,samples,result});return result}));
 return {input,kernel,output,states,width,height};
};
A.morph1d=function(input,kernel,op){const src=new Set(input);if(!src.size)return[];let out=new Set();if(op==='dilate'){input.forEach(x=>kernel.forEach(k=>out.add(x+k)))}else{for(let x=Math.min(...input)-Math.max(...kernel);x<=Math.max(...input)-Math.min(...kernel);x++){if(kernel.every(k=>src.has(x+k)))out.add(x)}}return [...out].sort((a,b)=>a-b)};
A.opening=function(op='open',radius=1){const input=[2,3,4,7],kernel=Array.from({length:radius*2+1},(_,i)=>i-radius);const first=op==='open'?'erode':'dilate',second=op==='open'?'dilate':'erode';const middle=A.morph1d(input,kernel,first),output=A.morph1d(middle,kernel,second);const repeat=A.morph1d(A.morph1d(output,kernel,first),kernel,second);return {input,kernel,middle,output,repeat,states:[input,middle,output],first,second};};
A.reconstruction=function(connectivity=4,both=false){
 const mask=[[0,1,1,0,1,0],[0,1,0,0,1,1],[0,1,1,0,0,0],[0,0,1,0,0,0],[0,0,0,0,0,0]];let current=mask.map(row=>row.map(()=>0));current[1][1]=1;if(both)current[1][4]=1;const states=[current];
 while(true){const expanded=A.morphology(current,'dilate',connectivity===4?'cross':'square').output;const next=mask.map((row,y)=>row.map((v,x)=>v&&expanded[y][x]?1:0));if(JSON.stringify(next)===JSON.stringify(current))break;states.push(next);current=next;}
 return {mask,states,output:current,iterations:states.length-1};
};
A.otsu=function(values=[1,1,2,8,9,9]){const mean=values.reduce((s,x)=>s+x,0)/values.length;const states=[];for(let t=0;t<=9;t++){const lo=values.filter(x=>x<=t),hi=values.filter(x=>x>t),w0=lo.length/values.length,w1=1-w0,m0=lo.length?lo.reduce((s,x)=>s+x,0)/lo.length:null,m1=hi.length?hi.reduce((s,x)=>s+x,0)/hi.length:null;states.push({t,lo,hi,w0,w1,m0,m1,score:m0===null||m1===null?null:w0*w1*(m0-m1)**2});}const max=Math.max(...states.map(s=>s.score??-Infinity));return {values,mean,states,max,best:states.filter(s=>s.score!==null&&Math.abs(s.score-max)<1e-10).map(s=>s.t)};};
A.hough=function(thetaStep=10,rhoStep=.5,n=3){const points=[[0,1],[1,1],[2,1]].slice(0,n),angles=[];for(let a=0;a<180;a+=thetaStep)angles.push(a);const buckets={};points.forEach(([x,y])=>angles.forEach(theta=>{const rho=x*Math.cos(theta*Math.PI/180)+y*Math.sin(theta*Math.PI/180),bin=Math.round(rho/rhoStep);const key=theta+','+bin;buckets[key]=(buckets[key]||0)+1}));let max=0;Object.values(buckets).forEach(v=>max=Math.max(max,v));return {points,angles,buckets,max,peaks:Object.keys(buckets).filter(k=>buckets[k]===max).map(k=>{let [theta,bin]=k.split(',').map(Number);return {theta,rho:bin*rhoStep}}),thetaStep,rhoStep};};
A.watershed=function(barrier=4){const terrain=[0,1,3,2,barrier,1,0],seeds=[0,6];const distances=seeds.map(seed=>terrain.map((_,i)=>Math.max(...terrain.slice(Math.min(i,seed),Math.max(i,seed)+1))));const labels=terrain.map((_,i)=>distances[0][i]<distances[1][i]?0:distances[1][i]<distances[0][i]?1:-1);return {terrain,seeds,distances,labels,max:Math.max(...terrain)};};
A.convolution=function(stride=1,padding=0,kernelType='edge'){
 const input=[[1,2,0,1,0],[0,1,3,1,2],[2,2,1,0,1],[1,0,2,3,1],[0,1,1,2,2]],kernel=kernelType==='average'?Array.from({length:3},()=>Array(3).fill(1/9)):[[1,0,-1],[1,0,-1],[1,0,-1]];
 const n=Math.floor((5+2*padding-3)/stride)+1,states=[];const output=Array.from({length:n},()=>Array(n).fill(0));
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const terms=[];for(let ky=0;ky<3;ky++)for(let kx=0;kx<3;kx++){const ix=x*stride+kx-padding,iy=y*stride+ky-padding,v=input[iy]?.[ix]??0,k=kernel[ky][kx];terms.push({ix,iy,kx,ky,v,k,product:v*k})}const sum=terms.reduce((s,t)=>s+t.product,0);output[y][x]=sum;states.push({x,y,terms,sum})}
 return {input,kernel,output,n,stride,padding,states};
};
A.gradient=function(eta=.2,steps=12){let w=0;const states=[];for(let k=0;k<=steps;k++){states.push({k,w,loss:(w-2)**2,gradient:2*(w-2),next:w-eta*2*(w-2)});w=states.at(-1).next}return {eta,states,ratio:1-2*eta};};
A.rng=function(seed){let s=seed>>>0;const random=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return (s+.5)/4294967296};const normal=()=>Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random());return {random,normal};};
A.diffusion=function(seed=2026,beta=.12,T=32){
 const {random,normal}=A.rng(seed),n=16;
 const prototypes=[0,1].map(kind=>Array.from({length:n*n},(_,i)=>{const x=i%n,y=Math.floor(i/n);return kind===0?(Math.abs(x-7.5)<2||Math.abs(y-7.5)<2?.9:-.9):((x-7.5)**2+(y-7.5)**2<22?.9:-.9)}));
 const alpha=1-beta,bars=Array.from({length:T+1},(_,t)=>alpha**t);const forward=[prototypes[0].slice()];for(let t=1;t<=T;t++)forward.push(forward[t-1].map(v=>Math.sqrt(alpha)*v+Math.sqrt(beta)*normal()));
 function posterior(x,t){if(t===0)return [1,0];const variance=1-bars[t],scale=Math.sqrt(bars[t]);const logs=prototypes.map(mu=>-x.reduce((s,v,i)=>s+(v-scale*mu[i])**2,0)/(2*variance));const max=Math.max(...logs),exp=logs.map(v=>Math.exp(v-max));return exp.map(v=>v/(exp[0]+exp[1]));}
 const initialClass=random()<.5?0:1;
 // Start at the exact finite-time marginal q(x_T), independent of the forward example.
 const reverse=Array(T+1),posteriors=Array(T+1);reverse[T]=prototypes[initialClass].map(v=>Math.sqrt(bars[T])*v+Math.sqrt(1-bars[T])*normal());posteriors[T]=posterior(reverse[T],T);
 for(let t=T;t>=1;t--){const weights=posterior(reverse[t],t),which=random()<weights[0]?0:1;posteriors[t]=weights;const c1=beta*Math.sqrt(bars[t-1])/(1-bars[t]),c2=Math.sqrt(alpha)*(1-bars[t-1])/(1-bars[t]),variance=beta*(1-bars[t-1])/(1-bars[t]);reverse[t-1]=reverse[t].map((v,i)=>c1*prototypes[which][i]+c2*v+Math.sqrt(Math.max(0,variance))*normal());}
 posteriors[0]=prototypes.map(mu=>reverse[0].every((v,i)=>Math.abs(v-mu[i])<1e-8)?1:0);
 return {n,T,seed,beta,alpha,bars,prototypes,forward,reverse,posteriors};
};
global.Algorithms=A;
})(typeof window!=='undefined'?window:globalThis);
