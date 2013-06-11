precision mediump float;

varying highp vec2 vTextureCoord;
uniform sampler2D uSampler;

void main(void) {
  float count = texture2D(uSampler, vTextureCoord).g;

  if(count <= 0.0)
    gl_FragColor = vec4(0);
  else if(count < 0.5)
    gl_FragColor = mix(vec4(0, 0.5, 0.5, 1), vec4(0, 1, 0, 1), count);
  else
    gl_FragColor = mix(vec4(0, 1, 0, 1), vec4(1, 0, 0, 1), count);
}
