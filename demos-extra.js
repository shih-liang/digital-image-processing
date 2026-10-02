// Additional step-by-step demonstrations (registered into the same framework as demos.js).
(function(){
'use strict';
const X=window.AlgorithmsExtra,specs=window.Demos.specs,lessons=window.IntegratedLessons;
const C={ink:'#214d62',blue:'#347fa1',light:'#e6eff3',gold:'#e6b75e',goldLight:'#fff0ce',red:'#b35b51',redLight:'#f6dcd8',green:'#3c8a5c',greenLight:'#dcefe2',gray:'#cbd7dc',white:'#ffffff'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;');
const fmt=(x,d=3)=>x===null||x===undefined?'—':!Number.isFinite(x)?'∞':Number(x.toFixed(d)).toString();
const text=(x,y,s,extra='')=>`<text x="${x}" y="${y}" ${/\bfill=/.test(extra)?'':`fill="${C.ink}"`} ${extra}>${esc(s)}</text>`;
const rect=(x,y,w,h,fill=C.light,extra='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const line=(x,y,u,v,col=C.gray,extra='')=>`<line x1="${x}" y1="${y}" x2="${u}" y2="${v}" stroke="${col}" stroke-width="2" ${extra}/>`;
const svg=(s,w=800,h=380,title='算法状态示意图')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><defs><marker id="axh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="${C.ink}"/></marker></defs>${s}</svg>`;
const table=(heads,rows,current=-1,cls='')=>`<table class="demo-table ${cls}"><thead><tr>${heads.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((row,i)=>`<tr${i===current?' class="current"':''}>${row.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const math=s=>`<math xmlns="http://www.w3.org/1998/Math/MathML">${s}</math>`;
const eq=s=>`<div class="lesson-equation">${math(s)}</div>`;
const p=s=>`<p>${s}</p>`;
const val=(host,name)=>host.querySelector(`[name="${name}"]`).value;
const sel=(name,label,opts)=>`<label>${label} <select name="${name}">${opts.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select></label>`;
const gray=v=>{const g=Math.max(0,Math.min(255,Math.round(v)));return `rgb(${g},${g},${g})`};
const hex=n=>n.toString(16).toUpperCase()+'H';
const twoCol=(...blocks)=>`<div class="theory-grid">${blocks.map(b=>`<div>${b}</div>`).join('')}</div>`;

/* ---------- LZW ---------- */
specs.lzw={controls:sel('message','输入串',[['aabcabbbbd','aabcabbbbd（本章算例）'],['abababab','abababab'],['aaaaaaaaaa','aaaaaaaaaa'],['abcdabcdabcd','abcdabcdabcd']]),
 model:h=>X.lzw(val(h,'message')),max:m=>m.states.length-1,
 draw(m,k){const st=m.states[k];let s=text(20,26,'输入串（金色为当前读入字符，蓝色为当前匹配串）');
  [...m.msg].forEach((ch,i)=>{const inCur=st.act!=='end'&&i<=st.i&&i>st.i-(st.act==='emit'?st.cur.length:st.cand?st.cand.length:0)-(st.act==='emit'?1:0)+ (st.act==='emit'?1:0);
   const isNow=i===st.i,before=i<st.i;const fill=isNow?C.gold:(st.act==='extend'&&i>st.i-st.cand.length&&i<st.i)||(st.act==='emit'&&i>=st.i-st.cur.length&&i<st.i)?C.blue:before?C.light:C.white;
   s+=rect(20+i*44,38,40,40,fill,`stroke="${C.gray}"`)+text(40+i*44,65,ch,`text-anchor="middle" font-size="20" ${fill===C.blue?'fill="#fff"':''}`)});
  s+=text(20,112,'输出码流')+(st.out.map((c,i)=>rect(20+i*52,122,48,32,i===st.out.length-1&&st.act!=='extend'?C.goldLight:C.light,`stroke="${C.gray}"`)+text(44+i*52,144,hex(c),'text-anchor="middle"')).join(''));
  const entries=[...st.dict.entries()].filter(([,c])=>c>=6);s+=text(20,190,'字典新增项（初始 a=0H, b=1H, c=2H, d=3H；CLEAR=4H, EOI=5H）');
  entries.forEach(([w,c],i)=>{const x=20+(i%6)*128,y=202+Math.floor(i/6)*40,isNew=st.added&&st.added[0]===w;s+=rect(x,y,120,32,isNew?C.goldLight:C.light,`stroke="${isNew?C.gold:C.gray}"`)+text(x+60,y+22,`${hex(c)} = ${w}`,'text-anchor="middle"')});
  const act=st.act==='start'?'输出 CLEAR（4H），当前串置空。':st.act==='extend'?`“${esc(st.cand)}” 已在字典中：不输出，继续匹配。`:st.act==='emit'?`“${esc(st.cand)}” 不在字典中：输出 “${esc(st.cur)}” 的编号 ${hex(st.code)}，新增 ${hex(st.added[1])} = ${esc(st.added[0])}，当前串改为 “${esc(st.ch)}”。`:`输入结束：输出当前串 “${esc(st.cur)}” 的编号 ${hex(st.code)}，再输出 EOI（5H）。`;
  return {diagram:svg(s,800,300,'LZW 编码过程'),explain:`<h3>${st.act==='end'?'编码完成':st.act==='start'?'初始化':'读入第 '+(st.i+1)+' 个字符 “'+esc(st.ch)+'”'}</h3>${table(['当前串 S','下一字符 c','S+c 在字典中？'],[[st.cur?esc(st.cur):'空',st.ch?esc(st.ch):'—',st.act==='extend'?'是':st.act==='emit'?'否':'—']])}<p>${act}</p><p>已输出 <span class="metric">${st.out.length}</span> 个编号；输入共 ${m.msg.length} 个字符。</p>`}}};
lessons.lzw={title:'LZW 编码：边匹配、边输出、边建字典',
 intro:'编码器始终寻找字典中已有的最长串：能延长就继续读，不能延长就输出已匹配串的编号，并把“已匹配串 + 下一字符”加入字典。解码器按同样规则重建字典，因此字典本身不需要传送。',
 theory:(m)=>twoCol(p('<strong>编码规则</strong>：S 为当前串，c 为下一字符。若 S+c 在字典中，令 S ← S+c；否则输出 code(S)，新增 S+c，并令 S ← c。输入结束时输出 code(S)。')+p('<strong>解码规则</strong>：每读入一个编号，输出其对应串；把“上一个输出串 + 当前串首字符”加入字典。若编号恰为尚未建立的下一项（如 ABABABA 中的情形），其串为“上一串 + 上一串首字符”。'),
  p('<strong>压缩效果</strong>：重复片段越长、越频繁，字典中的长串越多，一个编号代替的字符越多。本例 '+m.msg.length+' 个字符输出 '+(m.out.length)+' 个编号（含 CLEAR 与 EOI）。')+p('<strong>位宽</strong>：编号用定长位数表示；字典增长到 2ⁿ 项时位宽加 1，字典满后可发送 CLEAR 重新开始。GIF、TIFF 采用 LZW。'))};

/* ---------- DCT ---------- */
specs.dct={controls:sel('block','图块',[['edge','对角边缘块'],['ramp','平缓渐变块'],['texture','竖向纹理块']])+sel('order','保留顺序',[['zigzag','Z 字顺序（低频优先）'],['magnitude','按系数幅值从大到小']]),
 model:h=>X.dctStates(val(h,'block'),val(h,'order')),max:()=>63,
 draw(m,k){const st=m.states[k],cell=20;let s='';
  const grid=(ox,oy,title,fn)=>{s+=text(ox,oy-10,title);for(let x=0;x<8;x++)for(let y=0;y<8;y++)s+=rect(ox+y*cell,oy+x*cell,cell,cell,fn(x,y))};
  grid(10,40,'原图块 f',(x,y)=>gray(m.f[x][y]));grid(200,40,`重建（${st.k} 个系数）`,(x,y)=>gray(st.r[x][y]));
  grid(390,40,'误差 |f − f̂|（放大 2 倍）',(x,y)=>gray(255-Math.min(255,2*Math.abs(m.f[x][y]-st.r[x][y]))));
  const maxC=Math.max(...m.F.flat().map(Math.abs));s+=text(580,30,'DCT 系数（金色已保留）');
  for(let u=0;u<8;u++)for(let v=0;v<8;v++){const mag=Math.abs(m.F[u][v])/maxC,kept=st.keep[u][v];s+=rect(580+v*cell,40+u*cell,cell,cell,kept?`rgba(230,183,94,${0.35+0.65*Math.sqrt(mag)})`:`rgba(52,127,161,${0.08+0.6*Math.sqrt(mag)})`,`stroke="#fff"`)}
  const [lu,lv]=st.last;s+=`<rect x="${580+lv*cell}" y="${40+lu*cell}" width="${cell}" height="${cell}" fill="none" stroke="${C.red}" stroke-width="3"/>`;
  s+=text(580,225,'左上角为直流 (0,0)；向右、向下频率升高');
  const W=760,H=80,ox=20,oy=270;s+=text(ox,oy-10,'均方根误差 RMSE 随保留系数个数下降');
  const ys=m.states.map(x=>Math.sqrt(Math.max(x.mse,0))),ymax=Math.max(...ys),ymin=0;
  s+=line(ox,oy+H,ox+W,oy+H)+`<polyline fill="none" stroke="${C.blue}" stroke-width="2.5" points="${m.states.map((x,i)=>`${ox+i*W/63},${oy+H-(ys[i]-ymin)/(ymax-ymin)*H}`).join(' ')}"/>`;
  s+=`<circle cx="${ox+k*W/63}" cy="${oy+H-(ys[k]-ymin)/(ymax-ymin)*H}" r="6" fill="${C.gold}"/>`;
  const psnr=st.mse>1e-9?10*Math.log10(255*255/st.mse):Infinity;
  return {diagram:svg(s,800,365,'DCT 系数保留与重建'),explain:`<h3>保留 ${st.k} / 64 个系数</h3>${table(['指标','数值'],[['新加入的系数位置',`(u, v) = (${lu}, ${lv})`],['该系数值',fmt(m.F[lu][lv],2)],['保留能量比例',fmt(100*st.energy,3)+'%'],['像素域 MSE',fmt(st.mse,3)],['被舍系数平方和 ÷ 64',fmt(st.mseCoef,3)],['PSNR',Number.isFinite(psnr)?fmt(psnr,2)+' dB':'∞']])}<p>正交 DCT 保持能量：两种方式算出的 MSE 相同。</p>`}}};
lessons.dct={title:'DCT 重建：逐个加入系数',
 intro:'8×8 图块先做正交 DCT。按 Z 字顺序（或按幅值）每次多保留一个系数，其余置零后做逆 DCT。边缘块需要较多高频系数才能恢复锐利边界；平缓渐变块几个低频系数就足够。',
 theory:()=>twoCol(eq('<mi>F</mi><mo>(</mo><mi>u</mi><mo>,</mo><mi>v</mi><mo>)</mo><mo>=</mo><mi>α</mi><mo>(</mo><mi>u</mi><mo>)</mo><mi>α</mi><mo>(</mo><mi>v</mi><mo>)</mo><munderover><mo>∑</mo><mrow><mi>x</mi><mo>=</mo><mn>0</mn></mrow><mn>7</mn></munderover><munderover><mo>∑</mo><mrow><mi>y</mi><mo>=</mo><mn>0</mn></mrow><mn>7</mn></munderover><mi>f</mi><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>)</mo><mi>cos</mi><mfrac><mrow><mo>(</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn><mo>)</mo><mi>u</mi><mi>π</mi></mrow><mn>16</mn></mfrac><mi>cos</mi><mfrac><mrow><mo>(</mo><mn>2</mn><mi>y</mi><mo>+</mo><mn>1</mn><mo>)</mo><mi>v</mi><mi>π</mi></mrow><mn>16</mn></mfrac>')+p('α(0) = √(1/8)，α(u) = √(2/8)（u ≥ 1）。这一归一化使变换矩阵正交。'),
  p('<strong>能量守恒（Parseval）</strong>：Σ f² = Σ F²。因此只保留一部分系数时，像素域平方误差之和等于被舍弃系数的平方和。')+p('<strong>为何按 Z 字顺序</strong>：自然图像能量多集中在低频，Z 字顺序近似按频率从低到高排列；按幅值保留误差更小，但需要额外编码系数位置。'))};

/* ---------- Region growing ---------- */
specs.regiongrow={controls:sel('rule','判据',[['fixed','与固定种子比较'],['mean','与当前区域均值比较']])+sel('T','允许差值 T',[['3','3'],['2','2'],['4','4']])+sel('conn','邻接',[['4','4 邻接'],['8','8 邻接']]),
 model:h=>X.regionGrow(val(h,'rule'),+val(h,'T'),+val(h,'conn')),max:m=>m.states.length-1,
 draw(m,k){const st=m.states[k],cell=36,ox=20,oy=30;let s=text(ox,20,'8×8 灰度矩阵（行、列从 1 计；种子 (5,4) = 8）');
  m.g.forEach((row,r)=>row.forEach((v,c)=>{const inR=st.inR[r][c],cur=st.p&&st.p[0]===r&&st.p[1]===c;
   s+=rect(ox+c*cell,oy+r*cell,cell-2,cell-2,inR?C.blue:C.light,cur?`stroke="${st.ok===false?C.red:C.gold}" stroke-width="4"`:'')+text(ox+c*cell+17,oy+r*cell+23,v,`text-anchor="middle" font-size="16" ${inR?'fill="#fff"':''}`)}));
  s+=`<circle cx="${ox+3*cell+29}" cy="${oy+4*cell+7}" r="4" fill="${C.gold}"/>`;
  const head=st.type==='seed'?'从种子开始':st.type==='done'?'没有新的像素可以加入，生长结束':`第 ${st.round} 轮：检查 (${st.p[0]+1},${st.p[1]+1}) = ${m.g[st.p[0]][st.p[1]]}`;
  const detail=st.type==='test'?p(`参考值 ${fmt(st.ref,3)}，差值 ${fmt(Math.abs(m.g[st.p[0]][st.p[1]]-st.ref),3)}：${st.ok?'<strong>加入</strong>':'<strong>拒绝</strong>（下一轮仍可重试）'}。`):'';
  return {diagram:svg(s,320,330,'区域生长过程'),explain:`<h3>${head}</h3>${detail}${table(['区域像素数','区域均值'],[[`<span class="metric">${st.n}</span>`,fmt(st.mean,3)]])}<p>每轮先列出与区域相邻、尚未加入的像素，按行号、列号依次检查。${m.states[0]&&''}</p>`}}};
lessons.regiongrow={title:'区域生长：固定种子与动态均值',
 intro:'使用上一页的 8×8 矩阵。每一轮检查区域的全部邻接像素：与参考值的差 ≤ T 就加入。固定种子法的参考值始终是 8；动态均值法每加入一个像素就更新均值，所以灰度 4 后来也能加入。',
 theory:()=>twoCol(eq('<mrow><mo>|</mo><mi>f</mi><mo>(</mo><mi>x</mi><mo>,</mo><mi>y</mi><mo>)</mo><mo>−</mo><mi>r</mi><mo>|</mo></mrow><mo>≤</mo><mi>T</mi><mo>,</mo><mspace width="1em"/><mi>r</mi><mo>=</mo><mi>f</mi><mo>(</mo><msub><mi>s</mi><mn>0</mn></msub><mo>)</mo><mspace width="0.5em"/><mtext>或</mtext><mspace width="0.5em"/><mi>r</mi><mo>=</mo><msub><mi>μ</mi><mi>R</mi></msub>')+p('固定种子法的结果与访问顺序无关，等于“满足条件的像素中与种子连通的那一部分”。T = 3、4 邻接时为 22 个像素。'),
  p('动态均值法中，区域均值随加入的像素改变，结果依赖访问顺序与更新时机。T = 3、4 邻接时为 23 个像素，(6,3) = 4 在均值降低后加入。')+p('改为 8 邻接或改变 T，可以观察连通方式与阈值对区域范围的影响。'))};

/* ---------- Hysteresis ---------- */
specs.hysteresis={controls:sel('data','数据',[['page','本章 4×5 算例'],['large','7×10 示例']])+sel('TH','高阈值 T_H',[['100','100'],['80','80'],['140','140']])+sel('TL','低阈值 T_L',[['40','40'],['60','60'],['30','30']]),
 model:h=>{const TH=+val(h,'TH'),TL=+val(h,'TL');if(TL>=TH)throw Error('低阈值必须小于高阈值');return X.hysteresis(val(h,'data'),TH,TL)},max:m=>m.states.length-1,
 draw(m,k){const st=m.states[k],R=m.g.length,Cn=m.g[0].length,cell=Math.min(56,Math.floor(560/Cn)),ox=20,oy=34;let s=text(ox,22,'非极大值抑制后的梯度幅值');
  const keep=st.keep;m.g.forEach((row,r)=>row.forEach((v,c)=>{const cl=m.cls[r][c];let fill=C.white;
   if(st.type!=='input'){fill=cl==='strong'?C.blue:cl==='weak'?C.goldLight:C.white}
   if(keep&&keep[r][c])fill=cl==='strong'?C.blue:C.green;
   if(st.type==='final'&&cl==='weak'&&!keep[r][c])fill=C.redLight;
   const cur=st.p&&st.p[0]===r&&st.p[1]===c,added=st.added&&st.added.some(([y,x])=>y===r&&x===c);
   s+=rect(ox+c*cell,oy+r*cell,cell-3,cell-3,fill,`stroke="${cur?C.red:added?C.gold:C.gray}" stroke-width="${cur||added?4:1}"`)+text(ox+c*cell+cell/2-1,oy+r*cell+cell/2+5,v,`text-anchor="middle" font-size="15" ${fill===C.blue||fill===C.green?'fill="#fff"':''}`)}));
  const ly=oy+R*cell+28;[[C.blue,'强边缘（≥ T_H）'],[C.goldLight,'弱边缘候选'],[C.green,'已连接的弱边缘'],[C.redLight,'最终删除的弱边缘']].forEach(([f,t],i)=>s+=rect(ox+i*150,ly-14,18,18,f,`stroke="${C.gray}"`)+text(ox+i*150+24,ly,t,'font-size="14"'));
  const msg={input:'输入：每个位置只剩局部最大的梯度幅值。',classify:`按 T_H = ${m.TH}、T_L = ${m.TL} 分类：≥ T_H 为强边缘，介于两者之间为弱边缘，其余删除。`,seeds:`强边缘全部保留，并作为追踪起点（共 ${st.queue} 个）。`,visit:st.p?`从 (${st.p[0]+1},${st.p[1]+1}) 出发，检查 8 邻域：${st.added&&st.added.length?'新连接 '+st.added.length+' 个弱边缘，它们也成为起点。':'没有新的弱边缘。'}`:'',final:'追踪结束：没有连到强边缘的弱边缘全部删除。'}[st.type];
  const kept=keep?keep.flat().filter(Boolean).length:0;
  return {diagram:svg(s,620,ly+20,'滞后阈值连接'),explain:`<h3>${{input:'输入',classify:'双阈值分类',seeds:'确定起点',visit:'沿弱边缘追踪',final:'最终边缘'}[st.type]}</h3>${p(msg)}${table(['强边缘','弱边缘','当前保留'],[[m.cls.flat().filter(x=>x==='strong').length,m.cls.flat().filter(x=>x==='weak').length,`<span class="metric">${kept}</span>`]])}`}}};
lessons.hysteresis={title:'Canny 滞后阈值：从强边缘出发连接弱边缘',
 intro:'单一阈值要么丢掉弱边缘，要么引入噪声。Canny 用两个阈值：强边缘直接保留；弱边缘只有通过一串 8 邻接的弱边缘连到强边缘时才保留。',
 theory:()=>twoCol(eq('<msub><mi>g</mi><mi>NH</mi></msub><mo>=</mo><mo>{</mo><msub><mi>g</mi><mi>N</mi></msub><mo>≥</mo><msub><mi>T</mi><mi>H</mi></msub><mo>}</mo><mo>,</mo><mspace width="1em"/><msub><mi>g</mi><mi>NL</mi></msub><mo>=</mo><mo>{</mo><msub><mi>T</mi><mi>L</mi></msub><mo>≤</mo><msub><mi>g</mi><mi>N</mi></msub><mo>&lt;</mo><msub><mi>T</mi><mi>H</mi></msub><mo>}</mo>')+p('g_N 为非极大值抑制后的幅值。Canny 建议 T_H : T_L 约为 2 : 1 到 3 : 1。'),
  p('追踪相当于在弱边缘像素上做连通分量标记：凡是与强边缘处于同一个 8 连通分量的弱边缘都保留。')+p('T_L 过低会把噪声连成边缘；T_H 过高会缺少起点，整段边缘丢失。'))};

/* ---------- K-means ---------- */
const palette=['#347fa1','#e6b75e','#b35b51','#3c8a5c'];
specs.kmeans={controls:sel('K','聚类数 K',[['3','3'],['2','2'],['4','4']])+sel('init','初始均值',[['first','取前 K 个像素的灰度'],['even','在灰度范围内等间距']]),
 model:h=>X.kmeans(+val(h,'K'),val(h,'init')),max:m=>m.states.length-1,
 draw(m,k){const st=m.states[k],img=X.kmeansImage,cell=24;let s=text(20,22,'输入灰度图（10×12）')+text(330,22,st.lab?'当前聚类标签':'尚未分配');
  img.forEach((row,r)=>row.forEach((v,c)=>{s+=rect(20+c*cell,32+r*cell,cell,cell,gray(v));s+=rect(330+c*cell,32+r*cell,cell-1,cell-1,st.lab?palette[st.lab[r*12+c]]:C.light)}));
  const ox=20,oy=300,W=600,H=50,bins=Array(32).fill(0);m.v.forEach(x=>bins[Math.min(31,x>>3)]++);const bm=Math.max(...bins);
  s+=text(ox,oy-8,'灰度直方图与当前均值（竖线）');bins.forEach((b,i)=>s+=rect(ox+i*W/32,oy+H-b/bm*H,W/32-2,b/bm*H,C.gray));
  s+=line(ox,oy+H,ox+W,oy+H);st.m.forEach((mu,i)=>s+=`<line x1="${ox+mu/256*W}" y1="${oy-2}" x2="${ox+mu/256*W}" y2="${oy+H}" stroke="${palette[i]}" stroke-width="4"/>`);
  [0,128,255].forEach(t=>s+=text(ox+t/256*W,oy+H+16,t,'text-anchor="middle" font-size="12"'));
  const counts=st.m.map((_,i)=>st.lab?st.lab.filter(l=>l===i).length:0);
  const head={init:'初始化 K 个均值',assign:`第 ${st.it} 次迭代：按最近均值分配`,update:`第 ${st.it} 次迭代：重新计算均值`,done:'标签不再改变，收敛'}[st.type];
  return {diagram:svg(s,640,375,'K 均值聚类分割'),explain:`<h3>${head}</h3>${table(['类别','均值','像素数'],st.m.map((mu,i)=>[`<span style="display:inline-block;width:14px;height:14px;background:${palette[i]}"></span> ${i+1}`,fmt(mu,2),st.lab?counts[i]:'—']))}${st.sse!==undefined?p(`类内平方误差和 J = <span class="metric">${fmt(st.sse,0)}</span>`):''}${st.type==='assign'?p(`本次有 ${st.changed} 个像素改变了类别。`):''}`}}};
lessons.kmeans={title:'K 均值聚类分割的迭代过程',
 intro:'把每个像素的灰度看作特征，交替执行“分配到最近均值”和“重新计算均值”，直到标签不再改变。图像含暗背景、中等亮度圆形和亮矩形三类区域，并叠加了噪声。',
 theory:()=>twoCol(eq('<mi>J</mi><mo>=</mo><munderover><mo>∑</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>K</mi></munderover><munder><mo>∑</mo><mrow><mi>z</mi><mo>∈</mo><msub><mi>C</mi><mi>i</mi></msub></mrow></munder><msup><mrow><mo>‖</mo><mi>z</mi><mo>−</mo><msub><mi>m</mi><mi>i</mi></msub><mo>‖</mo></mrow><mn>2</mn></msup>')+p('分配步骤在均值固定时使 J 最小，更新步骤在分配固定时使 J 最小，因此 J 单调不增，算法必然收敛，但可能停在局部最优。'),
  p('特征也可以是颜色 (R, G, B)，或再加入像素坐标以照顾空间连续性。只用灰度时，K 均值与多阈值分割相似，结果不保证区域连通。')+p('K 需要事先给定；比较两种初始化，可以看到初值对迭代次数的影响：等间距初值一次迭代即接近收敛。'))};

/* ---------- Backpropagation ---------- */
specs.backprop={controls:sel('x','输入 x',[['2','2（本章算例）'],['-1','−1（ReLU 截断）']])+sel('eta','学习率 η',[['0.1','0.1'],['0.3','0.3'],['0.8','0.8']]),
 model:h=>X.backprop(+val(h,'x'),2,+val(h,'eta')),max:()=>11,
 draw(m,k){const nodes={x:[60,190,'x',m.x],w1:[60,90,'w₁',m.p.w1],b1:[60,290,'b₁',m.p.b1],z:[210,190,'z',m.z],h:[350,190,'h = ReLU(z)',m.h],w2:[350,80,'w₂',m.p.w2],b2:[350,300,'b₂',m.p.b2],yh:[500,190,'ŷ',m.yh],y:[500,300,'y',m.y],L:[650,190,'L',m.L]};
  const fwd={z:1,h:2,yh:3,L:4},grad={yh:[5,m.dy],w2:[6,m.dw2],b2:[6,m.db2],h:[7,m.dh],z:[8,m.dz],w1:[9,m.dw1],b1:[9,m.db1]};
  const edges=[['x','z'],['w1','z'],['b1','z'],['z','h'],['h','yh'],['w2','yh'],['b2','yh'],['yh','L'],['y','L']];let s='';
  edges.forEach(([a,b])=>{const [x1,y1]=nodes[a],[x2,y2]=nodes[b];const active=k>=5&&k<=9&&grad[a]&&grad[a][0]===k;s+=`<line x1="${x1+40}" y1="${y1}" x2="${x2-42}" y2="${y2}" stroke="${active?C.red:C.gray}" stroke-width="${active?4:2}" marker-end="url(#axh)"/>`});
  Object.entries(nodes).forEach(([id,[x,y,label,v]])=>{const known=!(id in fwd)||k>=fwd[id];const g=grad[id];const showG=g&&k>=g[0]&&k<=10;
   s+=`<rect x="${x-40}" y="${y-26}" width="80" height="52" rx="8" fill="${known?C.light:'#fff'}" stroke="${(id in fwd)&&fwd[id]===k?C.gold:C.gray}" stroke-width="${(id in fwd)&&fwd[id]===k?4:1.5}"/>`+text(x,y-6,label,'text-anchor="middle" font-size="14"')+text(x,y+16,known?fmt(v,4):'?','text-anchor="middle" font-size="16" font-weight="700"');
   if(showG)s+=`<text x="${x}" y="${y+46}" text-anchor="middle" font-size="14" fill="${C.red}" font-weight="700">∂L/∂${esc(label.split(' ')[0])} = ${fmt(g[1],4)}</text>`});
  if(k>=10){s+=text(20,355,`更新：w₁ ${fmt(m.p.w1)}→${fmt(m.q.w1,4)}，b₁ ${fmt(m.p.b1)}→${fmt(m.q.b1,4)}，w₂ ${fmt(m.p.w2)}→${fmt(m.q.w2,4)}，b₂ ${fmt(m.p.b2)}→${fmt(m.q.b2,4)}`,'font-size="15"')}
  if(k>=11)s+=text(20,378,`重新前向：ŷ = ${fmt(m.yh2,5)}，L = ${fmt(m.L2,6)}（更新前 ${fmt(m.L,4)}）`,'font-size="15" font-weight="700"');
  const steps=['初始参数：w₁ = 1，b₁ = 0，w₂ = 0.5，b₂ = 0，目标 y = 2。',`前向 ① z = w₁x + b₁ = ${fmt(m.z)}`,`前向 ② h = ReLU(z) = ${fmt(m.h)}`,`前向 ③ ŷ = w₂h + b₂ = ${fmt(m.yh)}`,`前向 ④ L = ½(ŷ − y)² = ${fmt(m.L,4)}`,`反向 ① ∂L/∂ŷ = ŷ − y = ${fmt(m.dy)}`,`反向 ② ∂L/∂w₂ = ∂L/∂ŷ · h = ${fmt(m.dw2)}；∂L/∂b₂ = ${fmt(m.db2)}`,`反向 ③ ∂L/∂h = ∂L/∂ŷ · w₂ = ${fmt(m.dh)}`,`反向 ④ ∂L/∂z = ∂L/∂h · ReLU′(z) = ${fmt(m.dh)} × ${m.z>0?1:0} = ${fmt(m.dz)}`,`反向 ⑤ ∂L/∂w₁ = ∂L/∂z · x = ${fmt(m.dw1)}；∂L/∂b₁ = ${fmt(m.db1)}`,`更新：θ ← θ − η ∂L/∂θ，η = ${m.eta}`,`用新参数重新前向：L 从 ${fmt(m.L,4)} 变为 ${fmt(m.L2,6)}`];
  return {diagram:svg(s,720,390,'计算图上的前向与反向传播'),explain:`<h3>${k<=4?'前向计算':k<=9?'反向传播':'参数更新'}</h3>${p(steps[k])}${k===8&&m.z<=0?p('z ≤ 0 时 ReLU 的导数为 0，梯度在此截断，w₁、b₁ 本次不更新。'):''}${p('金框为本步刚算出的前向值；红字为反向得到的梯度，红色连线表示梯度正沿该边传回。')}`}}};
lessons.backprop={title:'反向传播：在计算图上先前向、再反向',
 intro:'沿用本节两层网络：z = w₁x + b₁，h = ReLU(z)，ŷ = w₂h + b₂，L = ½(ŷ − y)²。先从左到右算出并保存中间量，再从 L 出发用链式法则逐边向左传回梯度，最后更新参数并重新检验损失。',
 theory:()=>twoCol(eq('<mfrac><mrow><mo>∂</mo><mi>L</mi></mrow><mrow><mo>∂</mo><msub><mi>w</mi><mn>1</mn></msub></mrow></mfrac><mo>=</mo><mfrac><mrow><mo>∂</mo><mi>L</mi></mrow><mrow><mo>∂</mo><mover><mi>y</mi><mo>^</mo></mover></mrow></mfrac><mfrac><mrow><mo>∂</mo><mover><mi>y</mi><mo>^</mo></mover></mrow><mrow><mo>∂</mo><mi>h</mi></mrow></mfrac><mfrac><mrow><mo>∂</mo><mi>h</mi></mrow><mrow><mo>∂</mo><mi>z</mi></mrow></mfrac><mfrac><mrow><mo>∂</mo><mi>z</mi></mrow><mrow><mo>∂</mo><msub><mi>w</mi><mn>1</mn></msub></mrow></mfrac>')+p('每个因子是一条边的局部导数，只依赖前向时保存的量。反向传播从输出开始，把已算出的 ∂L/∂(下游) 乘以局部导数传给上游，因此每条边只计算一次。'),
  p('<strong>ReLU 截断</strong>：选择 x = −1 时 z < 0，ReLU′(z) = 0，梯度无法传到 w₁、b₁，只有 w₂、b₂ 更新。')+p('<strong>学习率</strong>：η 过大时一次更新可能越过最优点，重新前向后损失反而变大（可试 η = 0.8）。'))};

/* ---------- NMS ---------- */
const boxColor={A:'#347fa1',B:'#5a9fbe',C:'#8ab9cf',D:'#b35b51',E:'#d08a80',F:'#3c8a5c'};
specs.nms={controls:sel('thr','IoU 阈值',[['0.5','0.5'],['0.3','0.3'],['0.7','0.7']])+sel('minScore','分数阈值',[['0.3','0.3'],['0.5','0.5']]),
 model:h=>X.nms(+val(h,'thr'),+val(h,'minScore')),max:m=>m.states.length-1,
 draw(m,k){const st=m.states[k],sc=1.9,ox=20,oy=20;let s=rect(ox,oy,230*sc,210*sc,'#f5f8f9',`stroke="${C.gray}"`);
  m.boxes.forEach(b=>{const stt=st.status[b.id],isTop=st.top===b.id;const dash=stt==='sup'||stt==='low'?'stroke-dasharray="6 5"':'';const op=stt==='sup'||stt==='low'?0.35:1;
   s+=`<rect x="${ox+b.x1*sc}" y="${oy+b.y1*sc}" width="${(b.x2-b.x1)*sc}" height="${(b.y2-b.y1)*sc}" fill="none" stroke="${boxColor[b.id]}" stroke-width="${isTop||stt==='keep'?5:2.5}" opacity="${op}" ${dash}/>`;
   const at={A:['s',5,18],B:['e',-5,-8],C:['s',5,-8],D:['s',5,18],E:['e',-5,-8],F:['s',5,18]}[b.id],lx=at[0]==='s'?ox+b.x1*sc+at[1]:ox+b.x2*sc+at[1],ly=at[2]>0?oy+b.y1*sc+at[2]:oy+b.y2*sc+at[2];
   s+=`<text x="${lx}" y="${ly}" text-anchor="${at[0]==='s'?'start':'end'}" fill="${boxColor[b.id]}" font-size="15" font-weight="700" opacity="${op}">${b.id} ${b.s.toFixed(2)}</text>`});
  const lbl={cand:'候选',keep:'保留',sup:'抑制',low:'分数过低'};
  const rows=m.boxes.map(b=>[b.id,b.s.toFixed(2),lbl[st.status[b.id]],st.rows?(st.rows.find(r=>r.id===b.id)?fmt(st.rows.find(r=>r.id===b.id).iou,3):'—'):'—']);
  const head={start:'候选框与得分',sort:'按得分从高到低排序：'+(st.order||[]).join(' > '),pick:`保留当前最高分框 ${st.top}，计算它与其余候选的 IoU`,suppress:`IoU > ${m.thr} 的候选被抑制`,done:'没有剩余候选，NMS 结束'}[st.type];
  return {diagram:svg(s,480,440,'非极大值抑制过程'),explain:`<h3>${head}</h3>${table(['框','得分','状态',st.top?`与 ${st.top} 的 IoU`:'IoU'],rows,-1,'compact-table')}${p('两个目标各有多个重叠候选。阈值过低会把相邻目标 D 也抑制；阈值过高会留下重复框。')}`}}};
lessons.nms={title:'NMS：逐轮保留最高分框并抑制重叠框',
 intro:'左侧两个目标各有三个、两个重叠候选，另有一个低分框。每一轮保留剩余候选中得分最高的框，删除与它 IoU 超过阈值的候选，直到没有候选。',
 theory:()=>twoCol(eq('<mi>IoU</mi><mo>(</mo><mi>A</mi><mo>,</mo><mi>B</mi><mo>)</mo><mo>=</mo><mfrac><mrow><mo>|</mo><mi>A</mi><mo>∩</mo><mi>B</mi><mo>|</mo></mrow><mrow><mo>|</mo><mi>A</mi><mo>∪</mo><mi>B</mi><mo>|</mo></mrow></mfrac>')+p('A 与 B、C 的 IoU 约为 0.71、0.65；A 与 D 只有 0.05，属于不同目标。'),
  p('IoU 阈值改为 0.3 时结果不变；改为 0.7 时，与 A 的 IoU 为 0.71 的 B 被抑制，而 0.65 的 C 被保留，出现重复检测。')+p('分数阈值先删去低置信度框 F（0.35）。实际检测器通常按类别分别执行 NMS。'))};

})();
