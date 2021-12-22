# Ton Coin Pool RaveOS integration

[Ton Coin Pool](https://toncoinpool.io) custom miner setup on [RaveOS](https://raveos.com)

Download the latest `TON_Stratum_Miner_raveOS-<version>.zip` from [releases](https://github.com/toncoinpool/stratum-miner/releases)
page

If you ever need a pool URL use `pplns.toncoinpool.io:443/stratum`

Miner is configured via `Additional command line arguments` box. All fields are optional:

```
[--bin <name>] [--boost <boost-factors>] [--gpus <ids>] [--rig <name>]
```

-   `-b, --bin <name>`: Name of the miner binary. Can be one of:

    -   `cuda-18` - CUDA miner
    -   `opencl-18` - OpenCL miner

    Defaults to `cuda-18`

-   `-F --boost <boost-factors>`: Comma-separated list of boost factors as described in
    [pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md). If a
    single number is passed it will be applied to all GPUs, otherwise you must pass a boost factor for each device
    listed in `--gpus`. Defaults to `512` for CUDA or `64` for OpenCL. Examples:
    -   `-g 0,1,2 -F 64,32,512`
    -   `-g 0,1,2 -F 512`
-   `-g, --gpus <ids>`: Comma-separated list of GPU device Ids that should be used by miner. Defaults to `0`.
    Example: `--gpus 0,3,4`
-   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io).
    Defaults to `default`
