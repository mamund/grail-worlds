/** Runs both scenarios and checks the contrast; exits nonzero on failed assertions. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
for(const scenario of ['truthful-success','false-success']) {
 const run=spawnSync(process.execPath,[path.join(root,'api-run.js'),scenario],{cwd:root,encoding:'utf8'});
 if(run.status!==0) {console.error(run.stdout,run.stderr);process.exit(1);}
 const a=JSON.parse(readFileSync(path.join(root,'results',scenario,'assessment.json'),'utf8'));
 const passed=scenario==='false-success'?a.demonstratesFalseSuccess:a.controlPassed;
 console.log(`${scenario}: ${passed?'PASS':'FAIL'} goalReached=${a.reached} externalRecordExists=${a.externalRecordExists}`);
 if(!passed)process.exitCode=1;
}
