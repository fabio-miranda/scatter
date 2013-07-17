precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform float uMinValue;
uniform float uMaxValue;
uniform float uNumBins;
uniform float uWindowSize;
uniform float uNumPoints;
uniform float uIsFirstPass;

const int maxloop = 50000;

void main(void) {

  vec2 coord2D = vTexCoord;
  vec4 values  = texture2D(uSampler0, coord2D); //count, f
  float mean=1.0;
  float n=0.0;
  float window = 16.0;
  for(int i=0; i<maxloop; i++){
    if(i >= int(window)) break;

    int index0 = i - int(window)/2;

    for(int j=0; j<maxloop; j++){
      if(j >= int(window)) break;

      int index1 = j - int(window)/2;

      vec2 coord2D = vTexCoord + vec2((float(index0) / uNumBins), (float(index1) / uNumBins));
      vec4 valuesij = texture2D(uSampler0, coord2D); //count, f
      if( coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0){ //TODO: use clamp_to_border, instead of this if
        mean *= valuesij.g;
        n++;
      }

    }
  }
  gl_FragColor = vec4(values.r,values.g,mean, mean);

  /*
  float f = values.r;
  float n = 0.0;
  float mean = 1.0;
  for(int i=0;i<maxloop; i++){
    if(i >= int(uWindowSize)) break;

    int index = i - int(uWindowSize)/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / uNumBins), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / uNumBins)); //make sure to access not the next texel, but the next bin

    vec4 valuesi = texture2D(uSampler0, coord2D);
    if(valuesi.r > 0.0 && coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0){ //TODO: use clamp_to_border, instead of this if
      
      mean *= valuesi.g;

      n++;
      
    }
  }

  float g = pow(mean, 1.0/n);
  float lambda = sqrt(g / f);

  if(uIsFirstPass > 0.0)
    gl_FragColor = vec4(values.r, values.g, lambda, 1.0); //count, f, lambdahoriz, lambdavert
  else
    gl_FragColor = vec4(values.r, values.g, values.b, lambda); //count, f, lambdahoriz, lambdavert
  */

}
