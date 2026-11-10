// Render only supplied course content. Upcoming classes never expose exercises.
export function renderPractice({data, solved, onSelect, salesReady}) {
 const root=document.getElementById('exercises');
 const classes=[...data.classes].sort((a,b)=>a.class-b.class);
 const latestCovered=classes.filter(c=>c.status==='covered').at(-1)?.class;
 const sets=classes.filter(c=>c.status!=='upcoming').flatMap(c=>c.sets);
 const labels={covered:'Covered in class',preview:'Preview',upcoming:'Added after class'};
 root.replaceChildren();
 document.getElementById('practice-tab').textContent=`Practice · ${sets.reduce((n,set)=>n+set.exercises.length,0)}`;
 for(const lesson of classes){
  const group=document.createElement('details');group.className='practice-class';group.dataset.class=lesson.class;group.dataset.status=lesson.status;group.open=lesson.class===latestCovered;
  const summary=document.createElement('summary');
  const title=document.createElement('span');title.className='class-title';title.textContent=lesson.title;
  const topic=document.createElement('span');topic.className='class-topic';topic.textContent=lesson.topic;
  const status=document.createElement('span');status.className='class-status';status.textContent=labels[lesson.status];
  summary.append(title,topic,status);group.append(summary);
  if(lesson.status==='preview'){const note=document.createElement('p');note.className='preview-note';note.textContent='Practice before class. Based on the course practice sheets; the class may cover it differently.';group.append(note)}
  if(lesson.status!=='upcoming')for(const set of lesson.sets){
   const d=document.createElement('details');d.className='set';d.dataset.setId=set.id;
   const s=document.createElement('summary');s.append(document.createTextNode(set.title));
   const progress=document.createElement('span');progress.className='set-progress';progress.dataset.set=set.id;
   progress.textContent=`${set.exercises.filter(ex=>solved.has(ex.id)).length} of ${set.exercises.length}`;s.append(progress);d.append(s);
   for(const ex of set.exercises){
    const b=document.createElement('button');b.className='exercise-button';b.dataset.id=ex.id;
    const prompt=document.createElement('span');prompt.textContent=ex.prompt;b.append(prompt);b.classList.toggle('solved',solved.has(ex.id));
    if(ex.needsSales){const note=document.createElement('span');note.className='sales-needed';note.textContent='Needs the sales table';note.hidden=salesReady; b.append(note)}
    b.onclick=()=>onSelect(ex,b);d.append(b);
   }
   group.append(d);
  }
  root.append(group);
 }
}

// Match query output, never the display-sorted grid. Missing/null first values cannot pass.
export function evaluateExercise(result,ex) {
 const fmt=n=>Number(n).toLocaleString('en-US');
 if(ex.expected===null||!ex.accept)return {message:'Check not available yet',match:null};
 let match, message;
 if(ex.check==='first'){
  const column=result.fields.findIndex(f=>f.name===ex.firstColumn);
  const value=column>=0&&result.count>0?result.rows[0]?.[column]:undefined;
  const actual=value===undefined?(column<0?`column "${ex.firstColumn}" not returned`:'no rows'):value===null?'[null]':String(value).trim();
  match=value==null?undefined:ex.accept.find(a=>String(value).trim()===String(a.value).trim());
  message=`First row: ${actual}. ${match?'Matches.':`Expected ${ex.accept.map(a=>String(a.value).trim()).join(' or ')}.`}`;
 }else{
  const value=ex.check==='value'&&result.count===1&&result.fields.length===1?result.rows[0][0]:null;
  match=ex.accept.find(a=>ex.check==='value'?value!==null&&Number.isFinite(Number(value))&&Math.abs(Number(value)-a.value)<=.001:result.count===a.count);
  const label=ex.check==='value'?'Value':'Rows',actual=ex.check==='value'?(value===null?'not a single value':fmt(value)):fmt(result.count);
  message=`${label}: ${actual}. ${match?`Matches the expected ${ex.check==='value'?'value':'row count'}.`:`Expected ${ex.accept.map(a=>fmt(ex.check==='value'?a.value:a.count)).join(' or ')}.`}`;
 }
 return {message,match:match||null};
}
