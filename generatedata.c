#include <stdlib.h>
#include <math.h>
#include <stdio.h>
#include <time.h>
#include <string.h>
#include <unistd.h> 
#include <png.h>

#define PI 3.141592654


//http://c-faq.com/lib/gaussian.html
float gaussrand(float mean, float std){
  static double U, V;
  static int phase = 0;
  double Z;

  if(phase == 0) {
    U = (rand() + 1.) / (RAND_MAX + 2.);
    V = rand() / (RAND_MAX + 1.);
    Z = sqrt(-2 * log(U)) * sin(2 * PI * V);
  } else
    Z = sqrt(-2 * log(U)) * cos(2 * PI * V);

  phase = 1 - phase;

  return Z*std + mean;
}

//http://www.labbookpages.co.uk/software/imgProc/libPNG.html

inline void setRGB(png_byte *ptr, float val)
{
  int v = (int)(val * 768);
  if (v < 0) v = 0;
  if (v > 768) v = 768;
  int offset = v % 256;

  if (v<256) {
    ptr[0] = 0; ptr[1] = 0; ptr[2] = offset;
  }
  else if (v<512) {
    ptr[0] = 0; ptr[1] = offset; ptr[2] = 255-offset;
  }
  else {
    ptr[0] = offset; ptr[1] = 255-offset; ptr[2] = 0;
  }
}

int writeImage(char* filename, int width, int height, float *buffer)
{
  int code = 0;
  FILE *fp;
  png_structp png_ptr;
  png_infop info_ptr;
  png_bytep row;
  
  // Open file for writing (binary mode)
  fp = fopen(filename, "wb");
  if (fp == NULL) {
    fprintf(stderr, "Could not open file %s for writing\n", filename);
    code = 1;
    goto finalise;
  }

  // Initialize write structure
  png_ptr = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
  if (png_ptr == NULL) {
    fprintf(stderr, "Could not allocate write struct\n");
    code = 1;
    goto finalise;
  }

  // Initialize info structure
  info_ptr = png_create_info_struct(png_ptr);
  if (info_ptr == NULL) {
    fprintf(stderr, "Could not allocate info struct\n");
    code = 1;
    goto finalise;
  }

  // Setup Exception handling
  if (setjmp(png_jmpbuf(png_ptr))) {
    fprintf(stderr, "Error during png creation\n");
    code = 1;
    goto finalise;
  }

  png_init_io(png_ptr, fp);

  // Write header (8 bit colour depth) //me: TYPE_GRAY
  png_set_IHDR(png_ptr, info_ptr, width, height,
      8, PNG_COLOR_TYPE_GRAY, PNG_INTERLACE_NONE,
      PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);

  // Set title
  /*
  if (title != NULL) {
    png_text title_text;
    title_text.compression = PNG_TEXT_COMPRESSION_NONE;
    title_text.key = "Title";
    title_text.text = title;
    png_set_text(png_ptr, info_ptr, &title_text, 1);
  }
  */

  png_write_info(png_ptr, info_ptr);

  // Allocate memory for one row (3 bytes per pixel - RGB) //me
  //row = (png_bytep) malloc(3 * width * sizeof(png_byte));
  row = (png_bytep) malloc(width * sizeof(png_byte));

  // Write image data
  int x, y;
  for (y=0 ; y<height ; y++) {
    for (x=0 ; x<width ; x++) {
      row[x] = 255.0f*buffer[y*width + x];
      //setRGB(&(row[x*3]), buffer[y*width + x]);
    }
    png_write_row(png_ptr, row);
  }

  // End write
  png_write_end(png_ptr, NULL);

  finalise:
  if (fp != NULL) fclose(fp);
  if (info_ptr != NULL) png_free_data(png_ptr, info_ptr, PNG_FREE_ALL, -1);
  if (png_ptr != NULL) png_destroy_write_struct(&png_ptr, (png_infopp)NULL);
  if (row != NULL) free(row);

  return code;
}

float* data;

float randf(float min, float max){
  float val = (float)rand() / RAND_MAX;
  return fmaxf(min, fminf(max, val));
}

void generateData(int numentries, int numdim){

  data = malloc(numentries*numdim*sizeof(float));

  srand (time(NULL));
  int dim;
  for(dim=0; dim<numdim; dim++){
    float mean = randf(0.2f, 0.8f);
    float std;
    if(mean < 0.5f){
      std = mean / 2.0f;
    }
    else{
      std = (1.0f - mean) / 2.0f;
    }

    int entry;
    for(entry=0; entry<numentries; entry++){

      float val = gaussrand(mean, std);
      val = fmaxf(0.0f, fminf(1.0f, val));

      data[dim*numentries+entry] = val;
    }
  }
}

void generate4DTiles(int imgsize, int numentries, int numdim, int numbin){

  float maxvalue = 1.0f;
  float maxcount = 0.0f;
  int datatilesize = imgsize / (numdim*numdim);
  int binsize = datatilesize / (numbin*numbin);

  float* buff = malloc(imgsize*imgsize*sizeof(float));
  int i,j,k,l;
  for(i=0; i<imgsize*imgsize; i++)
    buff[i] = 0.0f;

  for(i=0; i<numdim; i++){
    for(j=0; j<numdim; j++){
      for(k=0; k<numdim; k++){
        for(l=0; l<numdim; l++){

          maxcount=0;
          int entry;
          for(entry=0; entry<numentries; entry++){
            float vali = data[i*numentries+entry];
            float valj = data[j*numentries+entry];
            float valk = data[k*numentries+entry];
            float vall = data[l*numentries+entry];

            int bini = ((vali / maxvalue) * (numbin-1));
            int binj = ((valj / maxvalue) * (numbin-1));
            int bink = ((valk / maxvalue) * (numbin-1));
            int binl = ((vall / maxvalue) * (numbin-1));





          }


          //normalize
          int bini, binj, bink, binl;
          for(bini=0; bini<datatilesize; bini++){
            for(binj=0; binj<datatilesize; binj++){
              for(bink=0; bink<datatilesize; bink++){
                for(binl=0; binl<datatilesize; binl++){
                  int x = datatilesize*i + binsize*bini;
                  int y = datatilesize*j + binsize*binj;
                  int index = x * imgsize + y;
                  //buff[index] = (buff[index]/(float)maxcount);
                }
              }
            }
          }

        }
      }
    }
  }

  free(buff);
}

void generate2DTiles(int imgsize, int numentries, int numdim, int numbin){

  float maxvalue = 1.0f;
  float maxcount = 0.0f;
  int datatilesize = imgsize / numdim;
  int binsize = datatilesize / numbin;


  float* buff = malloc(imgsize*imgsize*sizeof(float));
  int i,j;
  for(i=0; i<imgsize*imgsize; i++)
    buff[i] = 0.0f;

  for(i=0; i<numdim; i++){
    for(j=0; j<numdim; j++){

      maxcount=0;
      int entry;
      for(entry=0; entry<numentries; entry++){

        float vali = data[i*numentries+entry];
        float valj = data[j*numentries+entry];

        int bini = ((vali / maxvalue) * (numbin-1));
        int binj = ((valj / maxvalue) * (numbin-1));

        //int numdatatiledim = 2;
        int x = datatilesize*i + binsize*bini;
        int y = datatilesize*j + binsize*binj;
        int index = x * imgsize + y;

        buff[index]++;

        if(buff[index] > maxcount)
          maxcount = buff[index];
      }
      
      //normalize
      int bini;
      for(bini=0; bini<datatilesize; bini++){
        int binj;
        for(binj=0; binj<datatilesize; binj++){
          //if(bini != binj){
            int x = datatilesize*i + binsize*bini;
            int y = datatilesize*j + binsize*binj;
            int index = x * imgsize + y;
            buff[index] = (buff[index]/(float)maxcount);
          //}
        }
      }
    }
  }

  //save to image
  char filename[100];
  snprintf(filename, 100, "./data4/%d.png", numbin);
  writeImage(filename, imgsize, imgsize, buff);

  //free
  free(buff);

}
 
int main(int argc, char* argv[]){

    if(argc < 3){
      printf("Usage: numentries numdim\n");
      return 0;
    }

    //int numbin = atoi(argv[1]);
    int numentries = atoi(argv[1]);
    int numdim = atoi(argv[2]);
    
    srand (time(NULL));

    printf("Generating data... ");
    generateData(numentries, numdim);
    printf("Done\n");

    int i;
    int* aux = {0, 1, 2, 3};
    for(i=2; i<10; i++){
      int numbin = pow(2, i);
      int imgsize = numbin * numdim;

      printf("Generating 2d data tile with imgsize=%d, numbin=%d...\n", imgsize, numbin);
      generate2DTiles(imgsize, numentries, numdim, numbin);
      printf("Done\n");

    }

    for(i=2; i<10; i++){
      int numbin = pow(2, i);
      int imgsize = pow(numbin, 2) * pow(numdim, 2);

      printf("Generating 4d data tile with imgsize=%d, numbin=%d...\n", imgsize, numbin);
      generate4DTiles(imgsize, numentries, numdim, numbin);
      printf("Done\n");
    }

    free(data);

    return 1;
}
