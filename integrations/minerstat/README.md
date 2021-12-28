# Ton Coin Pool MinerstatOS integration

[Ton Coin Pool](https://toncoinpool.io) client setup on [MinerstatOS](https://minerstat.com/software/mining-os)

Following the official instructions on [adding new custom mining client](https://minerstat.com/help/how-to-add-a-custom-mining-client#2-add-new-custom-mining-client)
fill in the fields:

-   `Name` - `TON-STRATUM-MINER`
-   `Package URL`

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v<version>/TON_Stratum_Miner_msOS-<version>.tar.gz
    ```

    where `<version>` - is the client version(`1.0.13`, `2.0.0`, etc.) from [releases](https://github.com/toncoinpool/stratum-miner/releases)
    page. Example:

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v2.0.0/TON_Stratum_Miner_msOS-2.0.0.tar.gz
    ```

-   `Executable file name` - `TON-Stratum-Miner`
-   `Client config type` - `Arguments`
-   `Client args/config` - This is a string of client's command-line arguments in the following form:

    `--integration msOS --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--rig <name>]`

    You should change it for each worker, if necessary. Available options are:

    -   `--integration msOS`: _Required_
    -   `-w, --wallet`: _Required_. Your TON wallet's address
    -   `-b, --bin <name>`: Name of the miner binary. Can be specified to use only Nvidia or only AMD GPUs. Can be one
        of:

        -   `cuda-18` - Nvidia
        -   `opencl-18` - AMD

        Defaults to using both Nvidia and AMD

    -   `-F --boost <boost-factors>`: configure boost factors
        ([pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md)).
        Can be a single number to apply to all GPUs or a comma-separated list of `<id>:<boost>,<id>:<boost>,...` pairs.
        The only way to find device ids is to run the miner first and check it's logs. Defaults to `2048` for
        Nvidia(recommended for GTX 1080 and above) or `64` for AMD.

        Given the following device list in miner logs:

        ```
        CUDA: id 0 boost 512 NVIDIA GeForce RTX 3080
        OpenCL: id 1:0 boost 64 AMD Radeon RX 6600
        ```

        We can configure boost factor in the following ways:

        -   `--boost 2048` - will use `2048` for all GPUs
        -   `--boost 1:0:256` - will use the default value of `512` for 3080 and `256` for 6600
        -   `--boost 0:1024,1:0:128` - will use `1024` for 3080 and `128` for 6600

    -   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io). Defaults to
        `default`

-   `Extra args` - you can add `| tee log.txt` here to create a log file in `/home/minerstat/minerstat-os/clients/<miner-name>/`
    to help with troubleshooting in case of any errors.

To update the client simply update the version in `Package URL`

If something doesn't work as expected or if you think this documentation is wrong or incomplete post a message in our
[telegram channel](https://t.me/toncoinpool) or open a GitHub issue

To learn more about our pool client go to the [main README](../../README.md)
