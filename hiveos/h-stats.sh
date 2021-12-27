#!/bin/bash

# originally copied from https://github.com/tontechio/pow-miner-gpu-hiveos

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
TONPOOL_HIVE_CONF="$SCRIPT_DIR/config/hive-config.json"
TONPOOL_STATS_JSON="$SCRIPT_DIR/data/stats.json"
TONPOOL_BIN=$(jq -r ".bin" $TONPOOL_HIVE_CONF)

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

# in TONPOOL_STATS_JSON gpus are sorted by CUDA first, then OpenCL
cnt=${#busids[@]}
for (( i=0; i < $cnt; i++)); do
    if [[ "${brands[$i]}" == "nvidia" && ( "$TONPOOL_BIN" == "cuda-18" || -z "$TONPOOL_BIN" ) ]]; then
        indexes+=($i)
    fi
done
for (( i=0; i < $cnt; i++)); do
    if [[ "${brands[$i]}" == "amd" && ( "$TONPOOL_BIN" == "opencl-18" || -z "$TONPOOL_BIN" ) ]]; then
        indexes+=($i)
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

source "$SCRIPT_DIR/h-manifest.conf"

stats=$(
    jq -n \
        --argjson hs "$hs" \
        --argjson temp "$temp" \
        --argjson fan "$fan" \
        --argjson uptime "$uptime" \
        --arg ver "$CUSTOM_VERSION" \
        --argjson bus_numbers "$bus_numbers" \
        --argjson ar "$ar" \
        '{"hs": $hs, "hs_units": "mhs", "temp": $temp, "fan": $fan, "uptime": $uptime, "ver": $ver, "ar": $ar, "bus_numbers": $bus_numbers}'
)

[[ -z $khs ]] && khs=0
[[ -z $stats ]] && stats="null"
