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
        [--bin <name>] [--boost <boost-factors>] [--gpus <ids>] [--rig <name>]
        ```

        -   `-b, --bin <name>`: Имя майнера, подходящее вашей системе. Одно из:

            -   `cuda-18` - для NVIDIA
            -   `opencl-18` - для AMD

            По умолчанию `cuda-18`

        -   `-F --boost <boost-factors>`: Список, через запятую, бустфакторов из
            [pow-miner-gpu](https://github.com/tontechio/pow-miner-gpu/blob/main/crypto/util/pow-miner-howto.md).
            Если передать одно число, оно будет применено ко всем GPU в `--gpus`. Для индивидуальной настройки каждого
            GPU вы должны перечислить бустфакторы в том же порядке, что в `--gpus` параметре. По умолчанию `512` для
            CUDA и `64` для OpenCL. Примеры:

            -   `-g 0,1,2 -F 64,32,512`
            -   `-g 0,1,2 -F 512`

        -   `-g, --gpus <ids>`: Список, через запятую, идентификаторов GPU девайсов, которые должны использоваться
            майнером. По умолчанию `0`. Пример: `--gpus 0,3,4`
        -   `-r, --rig`: Под каким именем будет видна статистика этого клиента на [toncoinpool.io](https://toncoinpool.io).
            По умолчанию `default`
