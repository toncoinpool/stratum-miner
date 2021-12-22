# Ton Coin Pool stratum-miner

[Ton Coin Pool](https://toncoinpool.io) mining client based on our fork of the official miner
[toncoinpool/pow-miner-gpu](https://github.com/toncoinpool/pow-miner-gpu)

## Translations

-   :ru: [Русский](docs/readme_ru.md)

## Prerequirements

-   Install latest GPU drivers for your platform:
    [CUDA-capable GPU (Nvidia)](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html)
    or [OpenCL-capable (AMD)](https://support.amd.com/en-us/download)
-   Download [Wallet app](https://ton.org/wallets) and create a wallet to obtain address

## Usage

Download the appropriate executable for your platform from
[Releases](https://github.com/toncoinpool/stratum-miner/releases) page:

-   Windows: file with `.exe` extension
-   MacOS: `.zip` archive containing `.app` file
-   Linux: `.AppImage` file with GUI or `linux-headless.tar.gz` archive containing CLI-only binary

### GUI Fields

-   Mining binary: select `pow-miner-gpu` binary for your system
-   GPUs: GPUs, that you want to use for mining
-   Wallet address: correct TON Wallet address. `DO NOT USE ANY CRYPTO EXCHANGE SERVICES WALLETS!!!`
-   Rig name: rig name for statistics on website. Allowed symbols are `latin`, `numeric`, ` `, `-`, `_`, max 24 symbols
    length

### MinerstatOS integration

Instructions can be found [here](integrations/minerstat/README.md)

### HiveOS integration

This instructions are targeted at users experienced with HiveOS

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

    where `<version>` - is the client version(`1.0.5`, `1.1.0`, etc.) from [releases](https://github.com/toncoinpool/stratum-miner/releases)
    page. Example:

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v1.0.11/TON_Stratum_Miner_HiveOS-1.0.11.tar.gz
    ```

-   `Hash algorithm` - leave blank
-   `Wallet and worker template` - **strictly** type `%WAL%` with no spaces
-   `Pool URL` - `pplns.toncoinpool.io:443/stratum` or it can be any other url since it is not used by the client
-   `Extra config arguments` - the most important field with client configuration:

    -   `TONPOOL_BIN` - one of:
        -   `cuda-18` - CUDA mining binary
        -   `opencl-18` - OpenCL mining binary
    -   `TONPOOL_GPUS` - comma-separated list of GPU device Ids that should be used by miner where `0` - the first
        device, `1` - second, and so on. Examples: `0` for single GPU; `0,3,4` for the first, fourth and fifth GPUs.
    -   `TONPOOL_RIGNAME` - name of this rig to use on the stats screen on the website. Can be any string composed of
        english letter and digits(no spaces, symbols and non-english letters allowed)
    -   `TONPOOL_BOOST` - _optional_ parameter to set boost factors, as described in
        [pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
        Can be a single number to apply to all GPUs or a comma-separated list of numbers for **each** GPU in
        `TONPOOL_GPUS`. Default boost factor is `512` for CUDA or `64` for OpenCL

    Example:

    ```
    TONPOOL_BIN=cuda-18
    TONPOOL_GPUS=0,1,2
    TONPOOL_RIGNAME=myHiveRig1
    TONPOOL_BOOST=1024,1024,64
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
$ ./TON-Stratum-Miner --headless --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--gpus <ids>] [--pool <uri>] [--rig <name>]
```

-   `-h, --headless`: _Required_. Pass this flag to not open the client's GUI window
-   `-w, --wallet`: _Required_. Your TON wallet's address
-   `-b, --bin <name>`: Name of the miner binary. Can be one of:

    Linux:

    -   `cuda-18`
    -   `cuda-20`
    -   `opencl-18`
    -   `opencl-20`

    Windows:

    -   `cuda.exe`
    -   `opencl.exe`

    Defaults to `cuda-20`

-   `-F --boost <boost-factors>`: Comma-separated list of boost factors as described in [pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
    If a single number is passed it will be applied to all GPUs, otherwise you must pass a boost factor for each device
    listed in `--gpus`. Defaults to `512` for CUDA or `64` for OpenCL. Examples:
    -   `-g 0,1,2 -F 64,32,512`
    -   `-g 0,1,2 -F 512`
-   `-g, --gpus <ids>`: Comma-separated list of GPU device Ids that should be used by miner. Defaults to `0`. Only
    necessary on multi-GPU systems. Example: `--gpus 0,3,4`
-   `-p, --pool`: Pool address to connect to. Defaults to `wss://pplns.toncoinpool.io/stratum`
-   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io). Defaults to `default`

Example:

```shell
$ ./TON-Stratum-Miner -h -w EQCUp88072pLUGNQCXXXDFJM3C5v9GXTjV7ou33Mj3r0Xv2W -b cuda-20 -F 512 -g 0,1,2 -r myRig
```

## Ton Coin Pool endpoints

-   [ `pplns`: `wss://pplns.toncoinpool.io/stratum` ]

## Stratum

Ton Coin Pool is based on [Stratum protocol](docs/stratum.md)

## License

MIT
