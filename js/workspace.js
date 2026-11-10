// Course-specific affordances around the familiar Query Tool workspace.
export function setupWorkspace(api) {
 const $=id=>document.getElementById(id);
 let toastTimer, bannerTimer, exerciseSets=[];
 function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2400)}
 function showQuick(){api.selectTab('data');$('quick-start').hidden=false;$('table-wrap').hidden=true;$('row-limit').hidden=true;$('grid-note').hidden=true;}
 function hideQuick(remember=true){$('quick-start').hidden=true;$('table-wrap').hidden=false;if(remember)api.save('sql-lab-quick-dismissed',true)}
 $('dismiss-quick').onclick=()=>hideQuick();
 const samples=[['Browse products','SELECT * FROM products LIMIT 10;'],['Count products by category','SELECT category_name, COUNT(*) FROM products GROUP BY category_name ORDER BY 2 DESC;'],['Count active stores',"SELECT COUNT(*) FROM stores WHERE store_status = 'A';"],['Explore county populations','SELECT county, population FROM counties ORDER BY population DESC LIMIT 10;'],['Find the top stores by sales','SELECT store, SUM(total) FROM sales GROUP BY store ORDER BY 2 DESC LIMIT 10;']];
 for(const [label,sql]of samples){const b=document.createElement('button');b.className='sample-query';b.disabled=true;const name=document.createElement('span');name.textContent=label;const code=document.createElement('code');code.textContent=sql;b.append(name,code);b.onclick=()=>{hideQuick();api.setQuery(sql);api.run()};$('sample-queries').append(b)}
 if(!api.read('sql-lab-quick-dismissed',false))showQuick();
 function revealSide(name){api.selectTab(name);if(matchMedia('(max-width:1099px)').matches){$('sidebar').classList.add('open');$('sidebar-toggle').setAttribute('aria-expanded','true')}}
 const menus=[
  ['File',[
   ['Open SQL file',()=>$('open-file').click()],['Save SQL file',()=>$('save-file').click()],['Download results as CSV (F8)',()=>$('download').click(),()=>!api.hasResult()],['Reset database',api.reset]]],
  ['Object',[
   ['View first 100 rows of the selected table',()=>api.preview(false),()=>!api.ready()||api.busy()],['View all rows',()=>api.preview(true),()=>!api.ready()||api.busy()],['Refresh Object Explorer',()=>{revealSide('explorer');api.refresh()},()=>!api.ready()||api.busy()]]],
  ['Tools',[
   ['Query Tool',()=>{api.selectTab('query');api.editor.focus()}],['Practice',()=>revealSide('practice'),()=>!api.config.showExercises],['Load sales table',()=>{if(api.salesReady())toast('sales table ready');else if(api.ready())api.loadSales();else toast('Preparing the database. Please wait.')}],['Query History',()=>api.selectTab('history')]]],
  ['Help',[
   ['Quick start',showQuick],['Keyboard shortcuts',()=>$('shortcuts').showModal()],['Dataset notes',()=>{api.selectTab('messages');$('dataset-notes').open=true;$('dataset-notes').scrollIntoView({block:'nearest'})}],['About',()=>$('about').showModal()]]]
 ];
 let openIndex=-1;const triggers=[],popups=[];
 function closeMenu(focus=false){if(openIndex<0)return;const old=openIndex;popups[old].hidden=true;triggers[old].setAttribute('aria-expanded','false');openIndex=-1;if(focus)triggers[old].focus()}
 function openMenu(i,focus=false){closeMenu();const popup=popups[i];for(const [index,b]of [...popup.querySelectorAll('button')].entries())b.disabled=!!menus[i][1][index][2]?.();popup.hidden=false;triggers[i].setAttribute('aria-expanded','true');openIndex=i;if(focus)popup.querySelector('button:not(:disabled)')?.focus()}
 menus.forEach(([title,items],i)=>{const wrap=document.createElement('div');wrap.className='app-menu';const trigger=document.createElement('button');trigger.textContent=title;trigger.setAttribute('role','menuitem');trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-expanded','false');trigger.id='menu-'+title.toLowerCase();const popup=document.createElement('div');popup.className='menu-popup';popup.role='menu';popup.setAttribute('aria-label',title);popup.hidden=true;trigger.setAttribute('aria-controls',popup.id='popup-'+title.toLowerCase());triggers.push(trigger);popups.push(popup);trigger.onclick=()=>openIndex===i?closeMenu():openMenu(i);trigger.onkeydown=e=>{if(['ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();if(e.key==='ArrowDown'||e.key==='ArrowUp')openMenu(i,true);else{const n=(i+(e.key==='ArrowRight'?1:menus.length-1))%menus.length;openMenu(n);triggers[n].focus()}}};
  for(const [label,action]of items){const b=document.createElement('button');b.role='menuitem';b.textContent=label;b.onclick=()=>{closeMenu();action()};popup.append(b)}
  popup.onkeydown=e=>{const items=[...popup.querySelectorAll('button:not(:disabled)')],index=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:items.length-1))%items.length]?.focus()}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();openMenu((i+(e.key==='ArrowRight'?1:menus.length-1))%menus.length,true)}else if(e.key==='Tab')closeMenu();};wrap.append(trigger,popup);$('menubar').append(wrap);
 });
 document.addEventListener('click',e=>{if(!e.target.closest('.app-menu'))closeMenu()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openIndex>=0){e.preventDefault();closeMenu(true)}});
 $('shortcuts-close').onclick=()=>$('shortcuts').close();
 function onState(state,value){clearTimeout(bannerTimer);const banner=$('sales-banner'),label=$('sales-banner-text'),button=$('load-sales'),tree=$('tree-load-sales');banner.hidden=false;button.hidden=state!=='idle';tree.hidden=['ready','loading','rows'].includes(state);tree.disabled=!api.ready();document.querySelectorAll('.sample-query').forEach(b=>b.disabled=!api.ready());
  if(state==='initial'){label.textContent='Preparing the class database';$('sales-progress').value=0;button.hidden=true;tree.hidden=false;tree.disabled=true;}
  if(state==='idle'||state==='small-ready'){label.textContent='sales table is not loaded yet';$('sales-progress').value=0;}
  if(state==='loading'){label.textContent=`sales table (${api.config.salesRows.toLocaleString('en-US')} rows) is loading ${value}%`;$('sales-progress').value=value;}
  if(state==='rows'){label.textContent=`sales table (${api.config.salesRows.toLocaleString('en-US')} rows) is loading rows`;$('sales-progress').value=100;}
  if(state==='ready'){label.textContent='sales table ready';$('sales-progress').value=100;tree.hidden=true;bannerTimer=setTimeout(()=>banner.hidden=true,1200);}
  if(state==='failed'){label.textContent=`Sales load failed: ${value}. Use File > Reset database to retry.`;tree.hidden=true;}
 }
 function onSolved(solved){for(const set of exerciseSets){const el=document.querySelector(`[data-set="${set.id}"]`);if(el)el.textContent=`${set.exercises.filter(e=>solved.has(e.id)).length} of ${set.exercises.length}`}}
 return {toast,onState,onSolved,onExecute(){hideQuick();$('grid-note').hidden=true;},onExercises(data){exerciseSets=data.classes.filter(c=>c.status!=='upcoming').flatMap(c=>c.sets);$('practice-tab').textContent=`Practice · ${exerciseSets.reduce((n,s)=>n+s.exercises.length,0)}`;}};
}

export function enhanceGrid(table,result,note,toast){
 const headers=[...table.tHead.rows[0].cells],body=table.tBodies[0],rows=[...body.rows];let sorted=-1,ascending=true;
 // Fix widths only after the browser has measured natural column sizes.
 const widths=headers.map(h=>Math.max(70,h.getBoundingClientRect().width));
 const group=document.createElement('colgroup');widths.forEach(w=>{const col=document.createElement('col');col.style.width=w+'px';group.append(col)});table.prepend(group);table.style.tableLayout='fixed';table.style.width=widths.reduce((a,b)=>a+b,0)+'px';
 headers.slice(1).forEach((header,index)=>{
  header.setAttribute('aria-sort','none');const sort=document.createElement('button');sort.className='sort-column';sort.title=`Display sorting: ${result.fields[index].name}`;sort.setAttribute('aria-label',sort.title);while(header.firstChild)sort.append(header.firstChild);header.append(sort);
  sort.onclick=()=>{ascending=sorted===index?!ascending:true;sorted=index;headers.slice(1).forEach(h=>h.setAttribute('aria-sort','none'));header.setAttribute('aria-sort',ascending?'ascending':'descending');const numeric=[20,21,23,26,700,701,790,1700].includes(Number(result.fields[index].dataTypeID));const order=result.rows.map((r,i)=>({value:r[index],i})).sort((a,b)=>{let c;if(a.value===null||b.value===null)c=a.value===b.value?0:a.value===null?1:-1;else if(numeric)c=Number(String(a.value).replace(/[$,]/g,''))-Number(String(b.value).replace(/[$,]/g,''));else c=String(a.value).localeCompare(String(b.value));return (ascending?c:-c)||a.i-b.i});for(const {i}of order)body.append(rows[i]);note.textContent=`Display sorting: ${result.fields[index].name}, ${ascending?'ascending':'descending'}. Only the displayed ${rows.length.toLocaleString('en-US')} rows are sorted. SQL results and CSV are unchanged.`;note.hidden=false;};
  const handle=document.createElement('span');handle.className='column-resize';handle.role='separator';handle.tabIndex=0;handle.setAttribute('aria-orientation','vertical');handle.setAttribute('aria-label',`Resize ${result.fields[index].name}`);header.append(handle);
  const resize=w=>{widths[index+1]=Math.max(70,w);group.children[index+1].style.width=widths[index+1]+'px';table.style.width=widths.reduce((a,b)=>a+b,0)+'px'};
  handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const x=e.clientX,w=widths[index+1];handle.setPointerCapture(e.pointerId);handle.onpointermove=e=>resize(w+e.clientX-x);handle.onpointerup=()=>handle.onpointermove=null};handle.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();resize(widths[index+1]+(e.key==='ArrowRight'?20:-20))}};
 });
 for(const row of rows)for(const cell of [...row.cells].slice(1)){cell.title='Double-click to copy cell';cell.ondblclick=async()=>{try{await navigator.clipboard.writeText(cell.textContent);toast('Cell copied.')}catch{toast('Could not copy. Select the cell text and copy it.')}};}note.hidden=true;
}
