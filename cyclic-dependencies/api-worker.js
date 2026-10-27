/** Child process: runs the real GRAIL Node API and writes evidence when it finishes. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Grail, loadEnvironment } from '@mamund/grail';
import { fileURLToPath as toPath, pathToFileURL } from 'node:url';
// Diagnostic module is not a package export; resolve relative to the package entry.
const runtimeEntry = toPath(import.meta.resolve('@mamund/grail'));
const { createPursuitTrace } = await import(pathToFileURL(path.join(path.dirname(runtimeEntry),'pursuitTrace.js')).href);
const root = path.dirname(fileURLToPath(import.meta.url));
const scenario = process.argv[2];
const outDir = process.argv[3];
if (!['cycle','control'].includes(scenario) || !outDir) throw new Error('Expected scenario and output directory');
mkdirSync(outDir, { recursive: true });
const env = loadEnvironment(path.join(root,'config'));
const worldstate = JSON.parse(readFileSync(path.join(root,'scenarios',scenario,'worldstate.json'),'utf8'));
const trace = createPursuitTrace();
const grail = new Grail({registry:env.registry,worldstate,inputs:env.inputs,baseDir:root});
try {
  const result = await grail.pursue(env.goal,{pursuitTrace:trace});
  writeFileSync(path.join(outDir,'output.json'),JSON.stringify(result,null,2)+'\n');
  writeFileSync(path.join(outDir,'observations.json'),JSON.stringify(result.observations,null,2)+'\n');
  writeFileSync(path.join(outDir,'trace.json'),JSON.stringify(trace.events,null,2)+'\n');
  process.stdout.write('E4_RESULT '+JSON.stringify({reached:result.reached,goal:result.goal,observations:result.observations.length,traceEvents:trace.events.length})+'\n');
} catch (error) {
  writeFileSync(path.join(outDir,'error.json'),JSON.stringify({message:String(error),stack:error?.stack},null,2)+'\n');
  process.exitCode=1;
}
