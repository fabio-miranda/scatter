precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform vec2 uDim;
uniform vec4 uSelectionQuad; //xy: bottom left, zw: top right
uniform float uSizeDataTile;

const int maxloop = 100;//50000;
//const float maxvalue = 1.0;

void main(void) {

  //a, b: current fragment
  //i, j: dimensions to iterate

  vec2 coord2D = (uDim - vec2(1))*uSizeDataTile + vTexCoord * uSizeDataTile; //a, b
  float count = texture2D(uSampler0, coord2D).g;
  
  float rangei0 = uSelectionQuad.x / uSizeDataTile;
  float rangei1 = uSelectionQuad.z / uSizeDataTile;
  int rangecounti = int((rangei1 - rangei0) * 512.0); //replace with imgsize


  float rangej0 = uSelectionQuad.y / uSizeDataTile;
  float rangej1 = uSelectionQuad.w / uSizeDataTile;
  int rangecountj = int((rangej1 - rangej0) * 512.0);


  float value = 0.0;
  //hack for Loop index cannot be compared with non-constant expression error
  for(int i=0; i<maxloop; i++){
    if(i >= rangecounti) break;
    for(int j=0; j<maxloop; j++){
      if(j >= rangecountj) break;

      vec4 coord4D = vec4(rangei0 + float(i)/512.0, rangej0 + float(j)/512.0, coord2D.x, coord2D.y);

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
      vec2 coord = vec2(512.0*coord4D.x + coord4D.y, 512.0*coord4D.z + coord4D.w);
      //vec2 coord = vec2(coord2D.xy);
      value += texture2D(uSampler1, coord).r;
    }
  }

  gl_FragColor = vec4(value, value, value, 1.0);
  return;
	
  if(count <= 0.0)
    gl_FragColor = vec4(0);
  else if(count < 0.5)
    gl_FragColor = mix(vec4(0, 0.5, 0.5, 1), vec4(0, 1, 0, 1), count);
  else
    gl_FragColor = mix(vec4(0, 1, 0, 1), vec4(1, 0, 0, 1), count);

}
