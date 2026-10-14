# Failure recovery

A standalone GRAIL world inspired by `grail-demo-23-survive-fail`. It adapts the customer-onboarding world with two deliberately unavailable providers to demonstrate alternative affordances and per-pursuit FAIL exclusion. This is a fresh implementation, not a copy of Demo 23.

## Goal

The goal is `customerOnboarded`. The underlying onboarding responsibilities remain the same as in the `customer-onboarding` example. Two conditions now have competing producers:

| Effect | Available producer | Unavailable producer |
| --- | --- | --- |
| `customerEmailVerified` | `verifyCustomerEmail` | `verifyEmailUnavailable` |
| `customerOnboarded` | `onboardCustomer` | `onboardCustomerUnavailable` |

Both producers for each effect have identical preconditions. The unavailable provider throws an error when invoked, producing FAIL. GRAIL excludes that affordance for the remainder of the pursuit and can select the viable alternative. No explicit fallback order is encoded in the registry.

## Run

Requires Node.js 22+ and npm. From this directory:

```sh
npm install
npx grail validate --config ./config
npx grail run --config ./config --output=json
```

The expected result is `reached: true`, with `worldstate.customerOnboarded: true`. Depending on randomized affordance selection, a run may show zero, one, or two FAIL observations before success. This variation is intentional: the available producer may be selected first. Run the command several times to see different selections.

To change customer inputs:

```sh
npx grail run --config ./config --inputs '{"name":"Grace Hopper"}' --output=json
```

## What to inspect

Inspect `observations` in the JSON result. A failed invocation of `verifyEmailUnavailable` or `onboardCustomerUnavailable` may be followed by a successful invocation of its counterpart. The failed provider's declared effect remains false until a successful producer establishes it. A FAIL belongs to an affordance invocation; the goal pursuit can continue.

## Composition lessons

- **Effect-based alternatives:** Producers share the same declared effect and preconditions. Selection is independent of their function names.
- **Failure memory:** An affordance that fails is excluded within the current pursuit.
- **Goal persistence:** Even failure of a goal-producing affordance need not terminate pursuit while another producer remains viable.
- **Domain state boundary:** Application data lives in `capabilities/onboarding.js`, while GRAIL tracks boolean conditions.

## Scope

The unavailable providers intentionally throw errors; no network dependency is required. This makes the recovery mechanism easy to reproduce without an HTTP service. It does not test transient outages, retries, or real provider health. It uses the published `@mamund/grail` version `0.2.0` and does not depend on other worlds.
