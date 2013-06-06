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
      entry.append(random.gauss(0.5, 0.1))
    aux.append(entry)

  data = numpy.array(aux)

  print aux


def createDataTile(binsize, width, height, dimension1, dimension2):

  maxvalue = 1.0
  numbins = width / binsize

  buf = numpy.zeros(shape=(width/binsize,height/binsize, 4), dtype=numpy.uint8)
  count = 0
  maxcount = 0
  for entry in range(0, len(dimension1)):

    val1 = dimension1[entry]
    val2 = dimension2[entry]

    bini = int((val1 / maxvalue) * numbins)
    binj = int((val2 / maxvalue) * numbins)


    #buf[i, j, 0] = 0   #b
    #buf[i, j, 1] = 0   #g
    #buf[i, j, 2] = 255 #r
    #buf[i, j, 3] = 255 #a

    #TODO: handle binsize
    buf[bini, binj, 0] += 1
    buf[bini, binj, 1] += 1
    buf[bini, binj, 2] += 1
    buf[bini, binj, 3] += 1

    if(buf[bini, binj, 2] > maxcount):
      maxcount = buf[bini, binj, 2]

  #normalize. do I really need it?  
  for i in range(0, width/binsize):
    for j in range(0, height/binsize):
      normalizedvalue = (buf[i,j, 0] / float(maxcount)) * 255
      buf[i,j, 0] = normalizedvalue
      buf[i,j, 1] = normalizedvalue
      buf[i,j, 2] = normalizedvalue
      buf[i,j, 3] = normalizedvalue
      #print buf[i,j, 2], maxcount

  #http://stackoverflow.com/questions/13901197/retain-unchanged-data-when-saving-numpy-array-to-image-with-scipy-imsave
  print maxcount
  return cairo.ImageSurface.create_for_data(buf, cairo.FORMAT_ARGB32, width, height, width * 4)
  #return buf

def generateDataTiles(binsize, width, height):

  global data
  global datatiles

  numentries, numdim = data.shape

  datatiles = numpy.zeros(shape=(width/binsize,height/binsize), dtype = object)

  print 'Creating tiles...'
  count = 0.0
  for i in range(0, 1):
    for j in range(0, 1):
      datatiles[i, j] = createDataTile(binsize, width, height, data[i], data[j])
      #print count / ((width/binsize)*(height/binsize))
      count+=1
  print 'Done'

  
def getTile(dimension1, dimension2):
  return datatiles[dimension1, dimension2]