# Utility functions to convert data
# location data from CSV to JSON format.
# @author cesarpalomo@gmail.com Cesar Palomo

# Expected input:
# 1st line: min_timestamp, max_timestamp,
# Then... timestamp, lat, lng

import csv
import json
import math
import os
import sys

class DataConverter:


  # Outputs object/array to a json file.
  def outputToCSV(self, data, output_file):
    output_file = output_file
    print 'Saving ', output_file
 
    with open(output_file, 'wb') as csv_file:
      csv_writer = csv.writer(csv_file)
      for d in data:
        csv_writer.writerow(d)


  # Outputs object/array to a json file.
  def outputToJson(self, data, output_file):
    output_file = output_file
    print 'Saving ', output_file
    f = open(output_file, 'w')
    f.write(json.dumps(data, \
                     indent = 2, \
                     separators = (',', ': ')))
    f.close()


  # Given a timestamp, returns the bucket index containing it.
  def getBucketIndex(self, ts, tsinitial, bucketsize):
    return int(math.floor((int(ts) - tsinitial) / bucketsize))


  # Iterates over filtered files and creates buckets per time for fast access.
  def outputBucketsForFilesInFolder(self, inputpath, outputpath, bucketsize):

    inputfile = open(inputpath)

    ts_initial = int(inputfile.readline())
    ts_final = int(inputfile.readline())

    print ts_initial, ts_final

    bucketcount = (ts_final - ts_initial) / bucketsize

    if bucketcount == 0:
      bucketcount = 1

    buckets = [[] for i in range(bucketcount)]

    csv_reader = csv.reader(inputfile)

    numpoints = 0
    minlat = float('inf')
    maxlat = -float('inf')
    minlng = float('inf')
    maxlng = -float('inf')

    # Points: ts(0), lat(1), lon(2), value(3)
    for point in csv_reader:
      ts = int(point[0])
      lat = float(point[1])
      lng = float(point[2])
      value = 1

      if(len(point) > 3):
        #print 'a'
        value = float(point[3])

      # Updates min/max
      minlat = min(minlat, lat)
      maxlat = max(maxlat, lat)
      minlng = min(minlng, lng)
      maxlng = max(maxlng, lng)

      bucket_index = self.getBucketIndex(ts, ts_initial, bucketsize)
      buckets[bucket_index].append(point)
      numpoints+=1

    # Outputs buckets to file.
    for bucket_index in range(bucketcount):
      output_filename = outputpath + str(bucket_index) + '.csv'
      print output_filename
      self.outputToCSV(buckets[bucket_index], output_filename)

    #info file
    # numpoints
    # bucketcount
    # bucketsize
    # tsmin
    # tsmax
    # latmin
    # latmax
    # lngmin
    # lngmax
    infofile = open(outputpath+'info.txt', 'w')
    infofile.write('numpoints: '+str(numpoints)+'\n')
    infofile.write('bucketcount: '+str(bucketcount)+'\n')
    infofile.write('bucketsize: '+str(bucketsize)+'\n')
    infofile.write('tsmin: '+str(ts_initial)+'\n')
    infofile.write('tsmax: '+str(ts_final)+'\n')
    infofile.write('latmin: '+str(minlat)+'\n')
    infofile.write('latmax: '+str(maxlat)+'\n')
    infofile.write('lngmin: '+str(minlng)+'\n')
    infofile.write('lngmax: '+str(maxlng)+'\n')
    infofile.close()


# Main
if __name__ == "__main__":

  print 'Usage: inputpath outputpath bucketsize'
  if(len(sys.argv) < 4):
    exit()

  inputpath = sys.argv[1]
  outputpath = sys.argv[2]
  bucketsize = int(sys.argv[3])

  converter = DataConverter()
  converter.outputBucketsForFilesInFolder(inputpath, outputpath, bucketsize)

  print 'finished'
