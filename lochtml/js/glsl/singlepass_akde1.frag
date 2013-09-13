precision mediump float;

uniform sampler2D uSamplerF;

uniform float uBandwidth;
uniform float uNumPoints;
uniform float uKernelSize;
uniform float uNumBins;

varying vec2 originalPos;

void main(void) {

  float f = texture2D(uSamplerF, originalPos).g;
  //float f = texture2D(uSamplerF, originalPos).r;
  f = log(f);
  gl_FragColor = vec4(f,1,1,1);
  //gl_FragColor = vec4(1,0,0,1);
  //gl_FragColor = vec4(0, 1, 0, 1);
}
