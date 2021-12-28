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
        [--bin <name>] [--boost <boost-factors>] [--rig <name>]
        ```

        -   `-b, --bin <name>`: Name of the miner binary. Can be specified to use only Nvidia or only AMD GPUs. Can be
            one of:

            -   `cuda-18` - Nvidia
            -   `opencl-18` - AMD

            Defaults to using both Nvidia and AMD

        -   `-F --boost <boost-factors>`: configure boost factors
            ([pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md)).
            Can be a single number to apply to all GPUs or a comma-separated list of `<id>:<boost>,<id>:<boost>,...`
            pairs. The only way to find device ids is to run the miner first and check it's logs. Defaults to `2048` for
            Nvidia(recommended for RTX 2080Ti and above) or `64` for AMD.

            Given the following device list in miner logs:

            ```
            CUDA: id 0 boost 512 NVIDIA GeForce RTX 3080
            OpenCL: id 1:0 boost 64 AMD Radeon RX 6600
            ```

            We can configure boost factor in the following ways:

            -   `--boost 2048` - will use `2048` for all GPUs
            -   `--boost 1:0:256` - will use the default value of `512` for 3080 and `256` for 6600
            -   `--boost 0:1024,1:0:128` - will use `1024` for 3080 and `128` for 6600

        -   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io).
            Defaults to `default`
