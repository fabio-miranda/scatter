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
	#for i in range(0, 6):
		#out.write(tokens[i]+',')

	origin = tokens[6]
	olat = airports[origin]['lat']
	olng = airports[origin]['lng']

	dest = tokens[7]
	dlat = airports[dest]['lat']
	dlng = airports[dest]['lng']

	#just use flights within Continental USA
	if(olng >= -124.7625 and olng <= -66.9326 and olat >= 24.5210 and olat <= 49.3845 and dlng >= -124.7625 and dlng <= -66.9326 and dlat >= 24.5210 and dlat <= 49.3845):
		#origin
		#out.write(str(lat)+','+str(lng)+',')
		out.write(str(olat)+';'+str(olng)+'\n')
		count+=1

		if(olat < lat0):
			lat0 = olat
		if(olng < lng0):
			lng0 = olng
		if(olat > lat1):
			lat1 = olat
		if(olng > lng1):
			lng1 = olng

		#dest
		#out.write(str(lat)+','+str(lng)+',')
		out.write(str(dlat)+';'+str(dlng)+'\n')
		count+=1

		if(dlat < lat0):
			lat0 = dlat
		if(dlng < lng0):
			lng0 = dlng
		if(dlat > lat1):
			lat1 = dlat
		if(dlng > lng1):
			lng1 = dlng

	#out.write(tokens[8]+',')
	#out.write(tokens[9]+'\n')
	

out.close()
f.close()

info = open('./info.txt', 'w')
info.write('numentries: '+str(count)+'\n')
#info.write('numdim: '+str(numdim)+'\n')
info.write('numdim: 2\n')
info.write('min: 0\n')
info.write('max: 1\n')
info.write('isline: 1\n')
info.write('hasgeoinfo: 1\n')
info.write('lat0: '+str(lat0)+'\n')
info.write('lng0: '+str(lng0)+'\n')
info.write('lat1: '+str(lat1)+'\n')
info.write('lng1: '+str(lng1)+'\n')
info.close()