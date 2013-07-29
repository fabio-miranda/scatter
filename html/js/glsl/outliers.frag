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
uniform float uNumBins;
uniform float uWindowSize;
uniform float uNumPoints;
uniform float uIsFirstPass;
uniform float uUseDensity;
uniform float uBandwidth;
uniform float uEntryDataTileWidth;
uniform float uPassValue;
uniform float uNumPassValues;
uniform float uOutliersThreshold;


const int maxloop = 50000;
const float windowSize = 4.0;


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
  /*
  float pointValue = 0.0;
  for(int i=0;i<maxloop; i++){
    if(i >= int(windowSize)) break;

    int index = i - int(windowSize)/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / uNumBins), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / uNumBins)); //make sure to access not the next texel, but the next bin
    pointValue += (getValue(coord2D).r  * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue);

  }

  vec3 pointColor = texture2D(uSamplerColorScale, vec2(pointValue / 4.0, 0)).rgb;
  gl_FragColor = vec4(pointColor, 1.0);
  return;
  */

  

  if(uIsFirstPass > 0.0){
    vec3 finalcolor = texture2D(uSamplerFinal, vTexCoord).rgb;
    float count = texture2D(uSamplerCount, vTexCoord).r;
    gl_FragColor = vec4(finalcolor, 1.0);
    return;
  }

  float count;
  count = texture2D(uSamplerCount, coord2D).r;
  //if(uIsFirstPass > 0.0)
    count = count * (uMaxCountValue - uMinCountValue) + uMinCountValue;

  //value from density map
  vec3 densValue = texture2D(uSamplerFinal, vTexCoord).rgb;

  //value from point
  float pointValue = getValue(vTexCoord).r  * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue;

  if(count <= 0.0){
    gl_FragColor = vec4(densValue, 1.0);
    return;
  }

  pointValue = pointValue;

  vec3 pointColor = texture2D(uSamplerColorScale, vec2(pointValue / 4.0, 0)).rgb;

  float distance = distance(densValue.rgb, pointColor);

  if(distance > uOutliersThreshold){
    gl_FragColor = vec4(pointColor, 1.0);
  }
  else
    gl_FragColor = vec4(densValue, 1.0);

  //gl_FragColor = vec4(pointColor.rgb, 1.0);
  //gl_FragColor = vec4(vec3(distance), 1.0);
  
}
