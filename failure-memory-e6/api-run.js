/** E5 parent harness: independent worker, hard timeout, fresh external state. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const scenario=process.argv[2] ?? 'failure';
if (!['failure','control'].includes(scenario)) { console.error('Usage: node api-run.js failure|control [timeoutMs]');process.exit(2); }
const timeoutMs=Number(process.argv[3] ?? 3000);
if (!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000) { console.error('Timeout must be 100..60000 ms');process.exit(2); }
const outDir=path.join(root,'results',scenario);
rmSync(outDir,{recursive:true,force:true}); mkdirSync(outDir,{recursive:true});
const started=Date.now();
const proc=spawnSync(process.execPath,[path.join(root,'api-worker.js'),scenario,outDir],{cwd:root,encoding:'utf8',timeout:timeoutMs,maxBuffer:1024*1024,killSignal:'SIGKILL'});
writeFileSync(path.join(outDir,'worker-stdout.log'),proc.stdout??'');
writeFileSync(path.join(outDir,'worker-stderr.log'),proc.stderr??'');
const timedOut=proc.error?.code==='ETIMEDOUT';
const status={scenario,timeoutMs,elapsedMs:Date.now()-started,timedOut,exitCode:proc.status,signal:proc.signal,error:proc.error?.message??null,completed:!timedOut && proc.status===0};
writeFileSync(path.join(outDir,'harness-status.json'),JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify(status,null,2));
if(timedOut)process.exitCode=124;
else if(proc.status!==0)process.exitCode=1;
