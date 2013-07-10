precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform float uMinValue;
uniform float uMaxValue;
uniform float uNumBins;
uniform float uNumPoints;
uniform float uIsFirstPass;
uniform float uBandwidth;

const int maxloop = 50000;
const float std = 1.0;
//const float maxvalue = 1.0;

float gauss(float r){
  return 0.3989422804 * exp( (- r*r) / 2.0);
  //return (1.0 / (sqrt(6.28318530718 * std * std))) * exp(- (r*r) / (2.0 * std * std) );
}

void main(void) {

  //vec2 coord2D = uDim * sizeDataTile2D + vTexCoord * sizeDataTile2D; //a, b
  vec2 coord2D = vTexCoord;
  float count = texture2D(uSampler0, coord2D).g * (uMaxValue - uMinValue);
  //gl_FragColor = vec4(count / uMaxValue, count / uMaxValue, count / uMaxValue, 1);
  //return;

  //if(uIsFirstPass <= 0.0){
    //count = count / (uMaxValue - uMinValue);
    //gl_FragColor = vec4(count, count, count, 1);
    //return;
  //}
  float aux = uNumBins;
  //if(uIsFirstPass <= 0.0)
    //aux = 1.0;


  float h = uBandwidth;
  float oneoverh = 1.0 / h;
  //float x = coord2D.x;
  float sum = 0.0;
  float sumCount = 1.0;
  for(int i=0;i<maxloop; i++){
    if(i >= 512) break;

    int index = i - 512/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / aux), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / aux)); //make sure to access not the next texel, but the next bin


    if(coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0){ //TODO: use clamp_to_border, instead of this if
      float counti  = texture2D(uSampler0, coord2D).g * (uMaxValue - uMinValue);

      sum += (counti * (gauss(abs(float(index) / aux) * oneoverh) * oneoverh));
      sumCount += counti;
    }
  }

  sum = sum / sumCount;  
  sum = sum / (uMaxValue - uMinValue);

  //gl_FragColor = vec4(0, 0, 1, 1);
  //return;
  if(uIsFirstPass > 0.0){
    gl_FragColor = vec4(sum, sum, sum, 1);
  }
  else{

    vec3 color = texture2D(uSampler1, vec2(sum, 0)).xyz;

    gl_FragColor = vec4(color.xyz, 1);

    /*
    if(sum <= 0.0)
      gl_FragColor = vec4(0.0, 0.5, 0.5, 1);
    else if(sum < 0.5)
      gl_FragColor = mix(vec4(0.0, 0.5, 0.5, 1), vec4(0.0, 1, 0, 1), sum);
    else
      gl_FragColor = mix(vec4(0.0, 1, 0, 1), vec4(1, 0, 0, 1), sum);
    */
  }

  //
  //return;
  
  

}
