# E6 — Failure-memory scope (multi-effect affordance)

## Research question

If an affordance declares **two effects** and fails while selected for one condition, is that same affordance excluded when the runtime later resolves its *other* condition? This tests the scope of GRAIL's failure exclusion (P3), not recovery compensators.

## World

Goal: `workCompleted`. The `completeWork` affordance requires both `conditionA` and `conditionB`. Both begin `false`.

| Affordance | Preconditions | Declared effects | Behavior |
|---|---|---|---|
| `sharedProducer` | none | `conditionA`, `conditionB` | Fails in the failure scenario; succeeds in control |
| `alternativeA` | none | `conditionA` | Succeeds |
| `alternativeB` | none | `conditionB` | Succeeds |
| `completeWork` | `conditionA`, `conditionB` | `workCompleted` | Succeeds |

**Failure scenario:** The deterministic selector first chooses `conditionA`, then `sharedProducer`, which fails. GRAIL should select `alternativeA` to satisfy A. When it later needs B, the failed `sharedProducer` should be excluded, leaving `alternativeB` as the only eligible candidate. The goal should still be reached.

**Control scenario:** `sharedProducer` succeeds on its first invocation, satisfying **both** A and B; neither alternative should run.

## Run

Requires Node.js 20+ and the published GRAIL runtime. From this directory:

```bash
npm install
npm test
```

Or run individually:

```bash
npm run test:control
npm run test:failure
# Optional timeout in milliseconds (default 3000)
node api-run.js failure 5000
```

The parent launcher uses `spawnSync` with a hard wall-clock timeout and `SIGKILL`, so even a synchronous runtime loop cannot block the test process indefinitely.

## Reproducibility and selector control

The current runtime's condition and affordance selectors choose among candidates using `Math.random()`. The **worker sets `Math.random = () => 0`** before calling the API. This is an explicit experimental control to ensure the same choice order; it does **not** change GRAIL's source code or selection rules. Without that control, a multi-effect producer might succeed or fail in a different order, confounding the test.

Each scenario uses a **fresh Grail instance and a single pursuit**. This matters: in the inspected 0.3.0-beta.1 API implementation, `Grail.pursue()` resets worldstate and observations at the start of each pursuit. This experiment therefore tests failure exclusion **within one pursuit**, not across independent pursuits.

## Evidence

After execution, each `results/<scenario>/` folder contains:

- `harness-status.json` — completion, timeout, exit code, elapsed time.
- `output.json` — complete API pursuit result.
- `observations.json` — capability invocations and results.
- `trace.json` — condition and affordance selections, stack events.
- `assessment.json` — scenario assertions and selected candidates.
- `worker-stdout.log`, `worker-stderr.log` — diagnostic logs.

On timeout, some files may be absent; the harness report and logs remain available. The test script exits nonzero on an unexpected result.

## Interpretive limits

This experiment tests **action-name-scoped failure memory across two effects within one pursuit**. It does not establish how failure memory behaves under multiple simultaneous pursuits, persistence across processes, or recovery operations. A passing result supports a specific implementation property, not a general theorem about all GRAIL worlds.

No runtime source modifications are required. Preserve the package and generated `results/` directory for the research evidence archive.
