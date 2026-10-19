// Verify the current workbook-driven dashboard with its actual embedded SQLite WASM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
const library = scripts.find(s => s[2].includes('var initSqlJs = function'))[2];
const wasm = scripts.find(s => s[1].includes('id="sqlite-wasm-bytes"'))[2];
assert(Buffer.from(wasm, 'base64').subarray(0,4).equals(Buffer.from([0,97,115,109])));
const init = new Function('module', 'require', '__dirname', library + '\nreturn initSqlJs;')({exports:{}}, require, root);
const nodes = new Map();
function node(id) {
    if (!nodes.has(id)) nodes.set(id, {innerHTML:'', textContent:id === 'sqlite-wasm-bytes' ? wasm : '', hidden:true, value:'', options:[], selectedIndex:0, listeners:{},
        addEventListener(e,fn){this.listeners[e]=fn;}, setAttribute(){}, removeAttribute(){}, querySelectorAll(){return [];}, querySelector(){return null;}, before(){}, appendChild(){}, classList:{add(){},remove(){}}});
    return nodes.get(id);
}
let mode = 'valid', requests = 0;
const bytes = fs.readFileSync(path.join(root,'database.synthetic.db'));
const context = {console,Intl,Date,Number,String,Math,Set,Map,Array,Object,Promise,Uint8Array,TextDecoder,atob,URL,AbortSignal,AbortController,setTimeout,clearTimeout,requestAnimationFrame: fn=>setTimeout(fn,0),
    location:{protocol:'http:',origin:'http://localhost:8765',href:'http://localhost:8765/index.html'}, initSqlJs:init,
    document:{baseURI:"http://localhost:8765/index.html",getElementById:node,addEventListener(){},querySelectorAll(){return [];}},window:{},
    fetch:async (url, options)=>{requests++; assert.equal(url, 'http://localhost:8765/database.synthetic.db'); assert.equal(options.credentials, 'same-origin'); assert.equal(options.method, 'GET'); assert(options.cache === 'no-store'); const payload=Uint8Array.from(mode === 'valid' ? bytes : Buffer.from('<html>not a database</html>')); let sent=false; return {ok:true,headers:{get: name=>name==='Content-Length'?String(payload.length):null},body:{getReader:()=>({read:async()=>sent?{done:true}:(sent=true,{done:false,value:payload}),cancel:async()=>{}})}};}};
let code = scripts.find(s => s[2].includes('const workbookTabs'))[2];
code = code.replace('    render();\n    loadDatabase();\n}());', '    window.api = {state, tabs, metricMap, loadDatabase, calculate, metricRows, supported, render, topWUCs, showBusy, hideBusy, renderCheckpoint, jobStatusRows, downloadDatabase, monthlyStatusChart, selectedStatusRows, updateStatusHighlight, metricDefinitions, wucCommandSegments, commandColor, matching, includesSelection};\n}());');
vm.runInNewContext(code,context);
const api = context.window.api;

(async()=>{
 await api.loadDatabase();
 assert(api.state.database,node('message').textContent);
 assert.equal(api.state.months.length,12);
 let checked=0;
 for(const tab of api.tabs){
  api.state.tab=tab.id;
  for(const id of tab.ids){
   const metric=api.metricMap.get(id);
   if(metric.linkOnly||metric.targetTab) continue;
   api.state.metric=id;
   await api.render();
   const output=node(tab.id+'-graphics').innerHTML;
   assert(!output.includes('NaN'),id);
   if(output.includes('class="line-chart"')){
    assert(output.includes('*Rolling 3 month trend'),id);
    assert(output.includes('class="forecast-band"'),id);
    checked++;
   }
  }
 }
 assert(checked>20);
 console.log(`Synthetic SQLite dashboard passed: ${checked} metric chart views rendered with projected trends and illustrative ranges.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
