# Ton Coin Pool RaveOS интеграция

Инструкция по установке клиента [Ton Coin Pool](https://toncoinpool.io) на [RaveOS](https://raveos.com)

1.  cкачайте архив `TON_Stratum_Miner_raveOS-<version>.zip` со страницы [релизов](https://github.com/toncoinpool/stratum-miner/releases)
2.  в меню слева перейдите на страницу `Custom Mining`
3.  перейдите во вкладку `MINERS`
4.  нажмите на кнопку `+ Add`, выберите скачанный `.zip` архив
5.  перейдите во вкладку `POOLS`
6.  нажмите на кнопку `+ Add` и заполните форму следующими значениями:

    -   `Pool name` - `Ton Coin Pool`
    -   `Ewal template` - `%EWAL%`
    -   `URL template` - `%URL%`
    -   `Type of auth` - `Wallet or Login`
    -   `Choose coin` - `Toncoin`
    -   `Pool mode` - `default`
    -   `Connection type` - `default`
    -   `Add URLs` - `wss://pplns.toncoinpool.io/stratum`

7.  перейдите во вкладку `WALLETS`
8.  нажмите на кнопку `+ Add` и заполните форму следующими значениями:

    -   `Select a coin` - `Toncoin`
    -   `Coin name` - `toncoin`
    -   `Select pool` - `Ton Coin Pool`
    -   `Select URL` - `wss://pplns.toncoinpool.io/stratum`
    -   `Wallet` - адрес вашего TON кошелька
    -   `Select miners` - выберите `TON-STRATUM-MINER` и нажмите на кнопку редактирования майнера. В появившемся окне
        вы можете добавить строку с дополнительными конфигурациями майнера:

        ```
        [--bin <name>] [--boost <boost-factors>] [--rig <name>]
        ```

        -   `-b, --bin <name>`: Имя майнера. Позволяет использовать только Nvidia(`cuda`) или только AMD(`opencl`)
            карты. Одно из:

            -   `cuda-18` - для NVIDIA
            -   `opencl-18` - для AMD

            По умолчанию использует Nvidia и AMD вместе

        -   `-F --boost <boost-factors>`: указание бустфактора
            ([pow-miner-gpu docs](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md)).
            Может быть одним числом, чтобы применить его ко всем видеокартам, или списком чисел, через запятую вида
            `<id>:<boost>,<id>:<boost>,...`. Для получения списка айди девайсов необходимо запустить майнер и посмотреть
            в начало его логов. По умолчанию используется бустфактор `2048` для Nvidia(рекомендованное значение для GTX
            1080 и выше) и `64` для AMD

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
