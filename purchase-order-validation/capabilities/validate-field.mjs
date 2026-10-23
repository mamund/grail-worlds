/**
 * Shared purchase-order field validator.
 *
 * Applies a domain rule selected by ruleId to the supplied value.
 * Returns a validation result; unknown rules cause execution failure.
 * Multiple GRAIL affordances reuse this capability.
 */

const rules = {
  supplier: (value) => ({
    valid: ["SUP-100", "SUP-200"].includes(value),
    reason: "Supplier is not eligible",
  }),

  account: (value) => ({
    valid: ["ACC-100", "ACC-200"].includes(value),
    reason: "Account is not recognized",
  }),

  product: (value) => ({
    valid: ["PRD-300", "PRD-400"].includes(value),
    reason: "Product is not available",
  }),

  quantity: (value) => ({
    valid:
      Number.isInteger(value) &&
      value >= 1 &&
      value <= 100,
    reason: "Quantity must be an integer from 1 to 100",
  }),
};

export function validateField({ value, ruleId }) {
  if (!Object.hasOwn(rules, ruleId)) {
    throw new Error(`Unknown ruleId: ${ruleId}`);
  }

  const result = rules[ruleId](value);

  return {
    valid: result.valid,
    reason: result.valid ? "Validation passed" : result.reason,
  };
}
