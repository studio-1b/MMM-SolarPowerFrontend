#!/bin/bash

NOW=$1
if [ "$NOW" == "" ]; then
  NOW=$(date +%y%m%d_%H%M%S)
fi

# clone
# https://github.com/cyrils/renogy-bt.git
# pip install -r requirements. txt
# renogybattery.ini, was from config.ini and modified for needed parameters
# modify example.py as needed

python3.7 -u example.py renogybattery.ini  2>/dev/null > renogy$NOW.json


echo renogy finished $(date), started $NOW

# output looks like
#{
#  "function": "READ",
#  "cell_count": 4,
#  "cell_voltage_0": 3.2,
#  "cell_voltage_1": 3.2,
#  "cell_voltage_2": 3.2,
#  "cell_voltage_3": 3.2,
#  "sensor_count": 2,
#  "temperature_0": 13,
#  "temperature_1": 15,
#  "current": -2,
#  "voltage": 12.9,
#  "remaining_charge": 15.6,
#  "capacity": 20,
#  "model": "XXXXXXXXXXX-BT",
#  "__device": "BT-XX-00000000",
#  "__client": "BatteryClient",
#}

# https://stackoverflow.com/questions/19529688/how-to-merge-2-json-objects-from-2-files-using-jq
# you can try to merge with another json, BUT it is a dumb merge AND does not have mechanism of merging on keys of 2 separate list of files
#   cat file1.json file2.json | jq -s add
# so you might as well create a join mechanism yourself, and create {json1:<file1 content>, json2:<file2 content>} and use jq to shape into desire output
