import sys
import argparse
import random
import StringIO
import scipy.misc
import numpy

data = None
datatiles = None

def generateData(numentries, numdim):

  global data

  data = numpy.zeros(shape=(numentries,numdim), dtype=numpy.float32)

  for dim in range(0, numdim):
    dist = random.uniform(0,2)
    alpha = random.uniform(1, 5)
    beta = random.uniform(1, 5)
    mean = random.uniform(0.3, 0.7)
    std = random.uniform(0.1, 0.19)
    for entry in range(0, numentries):
      if(dist < 1.0):
        val = max(0.0, min(random.gauss(mean, std), 1.0))
        data[entry, dim] = val
      elif(dist < 2.0):
        data[entry, dim] = random.betavariate(alpha, beta)


def createDataTile(binsize, width, height, dimension1, dimension2):

  maxvalue = 1.0
  numbins = width / binsize

  buf = numpy.zeros(shape=(width/binsize,height/binsize, 4), dtype=numpy.uint8)
  count = 0
  maxcount = 0
  for entry in range(0, len(dimension1)):

    val1 = dimension1[entry]
    val2 = dimension2[entry]

    bini = int((val1 / maxvalue) * (numbins-1))
    binj = int((val2 / maxvalue) * (numbins-1))


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
  #return cairo.ImageSurface.create_for_data(buf, cairo.FORMAT_ARGB32, width, height, width * 4)
  return buf

def generateDataTiles(binsize, width, height):

  global data
  global datatiles

  numentries, numdim = data.shape

  datatiles = numpy.zeros(shape=(width/binsize,height/binsize), dtype = object)

  print 'Creating tiles...'
  count = 0.0
  for i in range(0, numdim):
    for j in range(0, numdim):
      print float(count) / (numdim*numdim)
      datatiles[i, j] = createDataTile(binsize, width, height, data[0:,i], data[0:,j])
      img = scipy.misc.toimage(datatiles[i,j]) #, high=numpy.max(tile), low=numpy.min(tile), mode='P'
      img.save('./data/'+str(i)+'.'+str(j)+'.png')

      count+=1.0
  print 'Done'

  
def getTile(dimension1, dimension2):
  return datatiles[dimension1, dimension2]


def main(argv):
  parser = argparse.ArgumentParser(description='Generate data tiles')
  parser.add_argument('imgsize', metavar='imgsize', type=int, nargs='+', help='img size')
  parser.add_argument('binsize', metavar='binsize', type=int, nargs='+', help='bin size')
  parser.add_argument('numentries', metavar='numentries', type=int, nargs='+', help='number of entries')
  parser.add_argument('numdim', metavar='numdim', type=int, nargs='+', help='number of dimensions')

  args = vars(parser.parse_args())

  numdim = args['numdim'][0]
  imgsize = args['imgsize'][0]
  numentries = args['numentries'][0]
  binsize = args['binsize'][0]

  generateData(numentries, numdim)
  generateDataTiles(binsize, imgsize, imgsize)


if __name__ == "__main__":
  main(sys.argv)


