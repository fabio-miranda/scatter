precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSamplerColorScale;
uniform sampler2D uSamplerCount;
uniform sampler2D uSamplerIndex;
uniform sampler2D uSamplerEntry;
uniform float uMinCountValue;
uniform float uMaxCountValue;
uniform float uMinIndexValue;
uniform float uMaxIndexValue;
uniform float uMinEntryValue;
uniform float uMaxEntryValue;
uniform float uUseDensity;
uniform float uEntryDataTileWidth;


vec4 getValue(vec2 coord){
  float index = texture2D(uSamplerIndex, coord).r * (uMaxIndexValue - uMinIndexValue) + uMinIndexValue;
  vec2 coordValue = vec2(index/uEntryDataTileWidth, 0);
  return texture2D(uSamplerEntry, coordValue.xy);// * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue;
}


void main(void) {

  float value = 0.0;
  float count = texture2D(uSamplerCount, vTexCoord).r;

  if(count <= 0.0){
    gl_FragColor = vec4(0);
    return;
  }

  if(uUseDensity > 0.0){
    value = count;
  }
  else{
    value = getValue(vTexCoord).r;
  }

  vec3 color = texture2D(uSamplerColorScale, vec2(value, 0)).xyz;
  gl_FragColor = vec4(color, 1.0);
}
