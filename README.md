# Ton Coin Pool stratum-miner

[Ton Coin Pool](https://toncoinpool.io) mining client based on our fork of the official miner
[toncoinpool/pow-miner-gpu](https://github.com/toncoinpool/pow-miner-gpu)

Currently only Nvidia and AMD GPUs are supported

## Translations

-   :ru: [Русский](docs/readme_ru.md)

## Prerequirements

-   Install latest GPU drivers for your platform:
    [CUDA(Nvidia)](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html) or
    [OpenCL(AMD)](https://support.amd.com/en-us/download)
-   Download [Wallet app](https://ton.org/wallets) and create a wallet to obtain address

## Usage

Download the appropriate executable for your platform from
[Releases](https://github.com/toncoinpool/stratum-miner/releases) page:

-   Windows: file with `.exe` extension
-   macOS: `.zip` archive containing `.app` file. Last version with macOS support was `1.0.13`
-   Linux: `.AppImage` file with GUI or `linux-headless.tar.gz` archive containing CLI-only binary

### GUI Fields

-   Mining binary: select miner based on your GPU manufacturer: Nvidia, AMD or both
-   GPUs: select GPUs, that you want to use for mining
-   Wallet address: correct TON Wallet address. `DO NOT USE ANY CRYPTO EXCHANGE SERVICES WALLETS!!!`
-   Rig name: rig name for statistics on website. Allowed symbols are `latin`, `numeric`, ` `, `-`, `_`, max 24 symbols
    length

### MinerstatOS integration

Instructions can be found [here](integrations/minerstat/README.md)

### RaveOS integration

Instructions can be found [here](integrations/raveos/README.md)

### HiveOS integration

#### Add your TON wallet

Following official instructions: https://hiveos.farm/guides-how_to_start_mine_in_Hive_OS

-   `Coin` - `toncoin`
-   `Address` - you TON wallet address
-   `Name` - any name
-   `Source` - leave blank
-   leave switch `Fetch wallet balance` unchecked

#### Creating Flight Sheet

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
        The only way to find device ids is to run the miner first and check miner logs. Default boost factor is `512`
        for Nvidia or `64` for AMD

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

### Headless

You can run the client without the GUI directly from the command line:

```shell
$ ./TON-Stratum-Miner --headless --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--exclude-gpus <ids>] [--pool <uri>] [--rig <name>]
```

-   `-h, --headless`: _Required_. Pass this flag to not open the client's GUI window
-   `-w, --wallet`: _Required_. Your TON wallet's address
-   `-b, --bin <name>`: Name of the miner binary. Can be specified to use only Nvidia or only AMD GPUs. Can be one of:

    Linux:

    -   `cuda-18`
    -   `cuda-20`
    -   `opencl-18`
    -   `opencl-20`

    Windows:

    -   `cuda.exe`
    -   `opencl.exe`

    Defaults to using both Nvidia and AMD

-   `-F --boost <boost-factors>`: configure boost factors
    ([pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md)).
    Can be a single number to apply to all GPUs or a comma-separated list of `<id>:<boost>,<id>:<boost>,...` pairs. The
    only way to find device ids is to run the miner first and check the output. Defaults to `512` for Nvidia or `64` for
    AMD.

    Given the following device list in miner logs:

    ```
    CUDA: id 0 boost 512 NVIDIA GeForce RTX 3080
    OpenCL: id 1:0 boost 64 AMD Radeon RX 6600
    ```

    We can configure boost factor in the following ways:

    -   `--boost 2048` - will use `2048` for all GPUs
    -   `--boost 1:0:256` - will use the default value of `512` for 3080 and `256` for 6600
    -   `--boost 0:1024,1:0:128` - will use `1024` for 3080 and `128` for 6600

-   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io). Defaults to `default`

## Ton Coin Pool endpoints

-   [ `pplns`: `wss://pplns.toncoinpool.io/stratum` ]

## Stratum

Ton Coin Pool is based on [Stratum protocol](docs/stratum.md)

## License

MIT
