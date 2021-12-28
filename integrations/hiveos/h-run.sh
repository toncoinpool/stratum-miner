#!/bin/bash

TONPOOL_HIVE_CONF="/hive/miners/custom/TON_Stratum_Miner_HiveOS/config/hive-config.json"
TONPOOL_EXECUTABLE="/hive/miners/custom/TON_Stratum_Miner_HiveOS/TON-Stratum-Miner"

if [[ ! -f "$TONPOOL_HIVE_CONF" || ! -s "$TONPOOL_HIVE_CONF" ]]; then
    echo "$TONPOOL_HIVE_CONF does not exist or empty. Please reinstall miner."
    exit 1
fi

TONPOOL_BIN=$(jq -r ".bin" $TONPOOL_HIVE_CONF)
TONPOOL_BOOST=$(jq -r ".boost" $TONPOOL_HIVE_CONF)
TONPOOL_EXCLUDE_GPUS=$(jq -r ".excludeGPUs" $TONPOOL_HIVE_CONF)
TONPOOL_RIGNAME=$(jq -r ".rig" $TONPOOL_HIVE_CONF)
WALLET_ADR=$(jq -r ".wallet" $TONPOOL_HIVE_CONF)

source "/hive/miners/custom/TON_Stratum_Miner_HiveOS/h-manifest.conf"

CUSTOM_LOG_BASEDIR=`dirname "$CUSTOM_LOG_BASENAME"`
[[ ! -d $CUSTOM_LOG_BASEDIR ]] && mkdir -p $CUSTOM_LOG_BASEDIR

$TONPOOL_EXECUTABLE \
    --integration hiveos \
    -w ${WALLET_ADR:-""} \
    -b ${TONPOOL_BIN:-""} \
    -F ${TONPOOL_BOOST:-""} \
    --exclude-gpus ${TONPOOL_EXCLUDE_GPUS:-""} \
    -r ${TONPOOL_RIGNAME:-""} \
    2>&1 | tee --append $CUSTOM_LOG_BASENAME.log
