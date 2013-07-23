#include <stdlib.h>
#include <math.h>
#include <stdio.h>
#include <time.h>
#include <string.h>
#include <unistd.h> 
#include <png.h>
#include <limits.h>

#define PI 3.141592654
#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))


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

int writeImage(char* filename, int width, int height, float minvalue, float maxvalue, float *buffer, int bytesperpixel)
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
  if(bytesperpixel == 1)
    png_set_IHDR(png_ptr, info_ptr, width, height,
        8, PNG_COLOR_TYPE_GRAY, PNG_INTERLACE_NONE,
        PNG_COMPRESSION_TYPE_BASE, PNG_FILTER_TYPE_BASE);
  else if(bytesperpixel == 3)
    png_set_IHDR(png_ptr, info_ptr, width, height,
        8, PNG_COLOR_TYPE_RGB, PNG_INTERLACE_NONE,
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
  row = (png_bytep) malloc(bytesperpixel * width * sizeof(png_byte));
  //row = (png_bytep) malloc(width * sizeof(png_byte));

  // Write image data
  int x, y, z;
  for (y=0 ; y<height ; y++) {
    for (x=0 ; x<width ; x++) {
      for(z=0; z<bytesperpixel; z++){
        row[bytesperpixel*x+z] = 255.0f*((buffer[y*width*bytesperpixel + x*bytesperpixel+z] - minvalue) / (maxvalue - minvalue));
        //setRGB(&(row[x*3]), buffer[y*width + x]);
      }
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

void generateData(int numentries, int numdim, float* minvalues, float* maxvalues){

  data = malloc(numentries*numdim*sizeof(float));

  int i;
  for(i = 0; i<numdim; i++){
    minvalues[i] = INFINITY;
    maxvalues[i] = -INFINITY;
  }

  srand (time(NULL));
  int dim;
  for(dim=0; dim<numdim; dim++){
    //float mean = randf(0.2f, 0.8f);
    float mean = 0.5;
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

      if(val > maxvalues[dim])
        maxvalues[dim] = val;

      if(val < minvalues[dim])
        minvalues[dim] = val;

    }
  }
}

void loadData(char* filename, int numentries, int numdim, float* minvalues, float* maxvalues){

  data = malloc(numentries*numdim*sizeof(float));

  int i;
  for(i = 0; i<numdim; i++){
    minvalues[i] = INFINITY;
    maxvalues[i] = -INFINITY;
  }

  FILE* file = fopen(filename, "r");
  char line[1024];
  int entry = 0;
  int dim = 0;
  while(fgets(line, 1024, file)){
    dim = 0;
    char* tok = strtok (line," ;,");
    while(tok != NULL){
      float val = atof(tok);
      data[dim*numentries+entry] = val;
      tok = strtok (NULL," ;,");
      if(val > maxvalues[dim])
        maxvalues[dim] = val;

      if(val < minvalues[dim])
        minvalues[dim] = val;

      dim++;

      
    }


    entry++;
  }

}


/*
int generate4DTiles(int numentries, int numdim,
                    int dimperimage, int dimi, int dimj,int dimk, int diml,
                    int numbin, float maxdatavalue){

  int imgsize = (numbin * dimperimage) * (numbin * dimperimage);

  if(imgsize > 4096)
    return 0;

  //printf("0\n");
  float minvalue = INFINITY;
  float maxvalue = -INFINITY;
  float maxcount = 0.0f;
  int datatilesizex = sqrt(imgsize) / dimperimage; //TODO: ij is the same as ji, take that into account, and remove the 2 *
  int datatilesizez = sqrt(imgsize) / dimperimage;
  int binsizex = datatilesizex / numbin;
  int binsizez = datatilesizez / numbin;

  //printf("binsize: %d datatilesize: %d numbin: %d\n", binsize, datatilesize, numbin);
  //return;

  float* buff = malloc(imgsize*imgsize*sizeof(float));
  //printf("1\n");
  int i,j,k,l;
  for(i=0; i<imgsize*imgsize; i++)
    buff[i] = 0.0f;

  for(i=dimi; i<dimi+dimperimage; i++){
    for(j=dimj; j<dimj+dimperimage; j++){
      for(k=dimk; k<dimk+dimperimage; k++){
        for(l=diml; l<diml+dimperimage; l++){

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
            int x = datatilesizex*(i-dimi) + binsizex*bini;
            int y = datatilesizex*(j-dimj) + binsizex*binj;
            int z = datatilesizez*(k-dimk) + binsizez*bink;
            int w = datatilesizez*(l-diml) + binsizez*binl;

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
          
        }
      }
    }
  }

  //save to image
  char filenamepng[100];
  snprintf(filenamepng, 100, "./data4/4_%d_%d_%d_%d_%d_%d.png", numbin, dimperimage, dimi, dimj, dimk, diml);
  writeImage(filenamepng, imgsize, imgsize, minvalue, maxvalue, buff);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "./data4/4_%d_%d_%d_%d_%d_%d.txt", numbin, dimperimage, dimi, dimj, dimk, diml);
  
  FILE* file = fopen(filenametxt,"w+");
  fprintf(file,"%d\n",numdim);
  fprintf(file,"%d\n",dimperimage);
  fprintf(file,"%d\n",dimi);
  fprintf(file,"%d\n",dimj);
  fprintf(file,"%d\n",dimk);
  fprintf(file,"%d\n",diml);
  fprintf(file,"%f\n",minvalue);
  fprintf(file,"%f",maxvalue);
  fclose(file);

  //free
  free(buff);

  return 1;
}
*/

int generateTiles(char* outputdir, int numentries, int numdim,
                  int dimi, int dimj, int dimk,
                  int numbin, float* mindatavalues, float* maxdatavalues){


  //printf("%d %d\n", dimperimage, numbin);


  int imgsize = numbin;

  if(imgsize > 4096)
    return 0;

  float minCountValue = 0;
  float maxCountValue = -INFINITY;
  float minIndexValue = INFINITY;
  float maxIndexValue = -INFINITY;
  float minEntriesValue = INFINITY;
  float maxEntriesValue = -INFINITY;
  int datatilesize = imgsize;
  int binsize = datatilesize / numbin;

  //printf("-2\n");

  float* buffCount = malloc(imgsize*imgsize*sizeof(float));
  int i,j;
  for(i=0; i<imgsize*imgsize; i++)
    buffCount[i] = 0.0f;

  //printf("-1\n");

  float* buffIndex = malloc(imgsize*imgsize*sizeof(float));
  for(i=0; i<imgsize*imgsize; i++)
    buffIndex[i] = 0.0f;

  //printf("0\n");

  float* buffEntries = malloc(512*512*sizeof(float));
  for(i=0; i<512*512; i++)
    buffEntries[i] = 0.0f;

  //printf("1\n");

  int entrycount=0;
  for(i=0; i<numbin; i++){
    for(j=0; j<numbin; j++){
      int entry;
      for(entry=0; entry<numentries; entry++){

        //check if entry falls in bin ij
        float vali = (data[dimi*numentries+entry] - mindatavalues[dimi]) / (maxdatavalues[dimi] - mindatavalues[dimi]);
        float valj = (data[dimj*numentries+entry] - mindatavalues[dimj]) / (maxdatavalues[dimj] - mindatavalues[dimj]);

        int binj = round(valj * (float)(numbin-1));
        int bini = round(vali * (float)(numbin-1));

        if(i == bini && j == binj){

          //printf("2\n");

          //count data tile
          int x = binsize*bini;
          int y = binsize*binj;
          int index2D = x * imgsize + y;

          //printf("%d\n", index2D);

          buffCount[index2D]++;

          minCountValue = MIN(minCountValue, buffCount[index2D]);
          maxCountValue = MAX(maxCountValue, buffCount[index2D]);

          //printf("3\n");

          //index data tile
          //TODO: use 3 channels to store the index value
          if(buffIndex[index2D] == 0){
            buffIndex[index2D] = (entrycount);
            //buffIndex[3*index2D] = (entrycount) % 256;
            //buffIndex[3*index2D+1] = ((entrycount % 256) % 256);
            //buffIndex[3*index2D+2] = ((entrycount % 256) % 256) % 256;
          }

          minIndexValue = MIN(minIndexValue, buffIndex[index2D]);
          maxIndexValue = MAX(maxIndexValue, buffIndex[index2D]);

          //printf("4\n");

          //entry data tile
          //float valk = (data[dimk*numentries+entry] - mindatavalues[dimk]) / maxdatavalues[dimk];
          buffEntries[entrycount] = data[dimk*numentries+entry];

          //printf("%f\n", data[dimk*numentries+entry]);

          minEntriesValue = MIN(minEntriesValue, data[dimk*numentries+entry]);
          maxEntriesValue = MAX(maxEntriesValue, data[dimk*numentries+entry]);

          //printf("%f %f\n", minIndexValue, maxIndexValue);

          entrycount++;

          //printf("5\n");
        }
      }
    }
  }

  //printf("a\n");

  if(dimk == 0){
    //save count data tile to image
    char filenamepng1[100];
    snprintf(filenamepng1, 100, "%s/b%d_i%d_j%d.count.png", outputdir, numbin, dimi, dimj);
    writeImage(filenamepng1, imgsize, imgsize, minCountValue, maxCountValue, buffCount, 1);

    //save index data tile to image
    char filenamepng2[100];
    snprintf(filenamepng2, 100, "%s/b%d_i%d_j%d.index.png", outputdir, numbin, dimi, dimj);
    writeImage(filenamepng2, imgsize, imgsize, minIndexValue, maxIndexValue, buffIndex, 1); //3
  }

  //save entry data tile to image
  char filenamepng3[100];
  snprintf(filenamepng3, 100, "%s/b%d_i%d_j%d_k%d.entry.png", outputdir, numbin, dimi, dimj, dimk);
  writeImage(filenamepng3, 512, 512, minEntriesValue, maxEntriesValue, buffEntries, 1);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "%s/b%d_i%d_j%d_k%d.info.txt", outputdir, numbin, dimi, dimj, dimk);
  
  FILE* file = fopen(filenametxt,"w+");
  //fprintf(file,"numdim: %d\n",numdim);
  //fprintf(file,"dimperimage: %d\n",dimperimage);
  //fprintf(file,"dimi: %d\n",dimi);
  //fprintf(file,"dimj: %d\n",dimj);
  //fprintf(file,"dimk: %d\n",dimk);
  fprintf(file,"minCountValue: %f\n",minCountValue);
  fprintf(file,"maxCountValue: %f\n",maxCountValue);
  fprintf(file,"minIndexValue: %f\n",minIndexValue);
  fprintf(file,"maxIndexValue: %f\n",maxIndexValue);
  fprintf(file,"minEntriesValue: %f\n",minEntriesValue);
  fprintf(file,"maxEntriesValue: %f",maxEntriesValue);
  fclose(file);


  free(buffCount);
  free(buffIndex);
  free(buffEntries);

  return 1;

}
/*
int generate2DTiles(char* outputdir, int numentries, int numdim,
                    int dimperimage, int dimi, int dimj,
                     int numbin, float* mindatavalues, float* maxdatavalues){

  int imgsize = numbin * dimperimage;

  if(imgsize > 4096)
    return 0;

  float minvalue = INFINITY;
  float maxvalue = -INFINITY;
  float maxcount = 0.0f;
  int datatilesize = imgsize / dimperimage;
  int binsize = datatilesize / numbin;

  //printf("%d\n", datatilesize);

  //printf("binsize: %d datatilesize: %d numbin: %d\n", binsize, datatilesize, numbin);

  float* buff = malloc(imgsize*imgsize*sizeof(float));
  int i,j;
  for(i=0; i<imgsize*imgsize; i++)
    buff[i] = 0.0f;

  for(i=dimi; i<dimi+dimperimage; i++){
    for(j=dimj; j<dimj+dimperimage; j++){

      //printf("i: %f %f\n", mindatavalues[i], maxdatavalues[i]);
      //printf("j: %f %f\n", mindatavalues[j], maxdatavalues[j]);

      maxcount=0;
      int entry;
      for(entry=0; entry<numentries; entry++){

        float vali = (data[i*numentries+entry] - mindatavalues[i]) / maxdatavalues[i];
        float valj = (data[j*numentries+entry] - mindatavalues[j]) / maxdatavalues[j];

        int binj = round(valj * (float)(numbin-1));
        int bini = round(vali * (float)(numbin-1));

        //int numdatatiledim = 2;
        int x = datatilesize*(i-dimi) + binsize*bini;
        int y = datatilesize*(j-dimj) + binsize*binj;
        int index = x * imgsize + y;

        buff[index]++;
        //buff[index] += (vali + valj);

        if(buff[index] > maxcount)
          maxcount = buff[index];

        if(buff[index] > maxvalue)
          maxvalue = buff[index];

        if(buff[index] < minvalue)
          minvalue = buff[index];
      }
      
    }
  }

  //save to image
  char filenamepng[100];
  snprintf(filenamepng, 100, "%s/2_%d_%d_%d_%d.png", outputdir, numbin, dimperimage, dimi, dimj);
  //writeImage(filenamepng, imgsize, imgsize, minvalue, maxvalue, buff);
  writeImage(filenamepng, imgsize, imgsize, 0.0f, maxcount, buff);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "%s/2_%d_%d_%d_%d.txt", outputdir, numbin, dimperimage, dimi, dimj);
  
  FILE* file = fopen(filenametxt,"w+");
  fprintf(file,"%d\n",numdim);
  fprintf(file,"%d\n",dimperimage);
  fprintf(file,"%d\n",dimi);
  fprintf(file,"%d\n",dimj);
  //fprintf(file,"%f\n",minvalue);
  fprintf(file,"%f\n",0.0f);
  //fprintf(file,"%f",maxvalue);
  fprintf(file,"%f\n",maxcount);
  fclose(file);


  //free
  free(buff);

  return 1;

}

int generateHistogramTile(int numentries, int numdim,
                          int dimperimage, int dimi, int dimj, int numbinscatter,
                           int numbinhistogram, float maxdatavalue){

  
  float minvalue = INFINITY;
  float maxvalue = -INFINITY;

  int imgsizex = numbinscatter * dimperimage;
  int imgsizey = numbinscatter * dimperimage;
  int imgsizez = numbinhistogram * numdim;


  if(imgsizex*imgsizey > 4096 || imgsizez > 4096)
    return 0;

  int datatilesizex = imgsizex / dimperimage;
  int datatilesizey = imgsizey / dimperimage;
  int datatilesizez = imgsizez / numdim;

  int binsizex = datatilesizex / numbinscatter;
  int binsizey = datatilesizey / numbinscatter;
  int binsizez = datatilesizez / numbinhistogram;

  float* buff = malloc(imgsizex*imgsizey*imgsizez*sizeof(float));
  int i,j,k;
  for(i=0; i<imgsizex*imgsizey*imgsizez; i++)
    buff[i] = 0.0f;

  for(i=dimi; i<dimi+dimperimage; i++){
    for(j=dimj; j<dimj+dimperimage; j++){
      for(k=0; k<numdim; k++){

        int entry;
        for(entry=0; entry<numentries; entry++){

          float vali = data[i*numentries+entry];
          float valj = data[j*numentries+entry];
          float valk = data[k*numentries+entry];

          int binj = round((valj / maxdatavalue) * (float)(numbinscatter-1));
          int bini = round((vali / maxdatavalue) * (float)(numbinscatter-1));
          int bink = round((valk / maxdatavalue) * (float)(numbinhistogram-1));

          int x = datatilesizex*(i-dimi) + binsizex*bini;
          int y = datatilesizey*(j-dimj) + binsizey*binj;
          int z = datatilesizez*(k) + binsizez*bink;

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
  snprintf(filenamepng, 100, "./data4/hist_%d_%d_%d_%d_%d.png", numbinscatter, numbinhistogram, dimperimage, dimi, dimj);
  writeImage(filenamepng, imgsizex*imgsizey, imgsizez, minvalue, maxvalue, buff);

  //save info
  char filenametxt[100];
  snprintf(filenametxt, 100, "./data4/hist_%d_%d_%d_%d_%d.txt", numbinscatter, numbinhistogram, dimperimage, dimi, dimj);

  FILE* file = fopen(filenametxt,"w+");
  fprintf(file,"%d\n",numdim);
  fprintf(file,"%d\n",dimperimage);
  fprintf(file,"%d\n",dimi);
  fprintf(file,"%d\n",dimj);
  fprintf(file,"%f\n",minvalue);
  fprintf(file,"%f",maxvalue);
  fclose(file);

  //free
  free(buff);

  return 1;

}
*/
 
int main(int argc, char* argv[]){

    if(argc < 5){
      printf("Usage: numentries numdim dimperimage outputdir [inputfile]\n");
      return 0;
    }

    //int numbin = atoi(argv[1]);
    int numentries = atoi(argv[1]);
    int numdim = atoi(argv[2]);
    //int dimperimage = atoi(argv[3]);
    char* outputdir = argv[4];
    float* maxvalues = malloc(numdim * sizeof(float));
    float* minvalues = malloc(numdim * sizeof(float));

    if(argc == 6){
      printf("Loading data... \n");
      loadData(argv[5], numentries, numdim, minvalues, maxvalues);
      printf("Done\n");
    }
    else{
      srand (time(NULL));
      printf("Generating data... \n");
      generateData(numentries, numdim, minvalues, maxvalues);
      printf("Done\n");
    }
    
    //maxvalues[0] = 1.0;
    //minvalues[0] = 0.0;
    
    
    FILE *file;
    char filenametxt[100];
    snprintf(filenametxt, 100, "%s/info.txt", outputdir);
    file = fopen(filenametxt,"w+");
    fprintf(file,"numentries: %d\n",numentries); //numentries
    fprintf(file,"numdim: %d\n",numdim); //numdim
    //fprintf(file,"dimperimage: %d\n",dimperimage); //dimperimage (2)
    //fprintf(file,"%d\n",dimperimage); //dimperimage (4)
    //fprintf(file,"%d\n",dimperimage); //dimperimage (histogram)
    fprintf(file,"min: %f\n",0.0f);
    fprintf(file,"max: %f",1.0f);
    fclose(file);

    int numbinscatter[4] = {2, 128, 256, 512};//, 1024};//, 2048, 4096};
    //int numbinhistogram[9] = {2, 4, 8, 16, 32, 64, 128, 256, 512};
    int i,j,k,l;//,l,m;
    for(i=0; i<numdim; i++){
      for(j=0; j<numdim; j++){
        for(k=0; k<numdim; k++){
          for(l=0; l<sizeof(numbinscatter)/sizeof(int); l++){
            printf("Generating data tiles with numbin=%d, dim=[%d,%d,%d]\n", numbinscatter[l], i, j, k);
            if(!generateTiles(outputdir, numentries, numdim, i, j, k, numbinscatter[l], minvalues, maxvalues))
              break;
            printf("Done\n");
          }
        }


        /*
        for(k=0; k<sizeof(numbinscatter)/sizeof(int); k++){
          printf("Generating 2d data tile with numbin=%d, dim=[%d,%d]\n", numbinscatter[k], i, j);
          if(!generate2DTiles(outputdir, numentries, numdim, dimperimage, i, j, numbinscatter[k], minvalues, maxvalues))
            break;
          printf("Done\n");
        */
          /*
          for(l=0; l<numdim/dimperimage; l++){
            for(m=0; m<numdim/dimperimage; m++){
              printf("Generating 4d data tile with numbin=%d, dim=[%d,%d,%d,%d]\n", numbinscatter[k], i, j, l, m);
              if(!generate4DTiles(numentries, numdim, dimperimage, i, j, l, m, numbinscatter[k], 1.0f))
                break;
              printf("Done\n");
            }
          }
          

          //histogram
          int l;
          for(l=0; l<sizeof(numbinhistogram)/sizeof(int); l++){

            printf("Generating 3d histogram data tile with numbin=%d, dim=[%d,%d]\n", numbinhistogram[l], i, j);
            if(!generateHistogramTile(numentries, numdim, dimperimage, i, j, numbinscatter[k],  numbinhistogram[l],1.0f))
              break;
            printf("Done\n");
          }

          }
          */
      }
    }

    free(data);

    return 1;
}
