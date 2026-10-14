import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { getPurchase, updatePurchase } from './store.mjs';
const path = process.env.GRAIL_INPUTS_FILE;
if (!path) { console.error('Interactive STDIO requires GRAIL_INPUTS_FILE'); process.exit(1); }
const inputs = JSON.parse(await readFile(path, 'utf8'));
const purchase = await getPurchase(inputs.purchaseId);
if (!purchase) { console.error('Unknown purchase'); process.exit(1); }
const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
try {
  console.error(`\nPurchase ${purchase.id}: ${purchase.description}`);
  console.error(`Department: ${purchase.department}; amount: $${purchase.amount.toFixed(2)}`);
  console.error(`Policy: ${inputs.policyGuidance ?? purchase.policyGuidance ?? 'Not available'}`);
  console.error('1. Approve  2. Reject  3. Defer');
  let status;
  while (!status) {
    const choice = (await rl.question('Review decision [1-3]: ')).trim();
    status = { '1': 'approved', '2': 'rejected', '3': 'deferred' }[choice];
    if (!status) console.error('Choose 1, 2, or 3.');
  }
  const note = (await rl.question('Review note (optional): ')).trim();
  await updatePurchase(purchase.id, { review: { status, note } });
  process.stdout.write(JSON.stringify({ reviewStatus: status, reviewNote: note }) + '\n');
} catch (err) { console.error(`Review interrupted: ${err.message}`); process.exitCode = 1; }
finally { rl.close(); }
