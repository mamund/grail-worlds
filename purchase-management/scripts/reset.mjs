import { copyFile, rm } from 'node:fs/promises';
await copyFile(new URL('../data/seed.json', import.meta.url), new URL('../data/state.json', import.meta.url));
await rm(new URL('../config/observations.json', import.meta.url), { force: true });
console.log('Purchase domain state reset.');
