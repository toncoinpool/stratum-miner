# Ton Coin Pool stratum-miner

Клиент для пула [Ton Coin Pool](https://toncoinpool.io) основанный на нашем форке официального майнера
[toncoinpool/pow-miner-gpu](https://github.com/toncoinpool/pow-miner-gpu)

В данный момент поддерживаются только карты Nvidia и AMD.

## Перед использованием

-   Установите последние GPU драйверы для вашей платформы:
    [CUDA(Nvidia)](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html)
    или [OpenCL(AMD)](https://support.amd.com/en-us/download)
-   Установите [приложение TON кошелька](https://ton.org/wallets) и создайте в нём кошелёк для
    получения адреса

## Использование

Загрузите версию клиента, подходящую вам, со страницы [релизов](https://github.com/toncoinpool/stratum-miner/releases):

-   Windows: файл с `.exe` расширением
-   macOS: `.zip` архив содержащий `.app` файл. Последняя версия с поддержкой macOS была `1.0.13`
-   Linux: `.AppImage` файл с графическим интерфейсом или `linux-headless.tar.gz` архив содержащий файл, запускаемый
    только из командной строки

### Настройка графического клиента

-   `Select mining binary`: выберите майнер: Nvidia, AMD или оба
-   `Select GPUs`: Выберите отдельные GPU, которые будут использоваться для майнинга
-   `Wallet address`: адрес вашего персонального TON кошелька. `НЕ ИСПОЛЬЗУЙТЕ КОШЕЛЬКИ КРИПТООБМЕННИКОВ!!!`
-   `Rig name`: имя данного компьютера для отображения в статистике на нашем сайте. Разрешённые символы: `латиница`,
    `цифры`, ` `, `-`, `_`, максимальная длина - 24 символа

### MinerstatOS интеграция

Смотрите инструкцию [здесь](../integrations/minerstat/README.md)

### RaveOS интеграция

Смотрите инструкцию [здесь](../integrations/raveos/README_RU.md)

### HiveOS интеграция

Смотрите инструкцию [здесь](../integrations/hiveos/README_RU.md)

### Headless

Вы можете запустить клиент без графического интерфейса напрямую из командной строки:

```shell
$ ./TON-Stratum-Miner --headless --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--exclude-gpus <ids>] [--pool <uri>] [--rig <name>]
```

-   `-h, --headless`: _Обязательно_. Данный флаг предотвращает открытие окна графического интерфейса
-   `-w, --wallet`: _Обязательно_. Адрес вашего TON кошелька
-   `-b, --bin <name>`: Имя майнера. Позволяет использовать только Nvidia(`cuda`) или только AMD(`opencl`) карты. Одно из:

    Linux:

    -   `cuda-18`
    -   `cuda-20`
    -   `opencl-18`
    -   `opencl-20`

    Windows:

    -   `cuda.exe`
    -   `opencl.exe`

    По умолчанию использует Nvidia и AMD вместе

-   `-F --boost <boost-factors>`: указание бустфактора
    ([pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md)).
    Может быть одним числом, чтобы применить его ко всем видеокартам, или списком чисел, через запятую вида
    `<id>:<boost>,<id>:<boost>,...`. Для получения списка айди девайсов необходимо запустить майнер и посмотреть в
    начало его логов. По умолчанию используется бустфактор `512` для Nvidia и `64` для AMD

    При следующем списке девайсов в логах майнера:

    ```
    CUDA: id 0 boost 512 NVIDIA GeForce RTX 3080
    OpenCL: id 1:0 boost 64 AMD Radeon RX 6600
    ```

    Мы можем указать бустфактор следующими способами:

    -   `--boost 2048` - будет использовать `2048` для всех GPU
    -   `--boost 1:0:256` - будет использовать значение по умолчанию `512` для 3080 и `256` для 6600
    -   `--boost 0:1024,1:0:128` - будет использовать `1024` для 3080 и `128` для 6600

-   `-r, --rig`: Под каким именем будет видна статистика этого клиента на [toncoinpool.io](https://toncoinpool.io).
    По умолчанию `default`

## Ton Coin Pool endpoints

-   [ `pplns`: `wss://pplns.toncoinpool.io/stratum` ]

## Stratum

Ton Coin Pool is based on [Stratum protocol](./stratum.md)

## License

MIT
