precision mediump float;
uniform float uBandwidth;
uniform float uNumPoints;

float gauss(float r){
  return 0.3989422804 * exp( 25.0 * (- r*r) / 2.0);
}

void main(void) {

	//vec2 coord = vTexCoord.xy*uScale-uTranslation;
  //if(coord.x >= 0.0 && coord.x <= 1.0 && coord.y >= 0.0 && coord.y <= 1.0)
  	//gl_FragColor = texture2D(uSampler0, coord);
  //else
	float dist = distance( gl_PointCoord, vec2(0.5) ); //dist in [0,0.5]
	//dist = 2.0*(dist);
	float val = gauss(dist / uBandwidth);
	float weight = 100.0 / uNumPoints;
	val = val * weight;
  gl_FragColor = vec4(val);
  
}
