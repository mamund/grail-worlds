import { getPurchase, updatePurchase } from './store.mjs';
export async function checkPurchasePolicy({ purchaseId }) {
  const purchase = await getPurchase(purchaseId);
  if (!purchase) throw new Error(`Unknown purchase ${purchaseId}`);
  const guidance = purchase.amount > 1000
    ? 'Above $1,000: human reviewer should check budget and justification.'
    : 'At or below $1,000: standard purchasing policy applies.';
  await updatePurchase(purchaseId, { policyGuidance: guidance });
  return { guidance };
}
export async function processPurchase({ purchaseId }) {
  const purchase = await getPurchase(purchaseId);
  if (!purchase?.review?.status) throw new Error('Purchase has not been reviewed');
  const processingStatus = {
    approved: 'purchase-order-created',
    rejected: 'request-closed-rejected',
    deferred: 'follow-up-pending'
  }[purchase.review.status];
  if (!processingStatus) throw new Error('Unrecognized review outcome');
  await updatePurchase(purchaseId, { processingStatus });
  return { processingStatus };
}
