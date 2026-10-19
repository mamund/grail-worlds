# World composition: Customer Appreciation

## Intent and boundaries

This world fulfills a customer-appreciation business operation without encoding a domain-specific branch in the GRAIL runtime. GRAIL tracks Boolean occurrences; Python capabilities interpret domain state and record outcomes. **The goal is processing, not necessarily posting a credit or sending an email.** The world does not create customers.

The supervisor supplies a stable `operationId`, customer ID, fixed invoice period, percentage, and currency. `operationId` identifies a *business operation* across distinct GRAIL pursuits, not a single runtime pursuit. A new legitimate award must have a new ID.

## Registry

| Affordance | Preconditions | Effect | Capability behavior |
|---|---|---|---|
| `findCustomer` | — | `customerLocated` | Locate existing customer; FAIL if missing; never create |
| `findSalesRep` | `customerLocated` | `salesContactResolved` | Resolve active rep or default contact; FAIL if neither exists; persist selected contact |
| `totalInvoices` | `customerLocated` | `invoiceTotalComputed` | Retrieve qualifying invoices internally; compute total; empty set → $0; preserve basis and invoice IDs |
| `calculateCredit` | `invoiceTotalComputed` | `creditCalculated` | Compute specified percentage of total, including $0; reuse recorded calculation |
| `processCredit` | `customerLocated`, `creditCalculated` | `creditProcessed` | Positive amount → simulated posting once; zero → NOT_APPLICABLE |
| `prepareThankYou` | `customerLocated`, `salesContactResolved`, `creditProcessed` | `thankYouPreparationProcessed` | Positive credit → draft to customer and resolved contact; zero → no draft |
| `processThankYou` | `thankYouPreparationProcessed` | `customerAppreciationProcessed` | Positive credit → simulated send once; zero → no send |

**Goal:** `customerAppreciationProcessed`. Preconditions constrain eligibility; the registry does not dictate ordering among independent prerequisites. The actual GRAIL selection order may vary.

## Input and output contracts

- Scenario inputs: `operationId`, `customerId`, `creditPercent`, `periodStart`, `periodEnd`, `currency`.
- `findCustomer` outputs `customerId`, `customerEmail`.
- `findSalesRep` outputs `contactEmail`, `contactSource` (`ACTIVE_REP` or `DEFAULT`).
- `totalInvoices` outputs `invoiceTotal` (decimal string), `invoiceCount` (integer). Invoice records are *not* passed through GRAIL.
- `calculateCredit` consumes `invoiceTotal` via `$outputs.latest.invoiceTotal`, and outputs `creditAmount` (decimal string).
- `processCredit` consumes `creditAmount` via `$outputs.latest.creditAmount`, and outputs `creditStatus` (`APPLIED`, `ALREADY_APPLIED`, `NOT_APPLICABLE`).
- `prepareThankYou` outputs `messageStatus` (`PREPARED`, `ALREADY_PREPARED`, `NOT_APPLICABLE`).
- `processThankYou` outputs `deliveryStatus` (`SENT`, `ALREADY_SENT`, `NOT_APPLICABLE`).

Later capabilities re-read durable operation data using `operationId` instead of depending on the latest output of an unrelated affordance. This avoids ambiguous dependencies between parallel branches. The `totalInvoices` capability retains the invoice IDs and aggregate in `operations.json`, not the entire collection in GRAIL observations.

## Domain policies chosen for the demo

- Date range is **inclusive**, specified by the scenario (sample: calendar year 2025).
- Count `ISSUED` and `PAID` invoices; exclude `VOID`. Treat net amounts in the source as authoritative. Negative adjustments can reduce the total; clamp a negative aggregate to zero.
- Reject currency mismatches. All invoices for one operation must match the scenario currency; no FX conversion.
- Use Python `Decimal`, with two-decimal `ROUND_HALF_UP` rounding. The percentage must be 0–100.
- Missing customer → FAIL, no alternative producer; pursuit becomes unresolvable.
- No active sales rep → configured default; missing both → FAIL.
- Missing customer email with positive credit → FAIL in message preparation. A zero-credit operation requires no customer email.
- Zero invoice total → zero credit → no credit record, no draft, no simulated send; still SUCCESS.
- Reusing an operation ID with conflicting customer, period, currency, percentage, or credit amount → FAIL (`OPERATION_CONFLICT`).

These are **sample business rules**, not requirements imposed by GRAIL.

## Operation-scoped idempotency

- `operations.json` stores the invoice basis, selected contact, total, calculation, and progress for the business operation.
- `credits.json` is keyed by `operationId`. A repeated `processCredit` recognizes the existing posting.
- `messages.json` is keyed by `operationId`. A repeated `prepareThankYou` or `processThankYou` recognizes the existing message/delivery.
- All writes use atomic file replacement and a local advisory file lock, suitable for cooperating processes on a single machine. There is **no multi-file transaction**: a crash after updating a credit/message file but before updating the operation record is reconciled by inspecting the credit/message record on retry.
- Once an operation's invoice basis and contact are established, repeat pursuits reuse those values. Subsequent domain changes do not silently alter the same business award.
- The simulated delivery record is authoritative only for this local demo. Real email providers require durable provider-side idempotency or delivery reconciliation; exactly-once delivery is **not** guaranteed by a local JSON flag.

## Test scenarios and validation

1. **Positive:** C100 has $5,000 of qualifying invoices → $500 credit and one simulated message.
2. **Zero:** C200 has no invoices → $0 credit, fallback sales contact, no credit or message records.
3. **Missing customer:** UNKNOWN → FAIL; no downstream action.
4. **Repeat:** same operation ID → no duplicate credit or message.
5. **Interrupted:** stop after posting credit, then repeat → reconcile credit and continue.
6. **Conflict:** reuse ID with a different percentage → FAIL.
7. **Missing customer email, positive credit:** message preparation fails with `CUSTOMER_EMAIL_MISSING`; the credit already processed is not rolled back.
8. **Missing customer email, zero credit:** C300 has no qualifying invoices and no customer email; processing succeeds because no message is required.

### Observed GRAIL pursuits (October 19, 2026)

`grail validate` succeeded, and the Python suite passed all seven tests. CLI observations and traces were reviewed for three separate pursuits:

- **C100, first pursuit:** all seven affordances returned `SUCCESS`; invoice total `5000.00`, credit `500.00` (`APPLIED`), message `PREPARED`, delivery `SENT`.
- **C200, zero-credit pursuit:** all seven affordances returned `SUCCESS`; invoice total and credit `0.00`, fallback contact selected, and credit/message/delivery statuses `NOT_APPLICABLE`.
- **C100, repeated pursuit:** all seven affordances returned `SUCCESS`; credit `ALREADY_APPLIED`, message `ALREADY_PREPARED`, and delivery `ALREADY_SENT`.

All three traces ended with the pursuit stack empty. The selection order differed across pursuits, consistent with registry-defined eligibility rather than a prescribed linear route. These observations verify reported outcomes; the Python tests additionally inspect persisted records for duplicate prevention. The sample does not establish exactly-once guarantees for external services.

## Limitations and potential improvements

The reference simulation deliberately avoids external systems. The filesystem lock (`fcntl`) is Unix-specific and does not provide distributed coordination. JSON files do not supply cross-file ACID transactions. Real accounting/email integrations must add transactional guarantees, robust operation identity enforcement, delivery reconciliation, audit policy, and appropriate handling of personally identifiable information. The sample does not implement multiple currencies or invoice tax/credit-note accounting rules. The sample has been validated with the GRAIL CLI for the three scenarios documented above; additional fault-injection and real integration tests would be needed before production use.
