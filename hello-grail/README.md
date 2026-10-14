# Hello GRAIL

A minimal, independently runnable GRAIL world demonstrating goal pursuit, a prerequisite condition, Node-bound capabilities, and learned outputs.

## Goal

The goal is `greeted`. Initially, `nameKnown` and `greeted` are both false.

- `learnName` establishes `nameKnown` and returns a `name` output.
- `greet` requires `nameKnown`, consumes `$outputs.latest.name`, and establishes `greeted`.

The registry defines relationships between capabilities and conditions; it does not prescribe an execution order.

## Requirements

Node.js 22 or later; npm.

## Run

From this directory:

```sh
npm install
npx grail validate --config ./config
npx grail run --config ./config --output=json
```

Look for `reached: true`, `nameKnown: true`, and `greeted: true` in the run result. The `greet` observation should contain `message: "Hello, World!"` in its extracted outputs.

Try changing the name:

```sh
npx grail run --config ./config --inputs '{"name":"GRAIL"}' --output=json
```

## Composition lesson

The GRAIL condition `nameKnown` expresses that a responsibility has been fulfilled. The actual name is data supplied by `learnName` and captured in observations. `greet` depends on the condition and consumes the learned value.

## Portability

This world contains its own configuration and capabilities. No sibling worlds or local GRAIL runtime source files are required.
