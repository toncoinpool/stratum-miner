# Ton Coin Pool HiveOS интеграция

Инструкция по установке клиента [Ton Coin Pool](https://toncoinpool.io) на [HiveOS](https://hiveos.farm)

## Добавление своего TON кошелька

Следуя официальным инструкциям: https://hiveos.farm/guides-how_to_start_mine_in_Hive_OS_ru

-   в поле `Монета` - впишите `toncoin`
-   в поле `Адрес` - впишите адрес вашего кошелька
-   в поле `Имя` - можно писать что угодно
-   поле `Источник` - нужно оставить пустым
-   переключатель `Получить баланс кошелька` оставить выключенным(как в официальной инструкции)

## Создание полётного листа

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
        начало его логов. По умолчанию используется бустфактор `2048` для Nvidia(рекомендованное значение для GTX 1080
        и выше) и `64` для AMD

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
