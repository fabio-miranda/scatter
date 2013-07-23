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
  float count = texture2D(uSamplerCount, coord2D).r;
  float index = texture2D(uSamplerIndex, coord2D).r * (uMaxIndexValue - uMinIndexValue) + uMinIndexValue;

  //vec2 coordValue = vec2(mod(index, 256.0), index);
  vec2 coordValue = vec2(index/512.0, 0);
  //coordValue *= (1.0/(4096.0 - 0.0));

  float value = texture2D(uSamplerEntry, coordValue.xy).r * (uMaxEntryValue - uMinEntryValue) + uMinEntryValue;
  //gl_FragColor = vec4(value, value, value, 1);
  //return;

  //vec3 color = texture2D(uSamplerColorScale, vec2(count, 0)).xyz;
  //vec3 color = texture2D(uSamplerColorScale, vec2(value, 0)).xyz;
  //gl_FragColor = vec4(color.xyz, 1);
  float a = value;
  if(a <= 0.0 )
  	gl_FragColor = vec4(1, 0, 0, 1);
  else if(a <= 1.0 )
  	gl_FragColor = vec4(0, 1, 0, 1);
  else if(a <= 2.0 )
  	gl_FragColor = vec4(0, 0, 1, 1);
  else if(a <= 3.0 )
  	gl_FragColor = vec4(1, 1, 0, 1);
  else if(a <= 4.0)
  	gl_FragColor = vec4(0, 1, 1, 1);
  else if(a <= 5.0)
  	gl_FragColor = vec4(1, 0, 1, 1);
  else
  	gl_FragColor = vec4(1);

}
