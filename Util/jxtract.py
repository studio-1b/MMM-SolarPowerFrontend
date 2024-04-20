#!/usr/bin/env python3

import sys
import os
import glob
from datetime import datetime
from itertools import chain

# Python program to read
# json file
 
import json

compared = {"1","2"}
debug = False

def get_json(filename):
  i = 0
  start = -1
  end = -1
  incre = None
  decre = None
  count = 0
  # buffer = bytearray()
  # if the json file gets big, you might want to read in 4k chunks
  # and stop when it hits a closing token

  # Opening JSON file
  BUFFER_SIZE = 64000
  f = open(filename,'r')
  buffer = f.read(BUFFER_SIZE)
  while len(buffer)!=0:
    # this version, loads entire small JSON file into memory
    for ch in buffer:
      if count!=0:
        if ch==incre:
          count+=1
        elif ch==decre:
          count-=1
          if count<=0:
            end = i
            # returns JSON object as 
            # a dictionary
            try:
              data = json.loads(buffer[start:end+1])
              yield data
            catch:
              pass
            finally:
              start = -1
            # break
      elif start==-1 and (ch=='{' or ch=='[') :
        start = i
        count = 1
        if ch=='{':
          incre='{'
          decre='}'
        elif ch=='[':
          incre='['
          decre=']'
      else:
        raise Exception("Runtime error.  start condition not reset")
      i+=1
    buffer = f.read(BUFFER_SIZE)
    # i is in wrong loop
    # the slice is useless unless it is all in same buffer
  # Closing file
  f.close()

#    if count!=0:
#      sys.stderr.write(buffer)
#      sys.stderr.write("\n")
#      raise Exception("Runtime error.  This might not be a json")





if len(sys.argv) < 2:
    print("Usage: jxtract.py [filename]")
    exit(1)

file = sys.argv[1]




for item in get_json(file):
    print( json.dumps(item) )

exit(0)

