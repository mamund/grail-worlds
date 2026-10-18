import { Grail, loadEnvironment } from '@mamund/grail';

const environment = loadEnvironment('./config');
const grail = new Grail({
  registry: environment.registry,
  worldstate: environment.worldstate,
  inputs: environment.inputs
});
const result = await grail.pursue(environment.goal);
console.log('Goal reached:', result.reached);
console.log('World state:', result.worldstate);
console.log('Observations:', JSON.stringify(result.observations, null, 2));
if (!result.reached) process.exitCode = 1;
