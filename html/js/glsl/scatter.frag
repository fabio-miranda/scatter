precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform vec2 uDim;
uniform float uMaxDim; //current num of dimensions being displayed
uniform float uNumDim;
uniform float uNumBins;
uniform vec4 uSelectionQuad; //xy: bottom left, zw: top right
//uniform vec2 uSizeDataTile; //x: 2D, y: 4D

const int maxloop = 10;//50000;
//const float maxvalue = 1.0;


void main(void) {

  //a, b: current fragment
  //i, j: dimensions to iterate
  //vec2 texCoord = 0.5*(vTexCoord + vec2(1.0));
  float sizeDataTile2D = 1.0 / uNumDim;

  vec2 coord2D = uDim * sizeDataTile2D + vTexCoord * sizeDataTile2D; //a, b
  float count = texture2D(uSampler0, coord2D).g;


  float sizeBin = (1.0 / (uMaxDim + 1.0)) / uNumBins;
  float rangei0 = uSelectionQuad.x / sizeBin;
  float rangei1 = uSelectionQuad.z / sizeBin;
  int rangecounti = int(abs(rangei1 - rangei0)); //replace with imgsize


  float rangej0 = uSelectionQuad.y / sizeBin;
  float rangej1 = uSelectionQuad.w / sizeBin;
  int rangecountj = int(abs(rangej1 - rangej0));

  //gl_FragColor = vec4(uMaxDim, 0, 0, 1.0);
  //return;

  //gl_FragColor = vec4(coord2D.x, coord2D.y, 0, 1.0);
  //return;

  float sizeDataTile4D = 1.0 / uNumDim; //1.0 / (sqrt(16.0) * uNumDim);
  float value = 0.0;
  //hack for Loop index cannot be compared with non-constant expression error
  for(int i=0; i<maxloop; i++){
    if(i >= rangecounti) break;
    for(int j=0; j<maxloop; j++){
      if(j >= rangecountj) break;

      //vec2 coordAB = (uDim + 0.5*(vTexCoord + vec2(1.0)) / sizeDataTile2D) * sizeDataTile2D;
      //sizeDataTile4D = 1.0;
      vec2 coordIJ = vec2((rangei0+float(i))*sizeDataTile4D, (rangej0+float(j))*sizeDataTile4D);
      vec2 coordAB = uDim * sizeDataTile4D + vTexCoord * sizeDataTile4D;
      vec4 coord4D = vec4(coordIJ.x, coordIJ.y, coordAB.x, coordAB.y);

      /*
      int bini = round((vali / maxvalue) * (float)(numbin-1));
      int binj = round((valj / maxvalue) * (float)(numbin-1));
      int bink = round((valk / maxvalue) * (float)(numbin-1));
      int binl = round((vall / maxvalue) * (float)(numbin-1));


      int x = datatilesize*i + binsize*bini;
      int y = datatilesize*j + binsize*binj;
      int z = datatilesize*k + binsize*bink;
      int w = datatilesize*l + binsize*binl;
      int index0 = x * (sqrt(imgsize)) + y;
      int index1 = z * (sqrt(imgsize)) + w;

      vec2 coord4D = vec2(index0, index1) / 100.0;
      */
      //vec2 coord = vec2(coordIJ.x*coordAB.x, coordIJ.y*coordAB.y);
      vec2 coord = vec2(coord4D.x*sizeDataTile4D*coordAB.x + coord4D.y*coordAB.y, coord4D.z*sizeDataTile4D + coord4D.w);
      //vec2 coord = vec2(coord4D.xy);
      value += texture2D(uSampler1, coord).r;
      //value += texture2D(uSampler1, coordAB).r;
      //value = coord4D.x;
      
      //gl_FragColor = vec4(coordAB.x, coordAB.y, 0, 1.0);
      //return;
      /*
      
      if(coord.x <= 1.0 && coord.x >= 0.0 && coord.y >= 0.0 && coord.y <= 1.0){
        value += 1.0;
      }
      else{
        value += 0.0;
      }
      */
    }
  }

  gl_FragColor = vec4(count+value, value, value, 1.0);
  return;
	
  if(count <= 0.0)
    gl_FragColor = vec4(0);
  else if(count < 0.5)
    gl_FragColor = mix(vec4(0, 0.5, 0.5, 1), vec4(0, 1, 0, 1), count);
  else
    gl_FragColor = mix(vec4(0, 1, 0, 1), vec4(1, 0, 0, 1), count);

}
