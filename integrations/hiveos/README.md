# Ton Coin Pool HiveOS integration

[Ton Coin Pool](https://toncoinpool.io) custom miner setup on [HiveOS](https://hiveos.farm)

## Add your TON wallet

Following official instructions: https://hiveos.farm/guides-how_to_start_mine_in_Hive_OS

-   `Coin` - `toncoin`
-   `Address` - you TON wallet address
-   `Name` - any name
-   `Source` - leave blank
-   leave switch `Fetch wallet balance` unchecked

## Creating Flight Sheet

Following official instructions: https://hiveos.farm/getting_started-start_custom_miner

Creating flight sheet:

-   `Flight Sheet Name` - any name
-   `Coin` - `toncoin` you made previously
-   `Wallet` - select one you made previously
-   `Pool` - `Configure in miner`
-   `Miner` - select `Custom` and press `Setup Miner Config`

Setting up custom miner:

-   `Miner name` - should be populated automatically once you enter `Installation URL`. If it didn't, enter
    `TON_Stratum_Miner_HiveOS`
-   `Installation URL`

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v<version>/TON_Stratum_Miner_HiveOS-<version>.tar.gz
    ```

    where `<version>` - is the client version(`1.0.13`, `2.0.0`, etc.) from [releases](https://github.com/toncoinpool/stratum-miner/releases)
    page. Example:

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v2.0.0/TON_Stratum_Miner_HiveOS-2.0.0.tar.gz
    ```

-   `Hash algorithm` - leave blank
-   `Wallet and worker template` - **strictly** type `%WAL%` with no spaces
-   `Pool URL` - `pplns.toncoinpool.io:443/stratum` or it can be any other url since it is not used by the client
-   `Extra config arguments` - optional client configuration:

    -   `TONPOOL_BIN` - `cuda-18` for Nvidia, `opencl-18` for AMD. Defaults to both
    -   `TONPOOL_RIGNAME` - name of this rig to use on the stats screen on the website. Can be any string composed of
        english letter and digits(no spaces, symbols and non-english letters allowed). Defaults to your worker's name
    -   `TONPOOL_BOOST` - configure boost factors
        ([pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md)).
        Can be a single number to apply to all GPUs or a comma-separated list of `<id>:<boost>,<id>:<boost>,...` pairs.
        The only way to find device ids is to run the miner first and check miner logs. Default boost factor is `2048`
        for Nvidia(recommended for GTX 1080 and above) or `64` for AMD

        Given the following device list in miner logs:

        ```
        CUDA: id 0 boost 512 NVIDIA GeForce RTX 3080
        OpenCL: id 1:0 boost 64 AMD Radeon RX 6600
        ```

        We can configure boost factor in the following ways:

        -   `TONPOOL_BOOST=2048` - will use `2048` for all GPUs
        -   `TONPOOL_BOOST=1:0:256` - will use the default value of `512` for 3080 and `256` for 6600
        -   `TONPOOL_BOOST=0:1024,1:0:128` - will use `1024` for 3080 and `128` for 6600

    Example:

    ```
    TONPOOL_BIN=cuda-18
    TONPOOL_RIGNAME=myHiveRig1
    TONPOOL_BOOST=0:1024,1:2048
    ```

-   Press `Apply Changes`
-   Press `Create Flight Sheet`

To apply new Flight Sheet follow the instructions in chapter `How to start mine in Hive OS?` on
https://hiveos.farm/guides-how_to_start_mine_in_Hive_OS/#how-to-start-mine-in-hive-os

Miner logs are written into `/var/log/miner/TON_Stratum_Miner_HiveOS/TON_Stratum_Miner_HiveOS.log`

Automatic updates are not yet supported. When a new version is released you should repeat the procedure described above
