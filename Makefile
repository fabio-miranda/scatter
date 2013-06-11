all: generatedata.c
	gcc -lm -Wall -o generatedata generatedata.c -O2 -lpng

clean:
	rm generatedata
