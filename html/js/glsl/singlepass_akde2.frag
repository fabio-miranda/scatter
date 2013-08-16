precision mediump float;

uniform sampler2D uSamplerF;
uniform sampler2D uSamplerMean;

uniform float uBandwidth;
uniform float uNumPoints;

float gauss(float r){
  return 0.3989422804 * exp( 25.0 * (- r*r) / 2.0);
}

//Attention: gl_FragCoord is lower left, gl_PointCoord is upper left by default

void main(void) {

  float mean = texture2D(uSamplerMean, vec2(0.5)).r;
  //mean = pow(mean, 1.0/uNumPoints);
  mean = mean / uNumPoints;
  mean = exp(mean);
  //mean = pow(mean, 1.0/uNumPoints);

  //vec2 newFragCoord = vec2(gl_FragCoord.x, 512.0 - gl_FragCoord.y);
  vec2 newPointCoord = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);

  vec2 originalPos = (gl_FragCoord.xy - 256.0*newPointCoord.xy + 256.0*vec2(0.5))/512.0;
  //vec2 originalPos = (gl_FragCoord.xy/512.0);
  //originalPos = originalPos - 512.0*(gl_PointCoord.xy / 32.0) + 512.0*vec2(0.5)/32.0;
  //float f = texture2D(uSamplerF, gl_PointCoord.xy).r;
  float f = texture2D(uSamplerF, originalPos).r;
  //float f = texture2D(uSamplerF, gl_FragCoord.xy/512.0).r;
  //gl_FragColor = vec4(f, 0, 0, 1.0);
  //return;
  //float f = texture2D(uSamplerF, gl_FragCoord.xy).r;
  float lambda = sqrt(mean / f);
  float bandwidth = uBandwidth * lambda;

	float dist = distance( gl_PointCoord, vec2(0.5) ); //dist in [0,0.5]
	//dist = 2.0*(dist);
	float val = gauss(dist / bandwidth);
	float weight = 100.0 / uNumPoints;
	val = val * weight;
  gl_FragColor = vec4(val);
  //gl_FragColor = texture2D(uSamplerMean, vec2(0.5));
}
