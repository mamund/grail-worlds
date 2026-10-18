# Customer verification — GRAIL child world

This is a standalone GRAIL world that completes a customer verification process. It can run independently using the GRAIL CLI or be invoked by the `customer-onboarding` parent world through the GRAIL Node.js public API. It does **not** depend on the parent world.

## Prerequisites

- Node.js 22+
- Installed GRAIL beta CLI (`grail`)

## Validate and run

From this world's directory:

```sh
grail validate --config config
grail run --config config --output=json
```

From another directory, supply the path to this world's `config` directory with `--config`. GRAIL resolves Node binding module paths relative to the world root (the parent of `config/`), rather than the caller's working directory. The capability code itself remains responsible for its own filesystem and other dependencies.

The configured goal is `customerVerified`. A successful pursuit has `reached: true` and these worldstate conditions set to `true`: `customerLocated`, `identityChecked`, `accountChecked`, and `customerVerified`.

## Affordances and data flow

| Affordance | Requires | Establishes | Domain data produced |
| --- | --- | --- | --- |
| `lookupCustomer` | — | `customerLocated` | `customerId` |
| `checkIdentity` | `customerLocated` | `identityChecked` | `identityStatus` |
| `checkAccount` | `customerLocated` | `accountChecked` | `accountStatus` |
| `completeVerification` | `identityChecked`, `accountChecked` | `customerVerified` | `verificationStatus` |

`completeVerification` receives `customerId`, `identityStatus`, and `accountStatus`. It returns `APPROVED` only when identity is `APPROVED` **and** the account is `OPEN`; otherwise it returns `REJECTED`. The identity and account checks may execute in either order.

## Current demonstration fixture

The seeded customer is `C100`. In the current experiment, `checkIdentity` deliberately returns `REJECTED` to exercise the negative domain-outcome path. `checkAccount` returns `OPEN` for `C100`. Consequently, `completeVerification` returns:

```json
{
  "customerId": "C100",
  "verificationStatus": "REJECTED"
}
```

The capability also retains a commented-out customer-ID-based identity fixture; that alternative is **not** active in this demonstration. The account-check fixture returns `CLOSED` for `C998` and `OPEN` otherwise.

## Completion versus domain outcome

`customerVerified` means **the verification process completed**, not that the customer was approved. A `REJECTED` verification result is compatible with `reached: true` and GRAIL `SUCCESS` for each affordance. GRAIL tracks the occurrence of verification; capabilities determine its domain outcome.

## Use as a child world

The parent `nested-customer-onboarding` world uses `runGrailWorld()` to pass a `customerId` into a fresh child pursuit and reads `verificationStatus` from the `completeVerification` observation. The parent decides what to do with that result. The child does not know about the parent, its goal, or its activation policy.

The parent adapter calls the reusable API rather than manually loading the child environment or rewriting Node binding paths:

```js
const childResult = await runGrailWorld({
  worldRoot: childRoot,
  inputs: { customerId },
  inputMode: 'override'
});
```

The child's `config/goal.json` supplies the default goal, and its `config/inputs.json` supplies defaults for inputs not overridden by the caller. `runGrailWorld()` handles the world root and creates a fresh GRAIL instance for each call. The parent adapter still checks `childResult.reached` and extracts the domain result from the child's observations.

This experiment uses the existing Node binding and public API; it does not require a dedicated nested-GRAIL binding. The `runGrailWorld()` helper is available in the updated development version of `@mamund/grail`; it is not part of the published v0.2.0 beta. To run the parent with this adapter, install the updated local package in the parent project until a version containing the helper is published.

## Inspecting results

```sh
grail run --config config --output=json > verification-result.json
```

Inspect the `completeVerification` invocation's `inputs`, `response.result`, and `outputs`, as well as the top-level `reached` and `worldstate` fields. `verificationStatus` is exposed as an affordance output; `customerId` is also present in the capability response.
