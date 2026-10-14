export async function learnName({ name }) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('A nonempty name is required');
  }
  return { name };
}

export async function greet({ name }) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Cannot greet without a name');
  }
  return { message: `Hello, ${name}!` };
}
