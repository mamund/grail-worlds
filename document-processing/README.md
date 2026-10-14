# Document processing (STDIO)

A self-contained GRAIL world illustrating Python STDIO bindings, alternative affordances, domain-owned enumerations, and structured outputs. Requires Python 3 standard library only.

## Goal and world

The goal is `documentProcessed`. The world establishes `documentLoaded`, `documentClassified`, and `metadataExtracted` before processing. `classifyDocument` returns a domain enumeration (`INVOICE`, `CONTRACT`, `LETTER`, `OTHER`) without introducing separate GRAIL conditions. `processDocument` interprets that classification and returns a disposition.

Both `loadDocument` and `loadDocumentFallback` establish `documentLoaded`. The primary loader is designed to reject the `LEGACY:` sample, while the fallback accepts it. Selection may choose either loader first; a successful run does **not** necessarily exercise FAIL recovery.

## Run

From this directory (the world root):

```sh
grail validate --config ./config
grail run --config ./config --output=json
```

To try other documents, edit `config/inputs.json` to point to `samples/contract.txt`, `samples/letter.txt`, or `samples/legacy.txt`, then run again. You can also use the CLI's `--inputs` override if available in your installed release.

## STDIO contract

Each executable reads one JSON object from stdin and writes one JSON object to stdout. Diagnostic errors go to stderr and exit nonzero. The registry uses the demo-24 binding pattern (`protocol`, `command`, `args`, and `outputs` with `from: stdout` and `path`).

**Output references must use the `latest` alias.** The tested references are:

| Consumer | Input | Reference |
|---|---|---|
| `classifyDocument` | `documentText` | `$outputs.latest.documentText` |
| `extractMetadata` | `documentText` | `$outputs.latest.documentText` |
| `processDocument` | `classification` | `$outputs.latest.classification` |
| `processDocument` | `metadata` | `$outputs.latest.metadata` |

The `latest` resolver allows downstream affordances to consume an output alias produced by either loader. In the tested pursuit, GRAIL successfully resolved outputs from multiple affordances.

When running from the world root, STDIO script paths in `args` must use `./capabilities/...`, for example `./capabilities/loadDocument.py`. Sample document paths such as `samples/invoice.txt` are also relative to the world root.

## Test cases

### 1. Normal document processing — verified

Set `documentPath` in `config/inputs.json` to `samples/invoice.txt` and run the goal. In the observed successful run, GRAIL invoked `loadDocumentFallback`, `extractMetadata`, `classifyDocument`, and `processDocument`. The goal was reached; all four worldstate conditions were true. The final disposition was `queued-for-accounts-payable`.

The order of `classifyDocument` and `extractMetadata` is not prescribed: both depend on `documentLoaded`.

### 2. Exhausted alternatives — verified

Set `documentPath` to `samples/failed.txt` (a nonexistent file in the tested setup). Both `loadDocument` and `loadDocumentFallback` returned FAIL with exit code 1. GRAIL stopped with `documentProcessed` unreached and all four conditions false.

Restore `samples/invoice.txt` afterward.

### 3. Successful FAIL recovery — verified with a temporary code change

During testing, the primary loader was temporarily modified to return a nonzero exit code while the fallback loader remained functional. One observed pursuit ran:

```text
loadDocument          FAIL
loadDocumentFallback  SUCCESS
classifyDocument      SUCCESS
extractMetadata       SUCCESS
processDocument       SUCCESS
Goal: documentProcessed — reached
```

This demonstrated recovery from a failed STDIO affordance through an alternative producer of `documentLoaded`. The primary loader reported `documentPath required` in that test despite receiving a path; this was a test modification, not evidence of a missing input in GRAIL.

**Restore the primary loader after this experiment.** A configurable `simulatePrimaryFailure` input has been proposed but is not part of the verified example. Because selection among eligible affordances is random, a run may select the fallback first and never attempt the primary loader.

## Test scripts directly

```sh
printf '%s\n' '{"documentPath":"samples/invoice.txt"}' | python3 capabilities/loadDocument.py
printf '%s\n' '{"documentText":"INVOICE\nVendor: Northwind Supplies"}' | python3 capabilities/classifyDocument.py
printf '%s\n' '{"documentText":"INVOICE\nVendor: Northwind Supplies"}' | python3 capabilities/extractMetadata.py
printf '%s\n' '{"classification":"INVOICE","metadata":{"vendor":"Northwind Supplies"},"documentPath":"samples/invoice.txt"}' | python3 capabilities/processDocument.py
```

## Notes

This is a teaching example, not a production document parser. It recognizes a type marker on the first line and simple `Key: Value` metadata. It performs no persistent writes or external service calls. The receipt represents a completed processing decision, not a real payment or filing operation.

GRAIL tracks resolution of domain responsibilities through conditions. The document classification and disposition remain domain-owned outputs rather than separate worldstate enumerations.
