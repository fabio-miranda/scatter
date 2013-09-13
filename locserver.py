import cherrypy
import csv
import json
import os
import numpy


DATA_FOLDER = 'data/filtered/'
DATA_FILE = 'min_20130731_loc.csv'


HTML_DIR = os.path.join(os.path.abspath("."), u"lochtml")

class ScatterPage:

  # Default constructor reading app config file.
  def __init__(self):
    # Reads configuration file with application folders and server port.
    self.config = os.path.join(os.path.dirname(__file__), 'config.conf')


  # Access to index.html, the entry point in the application.
  @cherrypy.expose
  def index(self):
    return open(os.path.join(HTML_DIR, u'index.html'))


  # Returns list of points that occurred between timestamp interval
  # (query_ts1, query_ts2). Timestamps are in epoch seconds.
  @cherrypy.expose
  def getPoints(self, query_ts1, query_ts2):

    ts1 = int(query_ts1)
    ts2 = int(query_ts2)

    # Will return a json.
    cherrypy.response.headers['Content-Type'] = "application/json;"

    # TODO(Cesar): find out which file to open based on requested data.
    print "opening " + DATA_FOLDER + DATA_FILE
    csv_reader = csv.reader(open(DATA_FOLDER + DATA_FILE))

    # Stores lat/lon for points, and mininum/maximum latitude and longitude.
    points = []
    points_lat = []
    points_lon = []
    min_lat = float('inf')
    max_lat = float('-inf')
    min_lon = float('inf')
    max_lon = float('-inf')

    # CSV format: xid, ts (in seconds), accuracy, lat, lon
    for point in csv_reader:
      lat = float(point[3])
      lon = float(point[4])
      points.append(point[0:3] + [lat, lon])
      points_lat.append(lat)
      points_lon.append(lon)

      # Updates min/max
      min_lat = min(min_lat, lat)
      max_lat = max(max_lat, lat)
      min_lon = min(min_lon, lon)
      max_lon = max(max_lon, lon)

    # Prepares return data structure.
    data = {}
    data['points'] = points
    data['h'] = 1.06 * 0.5 * (numpy.std(points_lat) + \
        numpy.std(points_lon)) * pow(len(points), -0.2)
    data['min_lat'] = min_lat
    data['min_lon'] = min_lon
    data['max_lat'] = max_lat
    data['max_lon'] = max_lon

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
