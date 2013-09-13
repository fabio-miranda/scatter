attribute vec3 aVertexPosition;

uniform sampler2D uSamplerF;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform float uBandwidth;
uniform float uKernelSize;
uniform float uNumBins;

varying vec2 originalPos;

void main(void) {
  originalPos = vec2(uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0));
  //gl_Position = uPMatrix * uMVMatrix * vec4(0.5, 0.5, 0, 1);
  gl_Position = uPMatrix * vec4(0.5, 0.5, 0, 1);
  gl_PointSize = 1.0;
}
