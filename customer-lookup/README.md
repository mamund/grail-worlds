# Customer lookup

A standalone GRAIL world illustrating HTTP-bound capabilities, observations, and data learned during a pursuit. Adapted from the *concept* of `grail-demo-14-http-response-observations`; this is a new example rather than a source-file copy.

## Goal and world

The goal is `accountLoaded`. Initially `customerLoaded` and `accountLoaded` are false.

- `lookupCustomer` accepts the initial `customerId`, retrieves a customer through HTTP, establishes `customerLoaded`, and captures `accountId` and `customerName`.
- `lookupAccount` requires `customerLoaded`, uses `$outputs.latest.accountId` to retrieve the account through HTTP, and establishes `accountLoaded`.

The registry declares the requirements and effects. It does not declare a workflow sequence.

## Requirements

Node.js 22 or later and npm. The example HTTP service uses only Node's standard library. Port 3001 must be available.

## Run

From the `customer-lookup` directory:

```sh
npm install
npx grail validate --config ./config
```

Start the service in one terminal and leave it running:

```sh
npm run service
```

In another terminal, run the pursuit:

```sh
npx grail run --config ./config --output=json
```

The expected result includes `reached: true`, `customerLoaded: true`, and `accountLoaded: true`. The observations should include the `accountId` captured from `lookupCustomer`, followed by the account data returned by `lookupAccount`.

To use the other sample customer:

```sh
npx grail run --config ./config --inputs '{"customerId":"C101"}' --output=json
```

To demonstrate a failed lookup, try an unknown customer:

```sh
npx grail run --config ./config --inputs '{"customerId":"C999"}' --output=json
```

A 404 from the HTTP service makes `lookupCustomer` fail; without another producer for `customerLoaded`, the goal cannot be reached.

Stop the service with Ctrl+C when finished.

## Composition lesson

`customerLoaded` is a GRAIL condition: the customer lookup responsibility was fulfilled. The customer record and account identifier are domain data. GRAIL captures selected data from the HTTP response in observations and resolves `$outputs.latest.accountId` when the next capability executes. The capability's domain response remains separate from GRAIL world state.

## Portability

All configuration and service code is local to this directory. No sibling worlds, external APIs, credentials, or checked-out GRAIL runtime source are needed. The published `@mamund/grail` package is the only npm dependency.
