#!/bin/bash

# originally copied from https://github.com/tontechio/pow-miner-gpu-hiveos

cd `dirname $0`

# READ ENVS FROM FILE
set -o allexport
source $WALLET_CONF
set +o allexport

# parse "Miner extra config"
IFS="="; while read -r key value; do
    # remove spaces and quotes
    key=${key//[ \'\"]/""}
    value=${value//[ \'\"]/""}
    declare $key=$value
done < <(echo "$CUSTOM_USER_CONFIG")

TONPOOL_BIN=${TONPOOL_BIN:-"pow-miner-cuda-ubuntu-18"}

#-------------------------------------------------------------------------
# READ GPU STATS FROM HIVE OS
#-------------------------------------------------------------------------
GPU_STATS_JSON=`cat $GPU_STATS_JSON`

# fill some arrays from gpu-stats
temps=(`echo "$GPU_STATS_JSON" | jq -r ".temp[]"`)
fans=(`echo "$GPU_STATS_JSON" | jq -r ".fan[]"`)
powers=(`echo "$GPU_STATS_JSON" | jq -r ".power[]"`)
busids=(`echo "$GPU_STATS_JSON" | jq -r ".busids[]"`)
brands=(`echo "$GPU_STATS_JSON" | jq -r ".brand[]"`)
indexes=()

# filter arrays by $TONPOOL_BIN
cnt=${#busids[@]}
for (( i=0; i < $cnt; i++)); do
	if [[ "${brands[$i]}" == "nvidia" && "$TONPOOL_BIN" == "pow-miner-cuda-ubuntu-18" ]]; then
	  indexes+=($i)
	  continue
	elif [[ "${brands[$i]}" == "amd" &&  "$TONPOOL_BIN" == "pow-miner-opencl-ubuntu-18" ]]; then
	  indexes+=($i)
	  continue
	else # remove arrays data
		unset temps[$i]
		unset fans[$i]
		unset powers[$i]
		unset busids[$i]
		unset brands[$i]
	fi
done

STATUS_TEMP=()
STATUS_FAN=()
STATUS_BUS_NUMBERS=()

for (( i=0; i < ${#indexes[@]}; i++)); do
    BUS_NUMER_HEX=$(echo ${busids[${indexes[$i]}]:0:2} | tr "a-z" "A-Z")
    BUS_NUMBER=$(echo "obase=10; ibase=16; $BUS_NUMER_HEX" | bc)

    STATUS_BUS_NUMBERS+=($BUS_NUMBER)
    STATUS_TEMP+=(${temps[${indexes[$i]}]})
    STATUS_FAN+=(${fans[${indexes[$i]}]})
done

#-------------------------------------------------------------------------
# READ CLIENT STATS
#-------------------------------------------------------------------------

# get absolute path(for error log)
TONPOOL_STATS_JSON="$(cd "$(dirname "./data/stats.json")"; pwd)/$(basename "./data/stats.json")"

if test -f $TONPOOL_STATS_JSON; then
    ar=$(jq -r ".ar" $TONPOOL_STATS_JSON)
    hs=$(jq -r ".hs" $TONPOOL_STATS_JSON)
    khs=$(jq -r ".khs" $TONPOOL_STATS_JSON)
    uptime=$(jq -r ".uptime" $TONPOOL_STATS_JSON)
else
    echo "$TONPOOL_STATS_JSON does not exist"
    ar="[]"
    hs="[]"
    khs=0
    uptime=0
fi

#-------------------------------------------------------------------------
# COLLECT
#-------------------------------------------------------------------------

temp=$(echo "${STATUS_TEMP[@]}" | jq -s '.')
fan=$(echo "${STATUS_FAN[@]}" | jq -s '.')
bus_numbers=$(echo "${STATUS_BUS_NUMBERS[@]}" | jq -s '.')

source h-manifest.conf

stats=$(
    jq -n \
        --argjson hs "$hs" \
        --argjson temp "$temp" \
        --argjson fan "$fan" \
        --argjson uptime "$uptime" \
        --arg ver "$CUSTOM_VERSION" \
        --argjson bus_numbers "$bus_numbers" \
        --argjson ar "$ar" \
        '{"hs": $hs, "hs_units": "mhs", "temp": $temp, "fan": $fan, "uptime": $uptime, "ver": $ver, "ar": $ar, "bus_numbers": $bus_numbers}' <<< "$stats_raw"
)

[[ -z $khs ]] && khs=0
[[ -z $stats ]] && stats="null"
