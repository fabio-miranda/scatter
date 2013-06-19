all: generatedata.c
	gcc -lm -Wall -o generatedata.o generatedata.c -O2 -lpng

clean:
	rm generatedata
