# Utility functions to convert data into format expected by dataconverter.py
# timestamp lat lon
# @author fabiom@gmail.com Fabio Markus Miranda

import utm
import csv
import sys

TIMESTAMP = 1354579200

if(len(sys.argv) <= 4):
  print 'Error. Usage: input output zone_number zone_letter'
  exit()

input = open(sys.argv[1])
#input.readline()
csv_reader = csv.reader(input, delimiter=' ')
output = open(sys.argv[2], 'w+')


output.write(str(TIMESTAMP)+'\n')
output.write(str(TIMESTAMP)+'\n')

for point in csv_reader:
  try:
    x = float(point[0])
    y = float(point[1])
    #print x, y
    latlng = utm.to_latlon(x, y, int(sys.argv[3]), sys.argv[4])

    output.write(str(TIMESTAMP)+','+str(latlng[0])+','+str(latlng[1])+'\n')
  except ValueError:
    print 'Skipped '+str(point)


