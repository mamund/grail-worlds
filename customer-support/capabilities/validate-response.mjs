/**
 * validate-response.mjs
 * ------------------------------------------------------------------
 * Validate the drafted customer response.
 *
 * Enforces length limits and rejects selected unverified claims.
 *
 * GRAIL STDIO contract:
 *   Input:   JSON object from stdin (handled by common.mjs)
 *   Output:  JSON result to stdout on success
 *   Errors:  Message to stderr and nonzero exit status
 * ------------------------------------------------------------------
 */

import { main, required } from './common.mjs';

await main(async ({ draft, policy }) => {
  draft = required(draft, 'draft');
  required(policy, 'policy');

  if (draft.length < 20 || draft.length > 1500) {
    throw Error('Draft outside allowed length');
  }

  if (/(?:we have|i have|has been) (?:issued|processed|completed|refunded|fixed|resolved)/i.test(draft)) {
    throw Error('Draft claims unverified action');
  }

  if (/(?:guarantee|definitely refund|refund has been issued)/i.test(draft)) {
    throw Error('Draft makes prohibited promise');
  }

  return { validatedResponse: draft };
});
