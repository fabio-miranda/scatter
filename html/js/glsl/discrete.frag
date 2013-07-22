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


void main(void) {

  //vec2 coord2D = uDim * sizeDataTile2D + vTexCoord * sizeDataTile2D; //a, b
  vec2 coord2D = vTexCoord;
  float count = texture2D(uSamplerCount, coord2D).r;// * (uMaxValue - uMinValue);
  float index = texture2D(uSamplerIndex, coord2D).r;// * (uMaxIndexValue - uMinIndexValue);
  float value = texture2D(uSamplerEntry, vec2(index, 0)).r;// * (uMaxEntryValue - uMinEntryValue);

  //vec3 color = texture2D(uSamplerColorScale, vec2(count, 0)).xyz;
  //vec3 color = texture2D(uSamplerColorScale, vec2(value, 0)).xyz;
  //gl_FragColor = vec4(color.xyz, 1);
  gl_FragColor = vec4(index);

}
