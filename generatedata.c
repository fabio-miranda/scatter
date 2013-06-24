#include <stdlib.h>
#include <math.h>
#include <stdio.h>
#include <time.h>
#include <string.h>
#include <unistd.h> 
#include <png.h>
#include <limits.h>

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

int writeImage(char* filename, int width, int height, float minvalue, float maxvalue, float *buffer)
{
  int code = 0;
  FILE *fp;
  png_structp png_ptr = NULL;
  png_infop info_ptr = NULL;
  png_bytep row = NULL;
  
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
      row[x] = 255.0f*((buffer[y*width + x] - minvalue) / (maxvalue - minvalue));
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
    //float mean = 0.5;
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
      //float val = 0.5f;
      //float val = entry / (float)numentries;
      //val = randf(0, 1);

      data[dim*numentries+entry] = val;
    }
  }
}

void writeInfo(char* filename, int numdim, int dim0, int dim1, float min, float max){

  FILE *file;

  file = fopen(filename,"w+");
  fprintf(file,"%d\n",numdim);
  fprintf(file,"%d\n",dim0);
  fprintf(file,"%d\n",dim1);
  fprintf(file,"%f\n",min);
  fprintf(file,"%f",max);
  fclose(file);

}

int generate4DTiles(int numentries, int numdim, int dim0, int dim1, int numbin, float maxdatavalue){

  int imgsize = (numbin * (dim1-dim0)) * (numbin * (dim1-dim0));

  if(imgsize > 4096)
    return 0;

  //printf("0\n");
  float minvalue = INFINITY;
  float maxvalue = -INFINITY;
  float maxcount = 0.0f;
  int datatilesize = sqrt(imgsize) / (dim1-dim0); //TODO: ij is the same as ji, take that into account, and remove the 2 *
  int binsize = datatilesize / numbin;

  //printf("binsize: %d datatilesize: %d numbin: %d\n", binsize, datatilesize, numbin);
  //return;

  float* buff = malloc(imgsize*imgsize*sizeof(float));
  //printf("1\n");
  int i,j,k,l;
  for(i=0; i<imgsize*imgsize; i++)
    buff[i] = 0.0f;

  for(i=dim0; i<dim1; i++){
    for(j=dim0; j<dim1; j++){
      for(k=dim0; k<dim1; k++){
        for(l=dim0; l<dim1; l++){

          maxcount=0;
          int entry;
          for(entry=0; entry<numentries; entry++){

            float vali = data[i*numentries+entry];
            float valj = data[j*numentries+entry];
            float valk = data[k*numentries+entry];
            float vall = data[l*numentries+entry];

            //position inside datatile
            int bini = round((vali / maxdatavalue) * (float)(numbin-1));
            int binj = round((valj / maxdatavalue) * (float)(numbin-1));
            int bink = round((valk / maxdatavalue) * (float)(numbin-1));
            int binl = round((vall / maxdatavalue) * (float)(numbin-1));

            //position (x,y,z,w) in 4d texture
            int x = datatilesize*(i-dim0) + binsize*bini;
            int y = datatilesize*(j-dim0) + binsize*binj;
            int z = datatilesize*(k-dim0) + binsize*bink;
            int w = datatilesize*(l-dim0) + binsize*binl;

            //from 4d to 2d
            //int index0 = x * (sqrt(imgsize) / numdim) + y;
            //int index1 = z * (sqrt(imgsize) / numdim) + w;

            //from 2d to 1d (linear array)
            //int index = index0 * imgsize + index1;
            int sqrtimg = sqrt(imgsize);
            int index = x * pow(sqrtimg, 3) + y * pow(sqrtimg, 2) + z * sqrtimg + w;

            if(index >= imgsize*imgsize){
              printf("index: %d imgsize2: %d \n", index, imgsize*imgsize);
              printf("i: %d vali: %f bini: %d x: %d \n", i, vali, bini, x);
              printf("j: %d valj: %f binj: %d y: %d \n", j, valj, binj, y);
              printf("k: %d valk: %f bink: %d z: %d \n", k, valk, bink, z);
              printf("l: %d vall: %f binl: %d w: %d \n", l, vall, binl, w);
              exit(1);
            }

            //buff[index]++;
            buff[index] += (vali + valj + valk + vall);

            if(buff[index] > maxcount)
              maxcount = buff[index];

            if(buff[index] > maxvalue)
              maxvalue = buff[index];

            if(buff[index] < minvalue)
              minvalue = buff[index];




          }
          
          //printf("8\n");
          //normalize
          /*
          int bini, binj, bink, binl;
          for(bini=0; bini<datatilesize; bini++){
            for(binj=0; binj<datatilesize; binj++){
              for(bink=0; bink<datatilesize; bink++){
                for(binl=0; binl<datatilesize; binl++){
                  int x = datatilesize*i + binsize*bini;
                  int y = datatilesize*j + binsize*binj;
                  int z = datatilesize*k + binsize*bink;
                  int w = datatilesize*l + binsize*binl;
                  int index0 = x * (sqrt(imgsize)) + y;
                  int index1 = z * (sqrt(imgsize)) + w;
                  int index = index0 * (sqrt(imgsize)) + index1;
                  buff[index] = (buff[index]/(float)maxcount);
                }
              }
            }
          }
          */
          //printf("9\n");
          
        }
      }
    }
  }

  //save to image
  char filenamepng[100];
  snprintf(filenamepng, 100, "./data4/4_%d_%d_%d.png", numbin, dim0, dim1);
  writeImage(filenamepng, imgsize, imgsize, minvalue, maxvalue, buff);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "./data4/4_%d_%d_%d.txt", numbin, dim0, dim1);
  writeInfo(filenametxt, numdim, dim0, dim1, minvalue, maxvalue);

  //free
  free(buff);

  return 1;
}

int generate2DTiles(int numentries, int numdim, int dim0, int dim1, int numbin, float maxdatavalue){

  int imgsize = numbin * (dim1-dim0);

  if(imgsize > 4096)
    return 0;

  float minvalue = INFINITY;
  float maxvalue = -INFINITY;
  float maxcount = 0.0f;
  int datatilesize = imgsize / (dim1-dim0);
  int binsize = datatilesize / numbin;

  //printf("%d\n", datatilesize);

  //printf("binsize: %d datatilesize: %d numbin: %d\n", binsize, datatilesize, numbin);

  float* buff = malloc(imgsize*imgsize*sizeof(float));
  int i,j;
  for(i=0; i<imgsize*imgsize; i++)
    buff[i] = 0.0f;

  for(i=dim0; i<dim1; i++){
    for(j=dim0; j<dim1; j++){

      maxcount=0;
      int entry;
      for(entry=0; entry<numentries; entry++){

        float vali = data[i*numentries+entry];
        float valj = data[j*numentries+entry];

        int binj = round((valj / maxdatavalue) * (float)(numbin-1));
        int bini = round((vali / maxdatavalue) * (float)(numbin-1));

        //int numdatatiledim = 2;
        int x = datatilesize*(i-dim0) + binsize*bini;
        int y = datatilesize*(j-dim0) + binsize*binj;
        int index = x * imgsize + y;

        //buff[index]++;
        buff[index] += (vali + valj);

        if(buff[index] > maxcount)
          maxcount = buff[index];

        if(buff[index] > maxvalue)
          maxvalue = buff[index];

        if(buff[index] < minvalue)
          minvalue = buff[index];
      }
      
      //normalize
      /*
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
      */
    }
  }

  //save to image
  char filenamepng[100];
  snprintf(filenamepng, 100, "./data4/2_%d_%d_%d.png", numbin, dim0, dim1);
  writeImage(filenamepng, imgsize, imgsize, minvalue, maxvalue, buff);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "./data4/2_%d_%d_%d.txt", numbin, dim0, dim1);
  writeInfo(filenametxt, numdim, dim0, dim1, minvalue, maxvalue);

  //free
  free(buff);

  return 1;

}

int generateHistogramTile(int numentries, int numdim, int dim0, int dim1, int numbinscatter,
                           int numbinhistogram, float maxdatavalue){

  
  float minvalue = INFINITY;
  float maxvalue = -INFINITY;

  int imgsizex = numbinscatter * (dim1 - dim0);
  int imgsizey = numbinscatter * (dim1 - dim0);
  int imgsizez = numbinhistogram * (dim1 - dim0);


  if(imgsizex*imgsizey > 4096 || imgsizez > 4096)
    return 0;

  int datatilesizex = imgsizex / (dim1 - dim0);
  int datatilesizey = imgsizey / (dim1 - dim0);
  int datatilesizez = imgsizez / (dim1 - dim0);

  int binsizex = datatilesizex / numbinscatter;
  int binsizey = datatilesizey / numbinscatter;
  int binsizez = datatilesizez / numbinhistogram;

  float* buff = malloc(imgsizex*imgsizey*imgsizez*sizeof(float));
  int i,j,k;
  for(i=0; i<imgsizex*imgsizey*imgsizez; i++)
    buff[i] = 0.0f;

  for(i=dim0; i<dim1; i++){
    for(j=dim0; j<dim1; j++){
      for(k=dim0; k<dim1; k++){

        int entry;
        for(entry=0; entry<numentries; entry++){

          float vali = data[i*numentries+entry];
          float valj = data[j*numentries+entry];
          float valk = data[k*numentries+entry];

          int binj = round((valj / maxdatavalue) * (float)(numbinscatter-1));
          int bini = round((vali / maxdatavalue) * (float)(numbinscatter-1));
          int bink = round((valk / maxdatavalue) * (float)(numbinhistogram-1));

          int x = datatilesizex*(i-dim0) + binsizex*bini;
          int y = datatilesizey*(j-dim0) + binsizey*binj;
          int z = datatilesizez*(k-dim0) + binsizez*bink;

          int index = x * imgsizey * imgsizez + y * imgsizez + z;

          buff[index]++;
          //buff[index] += (vali + valj + valk);

          if(buff[index] > maxvalue)
            maxvalue = buff[index];

          if(buff[index] < minvalue)
            minvalue = buff[index];

        }
      }
    }
  }



  //save to image
  char filenamepng[100];
  snprintf(filenamepng, 100, "./data4/hist_%d_%d_%d_%d.png", numbinscatter, numbinhistogram, dim0, dim1);
  writeImage(filenamepng, imgsizex*imgsizey, imgsizez, minvalue, maxvalue, buff);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "./data4/hist_%d_%d_%d_%d.txt", numbinscatter, numbinhistogram, dim0, dim1);
  writeInfo(filenametxt, numdim, dim0, dim1, minvalue, maxvalue);

  //free
  free(buff);

  return 1;

}
 
int main(int argc, char* argv[]){

    if(argc < 4){
      printf("Usage: numentries numdim dimperimage\n");
      return 0;
    }

    //int numbin = atoi(argv[1]);
    int numentries = atoi(argv[1]);
    int numdim = atoi(argv[2]);
    int dimperimage = atoi(argv[3]);
    
    srand (time(NULL));

    printf("Generating data... ");
    generateData(numentries, numdim);
    printf("Done\n");

    int numbinscatter[9] = {2, 4, 8, 16, 32, 64, 128, 256, 512};
    int numbinhistogram[9] = {2, 4, 8, 16, 32, 64, 128, 256, 512};
    int i,j;
    for(i=0; i<numdim/dimperimage; i++){
      int dim0 = i*dimperimage;
      int dim1 = (i+1)*dimperimage;
      for(j=0; j<sizeof(numbinscatter)/sizeof(int); j++){

        printf("Generating 2d data tile with numbin=%d, dim=[%d,%d] ...\n", numbinscatter[j], dim0, dim1);
        if(!generate2DTiles(numentries, numdim, dim0, dim1, numbinscatter[j], 1.0f))
          break;
        printf("Done\n");

        printf("Generating 4d data tile with numbin=%d dim=[%d,%d] ...\n", numbinscatter[j], dim0, dim1);
        if(!generate4DTiles(numentries, numdim, dim0, dim1, numbinscatter[j], 1.0f))
          break;
        printf("Done\n");

        //histogram
        int k;
        for(k=0; k<sizeof(numbinhistogram)/sizeof(int); k++){

          printf("Generating 3d histogram data tile with numbin=%d... dim=[%d,%d] \n", numbinhistogram[k], dim0, dim1);
          if(!generateHistogramTile(numentries, numdim, dim0, dim1, numbinscatter[j],  numbinhistogram[k],1.0f))
            break;
          printf("Done\n");
        }
      }
    }

    free(data);

    return 1;
}
