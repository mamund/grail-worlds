/** Child process executes GRAIL API and captures evidence. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Grail, loadEnvironment } from '@mamund/grail';
const root = path.dirname(fileURLToPath(import.meta.url));
const scenario = process.argv[2];
const outDir = process.argv[3];
if (!['false-success','truthful-success'].includes(scenario) || !outDir) throw new Error('Invalid worker arguments');
mkdirSync(outDir, { recursive: true });
const env = loadEnvironment(path.join(root, 'config'));
const inputs = JSON.parse(readFileSync(path.join(root,'scenarios',scenario,'inputs.json'),'utf8'));
// Store path is absolute for the capability regardless of the process working directory.
inputs.storePath = path.join(root, inputs.storePath);
const runtimeEntry = fileURLToPath(import.meta.resolve('@mamund/grail'));
const { createPursuitTrace } = await import(pathToFileURL(path.join(path.dirname(runtimeEntry),'pursuitTrace.js')).href);
const trace = createPursuitTrace();
const grail = new Grail({registry:env.registry,worldstate:env.worldstate,inputs,baseDir:root});
try {
  const result = await grail.pursue(env.goal, { pursuitTrace:trace });
  writeFileSync(path.join(outDir,'output.json'), JSON.stringify(result,null,2)+'\n');
  writeFileSync(path.join(outDir,'observations.json'), JSON.stringify(result.observations,null,2)+'\n');
  writeFileSync(path.join(outDir,'trace.json'), JSON.stringify(trace.events,null,2)+'\n');
  const externalRecordExists = existsSync(inputs.storePath);
  const assessment = { scenario, goal:result.goal, reached:result.reached, externalRecordExists,
    observationCount:result.observations.length, traceEventCount:trace.events.length,
    demonstratesFalseSuccess:scenario==='false-success' && result.reached===true && !externalRecordExists,
    controlPassed:scenario==='truthful-success' && result.reached===true && externalRecordExists };
  writeFileSync(path.join(outDir,'assessment.json'),JSON.stringify(assessment,null,2)+'\n');
  console.log('E5_RESULT '+JSON.stringify(assessment));
} catch (error) {
  writeFileSync(path.join(outDir,'error.json'),JSON.stringify({message:String(error),stack:error?.stack},null,2)+'\n');
  process.exitCode=1;
}
