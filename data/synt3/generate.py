import sys
import math
import random

count = 0
def circle(innerradius, outterradius, numrotations):
  global count
  delta = math.pi/32.0
  for i in range(0, numrotations):
    j = 0
    while(j < 2.0 * math.pi):
      x = random.uniform(innerradius,outterradius) * math.cos(j)
      y = random.uniform(innerradius,outterradius) * math.sin(j)

      f.write(str(x)+';'+str(y)+'\n')
      count+=1

      j+=delta


#if(len(sys.argv) <= 1):
  #print 'Error! What is the csv file to parse? First line must be the fields names'
  #exit(1)

f = open('./data', 'w')
circle(0.1, 0.2, 10)
circle(0.5, 0.7, 10)
circle(0.8, 0.9, 10)
circle(1.0, 1.1, 1)

f.close()

info = open('./info.txt', 'w')
info.write('numentries: '+str(count)+'\n')
#info.write('numdim: '+str(numdim)+'\n')
info.write('numdim: 2\n')
info.write('min: 0\n')
info.write('max: 1\n')
info.write('isline: 0\n')
info.write('hasgeoinfo: 0\n')
info.close()