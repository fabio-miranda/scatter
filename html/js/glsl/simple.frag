precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform vec2 uScale;
uniform vec2 uTranslate;

void main(void) {
  vec2 scale = vec2(1.0);
  vec2 translate = vec2(0.0);
  gl_FragColor = texture2D(uSampler0, vTexCoord.xy*scale+translate);
  
}
