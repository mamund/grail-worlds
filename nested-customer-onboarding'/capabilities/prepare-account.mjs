/**
 * GRAIL Parent World — prepareAccount
 * File: capabilities/prepare-account.mjs
 * Purpose: Derives a demonstration account identifier from the customer identifier and reports account preparation completed.
 * Interface: exports async execute(inputs) for a Node-bound affordance.
 * Note: Domain results are returned as data; GRAIL applies declared effects.
 */

export async function execute({ customerId } = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  return {
    accountId: `A-${customerId}`,
    prepared: true
  };
}
