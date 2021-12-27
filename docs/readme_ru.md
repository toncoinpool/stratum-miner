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

#### Добавление своего TON кошелька

Следуя официальным инструкциям: https://hiveos.farm/guides-how_to_start_mine_in_Hive_OS_ru

-   в поле `Монета` - впишите `toncoin`
-   в поле `Адрес` - впишите адрес вашего кошелька
-   в поле `Имя` - можно писать что угодно
-   поле `Источник` - нужно оставить пустым
-   переключатель `Получить баланс кошелька` оставить выключенным(как в официальной инструкции)

#### Создание полётного листа

Следуя официальным инструкциям: https://hiveos.farm/getting_started-start_custom_miner_ru

При создании полётного листа:

-   `Имя` полётного листа - любое
-   `Монета` - созданный ранее `toncoin`
-   `Кошелёк` - созданный ранее
-   `Пул` - `Настроить в майнере`(`Configure in miner`)
-   `Майнер` - выберите `Custom` и нажмите на появившуюся кнопку `Setup Miner Config`

Настройка кастомного майнера:

-   `Miner name` - должен будет подставиться самостоятельно после того, как вы введёте `Installation URL`. Если этого не
    произошло, впишите `TON_Stratum_Miner_HiveOS`(без версии)
-   `Installation URL`

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v<version>/TON_Stratum_Miner_HiveOS-<version>.tar.gz
    ```

    где `<version>` - это желаемая версия майнера(`1.0.13`, `2.0.0`, и т.д.) из [релизов](https://github.com/toncoinpool/stratum-miner/releases).
    Например:

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v2.0.0/TON_Stratum_Miner_HiveOS-2.0.0.tar.gz
    ```

-   `Hash algorithm` - оставить пустым
-   `Wallet and worker template` - писать **строго** `%WAL%` без пробелов
-   `Pool URL` - `pplns.toncoinpool.io:443/stratum` или любой другой - в майнере никак не используется
-   `Extra config arguments` - опциональные настройки клиента:

    -   `TONPOOL_BIN` - `cuda-18` для Nvidia, `opencl-18` для AMD. По умолчанию использует и Nvidia и AMD
    -   `TONPOOL_RIGNAME` - имя рига, для отображения в статистике на сайте, может быть любой **слитной** строкой из
        латинских букв и цифр(никаких других символов и кириллицы). По умолчанию имя воркера
    -   `TONPOOL_BOOST` - указание бустфактора
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

        -   `TONPOOL_BOOST=2048` - будет использовать `2048` для всех GPU
        -   `TONPOOL_BOOST=1:0:256` - будет использовать значение по умолчанию `512` для 3080 и `256` для 6600
        -   `TONPOOL_BOOST=0:1024,1:0:128` - будет использовать `1024` для 3080 и `128` для 6600

    Пример:

    ```
    TONPOOL_BIN=cuda-18
    TONPOOL_RIGNAME=myHiveRig1
    TONPOOL_BOOST=0:1024,1:2048
    ```

-   Жмём `Apply Changes`(`подтвердить изменения`)
-   В меню создания полётного листа жмём `Создать полётный лист`

Для применения нового полётного листа следуйте инструкциям в разделе `Как начать майнить в Hive OS?` на странице:
https://hiveos.farm/guides-how_to_start_mine_in_Hive_OS_ru

Логи майнера можно посмотреть в файле `/var/log/miner/TON_Stratum_Miner_HiveOS/TON_Stratum_Miner_HiveOS.log`

Автоматическое обновление майнеров пока не реализовано, после выхода новой версии, повторите вышеописанную инструкцию
заного

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
