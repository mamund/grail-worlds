/** E4 API harness. A separate process provides a hard wall-clock timeout. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const scenario=process.argv[2] ?? 'cycle';
if (!['cycle','control'].includes(scenario)) { console.error('Usage: node api-run.js cycle|control [timeoutMs]');process.exit(2); }
const timeoutMs=Number(process.argv[3] ?? 3000);
if (!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000) {console.error('Timeout must be 100..60000 ms');process.exit(2);}
const outDir=path.join(root,'results',scenario);
mkdirSync(outDir,{recursive:true});
const started=Date.now();
const proc=spawnSync(process.execPath,[path.join(root,'api-worker.js'),scenario,outDir],{cwd:root,encoding:'utf8',timeout:timeoutMs,maxBuffer:1024*1024,killSignal:'SIGKILL'});
writeFileSync(path.join(outDir,'worker-stdout.log'),proc.stdout ?? '');
writeFileSync(path.join(outDir,'worker-stderr.log'),proc.stderr ?? '');
const timedOut=proc.error?.code==='ETIMEDOUT';
const status={scenario,timeoutMs,elapsedMs:Date.now()-started,timedOut,exitCode:proc.status,signal:proc.signal,error:proc.error?.message??null,completed:!timedOut && proc.status===0};
writeFileSync(path.join(outDir,'harness-status.json'),JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify(status,null,2));
if (timedOut) {console.error('TIMEOUT: child process killed; absence of completed trace is expected. See worker logs.');process.exitCode=124;}
else if(proc.status!==0){console.error('Worker failed; see results logs.');process.exitCode=1;}
