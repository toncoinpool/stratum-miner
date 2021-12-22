# Ton Coin Pool MinerstatOS integration

[Ton Coin Pool](https://toncoinpool.io) client setup on [MinerstatOS](https://minerstat.com/software/mining-os)

Following the official instructions on [adding new custom mining client](https://minerstat.com/help/how-to-add-a-custom-mining-client#2-add-new-custom-mining-client)
fill in the fields:

-   `Name` - `TON-STRATUM-MINER`
-   `Package URL`

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v<version>/TON_Stratum_Miner_msOS-<version>.tar.gz
    ```

    where `<version>` - is the client version(`1.0.5`, `1.1.0`, etc.) from [releases](https://github.com/toncoinpool/stratum-miner/releases)
    page. Example:

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v1.0.10/TON_Stratum_Miner_msOS-1.0.10.tar.gz
    ```

-   `Executable file name` - `TON-Stratum-Miner`
-   `Client config type` - `Arguments`
-   `Client args/config` - This is a string of client's command-line arguments in the following form:

    `--integration msOS --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--gpus <ids>] [--rig <name>]`

    You should change it for each worker, if necessary. Available options are:

    -   `--integration msOS`: _Required_
    -   `-w, --wallet`: _Required_. Your TON wallet's address
    -   `-b, --bin <name>`: Name of the miner binary. Can be one of:

        -   `cuda-18` - CUDA miner
        -   `opencl-18` - OpenCL miner

        Defaults to `cuda-18`

    -   `-F --boost <boost-factors>`: Comma-separated list of boost factors as described in
        [pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
        For more performant CUDA GPUs it is recommended to set boost factor to `512` or `1024`. If a single number is
        passed it will be applied to all GPUs, otherwise you must pass a boost factor for each device listed in
        `--gpus`. Defaults to `16`. Examples:
        -   `-g 0,1,2 -F 64,32,512`
        -   `-g 0,1,2 -F 512`
    -   `-g, --gpus <ids>`: Comma-separated list of GPU device Ids that should be used by miner. Defaults to `0`. Only
        necessary on multi-GPU systems. Example: `--gpus 0,3,4`
    -   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io).
        Defaults to `default`

    Full example:

    `--integration msOS -w EQCUp88072pLUGNQCXXXDFJM3C5v9GXTjV7ou33Mj3r0Xv2W -b cuda-18 -F 512 -g 0,1,2 -r msOSrig`

-   `Extra args` - you can add `| tee log.txt` here to create a log file in `/home/minerstat/minerstat-os/clients/<miner-name>/`
    to help with troubleshooting in case of any errors.

To update the client simply update the version in `Package URL`

If something doesn't work as expected or if you think this documentation is wrong or incomplete post a message in our
[telegram channel](https://t.me/toncoinpool) or open a GitHub issue

To learn more about our pool client go to the [main README](../../README.md)
