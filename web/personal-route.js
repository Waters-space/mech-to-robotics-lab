'use strict';
const PERSONAL_ROUTE_KEY='mech-robotics-personal-route-v1';
let personalRoute=null,routeSelectedNode=null,routeSelectedEdge=null,routeConnectFrom=null,routeGesture=null,routeObserver=null;
let routeScroll={x:0,y:0},routeStorageIssue=false,routeAnnouncement='';
let routeZoom=1;
const ROUTE_MIN_ZOOM=.05,ROUTE_MAX_ZOOM=2;
function routeId(){return crypto.randomUUID();}
function loadPersonalRoute(){
if(personalRoute)return personalRoute;
personalRoute={nodes:[],edges:[],updated:null};
try{
const raw=localStorage.getItem(PERSONAL_ROUTE_KEY);if(!raw)return personalRoute;
const value=JSON.parse(raw);if(!value||!Array.isArray(value.nodes)||!Array.isArray(value.edges))throw new Error('Invalid route');
const ids=new Set();
personalRoute.nodes=value.nodes.filter(n=>n&&typeof n.id==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(n.id)&&!ids.has(n.id)&&ids.add(n.id)&&((n.courseId&&getCourse(n.courseId))||(typeof n.title==='string'&&n.title.trim()))).map(n=>({id:n.id,courseId:getCourse(n.courseId)?.id||null,title:String(n.title||'').slice(0,80),x:Number.isFinite(n.x)?Math.max(24,Math.min(50000,n.x)):40,y:Number.isFinite(n.y)?Math.max(24,Math.min(50000,n.y)):40,learned:n.learned===true,note:typeof n.note==='string'?n.note.slice(0,8000):''}));
const validIds=new Set(personalRoute.nodes.map(n=>n.id));const edges=new Set();personalRoute.edges=value.edges.filter(e=>e&&typeof e.from==='string'&&typeof e.to==='string'&&validIds.has(e.from)&&validIds.has(e.to)&&e.from!==e.to&&!edges.has(e.from+'|'+e.to)&&edges.add(e.from+'|'+e.to)).map(e=>({from:e.from,to:e.to}));
personalRoute.updated=typeof value.updated==='string'?value.updated:null;
if(Number.isFinite(value.view?.zoom))routeZoom=Math.max(ROUTE_MIN_ZOOM,Math.min(ROUTE_MAX_ZOOM,value.view.zoom));
}catch{routeStorageIssue=true;routeAnnouncement='原有个人路线暂时无法读取；未覆盖保存的数据，本次编辑暂不保存。';}
return personalRoute;
}
function savePersonalRoute(){
if(routeStorageIssue){updateRouteSummary();routeAnnounce('浏览器存储不可用或原数据无法读取，当前编辑仅保留在本次打开期间。');return false;}
personalRoute.updated=new Date().toISOString();
personalRoute.view={zoom:routeZoom};
try{localStorage.setItem(PERSONAL_ROUTE_KEY,JSON.stringify(personalRoute));updateRouteSummary();return true;}catch{routeStorageIssue=true;updateRouteSummary();routeAnnounce('保存失败，当前编辑仅保留在本次打开期间。');return false;}
}
function routeNodeTitle(node){return getCourse(node.courseId)?.name||node.title;}
function routeNodeLearned(node){const c=getCourse(node.courseId);return node.learned||(c&&status(c)==='done');}
function personalRouteSection(){
loadPersonalRoute();
return `<section class="panel personal-route" aria-labelledby="personal-route-title"><div class="personal-route-heading"><div><span class="eyebrow">MY LEARNING PATH</span><h2 id="personal-route-title">我的个人路线</h2><p>把学过的课程连接起来，留下自己的学习顺序。</p></div><span id="route-summary" class="fine"></span></div>
<div class="route-editor-toolbar"><label for="route-course">课程模块</label><select id="route-course">${COURSES.map(c=>`<option value="${esc(c.id)}">${esc(c.name)} · ${statusName(status(c))}</option>`).join('')}</select><button type="button" class="button" data-route-action="add-course">添加课程</button><label class="route-custom-label" for="route-custom-title">自定义模块</label><input id="route-custom-title" maxlength="80" placeholder="例如：第一个电机实验"><button type="button" class="button secondary" data-route-action="add-custom">添加</button><button type="button" class="button secondary" data-route-action="arrange">整理布局</button></div>
<div class="route-view-controls" role="group" aria-label="路线画布缩放"><button type="button" class="button secondary" data-route-action="zoom-out" aria-label="缩小画布">−</button><output id="route-zoom-level" aria-live="polite">${Math.round(routeZoom*100)}%</output><button type="button" class="button secondary" data-route-action="zoom-in" aria-label="放大画布">＋</button><button type="button" class="button secondary" data-route-action="zoom-reset">重置视图</button><button type="button" class="button secondary" data-route-action="zoom-fit">适应全图</button></div>
<p class="route-editor-help">拖动模块任意位置即可移动；从右侧圆点拖到另一模块左侧圆点连线，也可依次点击两个圆点。用上方按钮或 Ctrl + 滚轮缩放，拖动画布空白处平移。选中模块或连线后可编辑或删除。</p>
<div class="route-editor-workspace"><div class="route-viewport" id="route-viewport" tabindex="0" aria-label="个人学习路线画布，可缩放和滚动查看"><div id="route-space" class="route-space"><div id="route-stage" class="route-stage"><svg id="route-wires" class="route-wires" aria-label="模块之间的学习顺序"></svg><div id="route-nodes"></div><div id="route-empty" class="route-editor-empty">从上方添加第一门课程<br><small>每条连线表示你从哪个模块学到了哪个模块</small></div></div></div></div><aside id="route-selection" class="route-selection" aria-label="选中内容的编辑面板"></aside></div>
<p id="route-message" class="route-editor-message" role="status" aria-live="polite"></p><p class="fine route-storage-note">路线、位置和心得自动保存在当前浏览器；个人路线的“学过”标记单独记录，课程知识任务完成后也会显示已掌握。</p></section>`;
}
function routeAnnounce(message){routeAnnouncement=message;const el=document.getElementById('route-message');if(el)el.textContent=message;}
function updateRouteSummary(){const el=document.getElementById('route-summary');if(el)el.textContent=`${personalRoute.nodes.length} 个模块 · ${personalRoute.edges.length} 条连线 · ${routeStorageIssue?'仅本次打开':personalRoute.updated?'已自动保存':'当前浏览器保存'}`;}
function routeDimensions(){const v=document.getElementById('route-viewport');return {width:Math.max(1100,(v?.clientWidth||0)/routeZoom,...personalRoute.nodes.map(n=>n.x+300)),height:Math.max(500,(v?.clientHeight||0)/routeZoom,...personalRoute.nodes.map(n=>n.y+215))};}
function sizeRouteStage(){const stage=document.getElementById('route-stage');if(!stage)return;const d=routeDimensions();stage.style.width=d.width+'px';stage.style.height=d.height+'px';stage.style.transform=`scale(${routeZoom})`;const space=document.getElementById('route-space');space.style.width=Math.ceil(d.width*routeZoom)+'px';space.style.height=Math.ceil(d.height*routeZoom)+'px';const svg=document.getElementById('route-wires');svg.setAttribute('width',d.width);svg.setAttribute('height',d.height);}
function updateRouteZoomControls(){const output=document.getElementById('route-zoom-level');if(!output)return;output.textContent=Math.round(routeZoom*100)+'%';document.querySelector('[data-route-action="zoom-out"]').disabled=routeZoom<=ROUTE_MIN_ZOOM;document.querySelector('[data-route-action="zoom-in"]').disabled=routeZoom>=ROUTE_MAX_ZOOM;}
function setRouteZoom(value,anchor){
const v=document.getElementById('route-viewport');if(!v||routeGesture)return;
const next=Math.max(ROUTE_MIN_ZOOM,Math.min(ROUTE_MAX_ZOOM,value)),a=anchor||{x:v.clientWidth/2,y:v.clientHeight/2},world={x:(v.scrollLeft+a.x)/routeZoom,y:(v.scrollTop+a.y)/routeZoom};
routeZoom=next;sizeRouteStage();v.scrollLeft=world.x*routeZoom-a.x;v.scrollTop=world.y*routeZoom-a.y;routeScroll={x:v.scrollLeft,y:v.scrollTop};updateRouteZoomControls();drawRouteWires();savePersonalRoute();
}
function fitRouteView(){
const v=document.getElementById('route-viewport');if(!v)return;if(!personalRoute.nodes.length){setRouteZoom(1);v.scrollTo(0,0);return;}
const minX=Math.min(...personalRoute.nodes.map(n=>n.x)),minY=Math.min(...personalRoute.nodes.map(n=>n.y)),maxX=Math.max(...personalRoute.nodes.map(n=>n.x+230)),maxY=Math.max(...personalRoute.nodes.map(n=>n.y+158));
setRouteZoom(Math.min(1,(v.clientWidth-48)/(maxX-minX+48),(v.clientHeight-48)/(maxY-minY+48)));v.scrollLeft=(minX+maxX)/2*routeZoom-v.clientWidth/2;v.scrollTop=(minY+maxY)/2*routeZoom-v.clientHeight/2;routeScroll={x:v.scrollLeft,y:v.scrollTop};
}
function mountPersonalRoute(){
if(!document.getElementById('route-stage')){routeObserver?.disconnect();return;}
drawRouteNodes();drawRouteSelection();updateRouteSummary();updateRouteZoomControls();routeAnnounce(routeAnnouncement);const viewport=document.getElementById('route-viewport');viewport.scrollLeft=routeScroll.x;viewport.scrollTop=routeScroll.y;
viewport.addEventListener('scroll',()=>{routeScroll={x:viewport.scrollLeft,y:viewport.scrollTop};},{passive:true});
viewport.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();const rect=viewport.getBoundingClientRect();setRouteZoom(routeZoom*Math.exp(-Math.max(-100,Math.min(100,e.deltaY))*.003),{x:e.clientX-rect.left,y:e.clientY-rect.top});},{passive:false});
routeObserver?.disconnect();routeObserver=new ResizeObserver(()=>{sizeRouteStage();drawRouteWires();});routeObserver.observe(viewport);requestAnimationFrame(drawRouteWires);
}
function drawRouteNodes(){
const root=document.getElementById('route-nodes');if(!root)return;
root.innerHTML=personalRoute.nodes.map(n=>`<article class="route-node ${n.id===routeSelectedNode?'selected':''}" data-route-node="${esc(n.id)}" style="left:${n.x}px;top:${n.y}px"><button type="button" class="route-node-grip" data-route-grip="${esc(n.id)}" aria-label="移动或选中${esc(routeNodeTitle(n))}，方向键微调"><span aria-hidden="true">⠿</span><strong>${esc(routeNodeTitle(n))}</strong></button><div class="route-node-content"><span class="badge ${routeNodeLearned(n)?'done':'new'}">${routeNodeLearned(n)?'学过 / 已掌握':'待记录'}</span><small>${n.courseId?'课程模块':'自定义模块'}${n.note?' · 有心得':''}</small></div><button type="button" class="route-port input" data-route-port="in" data-route-id="${esc(n.id)}" aria-label="${esc(routeNodeTitle(n))}的左侧连接点"></button><button type="button" class="route-port output ${routeConnectFrom===n.id?'active':''}" data-route-port="out" data-route-id="${esc(n.id)}" aria-label="${esc(routeNodeTitle(n))}的右侧连接点"></button></article>`).join('');
document.getElementById('route-empty').hidden=personalRoute.nodes.length>0;sizeRouteStage();drawRouteWires();
}
function routePoint(id,side){const el=[...document.querySelectorAll('[data-route-node]')].find(n=>n.dataset.routeNode===id)?.querySelector(`[data-route-port="${side}"]`);const stage=document.getElementById('route-stage');if(!el||!stage)return null;const r=el.getBoundingClientRect(),s=stage.getBoundingClientRect();return {x:(r.left+r.width/2-s.left)/routeZoom,y:(r.top+r.height/2-s.top)/routeZoom};}
function routeCurve(a,b){const bend=Math.max(65,Math.abs(b.x-a.x)*.48);return `M ${a.x} ${a.y} C ${a.x+bend} ${a.y}, ${b.x-bend} ${b.y}, ${b.x} ${b.y}`;}
function drawRouteWires(){
const svg=document.getElementById('route-wires');if(!svg)return;
svg.innerHTML='<defs><marker id="personal-route-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#78a9ff"/></marker></defs>'+personalRoute.edges.map(e=>{const a=routePoint(e.from,'out'),b=routePoint(e.to,'in');if(!a||!b)return '';const key=e.from+'|'+e.to,title=routeNodeTitle(personalRoute.nodes.find(n=>n.id===e.from))+' → '+routeNodeTitle(personalRoute.nodes.find(n=>n.id===e.to));return `<g class="route-edge ${routeSelectedEdge===key?'selected':''}"><path class="route-edge-visible" d="${routeCurve(a,b)}" marker-end="url(#personal-route-arrow)"/><path class="route-edge-hit" d="${routeCurve(a,b)}" data-route-edge="${esc(key)}" role="button" tabindex="0" aria-label="选择连线：${esc(title)}"><title>${esc(title)}</title></path></g>`;}).join('');
if(routeConnectFrom&&routeGesture?.kind==='wire'&&routeGesture.point){const a=routePoint(routeConnectFrom,'out');if(a)svg.insertAdjacentHTML('beforeend',`<path class="route-wire-draft" d="${routeCurve(a,routeGesture.point)}"/>`);}
}
function drawRouteSelection(){
const pane=document.getElementById('route-selection');if(!pane)return;
const n=personalRoute.nodes.find(n=>n.id===routeSelectedNode);
if(n){const completedByCourse=n.courseId&&status(getCourse(n.courseId))==='done';pane.innerHTML=`<h3>${esc(routeNodeTitle(n))}</h3><p class="fine">选中模块 · 可拖动整个模块或用方向键移动</p><label class="route-learned-label"><input type="checkbox" id="route-node-learned" ${routeNodeLearned(n)?'checked':''} ${completedByCourse?'disabled':''}> 我已经学过这个模块</label>${completedByCourse?'<p class="fine">课程知识任务已全部完成。</p>':''}<label for="route-node-note">学习心得 / 学习日期</label><textarea id="route-node-note" maxlength="8000" placeholder="例如：10 月 2 日完成，下一步做编码器实验…">${esc(n.note)}</textarea>${n.courseId?`<button class="button secondary" data-course="${esc(n.courseId)}">查看课程与中文视频</button>`:''}<button class="route-delete" data-route-action="delete-node">删除此模块及相关连线</button>`;return;}
if(routeSelectedEdge){const e=personalRoute.edges.find(e=>e.from+'|'+e.to===routeSelectedEdge);if(e){pane.innerHTML=`<h3>学习顺序连线</h3><p>${esc(routeNodeTitle(personalRoute.nodes.find(n=>n.id===e.from)))}<br><span class="route-direction">学习后进入</span><br>${esc(routeNodeTitle(personalRoute.nodes.find(n=>n.id===e.to)))}</p><button class="route-delete" data-route-action="delete-edge">删除这条连线</button>`;return;}}
pane.innerHTML='<h3>记录你的学习顺序</h3><p>选择一个模块，记录是否学过、学习日期和心得。</p><p>连线表示个人学习顺序，可以与站内建议先修顺序不同。</p><p class="fine">键盘也可操作：Tab 选择连接点，Enter 点击连接；选中标题后用方向键移动。</p>';
}
function selectRouteNode(id){routeSelectedNode=id;routeSelectedEdge=null;document.querySelectorAll('[data-route-node]').forEach(n=>n.classList.toggle('selected',n.dataset.routeNode===id));drawRouteSelection();drawRouteWires();}
function selectRouteEdge(key){routeSelectedEdge=key;routeSelectedNode=null;document.querySelectorAll('[data-route-node]').forEach(n=>n.classList.remove('selected'));drawRouteSelection();drawRouteWires();}
function cancelRouteConnection(){routeConnectFrom=null;routeGesture=null;document.getElementById('route-stage')?.classList.remove('panning');document.querySelectorAll('.route-port.active').forEach(p=>p.classList.remove('active'));drawRouteWires();}
function connectRouteNodes(from,to){
if(from===to){routeAnnounce('请选择另一个模块的左侧连接点。');return;}
if(personalRoute.edges.some(e=>e.from===from&&e.to===to)){cancelRouteConnection();routeAnnounce('这两个模块已经连接。');return;}
const pending=[to],seen=new Set();while(pending.length){const id=pending.pop();if(id===from){cancelRouteConnection();routeAnnounce('这条连线会形成循环，请按学习先后顺序连接。');return;}if(seen.has(id))continue;seen.add(id);personalRoute.edges.filter(e=>e.from===id).forEach(e=>pending.push(e.to));}
personalRoute.edges.push({from,to});cancelRouteConnection();savePersonalRoute();routeAnnounce('已连接两个模块，支持继续添加分支。');
}
function addRouteNode(courseId,title){
const existing=courseId&&personalRoute.nodes.find(n=>n.courseId===courseId);if(existing){selectRouteNode(existing.id);document.querySelector(`[data-route-node="${existing.id}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});routeAnnounce('这门课程已在画布中，可以继续连接。');return;}
let i=0,x=40,y=40;while(personalRoute.nodes.some(n=>Math.abs(n.x-x)<260&&Math.abs(n.y-y)<190)){i++;x=40+(i%3)*320;y=40+Math.floor(i/3)*220;}const n={id:routeId(),courseId:courseId||null,title:title||'',x,y,learned:courseId?status(getCourse(courseId))==='done':false,note:''};
personalRoute.nodes.push(n);routeSelectedNode=n.id;routeSelectedEdge=null;drawRouteNodes();drawRouteSelection();savePersonalRoute();document.querySelector(`[data-route-node="${n.id}"]`)?.scrollIntoView({block:'nearest',inline:'nearest'});routeAnnounce('已添加 '+routeNodeTitle(n)+'，可拖动整个模块调整位置。');
}
function arrangeRoute(){
const indegree=new Map(personalRoute.nodes.map(n=>[n.id,0])),levels=new Map(personalRoute.nodes.map(n=>[n.id,0]));personalRoute.edges.forEach(e=>indegree.set(e.to,indegree.get(e.to)+1));const queue=personalRoute.nodes.filter(n=>indegree.get(n.id)===0).map(n=>n.id);let visited=0;
while(queue.length){const id=queue.shift();visited++;personalRoute.edges.filter(e=>e.from===id).forEach(e=>{levels.set(e.to,Math.max(levels.get(e.to),levels.get(id)+1));indegree.set(e.to,indegree.get(e.to)-1);if(indegree.get(e.to)===0)queue.push(e.to);});}
if(visited!==personalRoute.nodes.length){routeAnnounce('已有循环连线，请先删除循环中的连线再整理布局。');return;}
const rows=new Map();personalRoute.nodes.forEach(n=>{const level=levels.get(n.id),row=rows.get(level)||0;n.x=40+level*320;n.y=40+row*220;rows.set(level,row+1);});drawRouteNodes();savePersonalRoute();routeAnnounce('已按连线顺序整理布局。');
}
document.addEventListener('click',e=>{
const root=e.target.closest('.personal-route');if(!root)return;
const action=e.target.closest('[data-route-action]')?.dataset.routeAction;
if(action==='add-course')addRouteNode(document.getElementById('route-course').value);
if(action==='add-custom'){const input=document.getElementById('route-custom-title');const title=input.value.trim();if(!title){routeAnnounce('先填写自定义模块名称。');input.focus();return;}addRouteNode(null,title);input.value='';}
if(action==='arrange')arrangeRoute();
if(action==='zoom-out')setRouteZoom(routeZoom/1.2);
if(action==='zoom-in')setRouteZoom(routeZoom*1.2);
if(action==='zoom-reset'){setRouteZoom(1);document.getElementById('route-viewport').scrollTo(0,0);routeScroll={x:0,y:0};}
if(action==='zoom-fit')fitRouteView();
if(action==='delete-node'){const id=routeSelectedNode;personalRoute.nodes=personalRoute.nodes.filter(n=>n.id!==id);personalRoute.edges=personalRoute.edges.filter(e=>e.from!==id&&e.to!==id);routeSelectedNode=null;cancelRouteConnection();drawRouteNodes();drawRouteSelection();savePersonalRoute();routeAnnounce('已删除模块及相关连线。');}
if(action==='delete-edge'){personalRoute.edges=personalRoute.edges.filter(e=>e.from+'|'+e.to!==routeSelectedEdge);routeSelectedEdge=null;drawRouteWires();drawRouteSelection();savePersonalRoute();routeAnnounce('已删除连线。');}
const port=e.target.closest('[data-route-port]');if(port){if(port.dataset.routePort==='out'){routeConnectFrom=port.dataset.routeId;document.querySelectorAll('.route-port.active').forEach(p=>p.classList.remove('active'));port.classList.add('active');routeAnnounce('再点击下一模块左侧圆点，或按 Esc 取消。');}else if(routeConnectFrom)connectRouteNodes(routeConnectFrom,port.dataset.routeId);else routeAnnounce('先点击上一模块右侧圆点。');return;}
const edge=e.target.closest('[data-route-edge]');if(edge){selectRouteEdge(edge.dataset.routeEdge);return;}
const node=e.target.closest('[data-route-node]');if(node&&routeSelectedNode!==node.dataset.routeNode)selectRouteNode(node.dataset.routeNode);
});
document.addEventListener('input',e=>{if(e.target.id==='route-node-note'){const n=personalRoute.nodes.find(n=>n.id===routeSelectedNode);if(n){n.note=e.target.value;savePersonalRoute();}}});
document.addEventListener('change',e=>{if(e.target.id==='route-node-learned'){const n=personalRoute.nodes.find(n=>n.id===routeSelectedNode);if(n){n.learned=e.target.checked;drawRouteNodes();savePersonalRoute();routeAnnounce('已更新个人学习记录。');}}});
document.addEventListener('pointerdown',e=>{
if(!e.isPrimary||e.button!==0)return;const stage=e.target.closest('#route-stage');if(!stage)return;const port=e.target.closest('[data-route-port]');const node=e.target.closest('[data-route-node]');
if(port?.dataset.routePort==='out'){routeConnectFrom=port.dataset.routeId;routeGesture={kind:'wire',id:e.pointerId,startX:e.clientX,startY:e.clientY,point:null};port.classList.add('active');stage.setPointerCapture(e.pointerId);}
else if(node&&!port){const n=personalRoute.nodes.find(n=>n.id===node.dataset.routeNode);selectRouteNode(n.id);routeGesture={kind:'node',id:e.pointerId,node:n.id,startX:e.clientX,startY:e.clientY,x:n.x,y:n.y,scrollX:document.getElementById('route-viewport').scrollLeft,scrollY:document.getElementById('route-viewport').scrollTop};stage.setPointerCapture(e.pointerId);e.preventDefault();}
else if(!port&&!e.target.closest('[data-route-edge]')){const v=document.getElementById('route-viewport');routeGesture={kind:'pan',id:e.pointerId,startX:e.clientX,startY:e.clientY,x:v.scrollLeft,y:v.scrollTop};stage.classList.add('panning');stage.setPointerCapture(e.pointerId);e.preventDefault();}
});
document.addEventListener('pointermove',e=>{
if(!routeGesture||routeGesture.id!==e.pointerId)return;const stage=document.getElementById('route-stage');if(!stage){routeGesture=null;return;}const r=stage.getBoundingClientRect();
if(routeGesture.kind==='wire'){routeGesture.point={x:(e.clientX-r.left)/routeZoom,y:(e.clientY-r.top)/routeZoom};drawRouteWires();}
else if(routeGesture.kind==='pan'){const v=document.getElementById('route-viewport');v.scrollLeft=routeGesture.x+routeGesture.startX-e.clientX;v.scrollTop=routeGesture.y+routeGesture.startY-e.clientY;}
else{const n=personalRoute.nodes.find(n=>n.id===routeGesture.node),v=document.getElementById('route-viewport');n.x=Math.max(24,Math.min(50000,routeGesture.x+(e.clientX-routeGesture.startX+v.scrollLeft-routeGesture.scrollX)/routeZoom));n.y=Math.max(24,Math.min(50000,routeGesture.y+(e.clientY-routeGesture.startY+v.scrollTop-routeGesture.scrollY)/routeZoom));const el=document.querySelector(`[data-route-node="${n.id}"]`);el.style.left=n.x+'px';el.style.top=n.y+'px';sizeRouteStage();drawRouteWires();}
});
document.addEventListener('pointerup',e=>{
if(!routeGesture||routeGesture.id!==e.pointerId)return;const gesture=routeGesture;routeGesture=null;const stage=document.getElementById('route-stage');stage?.classList.remove('panning');if(stage?.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);
if(gesture.kind==='node'){savePersonalRoute();return;}
if(gesture.kind==='pan')return;
const port=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-route-port="in"]');if(port&&routeConnectFrom)connectRouteNodes(routeConnectFrom,port.dataset.routeId);else{drawRouteWires();routeAnnounce('点击下一模块左侧圆点完成连接，或按 Esc 取消。');}
});
document.addEventListener('pointercancel',()=>{if(routeGesture?.kind==='node')savePersonalRoute();document.getElementById('route-stage')?.classList.remove('panning');cancelRouteConnection();});
document.addEventListener('keydown',e=>{
if(e.key==='Escape'&&routeConnectFrom){cancelRouteConnection();routeAnnounce('已取消连接。');return;}
const edge=e.target.closest?.('[data-route-edge]');if(edge&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectRouteEdge(edge.dataset.routeEdge);}
const grip=e.target.closest?.('[data-route-grip]');if(grip&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const n=personalRoute.nodes.find(n=>n.id===grip.dataset.routeGrip),d=e.shiftKey?40:10;n.x=Math.max(24,Math.min(50000,n.x+(e.key==='ArrowLeft'?-d:e.key==='ArrowRight'?d:0)));n.y=Math.max(24,Math.min(50000,n.y+(e.key==='ArrowUp'?-d:e.key==='ArrowDown'?d:0)));selectRouteNode(n.id);grip.closest('[data-route-node]').style.left=n.x+'px';grip.closest('[data-route-node]').style.top=n.y+'px';sizeRouteStage();drawRouteWires();savePersonalRoute();}
});
