#!/bin/bash

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
TONPOOL_HIVE_CONF="$SCRIPT_DIR/config/hive-config.json"

source $WALLET_CONF

# %WAL% in "Wallet and worker template "
WALLET_ADR=$CUSTOM_TEMPLATE

if [[ -z "$WALLET_ADR" ]]; then
    echo "Wallet was not set or was set incorrectly"
    exit 1
fi

# parse "Miner extra config"
IFS="="; while read -r key value; do
    # remove spaces and quotes
    key=${key//[ \'\"]/""}
    value=${value//[ \'\"]/""}
    declare $key=$value
done < <(echo "$CUSTOM_USER_CONFIG")

# set defaults
TONPOOL_BIN=${TONPOOL_BIN:-"cuda-18"}

if [[ "$TONPOOL_BIN" == "cuda-18" ]]; then
    TONPOOL_BOOST=${TONPOOL_BOOST:-"512"}
else
    TONPOOL_BOOST=${TONPOOL_BOOST:-"64"}
fi

TONPOOL_GPUS=${TONPOOL_GPUS:-"0"}
TONPOOL_RIGNAME=${TONPOOL_RIGNAME:-"default"}

TONPOOL_HIVE_CONF_JSON=$(
    jq -n \
        --arg bin "$TONPOOL_BIN" \
        --arg boost "$TONPOOL_BOOST" \
        --arg gpus "$TONPOOL_GPUS" \
        --arg rig "$TONPOOL_RIGNAME" \
        --arg wallet "$WALLET_ADR" \
        '{"bin":$bin, "boost":$boost, "gpus":$gpus, "rig":$rig, "wallet":$wallet}'
)

if [ $? -ne 0 ]; then
    echo "Invalid JSON string in Extra config arguments."
    exit 1
fi

echo $TONPOOL_HIVE_CONF_JSON | jq '.' > $TONPOOL_HIVE_CONF
