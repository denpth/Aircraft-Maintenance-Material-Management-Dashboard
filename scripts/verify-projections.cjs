const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../index.html'), 'utf8');
const start = html.indexOf('    function forecastMonthNumber(');
const end = html.indexOf('    function distribution(', start);
const context = {Intl, colors:['blue'], nf:new Intl.NumberFormat('en-US'), compact:new Intl.NumberFormat('en-US'), esc:String, monthLabel:String, pointTooltipAttributes:()=>'', statusTooltip:()=>'', wucLabel:String};
vm.createContext(context);
vm.runInContext(html.slice(start,end), context);
const months = Array.from({length:12}, (_,i)=>`2025-${String(i+1).padStart(2,'0')}`);
const values = months.map((_,i)=>10+2*i);


const forecast = context.rollingThreeForecast;
const robustNext = (input, inputMonths, target) => {
 const median = a => {const b=a.slice().sort((a,b)=>a-b);return (b[Math.floor((b.length-1)/2)]+b[Math.floor(b.length/2)])/2;};
 const slopes=[];for(let i=0;i<input.length;i++)for(let j=i+1;j<input.length;j++)slopes.push((input[j]-input[i])/(j-i));
 const slope=median(slopes), intercept=median(input.map((v,i)=>v-slope*i));
 return intercept+slope*(context.forecastMonthNumber(target)-context.forecastMonthNumber(inputMonths[0]));
};
const model=forecast(values,months);
const working=[...values], workingMonths=[...months];
for (const step of model.steps) {
 assert.equal(step.value,robustNext(working.slice(-3),workingMonths.slice(-3),step.month));
 working.push(step.value);workingMonths.push(step.month);
}
assert.deepEqual(Array.from(model.steps,step=>step.inputs.filter(p=>p.projected).length),[0,1,2,3]);
assert.notEqual(model.steps[0].value,model.steps[1].value);
assert.equal(forecast(values.slice(0,2),months.slice(0,2)),null);
const missing=[...values];missing[9]=null;
assert.equal(forecast(missing,months),null);
const oldMissing=[...values];oldMissing[0]=null;
assert.equal(forecast(oldMissing,months).steps[0].value,model.steps[0].value);
const shifted=[...Array(6).fill(99999),...values.slice(-6)];
assert.equal(forecast(shifted,months).steps[0].value,model.steps[0].value);
const constant=forecast(Array(12).fill(10),months);
assert(constant.steps.every(step=>step.value===10&&step.margin===0));
const bounded=forecast(values.map(v=>v*10),months,100);
assert(bounded.steps.every(step=>step.value<=100&&step.lower>=0&&step.upper<=100));
assert.deepEqual(Array.from(model.steps,p=>p.value),[34,36,38,40]);
const noise=forecast(values.map((v,i)=>v+[0,5,-3,7,-2,1][i%6]),months);
assert(noise.steps[0].variance>0);
for(let i=1;i<noise.steps.length;i++)assert(noise.steps[i].margin>noise.steps[i-1].margin);
const outlier=[...values];outlier[10]=9999;
assert(Number.isFinite(forecast(outlier,months).steps[0].value));
// August's final actual yields September–December; December uses September–November.
const exampleMonths=Array.from({length:8},(_,i)=>`2026-${String(i+1).padStart(2,'0')}`);
const example=forecast([10,20,30,40,50,60,70,80],exampleMonths);
const december=example.steps.at(-1);
assert.equal(december.month,'2026-12');
assert.deepEqual(Array.from(december.inputs,p=>p.month),['2026-09','2026-10','2026-11']);
assert.equal(december.inputs.filter(p=>p.projected).length,3);
const output=context.lineChart([{label:'Metric',values,color:'blue'}],months,'h');
assert(output.includes('class="forecast-band"'));
assert(!output.includes('NaN')&&!output.includes('Infinity'));
const paths=[...output.matchAll(/<path\b[^>]*>/g)].map(m=>m[0]);
const actual=paths[0].match(/d="([^"]+)"/)[1];
const projected=paths.find(p=>p.includes('stroke-dasharray="8 5"'));
assert.equal(projected.match(/d="M([^L]+)/)[1],actual.split('L').at(-1));
assert(output.includes('>Projected trend<tspan'));
assert(output.includes('*Rolling 3 month trend'));
assert(output.includes('2026-04'));
const short=context.lineChart([{label:'Metric',values:values.slice(0,2)}],months.slice(0,2),'h');
assert(!short.includes('stroke-dasharray="8 5"'));
console.log('Rolling three-month checks passed: recursive trend fits, December September–November window, projected inputs, missing months, bounds, widening bands, four-month horizon, and connected paths.');

// Both the trend and range ignore observations before their input windows.
const olderSpike=forecast([...Array(9).fill(99999),...values.slice(-3)],months);
assert.equal(olderSpike.steps[0].margin,model.steps[0].margin);
assert.equal(olderSpike.steps[3].margin,model.steps[3].margin);
let accumulated=0;
for(const step of model.steps){
 const inputs=Array.from(step.inputs,p=>p.value);
 const mean=inputs.reduce((s,v)=>s+v,0)/3;
 const variance=inputs.reduce((s,v)=>s+(v-mean)**2,0)/2;
 assert.equal(step.variance,variance);
 accumulated+=variance;
 assert.equal(step.accumulatedVariance,accumulated);
 assert.equal(step.margin,Math.sqrt(accumulated*(1+(model.steps.indexOf(step)+1)/3)));
}
console.log('Range checks passed: same three inputs, sample variance, accumulated spread, and independence from older history.');
