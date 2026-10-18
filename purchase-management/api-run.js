/**
 * GRAIL API launcher
 *
 * Loads a GRAIL environment from ./config, pursues its configured goal,
 * and prints the result, final world state, and invocation observations.
 *
 * Run: node api-run.js
 * Requires: Node.js 22+ and @mamund/grail installed.
 */
 
import { Grail, loadEnvironment } from '@mamund/grail';

// get configuration info
const environment = loadEnvironment('./config');

// populate instance of the runtime
const grail = new Grail({
  registry: environment.registry,
  worldstate: environment.worldstate,
  inputs: environment.inputs
});

// start real-time goal pursuit
const result = await grail.pursue(environment.goal);

// report results
console.log(result.reached);
console.log(result.worldstate);
console.log(JSON.stringify(result.observations,null,2));

// EOF

