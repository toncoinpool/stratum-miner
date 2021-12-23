# Ton Coin Pool RaveOS integration

[Ton Coin Pool](https://toncoinpool.io) custom miner setup on [RaveOS](https://raveos.com)

1.  Download the latest `TON_Stratum_Miner_raveOS-<version>.zip` from
    [releases](https://github.com/toncoinpool/stratum-miner/releases) page
2.  go to `Custom Mining` page
3.  go to `MINERS` tab
4.  press `+ Add` and select `.zip` archive you just downloaded
5.  go to `POOLS` tab
6.  press `+ Add` and fill in the form:

    -   `Pool name` - `Ton Coin Pool`
    -   `Ewal template` - `%EWAL%`
    -   `URL template` - `%URL%`
    -   `Type of auth` - `Wallet or Login`
    -   `Choose coin` - `Toncoin`
    -   `Pool mode` - `default`
    -   `Connection type` - `default`
    -   `Add URLs` - `wss://pplns.toncoinpool.io/stratum`

7.  go to `WALLETS` tab
8.  press `+ Add` and fill in the form:

    -   `Select a coin` - `Toncoin`
    -   `Coin name` - `toncoin`
    -   `Select pool` - `Ton Coin Pool`
    -   `Select URL` - `wss://pplns.toncoinpool.io/stratum`
    -   `Wallet` - your TON wallet address
    -   `Select miners` - select `TON-STRATUM-MINER` and press miner's `edit` button. Here you can add a string with
        miner's optional configuration:

        ```
        [--bin <name>] [--boost <boost-factors>] [--gpus <ids>] [--rig <name>]
        ```

        -   `-b, --bin <name>`: Name of the miner binary. Can be one of:

            -   `cuda-18` - CUDA miner
            -   `opencl-18` - OpenCL miner

            Defaults to `cuda-18`

        -   `-F --boost <boost-factors>`: Comma-separated list of boost factors as described in
            [pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
            If a single number is passed it will be applied to all GPUs, otherwise you must pass a boost factor for each
            device listed in `--gpus`. Defaults to `512` for CUDA or `64` for OpenCL. Examples:

            -   `-g 0,1,2 -F 64,32,512`
            -   `-g 0,1,2 -F 512`

        -   `-g, --gpus <ids>`: Comma-separated list of GPU device Ids that should be used by miner. Defaults to `0`.
            Example: `--gpus 0,3,4`
        -   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io).
            Defaults to `default`
