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
