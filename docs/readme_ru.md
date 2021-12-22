# Ton Coin Pool stratum-miner

Клиент для пула [Ton Coin Pool](https://toncoinpool.io) основанный на нашем форке официального майнера
[toncoinpool/pow-miner-gpu](https://github.com/toncoinpool/pow-miner-gpu)

## Перед использованием

-   Установите последние GPU драйверы для вашей платформы:
    [CUDA-capable GPU (Nvidia)](https://docs.nvidia.com/cuda/cuda-installation-guide-microsoft-windows/index.html)
    или [OpenCL-capable (AMD)](https://support.amd.com/en-us/download)
-   Установите [приложение TON кошелька](https://ton.org/wallets) и создайте в нём кошелёк для
    получения адреса

## Использование

Загрузите версию клиента, подходящую вам, со страницы [релизов](https://github.com/toncoinpool/stratum-miner/releases):

-   Windows: файл с `.exe` расширением
-   MacOS: `.zip` архив содержащий `.app` файл
-   Linux: `.AppImage` файл с графическим интерфейсом или `linux-headless.tar.gz` архив содержащий файл, запускаемый
    только из командной строки

### Настройка графического клиента

-   `Select mining binary`: выберите `pow-miner-gpu` майнер, подходящий для вашей системы
-   `Select GPUs`: Выберите отдельные GPU, которые будут использоваться для майнинга
-   `Wallet address`: адрес вашего персонального TON кошелька. `НЕ ИСПОЛЬЗУЙТЕ КОШЕЛЬКИ КРИПТООБМЕННИКОВ!!!`
-   `Rig name`: имя данного компьютера для отображения в статистике на нашем сайте. Разрешённые символы: `латиница`,
    `цифры`, ` `, `-`, `_`, максимальная длина - 24 символа

### MinerstatOS интеграция

Смотрите инструкцию [здесь](../integrations/minerstat/README.md)

### HiveOS интеграция

Данная инструкция рассчитана на пользователей, уже имеющих опыт работы с HiveOS

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

    где `<version>` - это желаемая версия майнера(`1.0.5`, `1.1.0`, и т.д.) из [релизов](https://github.com/toncoinpool/stratum-miner/releases).
    Например:

    ```
    https://github.com/toncoinpool/stratum-miner/releases/download/v1.0.11/TON_Stratum_Miner_HiveOS-1.0.11.tar.gz
    ```

-   `Hash algorithm` - оставить пустым
-   `Wallet and worker template` - писать **строго** `%WAL%` без пробелов
-   `Pool URL` - `pplns.toncoinpool.io:443/stratum` или любой другой - в майнере никак не используется
-   `Extra config arguments` - самое главное поле с настройками майнера:

    -   `TONPOOL_BIN` - одно из:
        -   `cuda-18` - CUDA майнер
        -   `opencl-18` - OpenCL майнер
    -   `TONPOOL_GPUS` - список, через запятую, айди видеокарт, которые должны использоваться майнером, где `0` - первый
        девайс, `1` - второй, и так далее. Примеры: `0` для одного девайса; `0,3,4` для первого, четвёртого и пятого
    -   `TONPOOL_RIGNAME` - имя рига, для отображения в статистике на сайте, может быть любой **слитной** строкой из
        латинских букв и цифр(никаких других символов и кириллицы)
    -   `TONPOOL_BOOST` - _необязательный_ параметр для указания бустфактора, как описано в [инструкциях pow-miner-gpu](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
        Может быть одним числом, чтобы применить его ко всем видеокартам, или списком чисел, через запятую, для
        **каждого** GPU в `TONPOOL_GPUS`. По умолчанию используется бустфактор `512` для CUDA и `64` для OpenCL

    Пример:

    ```
    TONPOOL_BIN=cuda-18
    TONPOOL_GPUS=0,1,2
    TONPOOL_RIGNAME=myHiveRig1
    TONPOOL_BOOST=1024,1024,64
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
$ ./TON-Stratum-Miner --headless --wallet <your-wallet-address> [--bin <name>] [--boost <boost-factors>] [--gpus <ids>] [--pool <uri>] [--rig <name>]
```

-   `-h, --headless`: _Обязательно_. Данный флаг предотвращает открытие окна графического интерфейса
-   `-w, --wallet`: _Обязательно_. Адрес вашего TON кошелька
-   `-b, --bin <name>`: Имя майнера, подходящее вашей системе. Одно из:

    Linux:

    -   `cuda-18`
    -   `cuda-20`
    -   `opencl-18`
    -   `opencl-20`

    Windows:

    -   `cuda.exe`
    -   `opencl.exe`

    По умолчанию `cuda-20`

-   `-F --boost <boost-factors>`: Список, через запятую, бустфакторов из [pow-miner-gpu](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
    Если передать одно число, оно будет применено ко всем GPU в `--gpus`. Для индивидуальной настройки каждого GPU вы
    должны перечислить бустфакторы в том же порядке, что в `--gpus` параметре. По умолчанию `512` для CUDA и `64` для
    OpenCL. Примеры:

    -   `-g 0,1,2 -F 64,32,512`
    -   `-g 0,1,2 -F 512`

-   `-g, --gpus <ids>`: Список, через запятую, идентификаторов GPU девайсов, которые должны использоваться майнером.
    По умолчанию `0`. Указывать стоит только на мульти-GPU системах. Пример: `--gpus 0,3,4`
-   `-p, --pool`: Адрес пула. По умолчанию `wss://pplns.toncoinpool.io/stratum`
-   `-r, --rig`: Под каким именем будет видна статистика этого клиента на [toncoinpool.io](https://toncoinpool.io).
    По умолчанию `default`

Пример:

```shell
$ ./TON-Stratum-Miner -h -w EQCUp88072pLUGNQCXXXDFJM3C5v9GXTjV7ou33Mj3r0Xv2W -b cuda-20 -F 512 -g 0,1,2 -r myRig
```

## Ton Coin Pool endpoints

-   [ `pplns`: `wss://pplns.toncoinpool.io/stratum` ]

## Stratum

Ton Coin Pool is based on [Stratum protocol](./stratum.md)

## License

MIT
