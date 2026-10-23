/**
 * Evaluate the completed purchase-order validations.
 *
 * Collects results from four named affordance outputs and
 * returns APPROVED or REJECTED with any failed checks.
 * A rejection is a business outcome, not a GRAIL execution failure.
 */

export function evaluateOrder(inputs) {
  const failures = [];

  for (const name of ["supplier", "account", "product", "quantity"]) {
    // Require explicit true; missing or malformed values cannot pass.
    if (inputs[`${name}Valid`] !== true) {
      failures.push({
        check: name,
        reason: inputs[`${name}Reason`] ?? "Validation did not pass",
      });
    }
  }

  return {
    decision: failures.length ? "REJECTED" : "APPROVED",
    failures,
  };
}
