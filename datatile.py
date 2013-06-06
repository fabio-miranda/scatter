import random
import StringIO
import cairo
import numpy

data = None
datatiles = None

def generateData(numentries, numdim):

  global data

  aux = []

  for i in range(0, numentries):
    entry = []
    for j in range(0, numdim):
      entry.append(random.uniform(0,1))
    aux.append(entry)

  data = numpy.array(aux)


def createDataTile(binsize, width, height, dimension1, dimension2):

  buf = numpy.zeros(shape=(width/binsize,height/binsize, 4))

  for i in range(0, width/binsize):
    for j in range(0, height/binsize):
      #TODO: handle binsize
      #if(dimension1[i] > 0):
        buf[i, j, 0] += 1
        buf[i, j, 1] += 1
        buf[i, j, 2] += 1
        buf[i, j, 3] += 1
      #if(dimension2[i] > 0):
        buf[i, j, 0] += 1
        buf[i, j, 1] += 1
        buf[i, j, 2] += 1
        buf[i, j, 3] += 1


  return cairo.ImageSurface.create_for_data(buf, cairo.FORMAT_ARGB32, width/binsize, height/binsize)

def generateDataTiles(binsize, width, height):

  global data
  global datatiles

  numentries, numdim = data.shape

  datatiles = numpy.zeros(shape=(width/binsize,height/binsize), dtype = object)

  print 'Creating tiles'
  count = 0.0
  for i in range(0, width/binsize):
    for j in range(0, height/binsize):
      datatiles[i, j] = createDataTile(binsize, width, height, data[i], data[j])
      print count / ((width/binsize)*(height/binsize))
      count+=1

  
def getTile(dimension1, dimension2):
  return datatiles[dimension1, dimension2]