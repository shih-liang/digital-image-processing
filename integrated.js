(function(){
'use strict';
const fmt=(x,d=6)=>Number.isFinite(x)?Number(x.toFixed(d)).toString():'∞';
const math=s=>`<math xmlns="http://www.w3.org/1998/Math/MathML">${s}</math>`;
const sub=(x,k)=>`<msub><mi>${x}</mi><mrow>${k}</mrow></msub>`;
const eq=s=>`<div class="lesson-equation">${math(s)}</div>`;
const p=s=>`<p>${s}</p>`;
const native=(lesson,id)=>{const div=document.createElement('div');div.innerHTML=lesson.html;const el=div.querySelector(`[data-shape="${id}"] .text-content`);return el?`<div class="native-fragment">${el.innerHTML}</div>`:''};
const blocks=(lesson,pairs)=>`<div class="theory-grid">${pairs.map(([h,b])=>`<div>${native(lesson,h)}${native(lesson,b)}</div>`).join('')}</div>`;
const formula=r=>r.formula?`<div class="formula-row">${r.formula}</div>`:'';
const lessons={
 huffman:{
  intro:'六个符号的概率为 0.4、0.3、0.1、0.1、0.06、0.04。每轮合并当前最小的两个权重，将新节点重新插入队列，直至形成一棵编码树。',
  theory:(m,k,h,r)=>formula(r)+p('合并序列：0.04 + 0.06 = 0.10；0.10 + 0.10 = 0.20；0.10 + 0.20 = 0.30；0.30 + 0.30 = 0.60；0.40 + 0.60 = 1。并列权重允许不同的选择；码字可能改变，本例最优平均码长保持不变。左、右分支分别记为 0、1。'),
  present:(m,k,h,r)=>{r.explain=r.explain.replace('共 6 个符号，概率和为 1。先比较概率，再合并两个最小值。','下一步合并 0.04 与 0.06。');return r}
 },
 quantization:{
  title:'量化步长、码长与重建误差',
  intro:'输入样本为 [1, 3, 7, 12]，取值范围为 0～15。代表值从 0 起按步长排列，采用最近邻量化；恰处于两个代表值中点时，取较大值。',
  theory:(m,k,h,r,l)=>blocks(l,[[2,3],[4,5],[6,7],[8,9]]),
  present:(m,k,h,r)=>{r.explain=r.explain.split('<p>')[0]+p(`MSE = <strong>${fmt(m.mse,4)}</strong>；RMSE = ${fmt(m.rmse,4)}；PSNR = ${fmt(m.psnr,2)} dB（峰值 15）。`)+p(`索引 ${m.bits} bit/样本，载荷 ${m.originalBits} → ${m.encodedBits} bit；未计量化表、长度和格式开销。`);return r}
 },
 arithmetic:{
  title:'算术编码：区间递推与消息恢复',
  intro:m=>`P(A) = ${fmt(m.p,2)}，P(B) = ${fmt(1-m.p,2)}。消息 ${m.message} 逐符号缩小半开区间，图中各行按局部区间等宽放大。解码端须已知概率模型与消息长度。`,
  theory:(m,k,h,r)=>formula(r)+p(`完整消息的区间宽度为 ${fmt(m.high-m.low,8)}，等于各符号概率的乘积。基准消息 ABA 在 P(A) = 0.75 时得到 [0.5625, 0.703125)，可取码值 0.625 = 0.101₂。实际编码还需规定有限精度、重归一化与终止规则。`),
  present:(m,k,h,r)=>{
   r.explain=r.explain.replace('<p>每行均放大到相同宽度，以显示局部划分；真实区间长度随编码缩小。</p>','');
   if(k===m.message.length)r.explain=r.explain.replace(/<h3>.*?<\/h3>/,`<h3>解码结果：${m.decoded}</h3>`).replace(/<p>取码值[\s\S]*?<\/p>/,p(`码值 ≈ ${fmt(m.code,12)}；二进制 0.${m.binary}₂；消息长度为 ${m.message.length}。`)).replace('<table class="demo-table">','<table class="demo-table compact-table">').replace(`<p>解码结果：<strong>${m.decoded}</strong>。</p>`,'');
   return r;
  }
 },
 morphology:{
  title:(m,k,h)=>h.querySelector('[name="op"]').value==='erode'?'二维腐蚀：结构元素与可保留的原点位置':'二维膨胀：结构元素与输出区域',
  intro:'输入为 5 × 5 的实心方块，外周为背景。移动结构元素，逐点判定输出；切换方形、十字或竖线，比较结构元素的形状与尺寸对结果的影响。',
  theory:(m,k,h)=>h.querySelector('[name="op"]').value==='erode'
   ?eq('<mi>A</mi><mo>⊖</mo><mi>B</mi><mo>=</mo><mo>{</mo><mi>z</mi><mo>|</mo>'+sub('B','<mi>z</mi>')+'<mo>⊆</mo><mi>A</mi><mo>}</mo>')+p('腐蚀保留的是结构元素能够完全容纳于对象内部的原点位置。3 × 3 方形得到较小的实心方块；5 × 1 竖线与对象等高时，只保留一行原点。边界外取 0，坐标从 0 开始。')
   :eq('<mi>A</mi><mo>⊕</mo><mi>B</mi><mo>=</mo><mo>{</mo><mi>a</mi><mo>+</mo><mi>b</mi><mo>|</mo><mi>a</mi><mo>∈</mo><mi>A</mi><mo>,</mo><mi>b</mi><mo>∈</mo><mi>B</mi><mo>}</mo>')+p('膨胀将结构元素平移到各个前景位置并取并集。本例结构元素均关于原点对称；一般情况下，基于邻域交集的判定需要反射结构元素。边界外取 0，图中仅显示当前窗口。')
 },
 opening:{
  title:(m,k,h)=>h.querySelector('[name="op"]').value==='open'?'开运算：先腐蚀，再膨胀':'闭运算：先膨胀，再腐蚀',
  intro:'一维前景集合 A = {2, 3, 4, 7}，结构元素以原点为中心。两次运算使用同一结构元素；结果由运算顺序与结构元素尺寸共同决定。',
  theory:(m,k,h)=>m.first==='erode'
   ?eq('<mi>A</mi><mo>∘</mo><mi>B</mi><mo>=</mo><mo>(</mo><mi>A</mi><mo>⊖</mo><mi>B</mi><mo>)</mo><mo>⊕</mo><mi>B</mi>')+p('开运算等于所有能够完全容纳在 A 内的 B 的平移副本之并。半径为 1 时，腐蚀仅保留中心 3，再膨胀得到 {2, 3, 4}，孤立点 7 消失。对同一结构元素重复开运算，结果不变。')
   :eq('<mi>A</mi><mo>•</mo><mi>B</mi><mo>=</mo><mo>(</mo><mi>A</mi><mo>⊕</mo><mi>B</mi><mo>)</mo><mo>⊖</mo><mi>B</mi>')+p('闭运算能够填补结构元素可跨越的间隙。对同一结构元素重复闭运算，结果不变。集合运算定义在整个整数轴上；显示窗口的边缘不是集合的边界。')
 },
 reconstruction:{
  title:'形态学重建：标记、掩膜与迭代传播',
  intro:'从初始标记出发，反复进行膨胀并与掩膜求交。改变邻接关系或种子数量，观察传播路径和最终连通区域如何变化。',
  theory:(m,k,h,r,l)=>blocks(l,[[2,3],[4,5],[6,7],[8,9]])
 },
 otsu:{
  intro:'对样本 [1, 1, 2, 8, 9, 9] 遍历全部整数阈值。低灰度类取 x ≤ T，高灰度类取 x > T；存在空类别的阈值不参与最优值比较。',
  theory:(m,k,h,r)=>formula(r)+p('总体均值为 5，总体方差为 41/3。T = 2～7 时，类内方差为 2/9，类间方差为 41/3 − 2/9 = 121/9；这些阈值的分类结果相同。实现必须规定并列处理规则，本例返回最小最优阈值 2。')
 },
 hough:{
  title:'Hough 投票：从共线点到参数峰值',
  intro:'图像中的三个点 (0, 1)、(1, 1)、(2, 1) 对应参数空间中的三条曲线。逐点加入投票，比较不同角度与距离分辨率下的累加器。',
  theory:(m,k,h,r)=>formula(r)+p('θ = 0° 时，三个点分别投向 ρ = 0、1、2；θ = 90° 时，三票集中于 ρ = 1，对应直线 y = 1。峰值表示对同一参数的共同支持，不能直接确定线段端点。θ 按 10° 采样；金色直线采用 P₁ 在当前角度的量化 ρ。')
 },
 watershed:{
  title:'分水岭：路径屏障与标记竞争',
  intro:'一维地形的两端为标记。水位逐步上升，某位置被访问所需的高度，取决于整条可达路径上的最高屏障。可改变位置 4 的高度，观察区域竞争。',
  theory:(m,k,h,r)=>formula(r)+p('π 表示从标记 s 到位置 v 的一条路径，g 是地形高度；先求每条路径的最大高度，再在全部路径中取最小值。多个标记竞争时，比较各自的最低屏障，代价较小者优先占有；代价相同的位置保留为未定边界。平台与分水线仍需明确的处理规则。'),
  present:(m,k,h,r)=>{r.explain=r.explain.replace('<p>地形高度较低，也可能被较高屏障隔开。判定依赖整条路径。</p>','');return r}
 },
 gradient:{
  title:'梯度下降：同一损失函数中的学习率比较',
  intro:'目标函数 L(w) = (w − 2)²，梯度为 2(w − 2)，初始参数 w₀ = 0。选择学习率并逐次更新，同时观察参数、梯度和损失。',
  theory:(m,k,h,r)=>formula(r)+p('η = 0.2 时逐步趋近最优点；η = 0.5 时一步到达；η = 1.2 时振荡发散。稳定性取决于误差递推系数的绝对值与目标曲率。这一数值范围针对当前二次函数，不能直接推广到一般神经网络的非凸损失。')
 },
 convolution:{
  title:'卷积滑窗：共享权重、局部乘加与输出尺寸',
  intro:'同一个 3 × 3 核依次访问 5 × 5 输入的不同位置。金色区域表示当前窗口，蓝色表示已计算的输出；右侧展开本次的 9 项乘积。',
  theory:(m,k,h,r)=>formula(r)+p('H、K、P、S 分别为输入尺寸、核尺寸、填充量与步幅；宽度使用同一公式。步幅为 1、无填充时，输出为 3 × 3。本页采用深度学习中常用的互相关约定，核不翻转，偏置为 0；严格的离散卷积需翻转卷积核。均值核按精确的 1/9 计算。')
 },
 diffusion:{
  title:'扩散过程：前向加噪与反向生成',
  intro:'解析模型仅含十字与圆形两个图案，先验概率各为 1/2。前向过程逐步加入独立噪声；反向过程从独立初态出发，按当前状态的条件分布采样。',
  theory:(m,k,h,r)=>formula(r)+p('前向转移 q 已知；实际扩散模型通过训练学习反向条件分布 pθ。本页使用可精确计算的双原型模型，不含已训练神经网络；反向初态采自有限时刻边缘分布 q(xT)。反向生成不保证恢复指定原图；用于图像复原时还须引入观测约束，生成细节不等于测量事实。'),
  present:(m,k,h,r)=>{
   const reverse=h.querySelector('[name="mode"]').value==='reverse',t=reverse?m.T-k:k,previous=reverse?Math.min(m.T,t+1):Math.max(0,t-1);
   const arrays=reverse?{start:m.reverse[m.T],previous:m.reverse[previous],current:m.reverse[t]}:{start:m.forward[0],previous:m.forward[previous],current:m.forward[t]};
   const captions={start:reverse?'独立初态 x<sub>T</sub>':'原始图案 x<sub>0</sub>',previous:(k?'前一步':'初始状态')+` x<sub>${previous}</sub>`,current:(k?'当前状态':'尚未转移')+` x<sub>${t}</sub>`};
   r.diagram=`<div class="diffusion-images">${['start','previous','current'].map(key=>`<figure><canvas data-image="${key}" width="16" height="16" aria-label="${key==='start'?'过程起点':key==='previous'?'前一步图像':'当前状态图像'}"></canvas><figcaption>${captions[key]}<br>${key==='start'?(reverse?'从边缘分布独立采样':'前向加噪的固定起点'):key==='previous'?(reverse?'按反向条件分布转移':'加入新的高斯噪声'):`时间 ${t} / ${m.T}`}</figcaption></figure>`).join('')}</div>`;
   r.after=host=>host.querySelectorAll('canvas').forEach(canvas=>{const ctx=canvas.getContext('2d'),im=ctx.createImageData(16,16);arrays[canvas.dataset.image].forEach((v,i)=>{const gray=Math.round(255*Math.max(0,Math.min(1,(v+2)/4)));im.data.set([gray,gray,gray,255],i*4)});ctx.putImageData(im,0,0)});
   return r;
  }
 }
};
window.IntegratedLessons=lessons;
})();
