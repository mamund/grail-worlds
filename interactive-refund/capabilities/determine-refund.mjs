import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";

// Interactive STDIO contract: input context from GRAIL_INPUTS_FILE,
// prompts on stderr, keyboard answers on stdin, final JSON on stdout.
const inputPath = process.env.GRAIL_INPUTS_FILE;
if (!inputPath) {
  console.error("Missing GRAIL_INPUTS_FILE; run this through GRAIL interactive STDIO.");
  process.exit(1);
}

let inputs;
try {
  inputs = JSON.parse(await readFile(inputPath, "utf8"));
} catch (error) {
  console.error(`Cannot read GRAIL inputs: ${error.message}`);
  process.exit(1);
}

const total = Number(inputs.orderTotal);
if (!Number.isFinite(total) || total < 0 || !Number.isInteger(Math.round(total * 100))) {
  console.error("Invalid orderTotal in GRAIL inputs.");
  process.exit(1);
}
const maxCents = Math.round(total * 100);
const reasons = ["DAMAGED_PRODUCT", "LATE_DELIVERY", "SERVICE_FAILURE", "GOODWILL"];
const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });

try {
  console.error("\nGRAIL customer support — refund determination");
  console.error(`Ticket: ${inputs.ticketId ?? "(unknown)"}`);
  console.error(`Issue: ${inputs.issue ?? "(unspecified)"}`);
  console.error(`Order total: $${(maxCents / 100).toFixed(2)}`);
  let cents;
  while (true) {
    const answer = (await rl.question(`Refund amount (0 to ${(maxCents / 100).toFixed(2)}): `)).trim();
    if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(answer)) {
      console.error("Enter a nonnegative dollar amount with at most two decimals.");
      continue;
    }
    cents = Math.round(Number(answer) * 100);
    if (!Number.isSafeInteger(cents) || cents > maxCents) {
      console.error("Amount exceeds the order total or is invalid.");
      continue;
    }
    break;
  }

  let reason = "NOT_APPLICABLE";
  if (cents > 0) {
    console.error("Reason codes:");
    reasons.forEach((item, index) => console.error(`  ${index + 1}. ${item}`));
    while (true) {
      const choice = (await rl.question(`Select reason [1-${reasons.length}]: `)).trim();
      const index = Number(choice) - 1;
      if (/^[1-4]$/.test(choice) && reasons[index]) {
        reason = reasons[index];
        break;
      }
      console.error("Choose a listed reason code.");
    }
  } else {
    console.error("Zero refund recorded with reason NOT_APPLICABLE.");
  }

  process.stdout.write(JSON.stringify({ refundAmount: cents / 100, refundReason: reason }) + "\n");
} catch (error) {
  console.error(`Refund determination interrupted: ${error.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
