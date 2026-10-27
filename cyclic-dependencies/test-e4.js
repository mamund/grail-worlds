/** Lightweight assertions; a timeout is a recorded experimental outcome, not an assertion of infinite execution. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
for (const scenario of ['control','cycle']) {
 const p=spawnSync(process.execPath,['api-run.js',scenario,'3000'],{encoding:'utf8'});
 const status=JSON.parse(readFileSync(`results/${scenario}/harness-status.json`,'utf8'));
 console.log(`${scenario}: ${JSON.stringify(status)}`);
 if(scenario==='control') {
   if(p.status!==0)throw Error('Control did not complete');
   const result=JSON.parse(readFileSync('results/control/output.json','utf8'));
   if(!result.reached || result.observations.length!==1)throw Error('Control should reach goal with one invocation');
 } else if (status.timedOut) console.log('Cycle exceeded observation window (not proof of infinite loop).');
 else if (status.completed) console.log('Cycle terminated; inspect reached/worldstate/trace to classify outcome.');
 else console.log('Cycle failed or was terminated; inspect logs before classifying.');
}
