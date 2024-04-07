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
