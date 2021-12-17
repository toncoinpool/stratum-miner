#!/bin/bash

cd `dirname $0`

# READ ENVS FROM FILE
set -o allexport
source $WALLET_CONF
set +o allexport

source h-manifest.conf

CUSTOM_LOG_BASEDIR=`dirname "$CUSTOM_LOG_BASENAME"`
[[ ! -d $CUSTOM_LOG_BASEDIR ]] && mkdir -p $CUSTOM_LOG_BASEDIR

# %WAL% in "Wallet and worker template "
WALLET_ADR=$CUSTOM_TEMPLATE

# parse "Miner extra config"
IFS="="; while read -r key value; do
    # remove spaces and quotes
    key=${key//[ \'\"]/""}
    value=${value//[ \'\"]/""}
    declare $key=$value
done < <(echo "$CUSTOM_USER_CONFIG")

echo $(date +%s) > ./data/started

export TONPOOL_IS_IN_HIVE=1

./TON-Stratum-Miner \
    -w $WALLET_ADR \
    -b ${TONPOOL_BIN:-"pow-miner-cuda-ubuntu-18"} \
    -g ${TONPOOL_GPUS:-"0"} \
    -r ${TONPOOL_RIGNAME:-"default"} \
    >> $CUSTOM_LOG_BASENAME.log 2>&1
