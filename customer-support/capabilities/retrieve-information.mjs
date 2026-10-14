/**
 * retrieve-information.mjs
 * ------------------------------------------------------------------
 * Retrieve support policy information for a request category.
 *
 * Reads the local support-policies fixture.
 *
 * GRAIL STDIO contract:
 *   Input:   JSON object from stdin (handled by common.mjs)
 *   Output:  JSON result to stdout on success
 *   Errors:  Message to stderr and nonzero exit status
 * ------------------------------------------------------------------
 */

import { readFile } from 'node:fs/promises';
import { main, required } from './common.mjs';

await main(async ({ category }) => {
  category = required(category, 'category');

  const policies = JSON.parse(
    await readFile(new URL('../data/support-policies.json', import.meta.url), 'utf8')
  );
  const policy = policies[category];

  if (!policy) {
    throw Error('Unsupported category');
  }

  return {
    policy: policy.text,
    policyId: policy.id
  };
});
