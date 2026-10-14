
/**
 * common.mjs
 * ------------------------------------------------------------------
 * Shared utilities for GRAIL STDIO capabilities using Ollama.
 *
 * Provides:
 *   - JSON input handling via stdin
 *   - Required string validation
 *   - Ollama API invocation with JSON responses
 *   - Standard capability execution and error handling
 *
 * Environment variables:
 *   OLLAMA_URL   Ollama generation endpoint
 *                Default: http://localhost:11434/api/generate
 *
 *   OLLAMA_MODEL Ollama model identifier
 *                Default: qwen2.5:3b
 *
 * Capability contract:
 *   Input:   JSON object received via stdin
 *   Output:  JSON value written to stdout
 *   Errors:  Message written to stderr; exit code 1
 *
 * ------------------------------------------------------------------
 */

/**
 * Read and parse a JSON object from standard input.
 *
 * @returns {Promise<object>} Parsed input object.
 */
export async function readInput() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const input = JSON.parse(
    Buffer.concat(chunks).toString('utf8')
  );

  if (!input || typeof input !== 'object') {
    throw Error('Expected JSON object');
  }

  return input;
}

/**
 * Validate and normalize a required string value.
 *
 * @param {*} value - Value to validate.
 * @param {string} name - Name used in error messages.
 * @returns {string} Trimmed string value.
 */
export function required(value, name) {
  if (typeof value !== 'string' || !value.trim()) {
    throw Error(`Missing ${name}`);
  }

  return value.trim();
}

/**
 * Send a prompt to Ollama and parse its JSON response.
 *
 * Uses a configurable endpoint and model, with deterministic
 * generation settings (temperature 0) and a 120-second timeout.
 *
 * @param {string} prompt - Prompt sent to the model.
 * @returns {Promise<*>} Parsed JSON response from Ollama.
 */
export async function ollama(prompt) {
  const response = await fetch(
    process.env.OLLAMA_URL ||
      'http://localhost:11434/api/generate',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(120000),
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
        prompt,
        format: 'json',
        stream: false,
        options: {
          temperature: 0
        }
      })
    }
  );

  if (!response.ok) {
    throw Error(`Ollama HTTP ${response.status}`);
  }

  const payload = await response.json();

  return JSON.parse(payload.response);
}

/**
 * Execute a GRAIL STDIO capability.
 *
 * Reads input, invokes the supplied handler, and writes the
 * resulting JSON to stdout. Errors are reported on stderr
 * with a nonzero process exit code.
 *
 * @param {Function} fn - Async capability handler.
 * @returns {Promise<void>}
 */
export async function main(fn) {
  try {
    const input = await readInput();
    const output = await fn(input);

    process.stdout.write(
      JSON.stringify(output) + '\n'
    );
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
}

