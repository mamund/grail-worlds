/**
 * lookup-customer.mjs
 * ------------------------------------------------------------------
 * Look up a customer in the local customer fixture.
 *
 * Returns the customer name and account status.
 *
 * GRAIL STDIO contract:
 *   Input:   JSON object from stdin (handled by common.mjs)
 *   Output:  JSON result to stdout on success
 *   Errors:  Message to stderr and nonzero exit status
 * ------------------------------------------------------------------
 */

import { readFile } from 'node:fs/promises';
import { main, required } from './common.mjs';

await main(async ({ customerId }) => {
  customerId = required(customerId, 'customerId');

  const customers = JSON.parse(
    await readFile(new URL('../data/customers.json', import.meta.url), 'utf8')
  );
  const customer = customers[customerId];

  if (!customer) {
    throw Error('Unknown customer');
  }

  return {
    customerName: customer.name,
    customerStatus: customer.status
  };
});
