#!/bin/bash

# originally copied from https://github.com/tontechio/pow-miner-gpu-hiveos

cd `dirname $0`

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

# filter arrays by $TYPE
cnt=${#busids[@]}
for (( i=0; i < $cnt; i++)); do
	if [[ "${brands[$i]}" == "nvidia" && "$TYPE" == "cuda" ]]; then
	  indexes+=($i)
	  continue
	elif [[ "${brands[$i]}" == "amd" &&  "$TYPE" == "opencl" ]]; then
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

#-------------------------------------------------------------------------
# READ MINER STAT
#-------------------------------------------------------------------------

STATUS_HS=()
STATUS_TEMP=()
STATUS_FAN=()
STATUS_BUS_NUMBERS=()

for (( i=0; i < ${#indexes[@]}; i++)); do
    #echo "GPU ID $i ${busids[${indexes[$i]}]}"
    BUS_NUMER_HEX=$(echo ${busids[${indexes[$i]}]:0:2} | tr "a-z" "A-Z")
    BUS_NUMBER=$(echo "obase=10; ibase=16; $BUS_NUMER_HEX" | bc)

    STATUS_BUS_NUMBERS+=($BUS_NUMBER)
    STATUS_TEMP+=(${temps[${indexes[$i]}]})
    STATUS_FAN+=(${fans[${indexes[$i]}]})

    # fixed hashrate of 1 for each gpu
    STATUS_HS+=(1)
done

#-------------------------------------------------------------------------
# COLLECT
#-------------------------------------------------------------------------

khs=42
hs=$(echo "${STATUS_HS[@]}" | jq -s '.')
temp=$(echo "${STATUS_TEMP[@]}" | jq -s '.')
fan=$(echo "${STATUS_FAN[@]}" | jq -s '.')
bus_numbers=$(echo "${STATUS_BUS_NUMBERS[@]}" | jq -s '.')

started=$(cat ./data/started)
timestamp=$(date +%s)
uptime=$((timestamp - started))

source h-manifest.conf

stats=$(
  jq -n \
    --argjson hs "$hs" \
    --argjson temp "$temp" \
    --argjson fan "$fan" \
    --arg uptime "$uptime" \
    --arg ver "$CUSTOM_VERSION" \
    --argjson bus_numbers "$bus_numbers" \
    '{"hs": $hs, "hs_units": "mhs", "temp": $temp, "fan": $fan, "uptime": $uptime, "ver": $ver, "bus_numbers":$bus_numbers}' <<<"$stats_raw"
)

[[ -z $khs ]] && khs=0
[[ -z $stats ]] && stats="null"
