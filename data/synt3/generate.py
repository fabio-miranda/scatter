import sys
import math
import random


#if(len(sys.argv) <= 1):
  #print 'Error! What is the csv file to parse? First line must be the fields names'
  #exit(1)

numrotations = 100
delta = math.pi/8.0
f = open('./data', 'w')

#f.write('0;0\n')
#f.write('1;0\n')
#f.write('0;1\n')
#f.write('1;1\n')
count=0

radius = 0.1
for i in range(0, numrotations):
  j = 0
  while(j < 2.0 * math.pi):
    x = random.uniform(0.1,0.2) * math.cos(j)
    y = random.uniform(0.1,0.2) * math.sin(j)

    f.write(str(x)+';'+str(y)+'\n')
    count+=1

    j+=delta

numrotations = 5
radius = 0.5
delta = math.pi/32.0
for i in range(0, 2*numrotations):
  j = 0
  while(j < 2.0 * math.pi):
    x = random.uniform(0.5,1.0) * math.cos(j)
    y = random.uniform(0.5,1.0) * math.sin(j)

    f.write(str(x)+';'+str(y)+'\n')
    count+=1

    j+=delta

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