# E4 — Cyclic Dependencies (GRAIL boundary experiment)

Research question: What does the existing GRAIL runtime do when the goal depends on an unsatisfied two-condition cycle?

## Design

- `establishA`: requires `conditionB`; establishes `conditionA`.
- `establishB`: requires `conditionA`; establishes `conditionB`.
- Goal: `conditionA`.
- `cycle` scenario: both conditions false; no capability can legally run.
- `control` scenario: `conditionB` true; `establishA` should execute and reach the goal.

## Setup

Requires Node.js >=20 and GRAIL 0.3.0-beta.1. From this directory:

```bash
npm install
npm run test:control
npm run test:cycle
# or both with control assertions:
npm test
```

The Node API is invoked by `api-worker.js` using `loadEnvironment`, `new Grail(...)`, and `grail.pursue(...)`. `api-run.js` starts that worker in a **separate OS process**, applies a 3000 ms wall-clock timeout, and kills the process if necessary. This is intentional: `Promise.race()` alone cannot stop a synchronous infinite loop.

Override the timeout: `node api-run.js cycle 5000`.

## Evidence

Each scenario writes to `results/<scenario>/`:

- `harness-status.json` — completion, exit status, signal, timeout, elapsed wall time.
- `worker-stdout.log` and `worker-stderr.log` — captured runtime messages, including partial output on timeout.
- On completed pursuit: `output.json`, `observations.json`, `trace.json`.
- On thrown error: `error.json`.

**Caution:** A killed process may not produce a complete trace or observations. A timeout means only that the pursuit did not finish within the observation window. Do not equate an unreached goal with a `BLOCKED` status unless the actual runtime output supports that interpretation. The `reached` field is a Boolean, not a full termination-reason code.

**Reproducibility:** Record `node --version`, `npm ls @mamund/grail`, timeout value, and the exact command. The runtime package is an explicit dependency; no GRAIL source changes are required. The runner uses the public `Grail` API and the runtime's diagnostic trace module. The trace collector is imported from the installed package directory (it is not a public package export); this is a version-specific diagnostic dependency.

**Experimental hygiene:** `results/` is overwritten on repeated runs. Archive it before rerunning. The scenario-specific initial worldstates remain immutable.
