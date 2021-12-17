#!/bin/bash

# %WAL% in "Wallet and worker template "
WALLET_ADR=$CUSTOM_TEMPLATE

if [[ -z "$WALLET_ADR" ]]; then
    echo "Wallet was not set or was set incorrectly"
    exit 1
fi

exit 0
