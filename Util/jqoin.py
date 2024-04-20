#!/usr/bin/env python3

import sys
import os
from os import isatty
import glob
from datetime import datetime
#from itertools import chain
import string

# Python program to read
# json file
 
import json

compared = {"1","2"}
debug = False

def get_json(filename):
    # buffer = bytearray()
    # if the json file gets big, you might want to read in 4k chunks
    # and stop when it hits a closing token

    # Opening JSON file
    f = open(filename,'r')
    buffer = f.read()
    # Closing file
    f.close()

    # this version, loeds entire small JSON file into memory
    i = 0
    start = -1
    end = -1
    incre = None
    decre = None
    count = 0
    for ch in buffer:
      if count!=0:
        if ch==incre:
          count+=1
        elif ch==decre:
          count-=1
          if count<=0:
            end = i
            break
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
          raise Exception("Runtime error.  More than 1 start condition for JSON detected")
      i+=1
    if count!=0:
      sys.stderr.write(buffer)
      sys.stderr.write("\n")
      raise Exception("Runtime error.  This might not be a json")

    # returns JSON object as 
    # a dictionary
    data = json.loads(buffer[start:end+1])

    return data


def get_stdin():
    # buffer = bytearray()
    # if the json file gets big, you might want to read in 4k chunks
    # and stop when it hits a closing token

    # READS from stdin
    # this version, loeds entire small JSON file into memory
    i = 0
    start = -1
    end = -1
    incre = None
    decre = None
    count = 0
    buffer = []
    stdin1 = sys.stdin.read(1)
    while len(stdin1)!=0:
      ch = stdin1[0]
      buffer.append(ch)
      if count!=0:
        if ch==incre:
          count+=1
        elif ch==decre:
          count-=1
          if count<=0:
            end = i
            # returns JSON object as 
            # a dictionary
            data = json.loads( "".join(buffer[start:end+1]) )
            yield data
            # break
            buffer = []
            start = -1
            end = -1
            i = -1
            decre=None
            incre=None
      elif start==-1 and (ch=='{' or ch=='[') :
        start = i
        count = 1
        if ch=='{':
          incre='{'
          decre='}'
        elif ch=='[':
          incre='['
          decre=']'
      elif start==-1 and (ch=='\n' or ch=='\r' or ch=='\t' or ch==' ') :
        pass # skip whitespace
      else:
          raise Exception("Runtime error.  More than 1 start condition for JSON detected")
      i+=1
      stdin1 = sys.stdin.read(1)

    if count!=0:
      sys.stderr.write(buffer)
      sys.stderr.write("\n")
      raise Exception("Runtime error.  This might not be a json")


def join_pair(block1, block2):
    list2 = list(block2)  # turning iterator into list, for the version that reads several times
    for a in block1:
        keyA = a["key"]
        if (a["value"]!=None) and (keyA!=None):
            for b in list2:   # block2:
                if debug:
                    hashed = a["value"]["filename"]+"|"+b["value"]["filename"]
                    if hashed in compared:
                        print("already compared")
                        print(hashed)
                        raise Exception("Assert failed. ")
                    compared.add(hashed)
                keyB = b["key"]
                if (b["value"]!=None) and (keyB!=None):
                    #print("comparing",keyA,keyB)
                    if keyA==keyB:
                        yield {"key":keyA, "a": a["value"], "b": b["value"]}

def join_iterator(dict1, generator2):
    alias = None
    for b in generator2:
        keyB = b["key"]
        if (b["value"]!=None) and (keyB!=None):
            if keyB in dict1:
            #for b in list1:   # block2:
                if debug:
                    hashed = a["value"]["filename"]+"|"+b["value"]["filename"]
                    if hashed in compared:
                        print("already compared")
                        print(hashed)
                        raise Exception("Assert failed. ")
                    compared.add(hashed)
                a = dict1[keyB]
                keyA = a["key"]
                if (b!=None):
                    valueB = b["value"]
                    #value["filename"]=="stdin"
                    #value["json"]["key"]
                    if ("filename" in valueB) and (valueB["filename"]=="stdin") and ("json" in valueB) and ("key" in valueB["json"]) and (valueB["json"]["key"]==keyA) and ("a" in valueB["json"]) and ("b" in valueB["json"]):
                        if alias==None:
                            for ch in list(string.ascii_lowercase[2:]):
                                if not ch in dict1:
                                    alias = ch
                                    break;
                        copyB = valueB["json"].copy()
                        copyB[alias] = a["value"]
                        yield copyB
                    else:
                        yield {"key":keyA, "a": a["value"], "b": b["value"]}

def join_jagged(list1, list2):
    i = 0
    j = 0
    len1 = len(list1)
    len2 = len(list2)
    if len1==0 or len2==0:
        exit(1)
    item1 = list1[0]
    item2 = list2[0]
    key1 = item1["key"]
    key2 = item2["key"]
    while (i<len1) and (j<len2):
        di = False
        dj = False
        if key1 == key2:
            ii = i
            while (i<len1) and list1[i]["key"]==key1:
                i+=1
            jj = j
            while (j<len2) and list2[j]["key"]==key2:
                j+=1
            #print(json.dumps({"key":key1, "a": item1["value"], "b": item2["value"]})
            for iii in range(ii,i):
                for jjj in range(jj,j):
                    #print(json.dumps( {"key":key1, "a": list1[iii]["value"], "b": list2[jjj]["value"]} ))
                    yield {"key":key1, "a": list1[iii]["value"], "b": list2[jjj]["value"]}
            di = True
            dj = True
        if key1 < key2:
            i+=1
            di = True
        if key1 > key2:
            j+=1
            dj = True
        if di:
            if i<len1:
                item1 = list1[i]
                key1 = item1["key"]
            else:
                item1 = None
                key1 = None
        if dj:
            if j<len2:
                item2 = list2[j]
                key2 = item2["key"]
            else:
                item2 = None
                key2 = None


def get_key(s,o):
    nesting = s.split('.')
    nestlevels = len(nesting)
    if nestlevels==1:
       s = nesting[0]
    elif nesting[0]=="":   # len(nesting)==0 is impossible, so after prev if, nestlevels>1
       if nestlevels>2:
          headkey = nesting[1]
          tailkey = ".".join(nesting)[1:]
          return get_key(tailkey,o[headkey])
       else:  # nestlevels==2
          s = "." + nesting[1]
    fn = s.split(':')
    joinkeyfield = fn[0]
    start = int(fn[1]) if len(fn)>=2 else 0
    end = int(fn[2]) if len(fn)>=3 else None
    # ??? step = int(fn[3]) if len(fn)>=4 else 1
    if joinkeyfield.startswith('filename'):
       return o['filename'][start:end]
    elif joinkeyfield.startswith('.'):
       joinkeyname = joinkeyfield[1:]
       if joinkeyname in o["json"]:
         # ie. now : 2024/03/31 15:10:
         #           12345678901234567
         #print( o["json"][joinkeyname][start:end] )
         if end==None:
           return o["json"][joinkeyname][start:]
         else:
           return o["json"][joinkeyname][start:end]
       else:
         sys.stderr.write("Cannot find .")
         sys.stderr.write(joinkeyname)
         sys.stderr.write(" in ")
         sys.stderr.write(o['filename'])
         sys.stderr.write("\n")
         sys.stderr.write(json.dumps(o['json']))
         sys.stderr.write("\n")
         return None
    else:
       return None

def get_avg_size(file_list):
    count = len(file_list)
    sum = 0
    for file_name in file_list:
        file_stats = os.stat(file_name)
        # print(file_stats)
        # print(f'File Size in Bytes is {file_stats.st_size}')
        sum += file_stats.st_size
    return round(sum / count);


# level 1 (L1) cache of 16 KB 
# and a level 2 (L2) cache of 128 KB
L1 = 16000
L2 = 128000

if len(sys.argv) < 2:
  print("Usage: jqoin.py [dir1] [key1] [dir2] [key2] ")
  print("Usage: jqoin.py [dir1] [key1] --key=[key for stdin] ")
  exit(1)

L = len(sys.argv)
name1 = sys.argv[1]
key1 = sys.argv[2]
name2 = sys.argv[3] if L>4 else None;
key2 = sys.argv[4]  if L>4 else None;
stdn_key = sys.argv[3][6:] if L>3 and sys.argv[3][:6]=="--key=" else None;

#print(datetime.now(),name1,key1,name2,key2)

dir1 = name1 if os.path.isdir(name1) else os.path.dirname(name1)
pattern1 = None if name1==dir1 else os.path.basename(name1)
pass1 = os.path.isdir(dir1)
files1 = None
if debug:
    sys.stderr.write(datetime.now(),pattern1,dir1,pass1)
    sys.stderr.write("\n")
if pattern1==None:
    #print("list "+dir1)
    files1 = os.listdir(dir1)
    full1 = list(map(lambda s: dir1 + "/" + s, files1))
else:
    #print("search "+name1)
    full1  = glob.glob(name1)
    files1 = list(map(lambda s: os.path.basename(s), full1))

dir2 = None
pattern2 = None
pass2 = None
files2 = None
if L==5:
    dir2 = name2 if os.path.isdir(name2) else os.path.dirname(name2)
    pattern2 = None if name2==dir2 else os.path.basename(name2)
    pass2 = os.path.isdir(dir2)
    files2 = None
    if debug:
        sys.stderr.write(datetime.now(),pattern2,dir2,pass2)
        sys.stderr.write("\n")
    if pattern2==None:
        #print("list "+ dir2)
        files2 = os.listdir(dir2)
        full2 = list(map(lambda s: dir2 + "/" + s, files2))
    else:
        #print("search" + name2)
        full2  = glob.glob(name2)
        files2 = list(map(lambda s: os.path.basename(s), full2))
    if debug:
        sys.stderr.write(datetime.now())
        sys.stderr.write("\n")

# there is no way to tell if there is no duplicate keys w/o loading all the files
#dupe1 = len(set(map(lambda s:key1,files1))) == len(files1)
#dupe2 = len(set(map(lambda s:key2,files2))) == len(files2)
# except if they keys is part of filename (why database index helps)
if key1.startswith("filename") and key2.startswith("filename"):
    #set1 = set(map(lambda s:get_filekey(s,key1),files1))
    #set2 = set(map(lambda s:get_filekey(s,key2),files2))
    #unique1 = len(set1) == len(files1)
    #unique2 = len(set2) == len(files2)
    d1 = dict(map(lambda s: (get_key(key1,{"filename":s}),s) ,files1))
    d2 = dict(map(lambda s: (get_key(key2,{"filename":s}),s) ,files2))
    unique1 = len(d1) == len(files1)
    unique2 = len(d2) == len(files2)
    if debug:
        sys.stderr.write("{0} {1} {2}".format(datetime.now(),unique1, unique2))
        sys.stderr.write("\n")
    if unique1 and unique2:
        # this branch assume there is 1:1 join, based on filename
        if debug:
            sys.stderr.write("intersection \n")
        set1 = set(d1)
        set2 = set(d2)
        common = set1.intersection(set2);

        #value1 = map(lambda s: {"filename":d1[s], "json":dir1 + "/" + d1[s]}, common)
        #keys1 = map(lambda s: {"key": s, "value":{"filename":d1[s], "json":dir1 + "/" + d1[s]}, common)
        #filtered1 = filter(lambda s: s["key"]!=None, keys1)
        #list1 = list(filtered1)
        #list1.sort(key=lambda s:s["key"])

        if debug:
            sys.stderr.write("sorting all")

        #value2 = map(lambda s: {"filename":d2[s], "json":dir2 + "/" + d2[s]}, common)
        #keys2 = map(lambda s: {"key": s, "value":{"filename":d2[s], "json":dir2 + "/" + d2[s]}}, common)
        #filtered2 = filter(lambda s: s["key"]!=None, keys2)
        #list2 = list(filtered2)
        #list2.sort(key=lambda s:s["key"])

        keys = map(lambda s: {"key": s, "a":{"filename":d1[s], "json":dir1 + "/" + d1[s]}, "b":{"filename":d2[s], "json":dir2 + "/" + d2[s]}}, common)
        filtered = filter(lambda s: s["key"]!=None, keys)
        lst = list(filtered)
        lst.sort(key=lambda s:s["key"])

        for item in lst:
            fileA = item["a"]["json"];
            fileB = item["b"]["json"];
            itemA = get_json(fileA)
            itemB = get_json(fileB)
            if itemA!=None and itemB!=None:
                item["a"]["json"] = itemA
                item["b"]["json"] = itemB
                print( json.dumps(item) )
                sys.stdout.flush() 
        #for item in join_jagged(list1, list2):
        #    print( json.dumps(item) )

        # sys.stderr.write("File index join Not finished yet")
        # sys.stderr.write("\n")
        exit(0)

# this branch loads the files into memory, processes joins
is_pipe = not isatty(sys.stdin.fileno())
if is_pipe:
    if debug:
        sys.stderr.write("sorting " + name1)
    value1 = map(lambda s: {"filename":s, "json":get_json(s)}, full1)
    keys1 = map(lambda s: {"key": get_key(key1,s), "value":s}, value1)
    filtered1 = filter(lambda s: s["key"]!=None, keys1)
    #list1 = list(filtered1)
    #list1.sort(key=lambda s:s["key"])
    dict1 = dict(map(lambda s:(s["key"],s), filtered1))

    if debug:
        sys.stderr.write("sorting " + name2)
    key = ".key" if stdn_key==None else stdn_key
    value2 = map(lambda s: {"filename":"stdin", "json":s}, get_stdin())
    keys2 = map(lambda s: {"key": get_key(key,s), "value":s}, value2)
    filtered2 = filter(lambda s: s["key"]!=None, keys2)
    # list2.sort(key=lambda s:s["key"])
    gen2 = filtered2

    if debug:
        sys.stderr.write("joining")

    for item in join_iterator(dict1, gen2):
        print( json.dumps(item) )
        sys.stdout.flush() 

    exit(0)

# this branch loads every json into memory and hopes it doesnt crash
if True:
    if debug:
        sys.stderr.write("sorting " + name1)
    value1 = map(lambda s: {"filename":s, "json":get_json(s)}, full1)
    keys1 = map(lambda s: {"key": get_key(key1,s), "value":s}, value1)
    filtered1 = filter(lambda s: s["key"]!=None, keys1)
    list1 = list(filtered1)
    list1.sort(key=lambda s:s["key"])

    if debug:
        sys.stderr.write("sorting " + name2)
    value2 = map(lambda s: {"filename":s, "json":get_json(s)}, full2)
    keys2 = map(lambda s: {"key": get_key(key2,s), "value":s}, value2)
    filtered2 = filter(lambda s: s["key"]!=None, keys2)
    list2 = list(filtered2)
    list2.sort(key=lambda s:s["key"])

    if debug:
        sys.stderr.write("joining")

    for item in join_jagged(list1, list2):
        print( json.dumps(item) )
        sys.stdout.flush() 

    exit(0)

# this code will have to run
# if anyone writes it
# that above will check the flag
# it will read the files for keys, and only keep filename
# complete the join based on key
# then re-read the json, to recreate the new json to output
# this should use less memory

# ...

exit(1)

