import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'state', 'ledger.json');

async function readLedger() {
  try {
    return JSON.parse(await readFile(dataFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return { active: [], history: [] };
    throw error;
  }
}

async function saveLedger(ledger) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(ledger, null, 2) + '\n');
}

async function create(kind, { pursuitId, invocationId }) {
  const ledger = await readLedger();
  ledger.active.push({ kind, pursuitId, invocationId });
  ledger.history.push({ action: `create:${kind}`, pursuitId, invocationId });
  await saveLedger(ledger);
  return { result: 'SUCCESS' };
}

async function compensate(kind, { pursuitId, invocationId }) {
  const ledger = await readLedger();
  const index = ledger.active.findIndex(item =>
    item.kind === kind && item.pursuitId === pursuitId && item.invocationId === invocationId
  );
  if (index < 0) return { result: 'FAIL' };
  ledger.active.splice(index, 1);
  ledger.history.push({ action: `recover:${kind}`, pursuitId, invocationId });
  await saveLedger(ledger);
  return { result: 'SUCCESS' };
}

export async function reserveInventory(_inputs, context) {
  return create('inventory', context);
}
export async function allocateShipping(_inputs, context) {
  return create('shipping', context);
}
export async function finalizeOrder() {
  throw new Error('Demo: finalization service unavailable');
}
export async function releaseInventory(context) {
  return compensate('inventory', context);
}
export async function releaseShipping(context) {
  return compensate('shipping', context);
}
