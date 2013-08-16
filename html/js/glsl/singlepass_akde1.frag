precision mediump float;

uniform sampler2D uSamplerF;

uniform float uBandwidth;
uniform float uNumPoints;

varying vec2 originalPos;

void main(void) {

  float f = texture2D(uSamplerF, originalPos).r;
  //float f = texture2D(uSamplerF, originalPos).r;
  f = log(f);
  gl_FragColor = vec4(f);
  //gl_FragColor = vec4(1,0,0,1);
  //gl_FragColor = vec4(0, 1, 0, 1);
}
