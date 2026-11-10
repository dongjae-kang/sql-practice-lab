import { PGlite } from 'https://cdn.jsdelivr.net/npm/@electric-sql/pglite@0.5.11/dist/index.js';
import { schema } from './schema.js';
let db, config, salesLoading = false, lastResult;
const send = (type, data={}) => postMessage({type,...data});
async function checkedFetch(url) { const r=await fetch(url); if(!r.ok) throw Error(`Could not load ${url}: HTTP ${r.status}`); return r; }
async function assertCount(table, expected) {
 const r=await db.query(`SELECT COUNT(*) AS n FROM ${table}`); const count=Number(r.rows[0].n);
 if(count!==expected) throw Error(`${table}: expected ${expected.toLocaleString()} rows, loaded ${count.toLocaleString()}. Reset database to retry.`);
 send('count',{table,count});
}
async function init(c) {
 config=c; db=await PGlite.create();
 await db.exec(Object.entries(schema).map(([t,cols])=>`CREATE TABLE ${t} (${cols.map(([n,type])=>`${n} ${type}`).join(',')});`).join('\n'));
 for(const [t,n] of [['counties',99],['products',9977],['stores',1973]]) {
  const blob=await (await checkedFetch(`../data/${t}.csv`)).blob();
  await db.exec(`COPY ${t} FROM '/dev/blob' WITH (FORMAT csv)`,{blob}); await assertCount(t,n);
 }
 send('ready');
}
async function sales() {
 if(salesLoading) return; salesLoading=true;
 try {
 const r=await checkedFetch(new URL(config.salesFile,new URL('../',import.meta.url)));
 const total=Number(r.headers.get('Content-Length')); let loaded=0;
 const stream=r.body.pipeThrough(new TransformStream({transform(chunk,controller){loaded+=chunk.byteLength;send('progress',{loaded,total});controller.enqueue(chunk);}})).pipeThrough(new DecompressionStream('gzip'));
 const blob=await new Response(stream).blob(); send('loadingRows');
 await db.exec(`COPY sales FROM '/dev/blob' WITH (FORMAT csv)`,{blob}); await assertCount('sales',config.salesRows);
 send('salesReady');
 } catch(e) {send('fatal',{message:e.message,stage:'sales'});}
}
self.onmessage=async({data:m})=>{
 try {
 if(m.type==='init') await init(m.config);
 if(m.type==='sales') await sales();
 if(m.type==='refresh'){const counts={};for(const t of Object.keys(schema)){const r=await db.query(`SELECT COUNT(*) AS n FROM ${t}`);counts[t]=Number(r.rows[0].n)}send('refreshed',{counts})}
 if(m.type==='query') {
  const start=performance.now(); const all=await db.exec(m.sql,{rowMode:'array'});
  lastResult=all.findLast(r=>r.fields?.length) || {rows:[],fields:[]};
  send('result',{id:m.id,rows:lastResult.rows.slice(0,1000),fields:lastResult.fields,count:lastResult.rows.length,statements:all.length,ms:performance.now()-start});
 }
 if(m.type==='csv' && lastResult) {
  const quote=v=>v===null?'':`"${String(v).replaceAll('"','""')}"`;
  const csv=[lastResult.fields.map(f=>quote(f.name)).join(','),...lastResult.rows.map(r=>r.map(quote).join(','))].join('\r\n');
  send('csv',{blob:new Blob([csv],{type:'text/csv;charset=utf-8'})});
 }
 } catch(e) {send(m.type==='query'?'error':'fatal',{id:m.id,message:e.message,position:e.position,code:e.code});}
};
