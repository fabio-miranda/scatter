import cherrypy
import csv
import json
import math
import os
import numpy


DATA_FOLDER = 'data/buckets/'
DATA_FILE = 'min_20130731_loc.csv'

HTML_DIR = os.path.join(os.path.abspath("."), u"lochtml")

BUCKET_SIZE = 10 * 60            # Data bucket size: 10 minutes.
BUCKET_TS_INITIAL = 1375142400   # Bucket zero Initial timestamp for datin the animation.
BUCKET_TS_FINAL = 1377993600     # Final timestamp in the animation.
# Number of data buckets.
BUCKET_COUNT = (BUCKET_TS_FINAL - BUCKET_TS_INITIAL) / BUCKET_SIZE

class ScatterPage:

  # Default constructor reading app config file.
  def __init__(self):
    # Reads configuration file with application folders and server port.
    self.config = os.path.join(os.path.dirname(__file__), 'config.conf')
    # Loads data into buckets.
    #self.initializeDataStats()
    #self.computeDataStats(DATA_FOLDER)


  # Given a timestamp, returns the bucket index containing it.
  def getBucketIndex(self, ts):
    return int(math.floor((int(ts) - BUCKET_TS_INITIAL) / BUCKET_SIZE))


  # Initializes empty data statistics.
  def initializeDataStats(self):
    self.data_stats = []
    inf = float('inf')
    for bucket_index in range(BUCKET_COUNT):
      bucket = dict()
      # Stores min/max lat and lon and filename.
      bucket['min_lat'] = inf
      bucket['max_lat'] = -inf
      bucket['min_lon'] = inf
      bucket['max_lon'] = -inf
      bucket['filename'] = str(bucket_index) + '.csv'
      self.data_stats.append(bucket)


  # Precomputes min/max lat/lon to speed up clients requests.
  def computeDataStats(self, data_folder):
    for bucket_index in range(BUCKET_COUNT):
      bucket = self.data_stats[bucket_index]
      filename = data_folder + bucket['filename']
      with open(filename) as input_file:
        csv_reader = csv.reader(input_file)

        print filename + '\n'

        # Points: xid(0), ts(1), acc(2), lat(3), lon(4)
        for point in csv_reader:
          #print point
          lat = float(point[3])
          lon = float(point[4])

          bucket['min_lat'] = min(bucket['min_lat'], lat)
          bucket['max_lat'] = max(bucket['max_lat'], lat)
          bucket['min_lon'] = min(bucket['min_lon'], lon)
          bucket['max_lon'] = max(bucket['max_lon'], lon)


  # Access to index.html, the entry point in the application.
  @cherrypy.expose
  def index(self):
    return open(os.path.join(HTML_DIR, u'index.html'))


  # Returns list of points that occurred between timestamp interval
  # (query_ts1, query_ts2]. Timestamps are in epoch seconds.
  # Optional parameter opt_compact lets client request compact data
  # (with only lat, lon and accuracy) or complete (lat, lon, acc,
  # xid and timestamp in epoch seconds.
  @cherrypy.expose
  def getPoints(self, query_ts1, query_ts2, opt_compact = True):

    bucket_index_1 = self.getBucketIndex(query_ts1)
    bucket_index_2 = self.getBucketIndex(query_ts2)

    # Stores lat/lon for points, and mininum/maximum latitude and longitude.
    points = []
    points_lat = []
    points_lon = []
    min_lat = float('inf')
    max_lat = float('-inf')
    min_lon = float('inf')
    max_lon = float('-inf')

    for bucket_index in range(bucket_index_1, bucket_index_2):
      filename = DATA_FOLDER + str(bucket_index) + '.csv'
      with open(filename) as input_file:
        csv_reader = csv.reader(input_file)

        # CSV format: xid, ts (in seconds), accuracy, lat, lon
        for point in csv_reader:
          lat = float(point[3])
          lon = float(point[4])
          acc = float(point[2])
          point_entry = [lat, lon, acc]
          if not opt_compact:
            point_entry += point[0:2]
          points.append(point_entry)
          points_lat.append(lat)
          points_lon.append(lon)

          # Updates min/max
          min_lat = min(min_lat, lat)
          max_lat = max(max_lat, lat)
          min_lon = min(min_lon, lon)
          max_lon = max(max_lon, lon)

    #print '\n\n requested (' + str(bucket_index_1) + ', ' \
    #    + str(bucket_index_2) + ']\t points: ' + str(len(points))

    # Prepares return data structure.
    data = {}
    data['points'] = points
    data['h'] = 1.06 * 0.5 * (numpy.std(points_lat) + \
        numpy.std(points_lon)) * pow(len(points), -0.2)
    #data['h'] = 0.01
    data['min_lat'] = min_lat
    data['min_lon'] = min_lon
    data['max_lat'] = max_lat
    data['max_lon'] = max_lon

    # Returns a json with data.
    cherrypy.response.headers['Content-Type'] = "application/json;"
    return json.dumps(data)


if __name__ == '__main__':
  scatterPage = ScatterPage()

  # CherryPy always starts with app.root when trying to map request URIs
  # to objects, so we need to mount a request handler root. A request
  # to '/' will be mapped to HelloWorld().index().
  app = cherrypy.quickstart(scatterPage, config=scatterPage.config)
else:
  scatterPage = ScatterPage()
  # This branch is for the test suite; you can ignore it.
  app = cherrypy.tree.mount(scatterPage, config=scatterPage.config)
