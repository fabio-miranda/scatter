

function scatterquad(gl, i, j, dim1, dim2, image){
  this.quadBuffer = null;
  this.texCoordBuffer = null;
  this.i = i;
  this.j = j;
  this.dim1 = dim1;
  this.dim2 = dim2;
  this.quad = new quad(gl, image);
}

function selectionquad(gl){
  this.quad = new quad(gl);
  this.x = [0, 0];
  this.y = [0, 0];
}


function scattergl(canvas){
  this.canvas = canvas;
  this.scatterplots = {};
  this.gl = null;
  this.scatterShader = null;
  this.selectionShader = null;
  this.maxdim = 0;
  this.mvMatrix = mat4.create();
  this.pMatrix = mat4.create();
  this.mousestate = 'MOUSEUP';
  this.devicePixelRatio = 1;

  this.initGL();
  this.initShaders();

  this.selection = new selectionquad(this.gl);
}

scattergl.prototype.addscatter = function(i, j, dim1, dim2, image){

  //var dim;
  //if(dim1 < dim2)
    //dim = dim1+'_'+dim2;
  //else
    //dim = dim2+'_'+dim1;

  //if(this.scatterplots[i+' '+j] == null){
    this.scatterplots[i+' '+j] = new scatterquad(this.gl, i, j, dim1, dim2, image);
    this.maxdim = Math.max(i, j, this.maxdim);
  //}

}

scattergl.prototype.reset = function(){

  delete this.scatterplots;
  this.scatterplots = {};
  this.maxdim = 0;

}

scattergl.prototype.draw = function(){

  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);


  //plots

  var width = this.gl.viewportWidth / (this.maxdim + 1);
  var height = this.gl.viewportHeight / (this.maxdim + 1);
  //mat4.ortho(this.pMatrix, 0, this.gl.viewportWidth, 0, this.gl.viewportHeight, 0, 1);
  mat4.identity(this.mvMatrix);
  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);

  this.gl.useProgram(this.scatterShader);
  //for(var i=0; i<this.numdim; i++){
    //for(var j=0; j<this.numdim; j++){
  for(var ij in this.scatterplots) {

    //var dim1 , dim2 = dim.split('_');
      

    //mat4.identity(this.mvMatrix);
    //mat4.translate(this.mvMatrix, this.mvMatrix, [i*width, j*height, 0.0]);
    //mat4.scale(this.mvMatrix, this.mvMatrix, [width, height, 1.0]);
    var scatter = this.scatterplots[ij];
    var i = scatter.i;
    var j = scatter.j;

    this.gl.viewport(i*width, j*height, width, height);
    scatter.quad.draw(this.gl, this.scatterShader, this.mvMatrix, this.pMatrix);

    //this.gl.viewport(j*width, i*height, width, height);
    //scatter.draw(this.gl, this.shaderProgram, this.mvMatrix, this.pMatrix);

    //if(scatter.dim1 > scatter.dim2)
      //scatter.draw(this.gl, this.shaderProgram, this.mvMatrix, this.pMatrix);
    //else
      //scatter.draw(this.gl, this.shaderProgram, this.mvMatrix, this.pMatrix);
      
    
  }

  //selection
  //if(this.mousestate == 'MOUSEDOWN'){
    this.gl.useProgram(this.selectionShader);
    var x, width, y, height;

    if(this.selection.x[0] < this.selection.x[1]){
      x = this.selection.x[0];
      width = this.selection.x[1] - x;
    }
    else{
      x = this.selection.x[1];
      width = this.selection.x[0] - x;
    }

    if(this.selection.y[0] < this.selection.y[1]){
      y = this.selection.y[0];
      height = this.selection.y[1] - y;
    }
    else{
      y = this.selection.y[1];
      height = this.selection.y[0] - y;
    }

    this.gl.viewport(x, y, width, height);
    this.selection.quad.draw(this.gl, this.selectionShader, this.mvMatrix, this.pMatrix);
  //}

  this.gl.useProgram(null);

}


scattergl.prototype.initShaders = function(){

  //scatter
  var fragmentShader = getShader(this.gl, "./js/glsl/scatter.frag", true);
  var vertexShader = getShader(this.gl, "./js/glsl/scatter.vert", false);

  this.scatterShader = this.gl.createProgram();
  this.gl.attachShader(this.scatterShader, vertexShader);
  this.gl.attachShader(this.scatterShader, fragmentShader);
  this.gl.linkProgram(this.scatterShader);

  if (!this.gl.getProgramParameter(this.scatterShader, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.scatterShader);

  this.scatterShader.vertexPositionAttribute = this.gl.getAttribLocation(this.scatterShader, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.scatterShader.vertexPositionAttribute);

  this.scatterShader.textureCoordAttribute = this.gl.getAttribLocation(this.scatterShader, "aTextureCoord");
  this.gl.enableVertexAttribArray(this.scatterShader.textureCoordAttribute);

  this.scatterShader.pMatrixUniform = this.gl.getUniformLocation(this.scatterShader, "uPMatrix");
  this.scatterShader.mvMatrixUniform = this.gl.getUniformLocation(this.scatterShader, "uMVMatrix");

  //selection
  var fragmentShader = getShader(this.gl, "./js/glsl/selection.frag", true);
  var vertexShader = getShader(this.gl, "./js/glsl/selection.vert", false);

  this.selectionShader = this.gl.createProgram();
  this.gl.attachShader(this.selectionShader, vertexShader);
  this.gl.attachShader(this.selectionShader, fragmentShader);
  this.gl.linkProgram(this.selectionShader);

  if (!this.gl.getProgramParameter(this.selectionShader, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.selectionShader);

  this.selectionShader.vertexPositionAttribute = this.gl.getAttribLocation(this.selectionShader, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.selectionShader.vertexPositionAttribute);

  this.selectionShader.pMatrixUniform = this.gl.getUniformLocation(this.selectionShader, "uPMatrix");
  this.selectionShader.mvMatrixUniform = this.gl.getUniformLocation(this.selectionShader, "uMVMatrix");

  this.gl.useProgram(null);

}

function getxy(that, evt){
  var rect = that.canvas.getBoundingClientRect();
  var x = that.devicePixelRatio * (evt.clientX - rect.left);
  var y = that.devicePixelRatio * (evt.clientY - rect.top);

  return [x, that.gl.viewportHeight - y];
}

scattergl.prototype.mousedown = function(evt){

  var xy = getxy(this, evt);

  if(this.mousestate == 'MOUSEUP'){
    this.mousestate = 'MOUSEDOWN';
    this.selection.x[0] = xy[0];
    this.selection.y[0] = xy[1];
    this.selection.x[1] = xy[0];
    this.selection.y[1] = xy[1];
  }

  this.draw();
}

scattergl.prototype.mouseup = function(evt){

  var xy = getxy(this, evt);

  if(this.mousestate == 'MOUSEDOWN'){
    this.mousestate = 'MOUSEUP';
    this.selection.x[1] = xy[0];
    this.selection.y[1] = xy[1];
  }

  

  this.draw();
}

scattergl.prototype.mousemove = function(evt){

  if(this.mousestate != 'MOUSEDOWN')
    return;

  var xy = getxy(this, evt);

  this.selection.x[1] = xy[0];
  this.selection.y[1] = xy[1];

  this.draw();

}


scattergl.prototype.initGL = function(){

  var that = this;

  //http://www.khronos.org/webgl/wiki/HandlingHighDPI
  this.devicePixelRatio = window.devicePixelRatio || 1;
  this.canvas.width = this.canvas.clientWidth * this.devicePixelRatio;
  this.canvas.height = this.canvas.clientHeight * this.devicePixelRatio;
  this.canvas.addEventListener("mousedown", function(evt){that.mousedown(evt);}, false);
  this.canvas.addEventListener("mouseup", function(evt){that.mouseup(evt);}, false);
  this.canvas.addEventListener("mousemove", function(evt){that.mousemove(evt);}, false);

  this.gl = this.canvas.getContext("experimental-webgl");
  this.gl.viewportWidth = this.canvas.width;
  this.gl.viewportHeight = this.canvas.height;

  this.gl.disable(this.gl.DEPTH_TEST);
  this.gl.enable(this.gl.BLEND);
  this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);

  if (!this.gl){
    alert("Could not initialise Webthis.gl.");
  }
}
