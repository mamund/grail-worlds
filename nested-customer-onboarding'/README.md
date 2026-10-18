# Customer onboarding — nested GRAIL pursuit

This parent GRAIL world demonstrates **recursive composition using the existing Node binding and GRAIL public API**. The `verifyCustomer` affordance invokes a standalone child `customer-verification` world, receives its domain result, and makes that result available to the parent's activation capability. No native GRAIL binding is required.

The experiment began from the working stage 3 onboarding world and extends the stage 4 nested-pursuit demonstration to include failure propagation and negative domain outcomes.

## Directory structure

- `config/`: parent registry, worldstate, inputs, and goal
- `capabilities/create-customer.mjs`: creates the customer
- `capabilities/prepare-account.mjs`: prepares an account
- `capabilities/verify-customer.mjs`: Node adapter that invokes the child GRAIL world through the public API
- `capabilities/activate-customer.mjs`: interprets verification status and returns an activation decision
- `child-world/customer-verification/`: independently runnable verification world, with its own `config/`, capabilities, and README
- `api-run.js`: parent-world launcher using the GRAIL public API, useful for inspecting observations

## Prerequisites

Node 22+ and GRAIL 0.2.x. From this parent-world directory, install dependencies:

```sh
npm install
```

Run the parent from this directory because its Node bindings use `./capabilities/...` paths.

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

The parent `verify-customer.mjs` adapter:

1. Locates and loads the child environment.
2. Converts the child's relative Node binding module paths to absolute paths **in memory**, without modifying child configuration or changing `process.cwd()`.
3. Constructs a new `Grail` instance with fresh child worldstate and passes in the parent's `customerId`.
4. Calls `grail.pursue(environment.goal)` and throws if the child pursuit did not reach its goal.
5. Reads `verificationStatus` from the child's `completeVerification` observation and returns it to the parent along with child pursuit evidence.

The parent and child maintain separate worldstates. The child's `inputs.json` provides standalone defaults; when invoked by the parent, `customerId` is supplied by the parent.

## Experiments and observed results

**Successful nested execution:** The child reaches `customerVerified`; the parent resumes and reaches its configured goal.

**Unresolvable child pursuit:** Disabling the child's `lookupCustomer` affordance leaves `customerLocated` unresolved. The child returns `reached: false`; the adapter throws, and the parent cannot complete its pursuit. Re-enable the affordance afterward.

**Negative domain outcome:** The child returns `verificationStatus: "REJECTED"` while reaching `customerVerified`. The parent propagates that result to `activateCustomer`, which returns `activationStatus: "DENIED"` with GRAIL `SUCCESS`.

For detailed evidence, run `node api-run.js` and inspect the parent `verifyCustomer` observation, which includes `childWorldstate` and `childObservations` in its capability response.

## Boundaries and limitations

- **Occurrence versus outcome:** `customerVerified` means the verification process completed, not that approval was granted. The capability determines the domain result.
- **Parent goal semantics:** The final parent goal is `onboardingProcessed`, which describes completion of onboarding processing regardless of whether activation is `ACTIVE` or `DENIED`. This avoids treating a positive domain outcome as the GRAIL goal.
- **Adapter plumbing:** `verify-customer.mjs` contains GRAIL-specific environment loading, pursuit execution, and observation extraction. The ordinary business capabilities are otherwise GRAIL-agnostic.
- **Result contract:** The adapter currently extracts the child domain result from an observation associated with `completeVerification`. This is coupled to the child's internal affordance name and is an identified area for future interface/data-marshalling improvements.
- **Existing bindings:** This experiment uses the Node binding and public API. It does not add or require a new binding protocol.

## Key finding

A GRAIL world can be invoked from an ordinary capability, and the resulting domain data can be passed to subsequent capabilities **without requiring the GRAIL runtime to interpret its meaning**. GRAIL tracks occurrences; capabilities interpret domain outcomes.
