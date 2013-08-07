#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSamplerColorScale;
uniform sampler2D uSamplerCount;
uniform sampler2D uSamplerIndex;
uniform sampler2D uSamplerEntry;
uniform sampler2D uSamplerFinal;
uniform float uMinCountValue;
uniform float uMaxCountValue;
uniform float uMinIndexValue;
uniform float uMaxIndexValue;
uniform float uMinEntryValue;
uniform float uMaxEntryValue;
uniform float uUseStreaming;
uniform float uNumBins;
uniform float uWindowSize;
uniform float uNumPoints;
uniform float uIsFirstPass;
uniform float uUseDensity;
uniform float uBandwidth;
uniform float uEntryDataTileWidth;
uniform float uPassValue;
uniform float uNumPassValues;


const int maxloop = 50000;
const float std = 1.0;
//const float maxvalue = 1.0;

float gauss(float r){
  return 0.3989422804 * exp( (- r*r) / 2.0);
  //return (1.0 / (sqrt(6.28318530718 * std * std))) * exp(- (r*r) / (2.0 * std * std) );
}

vec4 getValue(vec2 coord){
  float index = texture2D(uSamplerIndex, coord).r * (uMaxIndexValue - uMinIndexValue) + uMinIndexValue;
  vec2 coordValue = vec2(index/uEntryDataTileWidth, 0);
  return texture2D(uSamplerEntry, coordValue.xy);// * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue;
}

void main(void) {

  
  vec2 coord2D = vTexCoord;

  float count;
  count = texture2D(uSamplerCount, coord2D).r;
  if(uIsFirstPass > 0.0 && uUseStreaming <= 0.0)
    count = count * (uMaxCountValue - uMinCountValue) + uMinCountValue;

  


  float h = uBandwidth;
  float oneoverh = 1.0 / h;
  //float x = coord2D.x;
  float f = 0.0;
  //float W = 0.0;
  float numpoints = 1.0;
  for(int i=0;i<maxloop; i++){
    if(i >= int(uWindowSize)) break;

    int index = i - int(uWindowSize)/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / uNumBins), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / uNumBins)); //make sure to access not the next texel, but the next bin

    float value;
    if(uUseDensity <= 0.0)
      value = getValue(coord2D).r * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue;
    else
      value = uPassValue;

    //TODO: remove this if. It REALLY impacts performance
    if((uIsFirstPass > 0.0 && value >= uPassValue-0.1 && value <= uPassValue+0.1 && coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0)
      ||
      (uIsFirstPass <= 0.0 && coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0)){ //TODO: use clamp_to_border, instead of this if

      float counti  = texture2D(uSamplerCount, coord2D).g;

      if(uIsFirstPass > 0.0 && uUseStreaming <= 0.0)
        counti = counti * (uMaxCountValue - uMinCountValue) + uMinCountValue;

      //if(getValue(coord2D).r * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue == 2.0)
        //break;

      float gaus = gauss((float(index) / uNumBins) * oneoverh);
      float k = counti * gaus; //TODO: consider only count of the same group

      f += k;
      numpoints+=counti;
      //W += counti ;
    }
  }
  

  if(uIsFirstPass > 0.0){
    gl_FragColor = vec4(count, f, f, 1.0);
    //gl_FragColor = vec4(count, count, count, 1.0); 
    //gl_FragColor = vec4(1, 0, 0, 1);
  }
  else{

    //f = (1.0 / (uNumPoints*h)) * f;
    f = (1.0 / (uNumPoints*h)) * f;
    //f = (1.0 / (50.0*h)) * f;
    f = f/0.3989422804;

    //f = f / 10.0;

    //vec3 color = texture2D(uSamplerColorScale, vec2(f, 0)).xyz;
    //gl_FragColor = vec4(color.xyz, 1);
    gl_FragColor = vec4(f,f,f,1.0);
  }
  

}
