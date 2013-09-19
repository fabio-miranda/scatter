import cherrypy
import csv
import json
import math
import os
import numpy


DATA_FOLDER = 'data/buckets/'

HTML_DIR = os.path.join(os.path.abspath("."), u"lochtml")

BUCKET_SIZE = 10 * 60            # Data bucket size: 10 minutes.
BUCKET_TS_INITIAL = 1375142400   # Bucket zero Initial timestamp for datin the animation.
BUCKET_TS_FINAL = 1377993600     # Final timestamp in the animation.
# Number of data buckets.
BUCKET_COUNT = (BUCKET_TS_FINAL - BUCKET_TS_INITIAL) / BUCKET_SIZE

DATA_STATS_FILE = 'data/buckets/points_stats.json';

class ScatterPage:

  # Default constructor reading app config file.
  def __init__(self):
    # Reads configuration file with application folders and server port.
    self.config = os.path.join(os.path.dirname(__file__), 'config.conf')


  # Given a timestamp, returns the bucket index containing it.
  def getBucketIndex(self, ts):
    return int(math.floor((int(ts) - BUCKET_TS_INITIAL) / BUCKET_SIZE))

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
    data['ts1'] = query_ts1;
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


  # Returns data summary per date: returns array of dates and
  # the number of points in each date.
  @cherrypy.expose
  def getPointsSummary(self):
    # Returns a json with summary data.
    cherrypy.response.headers['Content-Type'] = "application/json;"
    with open(DATA_STATS_FILE) as input_file:
      data = input_file.read()
    return data


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
