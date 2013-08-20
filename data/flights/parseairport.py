import sys


if(len(sys.argv) <= 1):
	print 'Error! What is the csv file to parse? First line must be the fields names'
	exit(1)

airports = {}
f = open('./airports.csv', 'r')
print f.readline() #fieldnames
for line in f:
	tokens = line.split(',')
	if(len(tokens[1]) > 0):
		airports[tokens[0]] = {}
		airports[tokens[0]]['lat'] = float(tokens[1])
		airports[tokens[0]]['lng'] = float(tokens[2])
f.close()

print sys.argv[1]
f = open(sys.argv[1], 'r')
out = open('./data', 'w')
print f.readline() #fieldnames
count = 0
numdim = len(line.split(','))
lat0 = float('inf')
lng0 = float('inf')
lat1 = -float('inf')
lng1 = -float('inf')
for line in f:
	tokens = line.split(',')
	for i in range(0, 6):
		out.write(tokens[i]+',')

	#origin
	origin = tokens[6]
	lat = airports[origin]['lat']
	lng = airports[origin]['lng']
	out.write(str(lat)+','+str(lng)+',')

	if(lat < lat0):
		lat0 = lat
	if(lng < lng0):
		lng0 = lng
	if(lat > lat1):
		lat1 = lat
	if(lng > lng1):
		lng1 = lng

	#dest
	dest = tokens[7]
	lat = airports[dest]['lat']
	lng = airports[dest]['lng']
	out.write(str(lat)+','+str(lng)+',')

	if(lat < lat0):
		lat0 = lat
	if(lng < lng0):
		lng0 = lng
	if(lat > lat1):
		lat1 = lat
	if(lng > lng1):
		lng1 = lng

	out.write(tokens[8]+',')
	out.write(tokens[9]+'\n')
	count+=1

out.close()
f.close()

info = open('./info.txt', 'w')
info.write('numentries: '+str(count)+'\n')
info.write('numdim: '+str(numdim)+'\n')
info.write('min: 0\n')
info.write('max: 1\n')
info.write('isline: 1\n')
info.write('hasgeoinfo: 1\n')
info.write('lat0: '+str(lat0)+'\n')
info.write('lng0: '+str(lng0)+'\n')
info.write('lat1: '+str(lat1)+'\n')
info.write('lng1: '+str(lng1)+'\n')
info.close()