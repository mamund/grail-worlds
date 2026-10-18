import { Grail, loadEnvironment } from '@mamund/grail';

const environment = loadEnvironment('./config');

const grail = new Grail({
  registry: environment.registry,
  worldstate: environment.worldstate,
  inputs: environment.inputs
});

const result = await grail.pursue(environment.goal);

console.log(result.reached);
console.log(result.worldstate);
console.log(result.observations);
