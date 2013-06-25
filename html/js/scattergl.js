

function ScatterQuad(gl, i, j, dim1, dim2){
  this.i = i;
  this.j = j;
  this.dim1 = dim1;
  this.dim2 = dim2;
  this.quad = new quad(gl, true);
}

function SelectionQuad(gl){
  this.quad = new quad(gl, false);
  this.p0 = [0, 0];
  this.p1 = [0, 0];
  this.bottomleft = [0, 0];
  this.topright = [0, 0];//[gl.viewportWidth, gl.viewportHeight];
}

function Datatile(gl, numrelations, image, imgsize, numdim, imgdim0, imgdim1, numbin){
  this.image = image;
  this.imgsize = imgsize;
  this.numdim = numdim;
  this.imgdim0 = imgdim0;
  this.imgdim1 = imgdim1;
  this.numbin = numbin;

  this.texture = gl.createTexture();
  createTexture(gl, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image, this.texture);
}

SelectionQuad.prototype.updateBB = function(){
  this.bottomleft[0] = Math.min(this.p0[0], this.p1[0]);
  this.bottomleft[1] = Math.min(this.p0[1], this.p1[1]);
  this.topright[0] = Math.max(this.p0[0], this.p1[0]);
  this.topright[1] = Math.max(this.p0[1], this.p1[1]);
}


function ScatterGL(canvas){
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

  this.numbin = null;
  this.datatiles = {};
  this.histogram = null;

  this.initGL();
  this.initShaders();

  this.selection = new SelectionQuad(this.gl);
}


ScatterGL.prototype.update = function(numrelations, image, imgsize, numdim, imgdim0, imgdim1, numbin){

  var index = imgdim0+' '+imgdim1;

  if(this.datatiles[numrelations] == null)
    this.datatiles[numrelations] = {};

  this.numbin = numbin;
  this.numdim = numdim;
  this.datatiles[numrelations][index] = new Datatile(this.gl, numrelations, image, imgsize, numdim, imgdim0, imgdim1, numbin);

}

ScatterGL.prototype.addscatter = function(i, j, dim1, dim2){

  //var dim;
  //if(dim1 < dim2)
    //dim = dim1+'_'+dim2;
  //else
    //dim = dim2+'_'+dim1;

  //if(this.scatterplots[i+' '+j] == null){
  this.scatterplots[i+' '+j] = new ScatterQuad(this.gl, i, j, dim1, dim2);
  this.maxdim = Math.max(i, j, this.maxdim);
  //}

}

ScatterGL.prototype.setHistogram = function(histogram){

  this.histogram = histogram;

}



ScatterGL.prototype.reset = function(){

  delete this.scatterplots;
  this.scatterplots = {};
  this.maxdim = 0;

}

ScatterGL.prototype.getSelection = function(){

  var uSelectionQuad = {};
  uSelectionQuad.x = this.selection.bottomleft[0] / this.gl.viewportWidth;
  uSelectionQuad.y = this.selection.bottomleft[1] / this.gl.viewportHeight;
  uSelectionQuad.z = this.selection.topright[0] / this.gl.viewportWidth;
  uSelectionQuad.w = this.selection.topright[1] / this.gl.viewportHeight;
  var sizeBin = (1.0 / (this.maxdim + 1.0)) / this.numbin;
  var datatilei = Math.floor(uSelectionQuad.z * (this.maxdim+1));
  var datatilej = Math.floor(uSelectionQuad.w * (this.maxdim+1));
  var rangei0 = Math.floor((uSelectionQuad.x / sizeBin) - datatilei * this.numbin);
  var rangei1 = Math.floor((uSelectionQuad.z / sizeBin) - datatilei * this.numbin);
  var rangej0 = Math.floor((uSelectionQuad.y / sizeBin) - datatilej * this.numbin);
  var rangej1 = Math.floor((uSelectionQuad.w / sizeBin) - datatilej * this.numbin);

  var selection = {};
  selection.datatilei = datatilei;
  selection.datatilej = datatilej;
  selection.rangei0 = rangei0;
  selection.rangei1 = rangei1;
  selection.rangej0 = rangej0;
  selection.rangej1 = rangej1;

  return selection;

}

ScatterGL.prototype.draw = function(){

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

    var selection = this.getSelection();

    this.gl.uniform2f(this.scatterShader.dim, scatter.dim1, scatter.dim2);
    //this.gl.uniform2f(this.scatterShader.sizeDataTile, this.sizedatatile[2], this.sizedatatile[4]);
    this.gl.uniform1f(this.scatterShader.numDim, this.numdim);
    this.gl.uniform1f(this.scatterShader.maxDim, this.maxdim);
    this.gl.uniform1f(this.scatterShader.numBins, this.numbin);
    this.gl.uniform2f(this.scatterShader.selectionDim, selection.datatilei, selection.datatilej);
    this.gl.uniform4f(this.scatterShader.selectionBinRange,
      selection.rangei0, selection.rangei1, selection.rangej0, selection.rangej1
    );
    /*
    this.gl.uniform4f(
      this.scatterShader.SelectionQuad,
      this.selection.bottomleft[0] / this.gl.viewportWidth,
      this.selection.bottomleft[1] / this.gl.viewportHeight,
      this.selection.topright[0] / this.gl.viewportWidth,
      this.selection.topright[1] / this.gl.viewportHeight
    );
    */
    //console.log(this.scatterShader.selectionBinRange);
    //console.log(rangei0+' '+rangei1+' '+rangej0+' '+rangej1);
    scatter.quad.draw(
      this.gl,
      this.scatterShader,
      this.mvMatrix,
      this.pMatrix,
      this.datatiles['2']['0 4'].texture,
      this.datatiles['4']['0 4'].texture
    );

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
    var width, height;

    /*    if(this.selection.x[0] < this.selection.x[1]){
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
    */
    
    width = this.selection.topright[0] - this.selection.bottomleft[0];
    height = this.selection.topright[1] - this.selection.bottomleft[1];
    this.gl.viewport(this.selection.bottomleft[0], this.selection.bottomleft[1], width, height);
    this.selection.quad.draw(this.gl, this.selectionShader, this.mvMatrix, this.pMatrix);
  //}

  this.gl.useProgram(null);

}


ScatterGL.prototype.initShaders = function(){

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

  this.scatterShader.textureCoordAttribute = this.gl.getAttribLocation(this.scatterShader, "aTexCoord");
  this.gl.enableVertexAttribArray(this.scatterShader.textureCoordAttribute);

  this.scatterShader.dim = this.gl.getUniformLocation(this.scatterShader, 'uDim');
  //this.scatterShader.sizeDataTile = this.gl.getUniformLocation(this.scatterShader, 'uSizeDataTile');
  this.scatterShader.numBins = this.gl.getUniformLocation(this.scatterShader, 'uNumBins');
  this.scatterShader.maxDim = this.gl.getUniformLocation(this.scatterShader, 'uMaxDim');
  this.scatterShader.numDim = this.gl.getUniformLocation(this.scatterShader, 'uNumDim');
  this.scatterShader.selectionDim = this.gl.getUniformLocation(this.scatterShader, 'uSelectionDim');
  this.scatterShader.selectionBinRange = this.gl.getUniformLocation(this.scatterShader, 'uSelectionBinRange');
  //this.scatterShader.SelectionQuad = this.gl.getUniformLocation(this.scatterShader, 'uSelectionQuad');

  this.scatterShader.pMatrixUniform = this.gl.getUniformLocation(this.scatterShader, "uPMatrix");
  this.scatterShader.mvMatrixUniform = this.gl.getUniformLocation(this.scatterShader, "uMVMatrix");

  this.gl.useProgram(null);

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

ScatterGL.prototype.mousedown = function(evt){

  var xy = getxy(this, evt);

  if(this.mousestate == 'MOUSEUP'){
    this.mousestate = 'MOUSEDOWN';
    this.selection.p0 = xy;
    this.selection.p1 = xy;
    this.selection.updateBB();
  }

  this.draw();
  if(this.histogram != null) this.histogram.draw(this.getSelection());
}

ScatterGL.prototype.mouseup = function(evt){

  var xy = getxy(this, evt);

  if(this.mousestate == 'MOUSEDOWN'){
    this.mousestate = 'MOUSEUP';
    this.selection.p1 = xy;
    this.selection.updateBB();
  }

  
  this.draw();
  if(this.histogram != null) this.histogram.draw(this.getSelection());
}

ScatterGL.prototype.mousemove = function(evt){

  if(this.mousestate != 'MOUSEDOWN')
    return;

  var xy = getxy(this, evt);

  this.selection.p1 = xy;
  this.selection.updateBB();

  this.draw();
  if(this.histogram != null) this.histogram.draw(this.getSelection());

}


ScatterGL.prototype.initGL = function(){

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
  //this.gl.clearColor(1, 0, 0, 1);

  if (!this.gl){
    alert("Could not initialise Webgl.");
  }
}
