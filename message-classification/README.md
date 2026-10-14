# Message classification (Qwen + rules)

This standalone scenario uses the published `@mamund/grail@0.2.0` CLI. No experimental GRAIL runtime files are required.

## Prerequisites

- Node.js 22 or later
- Install the local dependency with `npm install`
- Optional for LLM classification: Ollama running locally with `qwen2.5:3b` (`ollama pull qwen2.5:3b`)

## Run

Run these commands **from this scenario directory**, so the STDIO capability paths resolve correctly:

```sh
npx grail validate --config ./config
npx grail show --config ./config
npx grail run --config ./config --output json
```

The local CLI is installed by `npm install`.

The goal is `customerMessageClassified`. Two affordances can establish it: `classifyCustomerMessage` (Ollama/Qwen) and `classifyWithRules` (local deterministic keywords). Both read the `message` from `config/inputs.json` and return `category` on stdout. The selected affordance is not fixed; GRAIL chooses between viable producers.

To change the input without editing files:

```sh
npx grail run --config ./config --inputs '{"message":"I need a refund."}' --output json
```

## Exercise failure recovery

Stop Ollama (`sudo systemctl stop ollama` on systems using systemd) and run again. If GRAIL selects Qwen first, that capability fails and the rules classifier can be selected next. If rules is selected first, the goal succeeds immediately. The sample message contains `charged`, so the rules classifier can classify it.

Restart Ollama as appropriate for your installation (for example, `sudo systemctl start ollama`).

## Interpretation

A successful run establishes the declared goal effect and records the returned category; it does **not** prove semantic correctness of the classification. The scenario relies on the existing beta STDIO contract and alternative-affordance failure recovery. No workflow or explicit fallback order is encoded.

## Files

- `config/registry.json` — two alternative STDIO affordances
- `config/goal.json` — target effect
- `config/inputs.json` — initial message
- `config/worldstate.json` — initial goal state
- `capabilities/classify-message.mjs` — Ollama/Qwen classifier
- `capabilities/classify-rules.mjs` — deterministic classifier

**Verification status:** This world was adapted from the working Demo 25 scenario. Validate and run it locally with GRAIL v0.2.0.
