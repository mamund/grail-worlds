# Customer support

A standalone, simulated customer-support world using **three Ollama-backed STDIO capabilities** (classification, extraction, response drafting) alongside deterministic customer lookup, policy retrieval, support-representative assignment, response validation, and outbox queuing. No GRAIL runtime modifications are required.

## Requirements

- Node.js 22+
- `@mamund/grail@0.2.0` installed locally with `npm install`
- Ollama running with `qwen2.5:3b` installed (`ollama pull qwen2.5:3b`)

Install dependencies and run from **this directory** (STDIO paths are relative to the current working directory):

```sh
npm install
```

Then:

```sh
npm run validate
npm run inspect
```

Override the sample message and customer ID:

```sh
npx grail run --config ./config --inputs '{"message":"My application shows an error when I sign in.","customerId":"C456"}' --output=json
```

### Run multiple requests (batch option)

After confirming a single pursuit works, process the sample JSON requests with:

```sh
./scripts/process-requests.sh
```

This is **external batch orchestration**, not a GRAIL runtime feature: the shell script calls `grail run` once per input document, using the **same world and goal** (`customerResponseQueued`) each time. Every successful pursuit writes a distinct record to `data/outbox/`. See [Batch processing: external loop](#batch-processing-external-loop) for details.

Use `OLLAMA_URL` and `OLLAMA_MODEL` to change the local endpoint or model (defaults `http://localhost:11434/api/generate` and `qwen2.5:3b`).

## Design

Goal: `customerResponseQueued`. The registry declares preconditions and effects, **not a prescribed workflow**. `classifyRequest` and `classifyWithRules` are alternative producers of `requestClassified`; selection is runtime-controlled. Other conditions are established through LLM or deterministic STDIO capabilities. The goal is **queueing a validated response** in a local `data/outbox/` JSON file. This simulates handing a message off for delivery; it does not send anything or resolve the underlying customer issue.

The initial scenario is a possible duplicate charge for customer `C123`. The same world also supports technical-support and sales inquiries with different inputs. Policies and customer records are local fixtures under `data/`.

The capability wrappers validate JSON structure and fail with a nonzero exit code on invalid results. A successful run **does not establish factual accuracy, policy compliance, or real-world resolution**. The validator performs limited checks only; it is not a comprehensive policy or safety verifier. Customer messages and model output are untrusted.

## Outputs and compatibility note

This world uses `$outputs.latest.<fieldname>` references for affordance outputs, matching the successful local tests. It deliberately does not require a fixed execution order between independent prerequisites. The included registry uses the STDIO binding shape supported by v0.2.0, and builds on the previously successful local pursuit. The original world was reported as working before packaging. Re-run the local acceptance test after installing v0.2.0.

## Experiment goals

1. Multiple LLM calls within one pursuit.
2. Structured output propagation between affordances.
3. Mixed deterministic and LLM implementations using STDIO.
4. Alternative producers for classification.
5. Inspection of observations and failure behavior.

## Layout

- `config/`: v0.2.0 registry, goal, worldstate and inputs files
- `capabilities/`: self-contained Node.js STDIO programs; `common.mjs` handles JSON and Ollama
- `data/`: local customer and support-policy fixtures, support staff roster, and generated outbox records
- `requests/`: sample JSON input documents for batch runs
- `scripts/process-requests.sh`: shell-based batch driver (outside GRAIL)

No dependencies on other world directories, no experimental runtime code, and no new GRAIL protocols.

## Simulated message delivery

The final affordance is `queueResponse` (effect: `customerResponseQueued`). It requires a validated response, customer details, classification, and selected policy. It writes a new JSON record under `data/outbox/` with the customer ID/name, category, policy ID, full message, a unique message ID, timestamp, and `status: "queued"`.

It returns only `messageId`, `status`, and `file` to GRAIL, so the summary no longer repeats the entire message at the final step. The draft and validated response remain separately observable as evidence of generation and validation.

The capability reports SUCCESS only after the file is written. Each run creates a separate message record. The outbox is a local simulation, not a real delivery service. For safety, don't commit generated outbox records containing customer data.

After a run, inspect the generated file:

```sh
ls -lt data/outbox/
cat data/outbox/*.json
```


## Batch processing: external loop

Six sample input documents live under `requests/` (billing, technical support,
and sales; customers C123 and C456). Process them sequentially from the world root:

```sh
./scripts/process-requests.sh
```

Or pass a different directory containing `*.json` request documents:

```sh
./scripts/process-requests.sh ./my-requests
```

The script runs `npx grail run --config ./config --inputs-file <file> --output=summary`
for each document. **The world and goal stay the same; only the inputs change.**
Each invocation is a **new pursuit** with a fresh initial world state. The shell
controls repetition; GRAIL determines how to reach the goal for each request.
No batch loop or branching mechanism is added to the GRAIL runtime. Successful `queueResponse` calls append uniquely named JSON files to
`data/outbox/`. Failures are counted, the batch continues, and the script exits
nonzero if any request failed. Existing outbox records are preserved; rerunning
the batch creates additional records rather than replacing them.

Ollama must be running for extraction and drafting. With `--output=summary`, each
individual pursuit may be silent while waiting on Ollama; the script prints a
request header before every run. The sample messages are synthetic fixtures.

## Support representative assignment

The deterministic `assignSupportRep` affordance uses `data/support-staff.json`: billing → Bob, support → Ted, sales → Carol, and all other categories → Alice. It requires `requestClassified`, produces `supportRepAssigned`, and is required by `queueResponse`. Queued messages now contain `supportRep`. No runtime changes are needed.

First test with the default `config/inputs.json` (billing → Bob):

```bash
npm run validate
npm start
```

Inspect the new `data/outbox/<messageId>.json` and verify `"supportRep": "Bob"`. This single-request test has passed locally; then run `npm run batch` to exercise multiple input documents.

## Packaging notes

This world is independently runnable and uses `@mamund/grail` v0.2.0. Generated observations and outbox messages are excluded from the distribution and ignored by Git. `npm run batch` processes six synthetic requests; each run writes a new queued message. `npm run inspect` prints JSON observations/results for inspection.
