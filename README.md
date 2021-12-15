# Ton Coin Pool stratum-miner
[Ton Coin Pool](https://toncoinpool.io) mining client based on official [tontechio/pow-miner-gpu](https://github.com/tontechio/pow-miner-gpu)

## Usage

Download the appropriate executable for your platform from [Releases](https://github.com/toncoinpool/stratum-miner/releases) page:

- Windows: file with `.exe` extension
- MacOS: `.zip` archive containing `.app` file.
- Linux: `.AppImage` file.

### Headless

You can run the client without the GUI directly from the command line:

```shell
$ ./TON-Stratum-Miner --headless --wallet <your-wallet-address> [--bin <name>] [--gpus <ids>] [--pool <uri>] [--rig <name>]
```

- `-h, --headless`: *Required*. Pass this flag to not open the client's GUI window
- `-w, --wallet`: *Required*. Your TON wallet's address
- `-b, --bin <name>`: Name of the miner binary. Can be one of:

  Linux:

  - `pow-miner-cuda-ubuntu-18`
  - `pow-miner-cuda-ubuntu-20`
  - `pow-miner-opencl-ubuntu-18`
  - `pow-miner-opencl-ubuntu-20`

  Windows:

  - `pow-miner-cuda.exe`
  - `pow-miner-opencl.exe`

  Defaults to `pow-miner-cuda-ubuntu-20`
- `-g, --gpus <ids>`: Comma-separated list of GPU device Ids that should be used by miner. Defaults to `0`. Only
necessary on multi-GPU systems. Example: `--gpus 0,3,4`
- `-p, --pool`: Pool address to connect to. Defaults to `wss://pplns.toncoinpool.io/stratum`
- `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io). Defaults to `default`

## Ton Coin Pool endpoints

- [ `pplns`: `wss://pplns.toncoinpool.io/stratum` ]

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

In order to initiate or resume a session with the server, a client needs to call the subscribe method\
This method call will only be executed by clients

#### Request:

```
{"id": 1, "method": "mining.subscribe", "params": ["ton-pool-client/1.0.0", null, null, null]}\n
```

- [ `id` : `int` ]: request id
- [ `method` : `string` ]: RPC method name
- [ `params` : (`string`, `string`, `string`, `string`) ]: list of method
  parameters
	1. MUST be name and version of mining software in the given format or empty
	   string

#### Response

```
{ "id": 1, "result": [null, "DEFAULT_SHARE_COMPLEXITY"], "error": null }\n
```

- [ `id` : `int` ]: request id
- [ `result` : (`string`, `string`) ]:
	- MUST be `null` if an error occurred or otherwise
		1. If the server supports session resumption, then this SHOULD be a unique
		session id, `null` otherwise
		2. The pool share complexity which must be used to pass server's difficulty challenge
- [ `error` : (`int`, `string`, `object`) ]

### mining.authorize

Before a client can submit solutions to a server it MUST authorize at least one worker\
This method call will only be executed by clients

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
notify clients of that\
This method call will only be executed by the server

#### Request

```
{"id": null, "method": "mining.set_target", "params": ["GIVER_SEED", "EXPIRED", "GIVER_ADDRESS", "WALLET_ADDRESS"]}\n
```

- [ `id` : `int` ]: request id
- [ `method` : `string` ]: RPC method name
- [ `params` : (`string`, `string`, `string`, `string`) ]: list of method parameters
	1. Current giver's job seed
	2. "expired" parameter which is preffered by server to calculate job result
	3. Current giver's address
	4. Pool wallet address

All job parameters must be used in .boc calculation, otherwise they will be rejected by pool

### mining.submit

With this method a worker can submit solutions for the mining puzzle\
This method call will only be executed by clients

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

## TODO

- user-friendly logs

## License

MIT
