/**
 * GRAIL child world: Customer Verification
 * Affordance: completeVerification
 * Purpose: Combine completed identity and account checks into a domain
 *          verification outcome, without treating rejection as GRAIL FAIL.
 * Inputs: customerId, identityStatus, accountStatus
 * Result: { customerId, verificationStatus }
 * Effect (declared in registry): customerVerified
 */
/*
 * Earlier demo implementation, retained for reference:
 *
 * export async function execute({ customerId } = {}) {
 *   if (!customerId) throw new Error('customerId is required');
 *   // Demo-only deterministic domain model. In production, read domain data from a store.
 *   const verificationStatus = ['C998', 'C999'].includes(customerId) ? 'REJECTED' : 'APPROVED';
 *   return { verificationStatus };
 * }
 */

export async function execute(inputs) {
  const { customerId, identityStatus, accountStatus } = inputs;

  const verificationStatus =
    identityStatus === 'APPROVED' && accountStatus === 'OPEN'
      ? 'APPROVED'
      : 'REJECTED';

  return {
    customerId,
    verificationStatus
  };
}
