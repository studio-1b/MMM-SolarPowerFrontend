#!/bin/bash
NOW=$1
if [ "$NOW" == "" ]; then
  NOW=$(date +%y%m%d_%H%M%S)
fi

# instructions below
# https://github.com/keshavdv/victron-ble
# but all you need to do is : pip3 install victron-ble
# the software is installed but you dont have the key
#   instructions in website to obtain key, by installing a VistronApp
#   then once connected thru the app, there are instructions to extracting the key from app with sqlite3

# NOTE: software needs a fairly recent version of python, that has DBUS support

victron-ble read "<bluetooth MAC of Solar>@<key value>" 2>/dev/null > victron$NOW.json


echo victron finished $(date), started $NOW

# output looks like
#{
#  "name": "SmartXXXXX XXXXXXXXXXX",
#  "address": "DA:00:00:00:00:00",
#  "rssi": -91,
#  "payload": {
#    "battery_charging_current": 1.1,
#    "battery_voltage": 13.13,
#    "charge_state": "bulk",
#    "external_device_load": 0.0,
#    "model_name": "SmartXXXX MPPT XXX|XX",
#    "solar_power": 17,
#    "yield_today": 120
#  }
#}

# https://stackoverflow.com/questions/19529688/how-to-merge-2-json-objects-from-2-files-using-jq
# you can try to merge with another json, BUT it is a dumb merge AND does not have mechanism of merging on keys of 2 separate list of files
#   cat file1.json file2.json | jq -s add
# so you might as well create a join mechanism yourself, and create {json1:<file1 content>, json2:<file2 content>} and use jq to shape into desire output
