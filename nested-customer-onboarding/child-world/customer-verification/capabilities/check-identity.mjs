/**
 * GRAIL child world: Customer Verification
 * Affordance: checkIdentity
 * Purpose: Report an identity-check outcome; currently forced to REJECTED
 *          to exercise the negative domain-outcome scenario.
 * Input: customerId
 * Result: { identityStatus }
 * Effect (declared in registry): identityChecked
 */
export async function execute({ customerId } = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  // Original demo rule, retained for reference:
  // return { identityStatus: customerId === 'C999' ? 'REJECTED' : 'APPROVED' };
  return {
    identityStatus: 'REJECTED'
  };
}
