/**
 * GRAIL child world: Customer Verification
 * Affordance: checkAccount
 * Purpose: Determine the customer's account status using demo rules.
 * Input: customerId
 * Result: { accountStatus } ('CLOSED' for C998, otherwise 'OPEN')
 * Effect (declared in registry): accountChecked
 */
export async function execute({ customerId } = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  return {
    accountStatus: customerId === 'C998' ? 'CLOSED' : 'OPEN'
  };
}
