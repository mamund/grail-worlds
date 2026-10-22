# Recovery demo — portable GRAIL world

This world demonstrates **best-effort compensation** of successful side effects when a later capability makes the goal unreachable. It uses deterministic Node capabilities and a local JSON ledger; no external services, credentials, or LLMs are needed.

## Requirements

- Node.js 22+
- A GRAIL installation containing Recovery v1 (the in-development recovery-enabled runtime). **The published `@mamund/grail@0.2.0` does not necessarily contain these unreleased changes.**

## Run

From the `recovery-demo` directory:

```sh
node scripts/reset.mjs
grail validate
grail run --recover --output=summary
cat state/ledger.json
```

The CLI should exit nonzero because the original goal is not reached. This is expected even when compensation succeeds. To capture its exit status in a shell, use `grail run --recover --output=summary; echo "exit=$?"` (do not use `&&` before inspecting the ledger).

If testing against the local `grail-release` checkout instead of an installed CLI, substitute `node /absolute/path/to/grail-release/cli/grail-cli.js` for `grail`.

## World and scenario

| Affordance | Preconditions | Effect | Forward operation | Recovery operation |
|---|---|---|---|---|
| `reserveInventory` | none | `inventoryReserved` | Append inventory reservation to ledger | `releaseInventory` |
| `allocateShipping` | `inventoryReserved` | `shippingAllocated` | Append shipping allocation to ledger | `releaseShipping` |
| `finalizeOrder` | `shippingAllocated` | `orderFinalized` | Intentionally throws an error | none |

The scenario in `config/goal.json` requests `orderFinalized`. Forward execution performs two successful side effects and then fails. There is no alternative producer for `orderFinalized`, so the pursuit becomes unresolvable and recovery starts.

## Expected evidence

The ledger's `history` records actions in this order:

```text
create:inventory
create:shipping
recover:shipping
recover:inventory
```

The `active` array should be empty after compensation. The recovery summary should report `attempted: true`, `recovered: 2`, `failed: 0`, and `skipped: 0`, while `reached` remains `false`.

Recovery handlers receive **only the original** `{ pursuitId, invocationId }` object and look up their side effects in the ledger. Each compensation is correlated with its original forward invocation. The worldstate still records forward occurrences; it is not rewritten by recovery.

For detailed evidence, run:

```sh
node scripts/reset.mjs
grail run --recover --output=json > result.json
```

Expect a nonzero exit code. Examine `result.json` for `phase: "forward"` and `phase: "recovery"` observations, original invocation correlation, and timing. `result.json` may contain runtime log lines depending on the CLI configuration; use the observation records as the authoritative execution evidence.

## Compare with recovery disabled

```sh
node scripts/reset.mjs
grail run --output=summary
cat state/ledger.json
```

Without `--recover`, the pursuit still fails, but the ledger retains two active entries and no recovery history entries. Reset the ledger before each run to avoid mixing scenarios.

## Limitations

This is an instructional, single-process example, not a production transaction manager. Its JSON ledger is deliberately simple, has no concurrency locking or crash recovery, and is reset manually. The finalization failure is intentional. Successful recovery handlers report successful compensation attempts, not proof that all external domain state was restored.
