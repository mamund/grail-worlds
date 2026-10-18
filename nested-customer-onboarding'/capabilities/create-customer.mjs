/**
 * GRAIL Parent World — createCustomer
 * File: capabilities/create-customer.mjs
 * Purpose: Validates the customer identifier and reports completion of the customer-creation step in the onboarding demonstration.
 * Interface: exports async execute(inputs) for a Node-bound affordance.
 * Note: Domain results are returned as data; GRAIL applies declared effects.
 */

export async function execute({ customerId } = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  return {
    customerId,
    created: true
  };
}
