precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform vec2 uDim;
uniform vec4 selectionQuad; //xy: bottom left, zw: top right
uniform float uSizeDataTile;

void main(void) {

  vec2 coord = (uDim - vec2(1))*uSizeDataTile + vTexCoord * uSizeDataTile;
  float count = texture2D(uSampler0, coord).g;
  /*
  int rangei = int((selectionQuad.y - selectionQuad.x)*uSizeDataTile);
  int rangej = int((selectionQuad.z - selectionQuad.w)*uSizeDataTile);
  float value = 0.0;

  //hack for Loop index cannot be compared with non-constant expression error
  for(int i=0; i<10000; i++){
    if(i >= 10) break;
    for(int j=0; j<10000; j++){
      if(j >= 10) break;
      vec2 aux = vec2(i, j) / 100.0;
      value += texture2D(uSampler0, coord).r;
    }
  }

  gl_FragColor = vec4(value, value, value, 1.0);
  return;
	*/
  if(count <= 0.0)
    gl_FragColor = vec4(0);
  else if(count < 0.5)
    gl_FragColor = mix(vec4(0, 0.5, 0.5, 1), vec4(0, 1, 0, 1), count);
  else
    gl_FragColor = mix(vec4(0, 1, 0, 1), vec4(1, 0, 0, 1), count);

}
