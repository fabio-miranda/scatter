# Utility functions to convert mobile phones
# location data from CSV to JSON format.
# @author cesarpalomo@gmail.com Cesar Palomo

import csv
import json
import os
import sys

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
    csv_reader = csv.reader(open(input_csv_file), delimiter=',')
    points = []
    current_xid = 0

    # Skips first line in file (headers).
    csv_reader.next()

    # Note: to save space, converts xid to smaller number and stores
    # ts in seconds rather than milliseconds.
    # Outputs xid(2), ts(3), acc(4), lat(8), lon(7)
    for p in csv_reader:
      points.append([self.getXid(p[2]), int(p[3]) / 1000, p[4], p[8], p[7]])
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
  def processFolder(self, input_folder, output_folder):
    for filename in os.listdir(input_folder):
      points = self.filterUsedFields(input_folder + filename)
      self.outputToCSV(points, output_folder + filename)


# Main
if __name__ == "__main__":
  INPUT_FOLDER = 'data/original/'
  OUTPUT_FOLDER = 'data/filtered/'

  converter = LocationDataConverter()
  converter.processFolder(INPUT_FOLDER, OUTPUT_FOLDER)
