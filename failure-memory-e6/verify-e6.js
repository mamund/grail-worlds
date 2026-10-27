/** Execute and assert both E6 scenarios. */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
for (const scenario of ['control','failure']) {
  const run=spawnSync(process.execPath,[path.join(root,'api-run.js'),scenario],{cwd:root,encoding:'utf8'});
  if(run.status!==0) {console.error(run.stdout,run.stderr);process.exitCode=1;continue;}
  const a=JSON.parse(readFileSync(path.join(root,'results',scenario,'assessment.json'),'utf8'));
  console.log(`${scenario}: ${a.passed?'PASS':'FAIL'} ${a.actions.map(x=>`${x.action}:${x.result}`).join(', ')}`);
  if(!a.passed)process.exitCode=1;
}
