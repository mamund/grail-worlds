# Customer onboarding

A standalone GRAIL world based on the **composition concepts** explored in `grail-demo-18-node-customer-onboarding`. This is a fresh, smaller implementation, not a copy of the original demo source.

## Goal and composition

The goal is `customerOnboarded`. The world contains seven Node-bound affordances:

| Affordance | Requires | Establishes |
| --- | --- | --- |
| `startOnboarding` | — | `onboardingStarted` |
| `createCustomerProfile` | `onboardingStarted` | `customerProfileCreated` |
| `setCustomerDetails` | `customerProfileCreated` | `customerEmailSet`, `customerPhoneNumberSet`, `customerAddressSet` |
| `verifyCustomerEmail` | `customerEmailSet` | `customerEmailVerified` |
| `verifyCustomerPhone` | `customerPhoneNumberSet` | `customerPhoneVerified` |
| `acceptTerms` | `customerProfileCreated` | `termsAccepted` |
| `onboardCustomer` | `customerEmailVerified`, `customerPhoneVerified`, `customerAddressSet`, `termsAccepted` | `customerOnboarded` |

The registry declares conditions and effects, not an execution sequence. GRAIL can resolve the independent verification and terms-acceptance conditions in different orders.

## Requirements

Node.js 22 or later, npm. No HTTP service, credentials, or external API is needed.

## Run

From this directory:

```sh
npm install
npx grail validate --config ./config
npx grail run --config ./config --output=json
```

Expect `reached: true` and `customerOnboarded: true`. The final `onboardCustomer` observation captures `status: "onboarded"`. Earlier observations contain identifiers such as `onboardingId`, `customerId`, and verification identifiers.

Try overriding customer data without editing configuration:

```sh
npx grail run --config ./config --inputs '{"name":"Grace Hopper","email":"grace@example.test"}' --output=json
```

The CLI resets GRAIL world state for each run. The capability module also maintains a fresh in-memory application record per CLI process.

## Composition lessons

**Conditions and domain data.** `customerProfileCreated` is a GRAIL condition. The customer record and identifiers are domain data held by the capability module. GRAIL captures selected outputs in observations and makes them available to subsequent affordances using `$outputs.latest.*`.

**Multiple effects.** `setCustomerDetails` establishes three conditions in one successful invocation. The capability validates all three inputs before updating its application state.

**Independent responsibilities.** Email verification, phone verification, and terms acceptance are separate affordances. Their ordering is determined by unmet conditions rather than a prescribed workflow.

**Success contract.** The final capability checks its own application data before reporting success. GRAIL then applies the declared `customerOnboarded` effect.

## Scope

This is a teaching example. Verification identifiers are illustrative, acceptance is simulated, and domain state is in-memory. It is not a production identity-verification or consent system. The original Demo 18 included fine-grained setter alternatives alongside a bundled details setter; this introductory version intentionally omits those alternatives. A later world can explore alternate producers and failure recovery.

## Portability

All files are local to this world. It depends only on published `@mamund/grail` version `0.2.0` and does not reference sibling worlds or a checked-out GRAIL runtime.
