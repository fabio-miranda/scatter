precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;

void main(void) {
  gl_FragColor = texture2D(uSampler0, vTexCoord.xy);
  
}
