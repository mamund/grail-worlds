# Interactive refund world

A standalone GRAIL world to exercise the interactive STDIO binding through the registry and normal goal pursuit. No actual refund is issued; a human records an amount and reason code.

## Prerequisites

- Node.js 22 or newer
- `@mamund/grail@beta` from a local `grail-release` checkout **with the interactive STDIO enhancement and schema update installed**. 
- Run this example from an interactive terminal so the refund capability can prompt for user input.

## Run

From this directory, using your locally updated GRAIL CLI (substitute its actual path):

```sh
node /path/to/grail-release/cli/grail-cli.js validate --config ./config
node /path/to/grail-release/cli/grail-cli.js run --config ./config --output=json
```

Alternatively, if the updated `grail` command is installed on your PATH:

```sh
grail validate --config ./config
grail run --config ./config --output=json
```

For the first run, enter `25` and choose reason `1` (DAMAGED_PRODUCT). Run again with `0` to test `NOT_APPLICABLE`. The target effect is `refundDetermined` and the output values are `refundAmount` and `refundReason`. The `--output=json` option includes the final world state and observation records, including the human decision.

## Files

- `config/registry.json`: `determineRefund` affordance, interactive STDIO binding, output mappings
- `config/worldstate.json`: initial boolean state
- `config/inputs.json`: sample ticket context (edit to try other cases)
- `config/goal.json`: goal uses the `goal` key
- `capabilities/determine-refund.mjs`: console interaction; reads `GRAIL_INPUTS_FILE`, prompts on stderr, returns JSON on stdout

## Notes

The capability limits the refund to the sample order total and requires a reason for positive amounts. A zero amount automatically returns `NOT_APPLICABLE`. The example does not perform policy authorization, issue refunds, or queue a customer response. A completed determination counts as success even if the amount is zero.

The `grail` CLI must be launched from the world directory for the relative `./capabilities/` path to work with the existing binding. If your runtime resolves binding paths differently, adjust the path accordingly.
