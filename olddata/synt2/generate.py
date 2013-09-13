import sys
import math
import random


#if(len(sys.argv) <= 1):
  #print 'Error! What is the csv file to parse? First line must be the fields names'
  #exit(1)

f = open('./data', 'w')

count=0
num = 10000
x = 2
y = 2
for i in range(0, 10):
  for j in range(0, i*i*i*i):
    x = random.uniform(0, 1)
    y = i

    f.write(str(x)+';'+str(y)+'\n')
    count+=1


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