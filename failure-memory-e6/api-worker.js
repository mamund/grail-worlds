/** Isolated GRAIL API execution; deterministic selector order for a controlled experiment. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Grail, loadEnvironment } from '@mamund/grail';
const root = path.dirname(fileURLToPath(import.meta.url));
const scenario = process.argv[2];
const outDir = process.argv[3];
if (!['failure', 'control'].includes(scenario) || !outDir) throw new Error('Invalid arguments');
mkdirSync(outDir, {recursive:true});
const env = loadEnvironment(path.join(root,'config'));
const inputs = JSON.parse(readFileSync(path.join(root,'scenarios',scenario,'inputs.json'),'utf8'));
const entry = fileURLToPath(import.meta.resolve('@mamund/grail'));
const {createPursuitTrace} = await import(pathToFileURL(path.join(path.dirname(entry),'pursuitTrace.js')).href);
const trace = createPursuitTrace();
// The production selectors use Math.random. Fixing it here ensures that
// conditionA is chosen before conditionB, and sharedProducer is tried first.
// This is a harness intervention, not a GRAIL runtime modification.
Math.random = () => 0;
try {
  const grail = new Grail({registry:env.registry, worldstate:env.worldstate, inputs, baseDir:root});
  const result = await grail.pursue(env.goal, {pursuitTrace:trace});
  writeFileSync(path.join(outDir,'output.json'),JSON.stringify(result,null,2)+'\n');
  writeFileSync(path.join(outDir,'observations.json'),JSON.stringify(result.observations,null,2)+'\n');
  writeFileSync(path.join(outDir,'trace.json'),JSON.stringify(trace.events,null,2)+'\n');
  const actions = result.observations.map(o=>({action:o.invocation.affordance,result:o.result}));
  const selects = trace.events.filter(e=>e.type==='affordance.selected');
  const sharedCount=actions.filter(x=>x.action==='sharedProducer').length;
  const altA=actions.some(x=>x.action==='alternativeA'&&x.result==='SUCCESS');
  const altB=actions.some(x=>x.action==='alternativeB'&&x.result==='SUCCESS');
  const failureObserved=actions.some(x=>x.action==='sharedProducer'&&x.result==='FAIL');
  const successObserved=actions.some(x=>x.action==='sharedProducer'&&x.result==='SUCCESS');
  const expected = scenario==='failure'
    ? result.reached===true && sharedCount===1 && failureObserved && altA && altB &&
      selects.some(e=>e.affordance==='alternativeB' && e.candidates?.length===1 && e.candidates[0]==='alternativeB')
    : result.reached===true && sharedCount===1 && successObserved && !altA && !altB;
  const assessment={scenario,passed:expected,goalReached:result.reached,actions,selectionEvents:selects,sharedInvocationCount:sharedCount,
    explanation:scenario==='failure'?'A shared multi-effect affordance failed for conditionA and was excluded when conditionB was later resolved.':'Successful shared producer satisfied both conditions in one invocation.'};
  writeFileSync(path.join(outDir,'assessment.json'),JSON.stringify(assessment,null,2)+'\n');
  console.log('E6_RESULT '+JSON.stringify({scenario,passed:expected,actions}));
  if(!expected)process.exitCode=1;
} catch(error) {
  writeFileSync(path.join(outDir,'error.json'),JSON.stringify({message:String(error),stack:error?.stack},null,2)+'\n');
  console.error(error);
  process.exitCode=1;
}
