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

  vec4 values = texture2D(uSampler0, coord2D); //count, f, mean

  //float x = coord2D.x;
  
  float f = 0.0;
  //float W = 0.0;
  for(int i=0;i<maxloop; i++){
    if(i >= int(uWindowSize)) break;

    int index = i - int(uWindowSize)/2;
    coord2D = vec2(vTexCoord.x + uIsFirstPass * (float(index) / uNumBins), vTexCoord.y + (1.0 - uIsFirstPass) * (float(index) / uNumBins)); //make sure to access not the next texel, but the next bin


    if(coord2D.x >= 0.0 && coord2D.y >= 0.0 && coord2D.x <= 1.0 && coord2D.y <= 1.0){ //TODO: use clamp_to_border, instead of this if
      vec4 valuesi  = texture2D(uSampler0, coord2D); //count, f, mean
      float counti = valuesi.r;
      float fi = valuesi.g;
      float meani = valuesi.b;

      float gi = pow(meani, 1.0/counti);
      float lambdai = sqrt(gi / fi);
      float hi = uBandwidth * lambdai;
      float oneoverhi = 1.0 / hi;

      float gaus = gauss((float(index) / uNumBins) * oneoverhi);
      float k = fi * gaus;

      f += k;
      //W += counti ;
    }
  }
  

  if(uIsFirstPass > 0.0){
    gl_FragColor = vec4(values.r, f, values.b, 1.0);
    //gl_FragColor = vec4(values.r, values.g, values.b, 1.0);
  }
  else{

    //f = (1.0 / (uNumPoints*h)) * f;
    f = f/0.3989422804;

    vec3 color = texture2D(uSampler1, vec2(f, 0)).xyz;
    gl_FragColor = vec4(color.xyz, 1);

    //gl_FragColor = vec4(values.r, values.g, values.b, 1.0);
    
  }


}
