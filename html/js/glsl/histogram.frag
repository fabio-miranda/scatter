precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform float uNumDim;
uniform float uNumBinsScatter;
uniform float uNumBinsHistogram;
uniform vec2 uSelectionDim;
uniform vec4 uSelectionBinRange;  //xy: range in x, zw: range in y

const int maxloop = 100;//50000;

void main(void) {

  gl_FragColor = vec4(1, 0, 0, 1);
  
}
