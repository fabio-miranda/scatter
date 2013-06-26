

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

function Datatile(gl, numrelations, image, imgsize, numdim, index, numbin){
  this.image = image;
  this.imgsize = imgsize;
  this.numdim = numdim;
  this.index = index;
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
  this.numdim = 0;
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


ScatterGL.prototype.update = function(numrelations, image, imgsize, numdim, dimperimage, index, numbin){


  if(this.datatiles[numrelations] == null)
    this.datatiles[numrelations] = {};

  this.numbin = numbin;
  this.numdim = numdim;
  this.datatiles[numrelations]['dimperimage'] = dimperimage;
  this.datatiles[numrelations][index] = new Datatile(this.gl, numrelations, image, imgsize, numdim, index, numbin);

}

ScatterGL.prototype.addscatter = function(i, j, dim1, dim2){

  this.scatterplots[i+' '+j] = new ScatterQuad(this.gl, i, j, dim1, dim2);
  this.maxdim = Math.max(i, j, this.maxdim);

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
  mat4.identity(this.mvMatrix);
  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);

  this.gl.useProgram(this.scatterShader);

  if(this.datatiles['2'] != null && this.datatiles['4'] != null){

    for(var ij in this.scatterplots) {

      var selection = this.getSelection();

      var scatter = this.scatterplots[ij];
      var i = scatter.i;
      var j = scatter.j;

      var dim0 = Math.floor(scatter.i / this.datatiles['2']['dimperimage']);
      var dim1 = Math.floor(scatter.j / this.datatiles['2']['dimperimage']);
      var dim2 = Math.floor(selection.datatilei / this.datatiles['4']['dimperimage']);
      var dim3 = Math.floor(selection.datatilei / this.datatiles['4']['dimperimage']);
      
      //var index2 = Math.floor(scatter.dim1/this.datatiles['2'].dimperimage)+' '+(Math.floor(scatter.dim2/this.datatiles['2'].dimperimage)+1);
      //var index4 = Math.floor(scatter.dim1/this.datatiles['4'].dimperimage)+' '+(Math.floor(scatter.dim2/this.datatiles['4'].dimperimage)+1);
      var index2 = dim0+' '+dim1;
      var index4 = dim0+' '+dim1+' '+dim2+' '+dim3;
      console.log(selection.datatilei);
      console.log(index4);

      //Check if textures have been loaded
      if(this.datatiles['2'][index2] != null && this.datatiles['4'][index4] != null){

        this.gl.viewport(i*width, j*height, width, height);

        this.gl.uniform2f(this.scatterShader.dim, scatter.dim1, scatter.dim2);
        this.gl.uniform1f(this.scatterShader.numDim, this.numdim);
        this.gl.uniform1f(this.scatterShader.maxDim, this.maxdim);
        this.gl.uniform1f(this.scatterShader.numBins, this.numbin);
        this.gl.uniform2f(this.scatterShader.selectionDim, selection.datatilei, selection.datatilej);
        this.gl.uniform4f(this.scatterShader.selectionBinRange,
          selection.rangei0, selection.rangei1, selection.rangej0, selection.rangej1
        );
        //var index2 = '0 4'
        //var index4 = '0 4';
        scatter.quad.draw(
          this.gl,
          this.scatterShader,
          this.mvMatrix,
          this.pMatrix,
          this.datatiles['2'][index2].texture,
          this.datatiles['4'][index4].texture
        );
      }
    }
  }

  //selection
  this.gl.useProgram(this.selectionShader);
  var width, height;
  
  width = this.selection.topright[0] - this.selection.bottomleft[0];
  height = this.selection.topright[1] - this.selection.bottomleft[1];
  if(width > 0 && height > 0){
    this.gl.viewport(this.selection.bottomleft[0], this.selection.bottomleft[1], width, height);
    this.selection.quad.draw(this.gl, this.selectionShader, this.mvMatrix, this.pMatrix);
  }

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
  this.scatterShader.numBins = this.gl.getUniformLocation(this.scatterShader, 'uNumBins');
  this.scatterShader.maxDim = this.gl.getUniformLocation(this.scatterShader, 'uMaxDim');
  this.scatterShader.numDim = this.gl.getUniformLocation(this.scatterShader, 'uNumDim');
  this.scatterShader.selectionDim = this.gl.getUniformLocation(this.scatterShader, 'uSelectionDim');
  this.scatterShader.selectionBinRange = this.gl.getUniformLocation(this.scatterShader, 'uSelectionBinRange');

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
