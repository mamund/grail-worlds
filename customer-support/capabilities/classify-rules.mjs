/**
 * classify-rules.mjs
 * ------------------------------------------------------------------
 * Classify a customer request using deterministic keyword rules.
 *
 * Provides a non-LLM classification alternative.
 *
 * GRAIL STDIO contract:
 *   Input:   JSON object from stdin (handled by common.mjs)
 *   Output:  JSON result to stdout on success
 *   Errors:  Message to stderr and nonzero exit status
 * ------------------------------------------------------------------
 */

import { main, required } from './common.mjs';

await main(async ({ message }) => {
  const text = required(message, 'message').toLowerCase();
  const keywords = {
    billing: ['charg', 'refund', 'invoice', 'payment', 'bill'],
    support: ['error', 'broken', 'problem', 'not working', 'troubleshoot'],
    sales: ['price', 'pricing', 'purchase', 'buy', 'quote']
  };

  const category = Object.entries(keywords).find(
    ([, words]) => words.some(w => text.includes(w))
  )?.[0];

  if (!category) {
    throw Error('No matching classification rule');
  }

  return { category };
});
