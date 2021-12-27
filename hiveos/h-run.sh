#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
TONPOOL_HIVE_CONF="$SCRIPT_DIR/config/hive-config.json"
TONPOOL_EXECUTABLE="$SCRIPT_DIR/TON-Stratum-Miner"

if [[ ! -f "$TONPOOL_HIVE_CONF" || ! -s "$TONPOOL_HIVE_CONF" ]]; then
    echo "$TONPOOL_HIVE_CONF does not exist or empty. Please reinstall miner."
    exit 1
fi

TONPOOL_BIN=$(jq -r ".bin" $TONPOOL_HIVE_CONF)
TONPOOL_BOOST=$(jq -r ".boost" $TONPOOL_HIVE_CONF)
TONPOOL_EXCLUDE_GPUS=$(jq -r ".excludeGPUs" $TONPOOL_HIVE_CONF)
TONPOOL_RIGNAME=$(jq -r ".rig" $TONPOOL_HIVE_CONF)
WALLET_ADR=$(jq -r ".wallet" $TONPOOL_HIVE_CONF)

source h-manifest.conf

CUSTOM_LOG_BASEDIR=`dirname "$CUSTOM_LOG_BASENAME"`
[[ ! -d $CUSTOM_LOG_BASEDIR ]] && mkdir -p $CUSTOM_LOG_BASEDIR

$TONPOOL_EXECUTABLE \
    "--integration hiveos" \
    ${WALLET_ADR:+"-w $WALLET_ADR"} \
    ${TONPOOL_BIN:+"-b $TONPOOL_BIN"} \
    ${TONPOOL_BOOST:+"-F $TONPOOL_BOOST"} \
    ${TONPOOL_EXCLUDE_GPUS:+"--exclude-gpus $TONPOOL_EXCLUDE_GPUS"} \
    ${TONPOOL_RIGNAME:+"-r $TONPOOL_RIGNAME"} \
    2>&1 | tee --append $CUSTOM_LOG_BASENAME.log
