import {showCheckGuide} from './check-guide.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sample=`竹林深处，日光被枝叶筛成细碎的金色，落在溪面上，随水一折一折地亮。画面随两岸的石头半藏在阴影里，沿着湿苔石缝一路踟蹰水边。溪水从远处的桥底下穿过，到了两块夹石之间，忽然急了，挤出一线白沫。一片竹叶随着微涌的波漂来。叶尖断得齐整，截面还带着鲜绿。它磕到岩边，短短停了一下，又被水带开。

随后，一只草鞋踏进浅水，踩散了倒影里的石头侧影与金色细碎的光。

几个戴斗笠的人沿左岸的一片竹坡停下。逆光下，他们形成一排剪影，和树立的竹影交汇，显得十分阴森复杂。这些斗笠人帽沿压得低，旧布衣下，各高高伸出一截刀鞘。他们没有挤到一处，彼此留着伸臂拔刀的空隙。此时摄影机横移，露出前景处走在最前面停在溪水中的人，他仰了仰身，把遮住桥头的路让出来。

对岸，一面窄旗擦过竹干。“裴”字在旗面上折起，又舒展开。

陆横舟扶着旗杆，抬眼望向来路。他身后的黑衣刀手先后转头，红缎带垂在衣摆之间。再靠岸的竹坡上，一人坐着，两人站着，背后均是一排黑衣侍卫；横在膝上的竹弓还没抬起，手却已经搭住了弓弦。

燕回山站在左岸前头。褐色兜帽遮住眉眼，只露出半张风尘未洗的脸。他没有看旗，也没有先找坐在对岸的人，目光落在桥边的水里。

燕身后的斗笠客低低蹲下来。从他们身后看过去，越过一层层帽沿，可以看见右岸青石旁的一把折椅。裴殿侯坐在那里，一柄旧油伞遮着肩头，伞外的光照亮了他膝上暗金色的衣纹。他伸直双腿，靴放在一个马扎上，鞋底干净干燥没有沾水。

两口贡箱被抬过竹径，落在桥头。竹杠卸下时轻轻一弹，抬箱人立刻握住，不让它再响。`;
export function seedScriptVersions(){return [1,2,3].map(id=>({id,title:'渡口来信',text:sample,published:id===1,updatedAt:Date.now(),color:'#ffd84d'}));}
export function mountScriptEditor(root,opts={}){
 const project=opts.project||{title:'渡口来信'},version=typeof opts.version==='object'?opts.version:(project.versions?.find(v=>v.id===opts.version)||project.versions?.[0]||seedScriptVersions()[0]);
 if(version.text==null)version.text=sample;
 const state=project.scriptUI??={side:null,tab:'ai',history:false,checks:[],records:[],episode:1};
 let disposed=false,timers=[],saveTimer=null,dirty=false,busy=false,modalAction=null,selection=null,ai={focus:['情绪强化'],requirement:'增强人物间的试探感，保留剧情信息。',result:'',applied:false,busy:false,error:''};
 const B=(txt,act,cls='',extra='')=>`<button class="${cls}" data-sc="${act}" ${extra}>${txt}</button>`;
 const I=(file,tip,act)=>B(`<img src="assets/${file}" alt="">`,act,'sc-icon',`title="${tip}" aria-label="${tip}"`);
 const change=()=>{version.updatedAt=Date.now();opts.onChange?.(project);};
 const later=(fn,ms=800)=>{const id=setTimeout(()=>{if(!disposed)fn();},ms);timers.push(id);};
 const toast=t=>{const el=root.querySelector('.sc-toast');if(el){el.textContent=t;el.classList.add('show');later(()=>el.classList.remove('show'),2600);}};
 function render(){const novelScroll=root.querySelector('.sc-novel')?.scrollTop||0;const old=root.querySelector('.sc-document')?.scrollTop||0;root.classList.add('sc-root');root.innerHTML=`<header class="sc-top"><div>${I('89f72.svg','展开正文','expand')}</div><span class="sc-center">${esc(project.title||'渡口来信')}</span><nav>${B(dirty?'未保存':'已保存','save','sc-save')}<div class="sc-publish">${B('发布','publish')}${B('⌄','publishMenu','sc-arrow')}</div>${I('bf7ce.svg','触发依赖关系校验','scan')}<span class="sc-notice-button">${I('355f3.svg','核验列表','checks')}${state.checks.length?`<i>${state.checks.length}</i>`:''}</span>${I('885f3.svg','查看原小说','source')}${I('ca52d.svg','AI 改写与文件详情','side')}</nav></header><div class="sc-work ${state.sourceOpen?'sc-parallel':''}">${state.sourceOpen?`<article class="sc-novel"><div class="sc-doc-head"><h1>${esc(project.title)} · 原小说</h1>${B('×','closeSource','sc-icon','aria-label="关闭原小说"')}</div><p class="sc-scene">原小说 <span class="sc-novel-save">已保存</span></p><div class="sc-novel-text" role="textbox" aria-label="原小说正文" aria-multiline="true" contenteditable="true" spellcheck="false">${esc(project.novelText??sample)}</div></article>`:''}<article class="sc-document"><div class="sc-doc-head"><h1>${esc(project.title||'渡口来信')}</h1><span>V${String(version.id??1).padStart(2,'0')}</span><select aria-label="剧本分集" data-sc-select="episode">${[1,2,3].map(n=>`<option value="${n}" ${state.episode===n?'selected':''}>第 ${String(n).padStart(2,'0')} 集</option>`).join('')}</select></div><p class="sc-scene">${['竹桥夜话 · 夜外','暗渡 · 河道 · 夜','桥头对峙 · 外景'][state.episode-1]}</p><div class="sc-text" role="textbox" aria-label="剧本正文" aria-multiline="true" contenteditable="true" spellcheck="false">${esc(textForEpisode())}</div><div class="sc-end">${B('＋ 继续上传','upload','sc-upload')}</div></article>${state.side?`<aside class="sc-side">${state.side==='checks'?checks():sidebar()}</aside>`:''}</div><div class="sc-modal-host"></div><div class="sc-menu-host"></div><div class="sc-toast" role="status"></div>`;root.querySelector('.sc-document').scrollTop=old;if(state.sourceOpen)root.querySelector('.sc-novel').scrollTop=novelScroll;}
 function textForEpisode(){return state.episode===1?version.text:(version.episodeTexts?.[state.episode]||sample);}
 function writeText(t){if(state.episode===1)version.text=t;else{version.episodeTexts??={};version.episodeTexts[state.episode]=t;}dirty=true;change();}
 function sidebar(){return `<div class="sc-tabs">${B('<img src="assets/7eab7.svg" alt=""> AI 改写','aiTab',state.tab==='ai'?'active':'')}${B('<img src="assets/dc8e4.svg" alt=""> 文件详情','detailsTab',state.tab==='details'?'active':'')}</div><div class="sc-side-content">${state.tab==='ai'?aiPanel():details()}</div>`;}
 function aiPanel(){return `<div class="sc-row"><h2>AI 辅助改写</h2>${B('×','closeSide','sc-close')}</div><p class="sc-caption">${selection?`改写对象：${esc(project.title)} · V${version.id} · 原选区`:'请在正文中选中文本，右键选择辅助改写'}</p><label class="sc-caption">改写重点</label><div class="sc-focus">${['情绪强化','对话打磨','节奏调整','画面细化'].map(x=>B(x,'focus',ai.focus.includes(x)?'active':'',`data-value="${x}"`)).join('')}</div>${B('<img src="assets/d1b02.svg" alt=""> 自定义skill','customSkill','sc-skill')}<label class="sc-caption">改写要求</label><textarea class="sc-requirement" aria-label="剧本改写要求" data-sc-input="requirement">${esc(ai.requirement)}</textarea>${ai.busy?'<p class="sc-progress">正在生成，请稍候…</p>':''}${ai.error?`<p class="sc-error">${esc(ai.error)}</p>`:''}${ai.result?`<p class="sc-caption">改写结果</p><div class="sc-result">${esc(ai.result)}</div><div class="sc-row">${B('重新生成','rewrite','',ai.busy?'disabled':'')}${B(ai.applied?'已采纳':'采纳应用','apply','sc-primary',ai.busy||ai.applied?'disabled':'')}</div>`:B('生成改写','rewrite','sc-primary sc-wide',!selection||ai.busy?'disabled':'')}<p class="sc-caption sc-footnote">结果会保留到下一轮改写；仅采纳后更新正文。</p>`;}
 function details(){return `<img class="sc-cover" src="assets/528a7.png" alt="项目预览"><h2>${esc(project.title)} · V${String(version.id).padStart(2,'0')}</h2><p class="sc-caption">竹桥夜话，故人因一封密信再相逢。</p><div class="sc-row sc-detail-actions">${B('复制分享链接','share')}${B('下载剧本','download')}</div><hr><p>所属文件夹　${esc(project.folder||'东方叙事')}</p><p>标签　<span class="sc-tag">悬疑</span> <span class="sc-tag">古装</span></p><hr><div class="sc-meta">创建日期　2026年10月18日<br>更新日期　${new Date(version.updatedAt||Date.now()).toLocaleDateString('zh-CN')}<br>总字数　${version.text.length.toLocaleString()}<br>总集数　3 集</div><h2>操作</h2>${[['修改颜色','color'],[project.starred?'取消重点标记':'重点标记','star'],['查看使用小说','source'],['查看下游资产包','assets'],['查看下游剧集','episodes'],['查看上一历史版本','previous'],['归档','archive']].map(([x,a])=>B(x,a,'sc-operation')).join('')}`;}
 function checks(){const items=state.history?state.records:state.checks;return `<div class="sc-side-content"><div class="sc-row"><h2>核验列表</h2>${B('×','closeSide','sc-close')}</div><div class="sc-row"><span class="sc-caption">${state.history?'历史核验记录':'待核验事项'}</span>${B(state.history?'返回待核验':'历史记录','history','sc-link')}</div>${items.length?items.map(x=>`<section class="sc-check"><b>${esc(x.title)}</b><p>${esc(x.description)}</p>${state.history?`<p class="sc-caption">${esc(x.result)}</p>`:`<div class="sc-row">${B('查看','checkView','',`data-id="${x.id}"`)}${B('忽略','checkIgnore','',`data-id="${x.id}"`)}${B('采纳','checkAccept','sc-primary',`data-id="${x.id}"`)}</div>`}</section>`).join(''):`<div class="sc-empty">${state.history?'暂无历史核验记录':'暂无待核验事项'}<p>${state.history?'处理后的核验记录会显示在这里。':'点击顶部手动核验，检查下游使用情况。'}</p></div>`}</div>`;}
 function modal(title,body,actions=B('关闭','cancel')){root.querySelector('.sc-modal-host').innerHTML=`<div class="sc-overlay"><section class="sc-modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h2>${title}</h2>${body}<footer>${actions}</footer></section></div>`;root.querySelector('.sc-modal button')?.focus();}
 function close(){root.querySelector('.sc-modal-host').innerHTML='';modalAction=null;}
 function confirm(title,body,fn,label='确认'){modalAction=fn;modal(title,`<p>${body}</p>`,B('取消','cancel')+B(label,'confirm','sc-primary'));}
 function publish(){version.published=true;version.publishedText=version.text;dirty=false;change();render();toast('已发布：修改的文本已覆盖原文，建议执行手动核验');}
 function startPublish(){if(Number(localStorage.getItem('jufeng-script-publish-muted-until')||0)>Date.now()){publish();return;}modal('确认发布',`<p>发布后，刚刚修改的文本将会直接覆盖原文，下游使用资产包与剧集可能会发生更新，建议稍后执行手动校验回扫。</p><p class="sc-caption">手动校验位置</p><div class="sc-nav-crop" aria-label="手动校验位置局部示意"><span>已保存</span><span>发布 ⌄</span><span class="sc-highlight"><img src="assets/bf7ce.svg" alt="手动校验"></span><img src="assets/355f3.svg" alt="核验列表"><img src="assets/885f3.svg" alt="原小说"><img src="assets/ca52d.svg" alt="侧栏"></div><label class="sc-check-label"><input type="checkbox" data-sc-mute> 本周不再提醒</label>`,B('取消','cancel')+B('确认发布','confirmPublish','sc-primary'));}
 function scan(){if(busy)return;busy=true;toast('正在核验下游使用情况…');later(()=>{busy=false;if(!state.checks.length)state.checks.push({id:Date.now(),title:'剧本更新 · 下游使用内容待核验',description:'渡口来信资产包与剧集使用了当前剧本，请查看并确认变更。'});state.history=false;change();render();toast('核验完成，发现 1 项待处理事项');},900);}
 function selectionFromDOM(){const s=window.getSelection();if(!s||s.isCollapsed||!root.querySelector('.sc-text')?.contains(s.anchorNode))return null;const text=s.toString();const full=textForEpisode(),start=full.indexOf(text);return start<0?null:{text,start,full,episode:state.episode};}
 function launchAI(){if(!selection){toast('请先在正文中选中文本');return;}state.side='details';state.tab='ai';render();}
 function rewrite(){if(!selection||ai.busy)return;const run=()=>{ai.applied=false;ai.busy=true;ai.error='';render();later(()=>{ai.busy=false;ai.result=selection.text.replace('踏进','缓缓踏入').replace('停下脚步','缓缓停住脚步');if(ai.result===selection.text)ai.result=selection.text+'\n风声渐静，人物之间的试探藏在短暂的停顿里。';render();},1000);};if(ai.result&&!ai.applied)confirm('重新生成改写？','当前未采纳的改写结果会被替换，原文保持不变。',()=>{close();run();});else run();}
 function apply(){if(!selection||ai.applied)return;const full=selection.episode===1?version.text:(version.episodeTexts?.[selection.episode]||sample);if(full.slice(selection.start,selection.start+selection.text.length)!==selection.text){ai.error='原选区已发生变化，请重新选择文本后改写。';render();return;}const next=full.slice(0,selection.start)+ai.result+full.slice(selection.start+selection.text.length);if(selection.episode===1)version.text=next;else{version.episodeTexts??={};version.episodeTexts[selection.episode]=next;}ai.applied=true;dirty=true;change();render();toast('已采纳到原选区，尚未发布');}
 const click=e=>{const el=e.target.closest('[data-sc]');if(!el||!root.contains(el)||el.disabled)return;const act=el.dataset.sc;switch(act){
 case 'expand':opts.onToggleFullscreen?.();break;
 case 'save':dirty=false;change();render();toast('已保存');break;
 case 'publish':startPublish();break;
 case 'publishMenu':root.querySelector('.sc-menu-host').innerHTML=`<div class="sc-publish-menu">${B('发布当前版本','publish')}${B('查看发布说明','publishHelp')}</div>`;break;
 case 'publishHelp':modal('发布说明','<p>保存保留当前草稿；发布后修改覆盖原文，下游更新需通过手动核验确认。</p>');break;
 case 'confirmPublish':if(root.querySelector('[data-sc-mute]')?.checked){const end=new Date();end.setDate(end.getDate()+(7-end.getDay())%7);end.setHours(23,59,59,999);localStorage.setItem('jufeng-script-publish-muted-until',String(+end));}close();publish();break;
 case 'scan':scan();showCheckGuide(()=>{state.side='checks';state.history=false;render();});break;
 case 'checks':state.side=state.side==='checks'?null:'checks';render();break;
 case 'side':state.side=state.side==='details'?null:'details';render();break;
 case 'closeSide':state.side=null;render();break;
 case 'aiTab':state.tab='ai';render();break;
 case 'detailsTab':state.tab='details';render();break;
 case 'focus':ai.focus=ai.focus.includes(el.dataset.value)?ai.focus.filter(x=>x!==el.dataset.value):[...ai.focus,el.dataset.value];render();break;
 case 'rewriteSelection':launchAI();break;
 case 'rewrite':rewrite();break;
 case 'apply':apply();break;
 case 'copy':navigator.clipboard?.writeText(selection?.text||'').then(()=>toast('已复制选中文本')).catch(()=>toast('浏览器未允许复制'));root.querySelector('.sc-menu-host').innerHTML='';break;
 case 'customSkill':modal('自定义 skill','<label>改写方式<input class="sc-custom" placeholder="例如：悬疑对话与试探感"></label>',B('取消','cancel')+B('添加','addSkill','sc-primary'));break;
 case 'addSkill':{const value=root.querySelector('.sc-custom')?.value.trim();if(!value)return;ai.requirement+=`\n使用 ${value}。`;close();render();break;}
 case 'history':state.history=!state.history;render();break;
 case 'checkView':modal('下游使用情况','<p>当前剧本被以下项目使用：</p><div class="sc-row">'+B('渡口来信资产包','assets')+B('渡口来信剧集','episodes')+'</div>');break;
 case 'checkAccept':case 'checkIgnore':{const item=state.checks.find(x=>String(x.id)===el.dataset.id);if(!item)break;confirm(act==='checkAccept'?'采纳这项核验结果？':'忽略这项核验结果？',act==='checkAccept'?'确认已检查下游使用情况，记录本次处理结果。':'该事项将移入历史核验记录。',()=>{state.checks=state.checks.filter(x=>x!==item);state.records.unshift({...item,result:act==='checkAccept'?'已采纳 · '+new Date().toLocaleString('zh-CN'):'已忽略 · '+new Date().toLocaleString('zh-CN')});change();close();render();},act==='checkAccept'?'确认采纳':'确认忽略');break;}
 case 'source':state.sourceOpen=!state.sourceOpen;render();change();break;
 case 'closeSource':state.sourceOpen=false;render();change();break;
 case 'assets':opts.onOpenAssets?.();break;
 case 'episodes':opts.onOpenEpisodes?.();break;
 case 'share':navigator.clipboard?.writeText(location.href).then(()=>toast('分享链接已复制')).catch(()=>toast('浏览器未允许复制'));break;
 case 'download':{const a=document.createElement('a'),url=URL.createObjectURL(new Blob([version.text],{type:'text/plain;charset=utf-8'}));a.href=url;a.download=`${project.title}-V${version.id}.txt`;a.click();later(()=>URL.revokeObjectURL(url));break;}
 case 'star':project.starred=!project.starred;change();render();break;
 case 'color':modal('修改项目颜色',`<div class="sc-colors">${['#ffd84d','#99ca8a','#b9a8ed','#e5a1a9','#91c7d9'].map(c=>B('', 'setColor','',`data-color="${c}" style="background:${c}" aria-label="颜色 ${c}"`)).join('')}</div>`);break;
 case 'setColor':project.color=el.dataset.color;change();close();toast('项目颜色已更新');break;
 case 'archive':confirm('归档项目？','项目将移入归档，可从主导航归档中恢复。',()=>{project.archived=true;change();close();toast('已归档，可在归档列表恢复');},'确认归档');break;
 case 'previous':{const list=project.versions||[];modal('历史版本',list.length?list.map(v=>`<p>V${v.id}　${esc(v.title||project.title)}　${v.published?'已发布':'草稿'}</p>`).join(''):'<p>暂无其他历史版本</p>');break;}
 case 'upload':modal('继续上传','<p>选择 TXT 文件，全文将续接到当前版本文末。</p><input type="file" accept=".txt,text/plain" data-sc-upload>',B('取消','cancel'));break;
 case 'cancel':close();break;
 case 'confirm':{const fn=modalAction;modalAction=null;fn?.();break;}
 }if(!['publishMenu'].includes(act)){const menu=root.querySelector('.sc-menu-host');if(menu)menu.innerHTML='';}};
 const input=e=>{if(e.target.matches('.sc-novel-text')){project.novelText=e.target.innerText;opts.onChange?.(project);}if(e.target.matches('.sc-text')){writeText(e.target.innerText);clearTimeout(saveTimer);saveTimer=setTimeout(()=>{if(!disposed){dirty=false;change();const label=root.querySelector('.sc-save');if(label)label.textContent='已保存';}},700);const label=root.querySelector('.sc-save');if(label)label.textContent='保存中…';}if(e.target.matches('[data-sc-input="requirement"]'))ai.requirement=e.target.value;};
 const select=e=>{if(e.target.matches('[data-sc-select="episode"]')){state.episode=+e.target.value;render();}if(e.target.matches('[data-sc-upload]')){const f=e.target.files[0];if(!f)return;f.text().then(t=>{if(disposed)return;if(!t.trim()){toast('文件内容为空');return;}writeText(textForEpisode()+'\n\n'+t);close();render();toast('已续接到当前版本文末');}).catch(()=>toast('读取失败，请重新选择文件'));}};
 const context=e=>{if(!e.target.closest('.sc-text'))return;const selected=selectionFromDOM();if(!selected)return;e.preventDefault();selection=selected;ai.result='';ai.applied=false;root.querySelector('.sc-menu-host').innerHTML=`<div class="sc-context" style="left:${Math.min(e.clientX,innerWidth-180)}px;top:${Math.min(e.clientY,innerHeight-110)}px">${B('<img src="assets/7eab7.svg" alt=""> AI 辅助改写','rewriteSelection')}${B('复制','copy')}</div>`;};
 const key=e=>{if(e.key==='Escape'){close();root.querySelector('.sc-menu-host').innerHTML='';}if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();dirty=false;change();render();toast('已保存');}};
 root.addEventListener('click',click);root.addEventListener('input',input);root.addEventListener('change',select);root.addEventListener('contextmenu',context);root.addEventListener('keydown',key);render();
 return ()=>{disposed=true;clearTimeout(saveTimer);timers.forEach(clearTimeout);root.removeEventListener('click',click);root.removeEventListener('input',input);root.removeEventListener('change',select);root.removeEventListener('contextmenu',context);root.removeEventListener('keydown',key);root.classList.remove('sc-root');};
}
