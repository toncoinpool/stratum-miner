# Stratum

Ton Coin Pool is based on [Stratum protocol](https://github.com/aeternity/protocol/blob/master/STRATUM.md), so any
mining software can be used with it.

## Protocol flow example

The following shows what a session might look like from subscription to submitting a solution.

```
Client                                Server
  |                                     |
  | --------- mining.subscribe -------> |
  | --------- mining.authorize -------> |
  | <-------- mining.set_target ------- |
  |                                     |
  | ---------- mining.submit ---------> |
```

## Supported methods

-   [mining.subscribe](#miningsubscribe)
-   [mining.authorize](#miningauthorize)
-   [mining.set_target](#miningset_target)
-   [mining.submit](#miningsubmit)

## Errors

```json
{ "id": 10, "result": null, "error": [21, "Job not found", null] }
```

Available error codes, in addition to the codes defined in the [JSON RPC 2.0](https://www.jsonrpc.org/specification)
specification, are:

-   `20` - Other/Unknown
-   `21` - Job not found (=stale)
-   `22` - Duplicate share
-   `23` - Low difficulty share
-   `24` - Unauthorized worker
-   `25` - Not subscribed

## mining.subscribe

In order to initiate or resume a session with the server, a client needs to call the subscribe method

This method call will only be executed by clients

### Request:

```json
{ "id": 1, "method": "mining.subscribe", "params": ["ton-pool-client/1.0.0", null, null, null] }
```

-   [ `id` : `int` ]: request id
-   [ `method` : `string` ]: RPC method name
-   [ `params` : (`string`, `string`, `string`, `string`) ]: list of method
    parameters
    1.  MUST be name and version of mining software in the given format or empty string

### Response

```json
{ "id": 1, "result": [null, "DEFAULT_SHARE_COMPLEXITY"], "error": null }
```

-   [ `id` : `int` ]: request id
-   [ `result` : (`string`, `string`) ]:
    -   MUST be `null` if an error occurred or otherwise
        1. If the server supports session resumption, then this SHOULD be a unique session id, `null` otherwise
        2. The pool share complexity which must be used to pass server's difficulty challenge
-   [ `error` : (`int`, `string`, `object`) ]

## mining.authorize

Before a client can submit solutions to a server it MUST authorize at least one worker

This method call will only be executed by clients

### Request

```json
{ "id": 2, "method": "mining.authorize", "params": ["TON_WALLET_ADDRESS", "RIG_NAME"] }
```

-   [ `id` : `int` ]: request id
-   [ `method` : `string` ]: RPC method name
-   [ `params` : (`string`, `string`) ]: list of method parameters
    1.  The worker ton wallet address
    2.  The worker rig name

### Response

```json
{ "id": 2, "result": true, "error": null }
```

-   [ `id` : `int` ]: request id
-   [ `result` : `bool` ]: authorization success
    -   MUST be `true` if successful
    -   MUST be `null` if an error occurred
-   [ `error` : (`int`, `string`, `object`) ]
    -   MUST be `null` if `result` is `true`
    -   If authorization failed then it MUST contain error object with the appropriate error id and description

## mining.set_target

The target difficulty for a block can change and a server needs to be able to notify clients of that

This method call will only be executed by the server

### Request

```json
{ "id": null, "method": "mining.set_target", "params": ["GIVER_SEED", "EXPIRED", "GIVER_ADDRESS", "WALLET_ADDRESS"] }
```

-   [ `id` : `int` ]: request id
-   [ `method` : `string` ]: RPC method name
-   [ `params` : (`string`, `string`, `string`, `string`) ]: list of method parameters
    1.  Current giver's job seed
    2.  "expired" parameter which is preffered by server to calculate job result
    3.  Current giver's address
    4.  Pool wallet address

All job parameters must be used in .boc calculation, otherwise they will be rejected by pool

## mining.submit

With this method a worker can submit solutions for the mining puzzle

This method call will only be executed by clients

### Request

```json
{ "id": 4, "method": "mining.submit", "params": ["expired", "rdata", "rseed", null] }
```

-   [ `id` : `int` ]: request id
-   [ `method` : `string` ]: RPC method name
-   [ `params` : (`string`, `string`, `string`, `string`) ]: list of method parameters
    1.  "expired" param which used in .boc calculations
    2.  "rdata" param which used in .boc calculations
    3.  "rseed" param which used in .boc calculations

### Response

```json
{ "id": 4, "result": true, "error": null }
```

-   [ `id` : `int` ]: request id
-   [ `result`: `bool` ]: submission accepted
    -   MUST be `true` if accepted
    -   MUST be `null` if an error occurred
-   [ `error` : (`int`, `string`, `object`) ]
    -   MUST be `null` if `result` is `true`
    -   If submission failed then it MUST contain error object with the appropriate error id and description
