/**
 * GRAIL Parent World — activateCustomer
 * File: capabilities/activate-customer.mjs
 * Purpose: Determines whether to activate or deny a customer based on the completed verification result; a denial is a domain outcome, not an execution failure.
 * Interface: exports async execute(inputs) for a Node-bound affordance.
 * Note: Domain results are returned as data; GRAIL applies declared effects.
 */

export async function execute({
  customerId,
  verificationCompleted,
  verificationStatus
} = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  if (!verificationCompleted) {
    throw new Error('Verification has not completed');
  }

  if (!verificationStatus) {
    throw new Error('verificationStatus is required');
  }

  const activationStatus =
    verificationStatus === 'APPROVED'
      ? 'ACTIVE'
      : 'DENIED';

  return {
    customerId,
    activationStatus
  };
}
