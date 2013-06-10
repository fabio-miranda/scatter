import sys
import argparse
import random
import StringIO
import scipy.misc
import numpy
import math

data = None
datatiles = None
interdatatiles = None


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



def generateDatatiles(imgsize, numdim, numbin):

  global data
  maxvalue = 1.0
  maxcount = 0

  buff = numpy.zeros(shape=(imgsize, imgsize, 3), dtype = numpy.uint8)
  

  for i in range(1, 2):
    for j in range(0, 1):

      dimension1 = data[0:,i]
      dimension2 = data[0:,j]

      for entry in range(0, len(dimension1)):

        

        val1 = dimension1[entry]
        val2 = dimension2[entry]

        bini = int((val1 / maxvalue) * (numbin-1))
        binj = int((val2 / maxvalue) * (numbin-1))


        #indexing
        numdatatiledim = 2
        #datatileindex = i*numdim+j
        datatilesize = imgsize / numdim

        #print numbin, val1, val2, x, datatileindex, bini, binj
        #print datatilesize
        #print datatilesize, datatilesize, bini, binj, datatileindex, i, j
        #print datatilesize*datatileindex + bini, datatilesize*datatileindex + binj
        #print datatilesize*i + bini, datatilesize*j + binj
        buff[datatilesize*i + bini, datatilesize*j + binj] = 255
        newvalue = buff[datatilesize*i + bini, datatilesize*j + binj, 0]

        #print newvalue

        #print newvalue
        if(newvalue > maxcount):
          maxcount = newvalue


  #print 'ok'

  #normalize TODO see http://stackoverflow.com/questions/13901197/retain-unchanged-data-when-saving-numpy-array-to-image-with-scipy-imsave

  #print buff
  img = scipy.misc.toimage(buff) 
  img.save('./data2/test.png')




def main(argv):
  parser = argparse.ArgumentParser(description='Generate data tiles')
  parser.add_argument('imgsize', metavar='imgsize', type=int, nargs='+', help='img size')
  parser.add_argument('numbin', metavar='numbin', type=int, nargs='+', help='number of bins')
  parser.add_argument('numentries', metavar='numentries', type=int, nargs='+', help='number of entries')
  parser.add_argument('numdim', metavar='numdim', type=int, nargs='+', help='number of dimensions')

  args = vars(parser.parse_args())

  numdim = args['numdim'][0]
  imgsize = args['imgsize'][0]
  numentries = args['numentries'][0]
  numbin = args['numbin'][0]

  print 'Generating data...'
  generateData(numentries, numdim)
  print 'Done'

  print 'Generating data tiles...'
  generateDatatiles(imgsize, numdim, numbin)
  print 'Done'

  #print 'Generating interaction data tiles...'
  #generateInteractionDataTiles(binsize, imgsize, imgsize)
  #print 'Done'


if __name__ == "__main__":
  main(sys.argv)


