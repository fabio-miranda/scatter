all: generatedata.c
	gcc -lm -Wall -o generatedatatiles.o generatedatatiles.c -O2 -lpng

clean:
	rm generatedatatiles
