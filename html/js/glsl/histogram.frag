precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform float uNumDim;
uniform float uNumBinsScatter;
uniform float uNumBinsHistogram;
uniform vec2 uSelectionDim;
uniform vec4 uSelectionBinRange;  //xy: range in x, zw: range in y

const int maxloop = 100;//50000;

void main(void) {

	//a: current histogram fragment
  //i, j: dimensions to iterate
  //vec2 texCoord = 0.5*(vTexCoord + vec2(1.0));
  float sizeDataTileX = 1.0 / uNumDim;
  float sizeDataTileZ = 1.0 / uNumDim;
  float sizeDataTile3D = 1.0 / (uNumBinsScatter * uNumDim);


  int rangecounti = int(abs(uSelectionBinRange.x - uSelectionBinRange.y));
  int rangecountj = int(abs(uSelectionBinRange.z - uSelectionBinRange.w));
  float rangei0 = uSelectionBinRange.x;
  float rangej0 = uSelectionBinRange.z;


  float uHistogramDim = 0.0;
  float value = 0.0;
  //hack for Loop index cannot be compared with non-constant expression error
  for(int i=0; i<maxloop; i++){
    if(i > rangecounti) break;
    for(int j=0; j<maxloop; j++){
      if(j > rangecountj) break;

      float aux = uNumBinsScatter;
      float coordA = uHistogramDim * sizeDataTileZ + vTexCoord.x * sizeDataTileZ; //take into consideration histogram dimension
      vec2 coordIJ = uSelectionDim * sizeDataTileX + vec2((rangei0 + float(i)) / aux, (rangej0 + float(j)) / aux) * sizeDataTileX;

      vec2 coord = vec2(sizeDataTile3D * coordIJ.x + coordIJ.y, coordA);

      //gl_FragColor = vec4(coord.x);
      //return;


      //vec2 coord = vec2(coord4D.xy);
      value += texture2D(uSampler0, coord).r;
    }
  }

  gl_FragColor = vec4(value);
  
}
