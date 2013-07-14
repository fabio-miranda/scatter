precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;


void main(void) {

  //vec2 coord2D = uDim * sizeDataTile2D + vTexCoord * sizeDataTile2D; //a, b
  vec2 coord2D = vTexCoord;
  float count = texture2D(uSampler0, coord2D).g;// * (uMaxValue - uMinValue);

  vec3 color = texture2D(uSampler1, vec2(count, 0)).xyz;
  gl_FragColor = vec4(color.xyz, 1);

}
