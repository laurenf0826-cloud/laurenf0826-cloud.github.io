export const covers=['02a78.png','4ab0a.png','825e3.png','36422.png'];
export const fields=['剧情推进','观众体验变化','感知重点','表演落点','镜头覆盖计划'];
export function makeSegment(id,index=0,locked=false){return {id,locked,duration:8,resolution:'480p',style:'电影写实',tab:'analysis',parallel:false,assetRevision:1,view:3,adopted:1,versions:Array.from({length:8},(_,i)=>({id:i+1,image:covers[index%4],analysis:fields.map(()=>''),prompt:i===2?'中景，镜头沿竹桥缓慢推进。人物停步回望，衣摆随风轻动，保持已选资产外观一致。':''})),nextVersion:9};}
export function initial(){return {episode:0,current:'SG02',episodes:[{name:'第 01 集',segments:[0,1,2,3].map(i=>makeSegment('SG0'+(i+1),i,i===3))},{name:'第 02 集',segments:[makeSegment('SG05',2),makeSegment('SG06',3,true)]},{name:'第 03 集',segments:[makeSegment('SG07',0,true),makeSegment('SG08',1,true)]}],nextSegment:9,updates:[],history:[],starred:false,appended:[]};}
export const current=s=>s.episodes[s.episode].segments.find(x=>x.id===s.current);
export const version=g=>g?.versions.find(v=>v.id===g.view);
export function removeVersion(g,id){if(g.locked)return false;g.versions=g.versions.filter(v=>v.id!==id);if(g.adopted===id)g.adopted=null;if(g.view===id)g.view=g.versions[0]?.id??null;return true;}
export function adoptVersion(g){if(g.locked||!version(g))return false;g.adopted=g.view;return true;}
export function applyUpdate(s,update,episodes){let count=0,skipped=0;for(const e of episodes){if(!update.pending.includes(e))continue;for(const g of s.episodes[e].segments){if(g.locked){skipped++;continue;}g.assetRevision++;for(const v of g.versions){v.prompt=v.prompt? v.prompt+'（已同步上游资产引用）':v.prompt;}count++;}update.pending=update.pending.filter(x=>x!==e);}s.history.push({title:update.title,result:`更新 ${count} 个片段，跳过 ${skipped} 个锁定片段；未生成视频。`});return {count,skipped};}
