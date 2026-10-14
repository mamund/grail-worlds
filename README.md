# GRAIL Worlds

**Runnable examples of goal-directed automation with [GRAIL](https://github.com/mamund/grail-release).**

GRAIL pursues a declared goal by discovering affordances that can establish the required conditions. A world defines the available affordances, their preconditions and effects, the inputs they consume, and the capabilities that carry out their work. The runtime selects a path through that environment rather than following a predefined workflow.

**Define the environment, not the path.**

This repository collects self-contained worlds you can run, inspect, and adapt. Each world has its own configuration, capabilities, and README. Examples target [`@mamund/grail` v0.2.0](https://www.npmjs.com/package/@mamund/grail).

## World catalog

| World | What it demonstrates | Requirements |
| --- | --- | --- |
| [`hello-grail`](./hello-grail/) | Goal resolution, preconditions, and runtime input overrides | Node.js |
| [`customer-lookup`](./customer-lookup/) | HTTP bindings, observations, and passing learned outputs between affordances | Node.js; local HTTP service (included) |
| [`customer-onboarding`](./customer-onboarding/) | Multi-capability composition, Node bindings, and separation of GRAIL state from application state | Node.js |
| [`failure-recovery`](./failure-recovery/) | Alternative producers, FAIL recovery, and unresolvable conditions | Node.js |
| [`message-classification`](./message-classification/) | LLM-backed and rules-based classification through interchangeable affordances | Node.js; Ollama and a local model for the LLM path |
| [`customer-support`](./customer-support/) | Customer support response preparation, mixed deterministic and LLM capabilities, and repeated pursuits from a batch script | Node.js; Ollama and configured local models |
| [`interactive-refund`](./interactive-refund/) | Human-in-the-loop STDIO capability and a completed refund determination, including zero-dollar outcomes | Node.js; interactive terminal |
| [`purchase-management`](./purchase-management/) | Purchase review and processing across HTTP, Node, and interactive STDIO bindings; approved, rejected, and deferred outcomes | Node.js; local HTTP service (included); interactive terminal |
| [`document-processing`](./document-processing/) | Python STDIO bindings, cross-affordance outputs, document classification, and recovery through alternative loaders | Python 3; GRAIL CLI |

The `document-processing` example uses Python 3 standard-library scripts and does not require an external service. Its README includes successful processing, FAIL recovery, and exhausted-alternatives tests.

The Ollama examples may have additional model and setup requirements. Consult their READMEs before running them.

## Getting started

Clone the repository and choose a world:

```sh
git clone https://github.com/mamund/grail-worlds.git
cd grail-worlds/hello-grail
npm install
npm run validate
npm start
```

If a world's scripts differ, follow its README. For a direct CLI invocation, use:

```sh
npx grail validate --config ./config
npx grail run --config ./config --output=json
```

Some worlds require a local service, an Ollama installation, or an interactive terminal. Each world documents its setup and expected result. In `purchase-management`, one pursuit handles one purchase request; run another pursuit to process another request.

## How a world is organized

A typical world looks like this:

```text
world-name/
├── README.md
├── package.json
├── config/
│   ├── registry.json
│   ├── worldstate.json
│   ├── inputs.json
│   └── goal.json
└── capabilities/
```

Some worlds use `service/`, `scripts/`, or other directories where appropriate.

- **`goal.json`** names the condition the pursuit aims to establish, using the `goal` key.
- **`registry.json`** describes affordances, their preconditions, effects, inputs, and execution bindings.
- **`worldstate.json`** records GRAIL's boolean conditions.
- **`inputs.json`** supplies initial values; CLI arguments can override them.
- **Capabilities** perform domain work and determine whether their declared responsibility has been fulfilled.

GRAIL's world state tracks the conditions relevant to pursuit. Domain-specific values and resolutions belong to capabilities and their application state. Observations record what happened during execution and can supply learned values to later capabilities.

## Suggested learning path

Start with `hello-grail`, then `customer-lookup`, followed by `customer-onboarding`. Explore `failure-recovery` to see how alternative affordances support continued pursuit after a failure. The remaining examples show how GRAIL integrates local models, larger support scenarios, and human interaction. Use `document-processing` to explore Python STDIO bindings, `$outputs.latest.*` references, and alternative affordances. Finish with `purchase-management` for a domain-oriented example that combines multiple binding types and records approved, rejected, or deferred purchase decisions.

## Using these examples

Each world is intended to stand alone. Copy a world into a separate project, install its dependencies, and change its inputs or capabilities to explore how the environment behaves. The examples are teaching material, not production-ready integrations; review security, credentials, external side effects, and domain rules before adapting them to live systems.

## Related projects

- [GRAIL runtime and CLI](https://github.com/mamund/grail-release)
- [GRAIL experiments and development history](https://github.com/mamund/grail-public)
- [GRAIL website](https://mamund.github.io/grail-site/)
