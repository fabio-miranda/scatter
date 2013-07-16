precision mediump float;

varying highp vec2 vTexCoord;
uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform float uMinValue;
uniform float uMaxValue;
uniform float uNumBins;
uniform float uWindowSize;
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

  vec2 coord2D = vTexCoord;

  float count;
  count = texture2D(uSampler0, coord2D).g;
  if(uIsFirstPass > 0.0)
    count = count * (uMaxValue - uMinValue);


  float h = uBandwidth;
  float oneoverh = 1.0 / h;
  //float x = coord2D.x;
  float f = 0.0;
  //float W = 0.0;
  for(int i=0;i<maxloop; i++){
    if(i >= int(uWindowSize)) break;

    int index = i - int(uWindowSize)/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / uNumBins), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / uNumBins)); //make sure to access not the next texel, but the next bin


    if(coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0){ //TODO: use clamp_to_border, instead of this if
      float counti  = texture2D(uSampler0, coord2D).g;

      if(uIsFirstPass > 0.0)
        counti = counti * (uMaxValue - uMinValue);

      float gaus = gauss((float(index) / uNumBins) * oneoverh);
      float k = counti * gaus;

      f += k;
      //W += counti ;
    }
  }
  

  if(uIsFirstPass > 0.0){
    gl_FragColor = vec4(f, f, f, 1.0);
  }
  else{

    f = (1.0 / (uNumPoints*h)) * f;
    f = f/0.3989422804;

    vec3 color = texture2D(uSampler1, vec2(f, 0)).xyz;
    gl_FragColor = vec4(color.xyz, 1);
    
  }


}
