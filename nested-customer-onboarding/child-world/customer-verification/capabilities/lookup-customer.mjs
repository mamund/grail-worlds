/**
 * GRAIL child world: Customer Verification
 * Affordance: lookupCustomer
 * Purpose: Locate a customer record for the supplied customer ID.
 * Input: customerId
 * Result: { customerId, found }
 * Effect (declared in registry): customerLocated
 */
export async function execute({ customerId } = {}) {
  if (!customerId) {
    throw new Error('customerId is required');
  }

  return {
    customerId,
    found: true
  };
}
