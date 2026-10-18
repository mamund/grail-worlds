/**
 * GRAIL Parent World — verifyCustomer
 * File: capabilities/verify-customer.mjs
 * Purpose: Runs the child customer-verification GRAIL pursuit with the parent customerId, propagates its domain verification status, and returns child pursuit evidence.
 * Interface: exports async execute(inputs) for a Node-bound affordance.
 * Note: Domain results are returned as data; GRAIL applies declared effects.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve, isAbsolute } from 'node:path';
import { Grail, loadEnvironment } from '@mamund/grail';

// Resolve the child world from this module, independent of the caller's cwd.
const here = dirname(fileURLToPath(import.meta.url));
const childRoot = resolve(here, '../child-world/customer-verification');

export async function execute({ customerId } = {}) {
  if (!customerId) throw new Error('customerId is required');

  const environment = loadEnvironment(resolve(childRoot, 'config'));
  // GRAIL's Node binding resolves module paths from process.cwd(). Convert
  // child bindings to absolute paths in memory; do not change its config files.

  const registry = structuredClone(environment.registry);
  for (const affordance of Object.values(registry)) {
    const binding = affordance.binding;
    if (binding?.protocol === 'node' && !isAbsolute(binding.module)) {
      binding.module = resolve(childRoot, binding.module);
    }
  }

  // New instance and fresh state per invocation. Pass the parent's customerId.
  const grail = new Grail({
    registry,
    worldstate: structuredClone(environment.worldstate),
    inputs: { ...environment.inputs, customerId }
  });

  const childResult = await grail.pursue(environment.goal);

  if (!childResult.reached) {
    throw new Error(`Child pursuit did not reach ${environment.goal}`);
  }

  // Retrieve the domain result from the child's final affordance.
  const verificationObservation = childResult.observations.find(
    observation =>
      observation.invocation.affordance === 'completeVerification'
  );

  if (!verificationObservation) {
    throw new Error('Child verification result is missing');
  }

  const verificationStatus =
    verificationObservation.outputs?.verificationStatus;

  if (!verificationStatus) {
    throw new Error('Child verificationStatus is missing');
  }

  // Pursuit completion does not imply domain approval; preserve the actual status.
  return {
    customerId,
    verificationCompleted: true,
    verificationStatus,
    childReached: childResult.reached,
    childGoal: environment.goal,
    childWorldstate: childResult.worldstate,
    childObservations: childResult.observations
  };
}
