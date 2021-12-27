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

-   Windows: file with `.exe` extension or `win-headless.zip`(recommended) archive containing CLI-only binary
-   macOS: `.zip` archive containing `.app` file. Last version with macOS support was `1.0.13`
-   Linux: `.AppImage` file with GUI or `linux-headless.tar.gz`(recommended) archive containing CLI-only binary

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

Instructions can be found [here](integrations/hiveos/README.md)

### Headless

You can run the client from the command-line on both linux and windows. Minimum required windows version is 8.1

Linux:

```shell
$ ./TON-Stratum-Miner --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--exclude-gpus <ids>] [--rig <name>]
```

Windows:

```shell
TON-Stratum-Miner.exe --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--exclude-gpus <ids>] [--rig <name>]
```

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
    Can be a single number to apply to all GPUs or a comma-separated list of `<id>:<boost>,<id>:<boost>,...` pairs. To
    list device ids run the client without `--wallet` argument. Defaults to `2048` for Nvidia(recommended for GTX 1080
    and above) or `64` for AMD.

    Given the following device list in miner logs:

    ```
    CUDA: id 0 boost 512 NVIDIA GeForce RTX 3080
    OpenCL: id 1:0 boost 64 AMD Radeon RX 6600
    ```

    We can configure boost factor in the following ways:

    -   `--boost 2048` - will use `2048` for all GPUs
    -   `--boost 1:0:256` - will use the default value of `512` for 3080 and `256` for 6600
    -   `--boost 0:1024,1:0:128` - will use `1024` for 3080 and `128` for 6600

-   `--exclude-gpus <ids>`: disable mining on specific GPUs. A comma-separated list of device ids. To find id of a
    specific device run the client without `--wallet` argument. Example: `--exclude-gpus 0,1,1:0,1:1`
-   `-r, --rig`: How this client's stats will be seen on [toncoinpool.io](https://toncoinpool.io). Defaults to `default`

## Ton Coin Pool endpoints

-   [ `pplns`: `wss://pplns.toncoinpool.io/stratum` ]

## Stratum

Ton Coin Pool is based on [Stratum protocol](docs/stratum.md)

## License

MIT
