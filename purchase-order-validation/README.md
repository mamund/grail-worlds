# Purchase order validation

A portable GRAIL-world demonstrating four distinct affordances invoking the **same Node.js function** with different `value` and `ruleId` inputs. Domain-specific rules are implemented in `capabilities/validate-field.mjs`, not the registry.

This world demonstrates capability reuse, named output references, literal inputs, and the separation of execution success from business outcomes.

## Goal and behavior

Goal: `purchaseOrderValidated`.

The four occurrence gates are `supplierValidated`, `accountValidated`, `productValidated`, and `quantityValidated`. All four must be satisfied before `evaluatePurchaseOrder` is eligible.

| Affordance | Capability | Effect |
| --- | --- | --- |
| `validateSupplier` | `validateField` | `supplierValidated` |
| `validateAccount` | `validateField` | `accountValidated` |
| `validateProduct` | `validateField` | `productValidated` |
| `validateQuantity` | `validateField` | `quantityValidated` |
| `evaluatePurchaseOrder` | `evaluateOrder` | `purchaseOrderValidated` |

The four validation affordances share the same Node.js capability. Each supplies a value and a rule identifier:

```json
{
  "value": "$inputs.supplierId",
  "ruleId": "supplier"
}
```

The `value` is resolved from the scenario inputs. The `ruleId` is a literal string passed directly to the capability.

The capability uses `ruleId` to dispatch the value to the appropriate validation function. The registry contains no domain-specific validation rules.

Validation failures are business results (`valid: false`), not execution failures. An unknown `ruleId` throws an error.

The evaluator collects the four validation results and returns `APPROVED` or `REJECTED`, along with an array of failures.

## Named outputs

Each validation returns the same output fields:

```json
{
  "valid": true,
  "reason": "Validation passed"
}
```

The evaluator uses named output references to retrieve the results of individual affordances:

```text
$outputs.validateSupplier.latest.valid
$outputs.validateAccount.latest.valid
$outputs.validateProduct.latest.valid
$outputs.validateQuantity.latest.valid
```

The general syntax is:

```text
$outputs.<affordance>.latest.<field>
```

These references identify the latest output from a specific affordance. Unlike `$outputs.latest.<field>`, they do not depend on which validation executed most recently.

This allows GRAIL to select and execute the four validations in any order.

## Run

Requires Node.js 22+ and `@mamund/grail` installed as a CLI, including support for literal affordance inputs.

From this world's root:

```sh
grail validate --config ./config
grail run --config ./config --output summary
```

To inspect the complete pursuit result, including observations and worldstate:

```sh
grail run --config ./config --output json
```

For alternative scenarios, use the CLI inputs-file override:

```sh
grail run --config ./config --inputs-file ./scenarios/approved.json --output summary
grail run --config ./config --inputs-file ./scenarios/invalid-supplier.json --output summary
grail run --config ./config --inputs-file ./scenarios/multiple-failures.json --output summary
```

The scenario files use identical keys, so the default append behavior is sufficient. Each CLI run starts with fresh worldstate.

## Expected results

| Scenario | Decision | Failed checks | Goal reached |
| --- | --- | --- | --- |
| approved | APPROVED | none | true |
| invalid-supplier | REJECTED | supplier | true |
| multiple-failures | REJECTED | supplier, quantity | true |

All three scenarios have been successfully tested.

The `multiple-failures` scenario produces:

```text
Goal: purchaseOrderValidated
Result: SUCCESS
Capability invocations: 5

validateSupplier: SUCCESS
  valid: false
  reason: Supplier is not eligible

validateQuantity: SUCCESS
  valid: false
  reason: Quantity must be an integer from 1 to 100

evaluatePurchaseOrder: SUCCESS
  decision: REJECTED
  failures: [...]
```

The complete output includes the successful account and product validations.

The pursuit succeeds because all validation and evaluation responsibilities have been completed. The business decision is `REJECTED` because two validation rules failed.

Inspect observations to verify four invocations of `validateField`, each associated with a distinct affordance, and one invocation of `evaluateOrder`. The order of the four validations is not guaranteed.

## Design notes

- **Capability reuse.** Four distinct affordances invoke the same Node.js function. Each invocation has its own inputs, effects, and observations.
- **Rule dispatch.** The `ruleId` is a domain identifier passed through the registry. The meaning and implementation of the rule are internal to the capability.
- **Literal inputs.** Affordances can pass literal strings alongside references to scenario inputs and previous outputs.
- **Named outputs.** The common `valid` and `reason` fields are independently accessible through affordance-specific output references.
- **Domain independence.** The sample rule tables are deliberately local and deterministic. Production rules could use a service or policy store without changing the GRAIL registry.
- **Occurrences and outcomes.** GRAIL records that validation occurred. The capabilities determine whether the purchase order is valid.

This last point illustrates a central GRAIL principle:

**GRAIL understands occurrences, not outcomes. Capabilities understand outcomes, not occurrences.**

A rejected purchase order can be the result of a successful pursuit.

## Verification

The world has been validated and all three scenarios have been executed successfully using the GRAIL CLI.

The experiment also exposed a missing runtime behavior: literal affordance inputs were previously treated as unresolved references. GRAIL's input resolver was updated to accept literal strings while preserving existing reference resolution.

The world now demonstrates shared capability execution, rule-based dispatch, named output resolution, and business outcome aggregation without requiring domain-specific changes to the GRAIL runtime.
