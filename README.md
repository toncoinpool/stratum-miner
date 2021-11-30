# Ton Coin Pool pow-miner-gpu
[Ton Coin Pool](https://toncoinpool.io) miner based on official [tontechio/pow-miner-gpu](https://github.com/tontechio/pow-miner-gpu)

## Installation

```
npm i && npm run build:prod
```

## Usage

```
npm run start
```

## Miner binary

Current pow-miner is located inside `bin` folder. Binary name can be changed in `src/config.ts` file.

## Config

Configurable settings through config/config.json

- `gpus`: { `[gpuId: string]: boolean` } - List of GPU's with their system id's, that can be separately enabled/disabled
- `serverAddress`: `string` - Pool stratum endpoint
- `wallet`: `string` - Your ton mining wallet

## Stratum

Ton Coin Pool is based on [Stratum protocol](https://github.com/aeternity/protocol/blob/master/STRATUM.md), so any mining software can be used with it.

### Protocol flow example

The following shows what a session might look like from subscription to
submitting a solution.

```
Client                                Server
  |                                     |
  | --------- mining.subscribe -------> |
  | --------- mining.authorize -------> |
  | <-------- mining.set_target ------- |
  |                                     |
  | ---------- mining.submit ---------> |
```

### Supported methods

- [mining.subscribe](#miningsubscribe)
- [mining.authorize](#miningauthorize)
- [mining.set_target](#miningset_target)
- [mining.submit](#miningsubmit)

### Errors

```
{"id": 10, "result": null, "error": [21, "Job not found", null]}
```

Available error codes, in addition to the codes defined in the [JSON RPC 2.0]() specification, are:

- `20` - Other/Unknown
- `21` - Job not found (=stale)
- `22` - Duplicate share
- `23` - Low difficulty share
- `24` - Unauthorized worker
- `25` - Not subscribed

### mining.subscribe

In order to initiate or resume a session with the server, a client needs to
call the subscribe method.
This method call will only be executed by clients.

#### Request:

```
{"id": 1, "method": "mining.subscribe", "params": ["ton-pool-client/1.0.0", "solo", null, null]}\n
```

- [ `id` : `int` ]: request id
- [ `method` : `string` ]: RPC method name
- [ `params` : (`string`, `string`, `string`, `string`) ]: list of method
  parameters
	1. MUST be name and version of mining software in the given format or empty
	   string
	2. MUST be mining mode which equals one of the following: `solo`, `pps`, `pplns`

### mining.authorize

Before a client can submit solutions to a server it MUST authorize at least one worker.
This method call will only be executed by clients.

#### Request

```
{"id": 2, "method": "mining.authorize", "params": ["TON_WALLET_ADDRESS", "RIG_NAME"]}\n
```

- [ `id` : `int` ]: request id
- [ `method` : `string` ]: RPC method name
- [ `params` : (`string`, `string`) ]: list of method parameters
	1. The worker ton wallet address
	2. The worker rig name

#### Response

```
{"id": 2, "result": true, "error": null}\n
```

- [ `id` : `int` ]: request id
- [ `result` : `bool` ]: authorization success
	- MUST be `true` if successful
	- MUST be `null` if an error occurred
- [ `error` : (`int`, `string`, `object`) ]
	- MUST be `null` if `result` is `true`
	- If authorization failed then it MUST contain error object with the
	  appropriate error id and description

### mining.set_target

The target difficulty for a block can change and a server needs to be able to
notify clients of that.
This method call will only be executed by the server.

#### Request

```
{"id": null, "method": "mining.set_target", "params": ["GIVER_SEED", "GIVER_COMPLEXITY", "GIVER_ADDRESS", "WALLET_ADDRESS"]}\n
```

- [ `id` : `int` ]: request id
- [ `method` : `string` ]: RPC method name
- [ `params` : (`string`, `string`, `string`, `string`) ]: list of method parameters
	1. Current giver's job seed.
	2. Share complexity.
	3. Current giver's address.
	4. Pool wallet address.

All job parameters must be used in .boc calculation, otherwise they will be rejected by pool.

### mining.submit

With this method a worker can submit solutions for the mining puzzle.
This method call will only be executed by clients.

#### Request

```
{"id": 4, "method": "mining.submit", "params": ["expired", "rdata", "rseed", null]}\n
```

- [ `id` : `int` ]: request id
- [ `method` : `string` ]: RPC method name
- [ `params` : (`string`, `string`, `string`, `string`) ]: list of method
  parameters
	1. "expired" param which used in .boc calculations
	2. "rdata" param which used in .boc calculations
	3. "rseed" param which used in .boc calculations

#### Response

```
{"id": 4, "result": true, "error": null}\n
```

- [ `id` : `int` ]: request id
- [ `result`: `bool` ]: submission accepted
	- MUST be `true` if accepted
	- MUST be `null` if an error occurred
- [ `error` : (`int`, `string`, `object`) ]
	- MUST be `null` if `result` is `true`
	- If submission failed then it MUST contain error object with the
	  appropriate error id and description

### client.reconnect

If a pool operator wants to have their clients reconnect to the same or a
different host they use this call.

This method call will only be executed by the server.

## TODO

- set share complexity once throug subscribe/notify
- omit seed from job submit
- validate miner's wallet on client side
- user-friendly logs

## License

MIT
