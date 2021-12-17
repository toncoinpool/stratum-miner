#!/bin/bash

cd `dirname $0`

# READ ENVS FROM FILE
set -o allexport
source $WALLET_CONF
set +o allexport

# %WAL% in "Wallet and worker template "
WALLET_ADR=$CUSTOM_TEMPLATE

if [[ -z "$WALLET_ADR" ]]; then
    echo "Wallet was not set or was set incorrectly"
    exit 1
fi

chmod +x ./h-run.sh

exit 0
