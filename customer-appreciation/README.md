# Customer Appreciation — portable GRAIL world

A JSON-backed, **simulation-only** GRAIL reference world. No actual credits are posted and no email is sent. Python 3 standard library, plus GRAIL 0.2.0 to run a pursuit. Assumes a Unix-like environment (`fcntl` advisory locking).

## Scenario

For an **existing** customer, total qualifying invoices for the specified period, calculate a percentage credit, process the credit if positive, and process a thank-you message to the customer and resolved sales contact. If the credit is zero, do not post a credit or send a message. The customer lookup must FAIL if the customer does not exist. An inactive or absent sales representative is replaced with the configured default contact.

**Goal:** `customerAppreciationProcessed`.

See [COMPOSITION.md](docs/COMPOSITION.md) for the complete registry, contracts, operation-scoped idempotency, and tradeoffs.

## Quick start

From this world's root directory:

```bash
python3 -m unittest discover -s tests -v
# Requires @mamund/grail 0.2.0 installed:
grail validate --config ./config
grail run --config ./config --output=json
```

`grail run` is a **simulation**, but it updates the JSON files in `data/`. It resets GRAIL's worldstate on each pursuit, not the domain data. Repeating the same operation ID exercises idempotency. To reset the simulation, run:

```bash
python3 tests/reset_data.py
```

To try the zero-credit case, change `config/inputs.json` to `customerId: "C200"`, `operationId: "THANKYOU-2026-C200"` (all other inputs unchanged). For a missing customer use a new ID and operation ID. Use a new `operationId` for a genuinely new appreciation award.

## Validation results (October 19, 2026)

The world passed `grail validate --config ./config` and all seven Python unit tests (`python3 -m unittest discover -s tests -v`). Three GRAIL CLI pursuits were also exercised with observations and pursuit traces:

| Pursuit | Observed outcome |
|---|---|
| C100, first execution (`THANKYOU-2026-C100`) | $5,000 invoice total; $500 credit `APPLIED`; message `PREPARED`; delivery `SENT` |
| C200 (`THANKYOU-2026-C200`) | $0 invoice total; default sales contact; credit, preparation, and delivery each `NOT_APPLICABLE`; goal reached |
| C100, repeated with the same operation ID | Credit `ALREADY_APPLIED`; message `ALREADY_PREPARED`; delivery `ALREADY_SENT`; goal reached |

All seven affordances returned GRAIL `SUCCESS` in each pursuit, and each trace ended with an empty pursuit stack. The traces also demonstrate that eligible prerequisite resolution can occur in different orders. These are simulation results, not proof of production-grade transactional or email delivery guarantees.

The seven Python tests cover positive processing and retry, zero-credit processing, missing customer, conflicting retry, interruption after credit, zero credit with missing email, and positive credit with missing email. A missing customer email is an error **only when** a positive credit requires a message.

## Notes

- Python capability STDIO: one JSON object on stdin; one JSON object on stdout; failure writes a reason to stderr and exits nonzero.
- All registry output mappings use `stdout` and downstream bindings use `$outputs.latest.<field>`.
- The invoice collection stays inside `totalInvoices`; only the numeric total and count cross the affordance boundary.
- Financial values are persisted as decimal **strings** (not binary floating-point values).
- Operation records persist invoice basis, calculation, contact selection, credit posting, and simulated message delivery.
- This demo assumes cooperating local processes and a single machine. It is not a production transaction processor. See limitations in the composition document.
