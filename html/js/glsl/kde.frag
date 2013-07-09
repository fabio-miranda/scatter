precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform float uMinValue;
uniform float uMaxValue;
uniform float uNumBins;
uniform float uNumPoints;

const int maxloop = 2;//50000;
//const float maxvalue = 1.0;

float gauss(float r){
  return 0.3989422804 * exp( (- r*r) / 2.0);
}

void main(void) {

  //vec2 coord2D = uDim * sizeDataTile2D + vTexCoord * sizeDataTile2D; //a, b
  vec2 coord2D = vTexCoord;
  float count = texture2D(uSampler0, coord2D).g * (uMaxValue - uMinValue);
  //gl_FragColor = vec4(count / uMaxValue, count / uMaxValue, count / uMaxValue, 1);
  //return;


  float h = 0.3;
  float oneoverh = 1.0 / h;
  float x = coord2D.x;
  float sum = 0.0;
  float sumCount = 0.0;
  for(int i=-maxloop/2;i<maxloop/2; i++){
      float xi = vTexCoord.x + float(i) / uNumBins;
      coord2D = vec2(xi, vTexCoord.y); //make sure to access not the next texel, but the next bin
      float counti  = texture2D(uSampler0, coord2D).g * (uMaxValue - uMinValue);

      sum += counti * (gauss(abs(x - xi) * oneoverh) * oneoverh);
      sumCount += counti;
  }

  sum = sum / sumCount;
  sum = sum / (uMaxValue - uMinValue);

  gl_FragColor = vec4(sum, sum, sum, 1);
  return;
  if(sum <= 0.0)
    gl_FragColor = vec4(0);
  else if(sum < 0.5)
    gl_FragColor = mix(vec4(0.0, 0.5, 0.5, 1), vec4(0.0, 1, 0, 1), sum);
  else
    gl_FragColor = mix(vec4(0.0, 1, 0, 1), vec4(1, 0, 0, 1), sum);
  

}
