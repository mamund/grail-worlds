/**
 * GRAIL Parent World — verifyCustomer
 * File: capabilities/verify-customer.mjs
 *
 * Purpose:
 *   Runs the child customer-verification GRAIL pursuit with the
 *   parent's customerId, propagates its domain verification status,
 *   and returns child pursuit evidence.
 *
 * Interface:
 *   exports async execute(inputs) for a Node-bound affordance.
 *
 * Note:
 *   Domain results are returned as data; GRAIL applies declared effects.
 */

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { runGrailWorld } from '@mamund/grail';

// Locate the child world relative to this module, not process.cwd().
const here = dirname(fileURLToPath(import.meta.url));
const childRoot = resolve(here, '../child-world/customer-verification');

export async function execute({ customerId } = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  // Launch an independent child GRAIL pursuit.
  const childResult = await runGrailWorld({
    worldRoot: childRoot,
    inputs: { customerId },
    inputMode: 'override'
  });

  if (!childResult.reached) {
    throw new Error(`Child pursuit did not reach ${childResult.goal}`);
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

  // Pursuit completion does not imply domain approval.
  return {
    customerId,
    verificationCompleted: true,
    verificationStatus,
    childReached: childResult.reached,
    childGoal: childResult.goal,
    childWorldstate: childResult.worldstate,
    childObservations: childResult.observations
  };
}
