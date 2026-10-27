/** E6: one multi-effect producer and independent single-effect alternatives. */
export async function sharedProducer({ mode }) {
  if (mode === 'failure') throw new Error('E6 intentional sharedProducer failure');
  if (mode !== 'control') throw new Error(`Unsupported mode: ${mode}`);
  return { result: 'SUCCESS', source: 'sharedProducer' };
}
export async function alternativeA() { return { result: 'SUCCESS', source: 'alternativeA' }; }
export async function alternativeB() { return { result: 'SUCCESS', source: 'alternativeB' }; }
export async function completeWork() { return { result: 'SUCCESS', source: 'completeWork' }; }
