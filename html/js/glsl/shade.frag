#extension GL_OES_standard_derivatives : enable

precision mediump float;

varying highp vec2 vTexCoord;
uniform float uNumBins;
uniform float uUseDensity;
uniform float uPassValue;
uniform float uNumPassValues;
uniform sampler2D uSamplerF;
uniform sampler2D uSamplerColorScale;
uniform sampler2D uSamplerFinal;


void main(void) {

  vec2 coord = vTexCoord.xy;
  float f = texture2D(uSamplerF, coord).r;

  if(uUseDensity > 0.0){
    vec4 color = texture2D(uSamplerColorScale, vec2(f, 0));
    gl_FragColor = vec4(color.rgb*color.a, color.a); //TODO: multiply color by alpha?
    /*
    float fnext = texture2D(uSamplerF, coord + vec2(10.0/uNumBins, 0.0)).r;
    vec3 colornext = texture2D(uSamplerColorScale, vec2(f, 0)).rgb;
    float df = distance(color.rgb,colornext.rgb);
    if(df > 0.0)
    	gl_FragColor = vec4(0,0,0,color.a);
		*/
  }
  else{
    vec4 oldcolor = texture2D(uSamplerFinal, vTexCoord);
    //oldcolor.a = 1.0;
    //gl_FragColor = oldcolor+vec4(0.25, 0.0, 0.0, 0);
    //return;

    //vec3 color = texture2D(uSamplerColorScale, vec2(uPassValue/(uNumPassValues+1.0) + f/(uNumPassValues+1.0), 0)).rgb;
    vec4 newcolor = texture2D(uSamplerColorScale, vec2(uPassValue/(uNumPassValues+1.0), 0));
    newcolor.a = texture2D(uSamplerColorScale, vec2(f, 0)).a;
    //newcolor.a = newcolor.a*0.5;

    //TODO: use premultipled alpha? http://en.wikibooks.org/wiki/GLSL_Programming/Unity/Transparency
    vec4 finalcolor;
    finalcolor.rgb = newcolor.a * newcolor.rgb + (1.0 - newcolor.a) * oldcolor.rgb;
    finalcolor.a = newcolor.a + oldcolor.a;
    //newcolor.a = 0.5;
    gl_FragColor = finalcolor;
  }


  /*
  if(uUseDensity > 0.0){
	  vec3 color = texture2D(uSamplerColorScale, vec2(f, 0)).rgb;
	  float alpha = texture2D(uSamplerColorScale, vec2(f, 0)).a;
	  gl_FragColor = vec4(color.xyz*alpha, alpha); //TODO: multiply color by alpha?
	}
	else{
	  vec4 oldcolor = texture2D(uSamplerFinal, vTexCoord);
	  //oldcolor.a = 1.0;
	  //gl_FragColor = oldcolor+vec4(0.25, 0.0, 0.0, 0);
	  //return;

	  //vec3 color = texture2D(uSamplerColorScale, vec2(uPassValue/(uNumPassValues+1.0) + f/(uNumPassValues+1.0), 0)).rgb;
	  vec4 newcolor = texture2D(uSamplerColorScale, vec2(uPassValue/(uNumPassValues+1.0), 0));
	  newcolor.a = texture2D(uSamplerColorScale, vec2(f, 0)).a;
	  //newcolor.a = newcolor.a*0.5;

	  //TODO: use premultipled alpha? http://en.wikibooks.org/wiki/GLSL_Programming/Unity/Transparency
	  vec4 finalcolor;
	  finalcolor.rgb = newcolor.a * newcolor.rgb + (1.0 - newcolor.a) * oldcolor.rgb;
	  finalcolor.a = newcolor.a + oldcolor.a;
	  //newcolor.a = 0.5;
	  gl_FragColor = finalcolor;

	}
  */
}
