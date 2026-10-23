// Each input is supplied from an explicitly named affordance output.
export function evaluateOrder(inputs) {
  const failures = [];
  for (const name of ["supplier", "account", "product", "quantity"]) {
    // Strict comparison prevents missing or malformed values from being approved.
    if (inputs[`${name}Valid`] !== true) {
      failures.push({ check: name, reason: inputs[`${name}Reason`] ?? "Validation did not pass" });
    }
  }
  return { decision: failures.length ? "REJECTED" : "APPROVED", failures };
}
