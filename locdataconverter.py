# Utility functions to convert mobile phones
# location data from CSV to JSON format.
# @author cesarpalomo@gmail.com Cesar Palomo

import csv
import json
import math
import os
import sys


BUCKET_SIZE = 10 * 60            # Data bucket size: 60 minutes.
BUCKET_TS_INITIAL = 1375142400   # Bucket zero Initial timestamp for date in the animation.
BUCKET_TS_FINAL = 1377993600     # Final timestamp in the animation.
# Number of data buckets.
BUCKET_COUNT = (BUCKET_TS_FINAL - BUCKET_TS_INITIAL) / BUCKET_SIZE

DATA_STATS_FILE = os.path.expanduser('~/xtifyData/points_stats.json')
IDS_SAMPLE_COUNT_FILE = os.path.expanduser('~/xtifyData/samples_per_bucket_of_10.json')
ORIGINAL_FILES_FOLDER = os.path.expanduser('~/xtifyData/original/')
FILTERED_FILES_FOLDER = os.path.expanduser('~/xtifyData/filtered/')
BUCKETS_FILES_FOLDER = os.path.expanduser('~/xtifyData/buckets/')

class LocationDataConverter:

  # Default constructor.
  def __init__(self):
    self.used_xids = dict()
    self.current_xid = 0

  # Converts xid to different number to make it smaller for output.
  def getXid(self, xid):
    if xid in self.used_xids:
      xid = self.used_xids[xid]
    else:
      self.used_xids[xid] = self.current_xid
      xid = self.current_xid
      self.current_xid += 1
    return xid


  # Reads mobile phones location data from a CSV file
  # and outputs only used fields.
  def filterUsedFields(self, input_csv_file):
    # id,sk,xid,ts,acc,prov,cts,long,lat
    csv_reader = csv.reader(open(input_csv_file))
    points = []
    current_xid = 0

    # Skips first line in file (headers).
    csv_reader.next()

    # Note: to save space, converts xid to smaller number and stores
    # ts in seconds rather than milliseconds.
    # Outputs xid(2), ts(3), acc(4), lat(8), lon(7)

    # Valid timestamps interval.
    MIN_VALID_TS = 1375142400
    MAX_VALID_TS = 1377993600
    for p in csv_reader:
      # Ignores invalid points.
      ts = int(p[3]) / 1000
      if ts > MIN_VALID_TS and ts < MAX_VALID_TS and len(p[4]) > 0:
        points.append([self.getXid(p[2]), ts, p[4], p[8], p[7]])
    return points


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


  # Iterates over original files and filter useful fields.
  def filterFilesInFolder(self, input_folder, output_folder):
    for filename in os.listdir(input_folder):
      points = self.filterUsedFields(input_folder + filename)
      self.outputToCSV(points, output_folder + filename)


  # Given a timestamp, returns the bucket index containing it.
  def getBucketIndex(self, ts):
    return int(math.floor((int(ts) - BUCKET_TS_INITIAL) / BUCKET_SIZE))


  # Iterates over filtered files and creates buckets per time for fast access.
  def outputBucketsForFilesInFolder(self, input_folder, output_folder):
    buckets = [[] for i in range(BUCKET_COUNT)]
    for input_filename in os.listdir(input_folder):
      print input_filename
      with open(input_folder + input_filename) as input_file:
        csv_reader = csv.reader(input_file)

        # Points: xid(0), ts(1), acc(2), lat(3), lon(4)
        for point in csv_reader:
          ts = int(point[1])
          bucket_index = self.getBucketIndex(ts)
          buckets[bucket_index].append(point)

    # Outputs buckets to file.
    for bucket_index in range(BUCKET_COUNT):
      output_filename = output_folder + str(bucket_index) + '.csv'
      self.outputToCSV(buckets[bucket_index], output_filename)


  # Outputs a Json with statistics of points: number of points.
  def createDataStatsJson(self, input_folder, output_file):
    data_stats = []
    for bucket_index in range(BUCKET_COUNT):
      current_ts = BUCKET_TS_INITIAL + bucket_index * BUCKET_SIZE
      filename = input_folder + str(bucket_index) + '.csv'
      print filename
      with open(filename) as input_file:
        csv_reader = csv.reader(input_file)

        numberOfPoints = 0
        for point in csv_reader:
          numberOfPoints += 1
      data_stats.append([current_ts, numberOfPoints])

    # Outputs to file.
    self.outputToJson(data_stats, output_file)


  # Outputs a Json with the number of samples per xid, in ascending order
  # of number of samples.
  def createIdsStatsJson(self, input_folder, output_file):
    samples_per_id = dict()
    max_number_of_samples = -sys.maxint

    for filename in os.listdir(input_folder):
      csv_reader = csv.reader(open(input_folder + filename))

      for point in csv_reader:
        xid = point[2]
        number_of_samples = samples_per_id.setdefault(xid, 0) + 1
        samples_per_id[xid] = number_of_samples
        max_number_of_samples = max(max_number_of_samples, number_of_samples)

    # Creates a bucketed list: stores how many users have
    # (BUCKET_N_SAMPLES_I, BUCKET_N_SAMPLES_I+1] samples.
    bucket_size = 10
    num_buckets = max_number_of_samples // bucket_size + 1
    buckets = [[bucket_i * bucket_size, 0] for bucket_i in range(num_buckets)]
    for xid, n in samples_per_id.iteritems():
      bucket_i = n // bucket_size
      num_entries = buckets[bucket_i][1] + 1
      buckets[bucket_i] = [bucket_i * bucket_size, num_entries]

    # Outputs to file.
    self.outputToJson(buckets, output_file)


  # Iterates over filtered files and outputs basic stats for each data file:
  # number of points and min/max timestamp.
  def showInfoForFilteredFiles(self, input_folder):
    general_min_ts = sys.maxint
    general_max_ts = -sys.maxint
    general_min_lat = float('inf')
    general_max_lat = -float('inf')
    general_min_lon = float('inf')
    general_max_lon = -float('inf')
    general_point_count = 0

    general_ids_count = 0
    xids_set = set()
    for filename in os.listdir(input_folder):
      csv_reader = csv.reader(open(input_folder + filename))

      file_min_ts = sys.maxint
      file_max_ts = -sys.maxint
      file_point_count = 0

      # Points: xid(0), ts(1), acc(2), lat(3), lon(4)
      for p in csv_reader:
        # Updates min/max and updates points count for file.
        file_point_count += 1
        timestamp = int(p[1])
        file_min_ts = min(file_min_ts, timestamp)
        file_max_ts = max(file_max_ts, timestamp)
        #lat = float(p[3])
        #lon = float(p[4])
        #general_min_lat = min(general_min_lat, lat)
        #general_max_lat = max(general_max_lat, lat)
        #general_min_lon = min(general_min_lon, lon)
        #general_max_lon = max(general_max_lon, lon)

        xid = p[0]
        if xid not in xids_set:
          xids_set.add(xid)
          general_ids_count += 1
      
      # Outputs stats for file.
      print filename + '\t' + \
          str(file_point_count) + ' points ' + \
          '[' + str(file_min_ts) + ', ' + str(file_max_ts) + ']'

      # Updates general stats.
      general_min_ts = min(general_min_ts, file_min_ts)
      general_max_ts = max(general_max_ts, file_max_ts)
      general_point_count += file_point_count

    # Outputs general stats.
    print 'All files:\t' + \
        str(general_point_count) + ' points ' + \
        '[' + str(general_min_ts) + ', ' + str(general_max_ts) + '] ' + \
        'lat: [' + str(general_min_lat) + ', ' + str(general_max_lat) + '] ' + \
        'lon: [' + str(general_min_lon) + ', ' + str(general_max_lon) + ']'
    print 'xid count: ' + str(general_ids_count)


  # Iterates over original files and outputs basic stats for each data file:
  # number of points and unique xid count.
  def showInfoForOriginalFiles(self, input_folder):
    general_point_count = 0
    general_xids_count = 0
    general_pids_count = 0
    xids_set = set()
    pids_set = set()

    for filename in os.listdir(input_folder):
      csv_reader = csv.reader(open(input_folder + filename))

      # Points: xid(0), ts(1), acc(2), lat(3), lon(4)
      for p in csv_reader:
        general_point_count += 1
        pid = p[0]
        xid = p[2]
        if xid not in xids_set:
          xids_set.add(xid)
          general_xids_count += 1

        if pid not in pids_set:
          pids_set.add(pid)
          general_pids_count += 1
      
    # Outputs general stats.
    print 'point count:  ' + str(general_point_count) + \
        '\txid count: ' + str(general_xids_count) + \
        '\tid count: ' + str(general_pids_count)


  # Iterates over buckets files and outputs basic stats for each data file:
  # number of points per file.
  def showInfoForBucketsFiles(self, input_folder):
    max_point_count = -sys.maxint
    point_count = 0

    fi = 0
    for filename in os.listdir(input_folder):
      fi += 1
      csv_reader = csv.reader(open(input_folder + filename))

      if fi == 6:
        print 'point count:  ' + str(point_count)
        point_count = 0
        fi = 0

      for p in csv_reader:
        point_count += 1

      max_point_count = max(max_point_count, point_count)
      
    # Outputs general stats.
    print 'max_point count:  ' + str(max_point_count)

# Main
if __name__ == "__main__":
  converter = LocationDataConverter()
  #converter.filterFilesInFolder(ORIGINAL_FILES_FOLDER, FILTERED_FILES_FOLDER)
  #converter.outputBucketsForFilesInFolder(FILTERED_FILES_FOLDER, BUCKETS_FILES_FOLDER)
  converter.showInfoForFilteredFiles(FILTERED_FILES_FOLDER)
  #converter.showInfoForOriginalFiles(ORIGINAL_FILES_FOLDER)
  #converter.createIdsStatsJson(ORIGINAL_FILES_FOLDER, IDS_SAMPLE_COUNT_FILE)
  #converter.createDataStatsJson(BUCKETS_FILES_FOLDER, DATA_STATS_FILE)
  #converter.showInfoForBucketsFiles(BUCKETS_FILES_FOLDER)
