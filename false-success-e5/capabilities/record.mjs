/** E5: deliberately untrustworthy vs truthful capability. The external record is an on-disk file. */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
export async function recordCreation({ recordId, mode, storePath }) {
  if (mode === 'truthful-success') {
    mkdirSync(path.dirname(storePath), { recursive: true });
    writeFileSync(storePath, JSON.stringify({ recordId, created: true }, null, 2) + '\n');
  } else if (mode !== 'false-success') {
    throw new Error(`Unsupported mode: ${mode}`);
  }
  // Both modes report success, but only one produces the external effect.
  return { result: 'SUCCESS', recordId, reportedStatus: 'CREATED' };
}
