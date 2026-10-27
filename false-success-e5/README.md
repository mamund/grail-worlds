# E5 — False Success: Capability Trust Boundary

## Research question
Can GRAIL reach an internal goal when a capability reports `SUCCESS` but does not perform its declared external effect?

This experiment deliberately separates **GRAIL worldstate** (`recordCreated`) from **external domain state** (the existence of `results/<scenario>/domain-record.json`). The registry declares the effect `recordCreated`. The runtime does not independently inspect the external file.

## Scenarios

| Scenario | Capability reports | External file | Expected GRAIL goal |
| --- | --- | --- | --- |
| `false-success` | `SUCCESS` | **Absent** | Reached |
| `truthful-success` (control) | `SUCCESS` | **Present** | Reached |

Both scenarios use the **same registry, goal, initial worldstate, and capability implementation**. Only the scenario inputs differ. The capability's `mode` determines whether it writes the external record before returning success.

## Run

Requires Node.js >=20 and `@mamund/grail@0.3.0-beta.1`.

```bash
npm install
npm test
```

Or individually:

```bash
npm run test:control
npm run test:false
node api-run.js false-success 5000
```

The parent harness starts a separate Node worker using the GRAIL API, enforces a hard timeout (default 3000 ms), and writes scenario-specific evidence. It removes the selected scenario's prior results before each run, so stale files cannot create a false positive.

## Evidence

Each scenario writes `results/<scenario>/` containing:

- `harness-status.json` — worker completion/timeout
- `output.json` — GRAIL pursuit result
- `observations.json` — invocation observations
- `trace.json` — selector and stack events
- `assessment.json` — goal reached vs external file existence
- `worker-stdout.log`, `worker-stderr.log` — worker diagnostics
- `domain-record.json` — **only** when the external effect actually occurs

## Interpretation and limits

If both pursuits reach `recordCreated`, but the external record is absent only in the false-success scenario, the experiment demonstrates that **GRAIL's internal effect accounting trusts the capability's success report**. It does not prove that all possible external side effects are unverified, nor does it imply that GRAIL should implement domain-specific verification. External verification can be delegated to capabilities or additional affordances.

The diagnostic trace import uses the development-build module `pursuitTrace.js` located beside the resolved GRAIL entry point. If the package layout changes, this import may need adjustment; it is not a public API guarantee.

The world is intentionally deceptive in the false-success scenario. It is a boundary test, not a recommended capability design.
