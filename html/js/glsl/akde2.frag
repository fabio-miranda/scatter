precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform float uMinValue;
uniform float uMaxValue;
uniform float uNumBins;
uniform float uWindowSize;
uniform float uIsFirstPass;
uniform float uBandwidth;

const int maxloop = 50000;
const float std = 1.0;
//const float maxvalue = 1.0;

float gauss(float r){
  return 0.3989422804 * exp( (- r*r) / 2.0);
}

void main(void) {

  vec2 coord2D = vTexCoord;
  vec4 values = texture2D(uSampler0, coord2D); //count, f, lambda

  float f = 0.0;
  float W = 1.0;
  for(int i=0;i<maxloop; i++){
    if(i >= int(uWindowSize)) break;

    int index = i - int(uWindowSize)/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / uNumBins), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / uNumBins)); //make sure to access not the next texel, but the next bin


    vec4 valuesi  = texture2D(uSampler0, coord2D);
    if(valuesi.r > 0.0 && coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0){ //TODO: use clamp_to_border, instead of this if

      //sum += (valuesi.r * (gauss(abs(float(index) / uNumBins) * oneoverh) * oneoverh));
      //sumCount += valuesi.r;

      float lamba;
      if(uIsFirstPass > 0.0){
        lamba = valuesi.b;
      }
      else{
        lamba = valuesi.a;
      }

      float h = uBandwidth * lamba;
      float oneoverh = 1.0 / h;

      float k = gauss((float(index) / uNumBins) * oneoverh);
      //k = valuesi.r * oneoverh * k;
      f += k;
      W += valuesi.r;

    }
  }

  if(uIsFirstPass <= 0.0)
    f = (1.0 / (uBandwidth * values.b * uBandwidth * values.a * W)) * f;

  if(uIsFirstPass > 0.0){
    gl_FragColor = vec4(f, values.g, values.b, values.a); //sum, f, lambdahoriz, lambdavert
  }
  else{
    vec3 color = texture2D(uSampler1, vec2(f  / (uMaxValue - uMinValue), 0)).xyz;
    gl_FragColor = vec4(color.xyz, 1);
  }


}
