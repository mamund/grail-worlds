/**
 * queue-response.mjs
 * ------------------------------------------------------------------
 * Queue a validated customer response in the local outbox.
 *
 * Writes a unique JSON record and returns its identifier and file path.
 *
 * GRAIL STDIO contract:
 *   Input:   JSON object from stdin (handled by common.mjs)
 *   Output:  JSON result to stdout on success
 *   Errors:  Message to stderr and nonzero exit status
 * ------------------------------------------------------------------
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join, relative } from 'node:path';
import { main, required } from './common.mjs';

await main(async ({ response, customerId, customerName, category, policyId, supportRep }) => {
  const message = required(response, 'response');
  const id = required(customerId, 'customerId');
  const name = required(customerName, 'customerName');
  const type = required(category, 'category');
  const policy = required(policyId, 'policyId');
  const representative = required(supportRep, 'supportRep');

  const messageId = randomUUID();
  const outbox = join(process.cwd(), 'data', 'outbox');
  const path = join(outbox, `${messageId}.json`);
  const record = {
    messageId,
    customerId: id,
    customerName: name,
    category: type,
    policyId: policy,
    supportRep: representative,
    message,
    status: 'queued',
    queuedAt: new Date().toISOString()
  };

  await mkdir(outbox, { recursive: true });
  await writeFile(path, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });

  return {
    messageId,
    status: 'queued',
    file: relative(process.cwd(), path)
  };
});
