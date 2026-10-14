import { readFile, writeFile } from 'node:fs/promises';
const stateURL = new URL('../data/state.json', import.meta.url);
const seedURL = new URL('../data/seed.json', import.meta.url);
export async function readState() {
  try { return JSON.parse(await readFile(stateURL, 'utf8')); }
  catch (err) { if (err.code !== 'ENOENT') throw err; return JSON.parse(await readFile(seedURL, 'utf8')); }
}
export async function writeState(state) { await writeFile(stateURL, JSON.stringify(state, null, 2) + '\n'); }
export async function getPurchase(id) { return (await readState())[id]; }
export async function updatePurchase(id, changes) {
  const state = await readState();
  if (!state[id]) throw new Error(`Unknown purchase ${id}`);
  state[id] = { ...state[id], ...changes };
  await writeState(state);
  return state[id];
}
