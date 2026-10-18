# Customer onboarding — nested GRAIL pursuit

This parent GRAIL world demonstrates **recursive composition using the existing Node binding and GRAIL public API**. The `verifyCustomer` affordance invokes a standalone child `customer-verification` world, receives its domain result, and makes that result available to the parent's activation capability. No native GRAIL binding is required.

The example builds on customer onboarding to demonstrate nested pursuits, failure propagation, and negative domain outcomes.

## Directory structure

- `config/`: parent registry, worldstate, inputs, and goal
- `capabilities/create-customer.mjs`: creates the customer
- `capabilities/prepare-account.mjs`: prepares an account
- `capabilities/verify-customer.mjs`: Node adapter that invokes the child world using `runGrailWorld()`
- `capabilities/activate-customer.mjs`: interprets verification status and returns an activation decision
- `child-world/customer-verification/`: independently runnable verification world, with its own `config/`, capabilities, and README
- `api-run.js`: parent-world launcher using the GRAIL public API, useful for inspecting observations

## Prerequisites

Node.js 22+ and a version of `@mamund/grail` that exports `runGrailWorld()`. The helper has been added to the development source but is not included in the published v0.2.0 beta.

From this parent-world directory, install the updated local `grail-release` package (adjust the path to your checkout):

```sh
npm install ../../grail-release
```

If a future published release includes `runGrailWorld()`, install that release instead. To verify the installed export:

```sh
node --input-type=module -e "import('@mamund/grail').then(m => console.log(typeof m.runGrailWorld))"
```

The expected output is `function`. GRAIL resolves Node binding module paths relative to the world root when the runtime receives the correct `baseDir`; the helper supplies that automatically. Capability-internal file paths and other dependencies remain the capability's responsibility.

## Run the child independently

```sh
cd child-world/customer-verification
grail validate --config config
grail run --config config --output=json
cd ../..
```

Expected child goal: `customerVerified`, with `reached: true`. The child runs `lookupCustomer`, `checkIdentity`, `checkAccount`, and `completeVerification`; the two checks may run in either order. The final capability consumes `identityStatus` and `accountStatus` and returns `verificationStatus`.

In the currently tested fixture, `checkIdentity` returns `REJECTED`, so the child completes successfully with `verificationStatus: "REJECTED"`. This is a domain result, not a GRAIL failure. See the child README for fixture details.

## Run the parent with its nested child

```sh
grail validate --config config
grail run --config config --output=json
node api-run.js
```

The parent pursues `onboardingProcessed` through these affordances:

1. `createCustomer` — creates the customer.
2. `prepareAccount` — prepares the account.
3. `verifyCustomer` — runs the child's `customerVerified` pursuit and exposes `verificationCompleted`, `childReached`, and `verificationStatus`.
4. `activateCustomer` — consumes `verificationStatus` and returns `activationStatus`.

For the confirmed rejection scenario (`customerId: "C100"` with the child's forced `REJECTED` identity fixture), expect:

```json
{
  "verificationStatus": "REJECTED",
  "activationStatus": "DENIED"
}
```

These values appear in the relevant affordance observations, not necessarily together in a single top-level result object. The child and parent affordances can all report GRAIL `SUCCESS` because their work completed, even though activation was denied.

## How the nested invocation works

The parent `verify-customer.mjs` adapter locates the child world relative to its own module and invokes the public helper:

```js
const childResult = await runGrailWorld({
  worldRoot: childRoot,
  inputs: { customerId },
  inputMode: 'override'
});
```

`runGrailWorld()` loads the child's configuration, resolves binding paths against the child world root, creates a fresh GRAIL instance, and pursues the child's configured goal (`customerVerified`). It does not change `process.cwd()` or rewrite configuration files. The parent's `customerId` overrides the value in the child's `inputs.json`; other configured inputs remain available. An omitted `inputs` argument would use the child's configured inputs unchanged. The helper also supports `inputMode: 'replace'` and an optional `goal` override.

The adapter then checks `childResult.reached`, throwing if the child pursuit could not complete. On success, it reads `verificationStatus` from the `completeVerification` observation and returns that domain value and the child pursuit evidence to the parent. The parent and child maintain separate worldstates.

A direct caller can also launch the parent from another working directory using `runGrailWorld({ worldRoot: '/absolute/path/to/nested-customer-onboarding' })`. This has been tested with the nested pursuit.

## Experiments and observed results

**Successful nested execution:** The child reaches `customerVerified`; the parent resumes and reaches its configured goal.

**Unresolvable child pursuit:** Disabling the child's `lookupCustomer` affordance leaves `customerLocated` unresolved. The child returns `reached: false`; the adapter throws, and the parent cannot complete its pursuit. Re-enable the affordance afterward.

**Negative domain outcome:** The child returns `verificationStatus: "REJECTED"` while reaching `customerVerified`. The parent propagates that result to `activateCustomer`, which returns `activationStatus: "DENIED"` with GRAIL `SUCCESS`.

For detailed evidence, run `node api-run.js` and inspect the parent `verifyCustomer` observation, which includes `childWorldstate` and `childObservations` in its capability response.

## Boundaries and limitations

- **Occurrence versus outcome:** `customerVerified` means the verification process completed, not that approval was granted. The capability determines the domain result.
- **Parent goal semantics:** The final parent goal is `onboardingProcessed`, which describes completion of onboarding processing regardless of whether activation is `ACTIVE` or `DENIED`. This avoids treating a positive domain outcome as the GRAIL goal.
- **Adapter plumbing:** `verify-customer.mjs` delegates environment loading, path resolution, and pursuit execution to `runGrailWorld()`. It still checks pursuit completion and extracts the domain result. The ordinary business capabilities are otherwise GRAIL-agnostic.
- **Result contract:** The adapter currently extracts the child domain result from an observation associated with `completeVerification`. This is coupled to the child's internal affordance name and is an identified area for future interface/data-marshalling improvements.
- **Existing bindings:** This experiment uses the Node binding and public API. It does not add or require a new binding protocol.
- **Portability boundary:** GRAIL can locate and invoke a capability relative to the world root; any filesystem paths or external dependencies used *inside* that capability are its own responsibility.

## Key finding

A GRAIL world can be invoked from an ordinary capability through `runGrailWorld()`, and the resulting domain data can be passed to subsequent capabilities **without requiring the GRAIL runtime to interpret its meaning**. GRAIL tracks occurrences; capabilities interpret domain outcomes.
