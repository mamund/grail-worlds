/**
 * assign-support-rep.mjs
 * ------------------------------------------------------------------
 * Assign a support representative based on request classification.
 *
 * Reads the support-staff roster; uses the other representative as fallback.
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
  const classifiedCategory = required(category, 'category');
  const staff = JSON.parse(
    await readFile(new URL('../data/support-staff.json', import.meta.url), 'utf8')
  );
  const supportRep = staff[classifiedCategory] ?? staff.other;

  if (typeof supportRep !== 'string' || !supportRep.trim()) {
    throw Error('No support representative available');
  }

  return { supportRep };
});
