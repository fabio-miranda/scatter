
function ColorScale(canvas){
  this.gl = null;
  this.canvas = canvas;
  this.scatterShader = null;
  this.selectionShader = null;
  this.maxdim = 0;
  this.mvMatrix = mat4.create();
  this.pMatrix = mat4.create();
  this.devicePixelRatio = 1;

  this.texsize = 256;
  this.texture = null;
  this.texdata = null;

  this.initGL();
  this.initShaders();

  this.quad = new quad(this.gl, true);
}

function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}

ColorScale.prototype.setValues = function(values, isLinear, hasAlpha){
  var scaleColor;
  var scaleAlpha;

  if(isLinear){
    scaleColor = d3.scale.linear()
      .domain(d3.range(0, 255+255.0/(values.length-1), 255.0/(values.length-1)));
    scaleAlpha = d3.scale.linear()
      .domain(d3.range(0, 255+255.0/(values.length-1), 255.0/(values.length-1)));
  }
  else{
    scaleColor = d3.scale.quantize() //quantize only takes two numbers as domain
      .domain([0,this.texsize]);
    scaleAlpha = d3.scale.quantize() //quantize only takes two numbers as domain
      .domain([0,this.texsize]);
  }

  scaleColor.range(values);
  scaleAlpha.range(d3.range(0, 255+255.0/(values.length-1), 255.0/(values.length-1)));

  //create texture
  this.texdata = new Uint8Array(4*this.texsize);
  for(var i=0; i<this.texsize; i++){
    var hex = scaleColor(i);
    var r = hexToR(hex);
    var g = hexToG(hex);
    var b = hexToB(hex);
    this.texdata[4*i] = r;
    this.texdata[4*i+1] = g;
    this.texdata[4*i+2] = b;

    if(hasAlpha)
      this.texdata[4*i+3] = scaleAlpha(i);
    else
      this.texdata[4*i+3] = 255.0;

  }

  this.texdata[4*0] = 255;
  this.texdata[4*0+1] = 255;
  this.texdata[4*0+2] = 255;
  this.texdata[4*0+3] = 0;

  //console.log(texData);

  this.texture = this.gl.createTexture();
  createTextureFromArray(this.gl, this.gl.NEAREST, this.texsize, 1, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.texdata, this.texture);

  this.draw();

}

ColorScale.prototype.draw = function(){

  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


  //mat4.ortho(this.pMatrix, 0, this.gl.viewportWidth, 0, this.gl.viewportHeight, 0, 1);
  mat4.identity(this.mvMatrix);
  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);

  this.gl.useProgram(this.simpleShader);

  this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);

  this.quad.draw(this.gl, this.simpleShader, this.mvMatrix, this.pMatrix, this.texture);

  this.gl.useProgram(null);

}

ColorScale.prototype.initShaders = function(){


  var fragmentShader = getShader(this.gl, "./js/glsl/colorscale.frag", true);
  var vertexShader = getShader(this.gl, "./js/glsl/simple.vert", false);

  this.simpleShader = this.gl.createProgram();
  this.gl.attachShader(this.simpleShader, vertexShader);
  this.gl.attachShader(this.simpleShader, fragmentShader);
  this.gl.linkProgram(this.simpleShader);

  if (!this.gl.getProgramParameter(this.simpleShader, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.simpleShader);

  this.simpleShader.vertexPositionAttribute = this.gl.getAttribLocation(this.simpleShader, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.simpleShader.vertexPositionAttribute);

  this.simpleShader.textureCoordAttribute = this.gl.getAttribLocation(this.simpleShader, "aTexCoord");
  this.gl.enableVertexAttribArray(this.simpleShader.textureCoordAttribute);

  this.simpleShader.pMatrixUniform = this.gl.getUniformLocation(this.simpleShader, "uPMatrix");
  this.simpleShader.mvMatrixUniform = this.gl.getUniformLocation(this.simpleShader, "uMVMatrix");

  this.gl.useProgram(null);

}

ColorScale.prototype.initGL = function(){

  //http://www.khronos.org/webgl/wiki/HandlingHighDPI
  this.devicePixelRatio = window.devicePixelRatio || 1;
  this.canvas.width = 10 * window.devicePixelRatio;
  this.canvas.height = this.texsize * window.devicePixelRatio;
  //this.canvas.addEventListener("mousedown", function(evt){that.mousedown(evt);}, false);
  //this.canvas.addEventListener("mouseup", function(evt){that.mouseup(evt);}, false);
  //this.canvas.addEventListener("mousemove", function(evt){that.mousemove(evt);}, false);

  this.gl = this.canvas.getContext("experimental-webgl");
  this.gl.viewportWidth = this.canvas.width;
  this.gl.viewportHeight = this.canvas.height;

  this.gl.disable(this.gl.DEPTH_TEST);
  this.gl.enable(this.gl.BLEND);
  this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);

  if (!this.gl){
    alert("Could not initialise Webgl.");
  }

}