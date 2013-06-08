

function scatterquad(gl, image){
  this.quadBuffer = null;
  this.texCoordBuffer = null;

  this.texture = gl.createTexture();
  createTexture(gl, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image, this.texture);

  this.initBuffers(gl);

}

scatterquad.prototype.initBuffers = function(gl){

  //vertices
  this.quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
  var vertices = [
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
       1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  this.quadBuffer.itemSize = 3;
  this.quadBuffer.numItems = 4;


  //tex coord
  this.texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
   
  var texCoords = [
       1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
      -1.0, -1.0,
  ];
   
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
  this.texCoordBuffer.itemSize = 2;
  this.texCoordBuffer.numItems = 4;

}

scatterquad.prototype.draw = function(gl, shaderProgram, mvMatrix, pMatrix){

  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.quadBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.quadBuffer.numItems);
}


function scattergl(canvas){
  this.canvas = canvas;
  this.scatterplots = {};
  this.gl = null;
  this.shaderProgram = null;
  this.numdim = 0;
  this.mvMatrix = mat4.create();
  this.pMatrix = mat4.create();

  this.initGL(this.canvas);
  this.initShaders();
}

scattergl.prototype.addscatter = function(i, j, image){

  if(this.scatterplots[i] == null){
    this.scatterplots[i] = {};
    this.numdim++;
  }

  
  this.scatterplots[i][j] = new scatterquad(this.gl, image);

}

scattergl.prototype.reset = function(){

  delete this.scatterplots;
  this.scatterplots = {};
  this.numdim = 0;

}

scattergl.prototype.draw = function(){
  console.log('called');

  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);
  mat4.identity(this.mvMatrix);

  for(var i=0; i<this.numdim; i++){
    for(var j=0; j<this.numdim; j++){
      var width = this.gl.viewportWidth / this.numdim;
      var height = this.gl.viewportHeight / this.numdim;
      this.gl.viewport(i*width, j*height, width, height);
      if(i > j)
        this.scatterplots[i][j].draw(this.gl, this.shaderProgram, this.mvMatrix, this.pMatrix);
      else
        this.scatterplots[j][i].draw(this.gl, this.shaderProgram, this.mvMatrix, this.pMatrix);
      
    }
  }
}


scattergl.prototype.initShaders = function(){
  var fragmentShader = getShader(this.gl, "shader-fs");
  var vertexShader = getShader(this.gl, "shader-vs");

  this.shaderProgram = this.gl.createProgram();
  this.gl.attachShader(this.shaderProgram, vertexShader);
  this.gl.attachShader(this.shaderProgram, fragmentShader);
  this.gl.linkProgram(this.shaderProgram);

  if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.shaderProgram);

  this.shaderProgram.vertexPositionAttribute = this.gl.getAttribLocation(this.shaderProgram, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.shaderProgram.vertexPositionAttribute);

  this.shaderProgram.textureCoordAttribute = this.gl.getAttribLocation(this.shaderProgram, "aTextureCoord");
  this.gl.enableVertexAttribArray(this.shaderProgram.textureCoordAttribute);

  this.shaderProgram.pMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uPMatrix");
  this.shaderProgram.mvMatrixUniform = this.gl.getUniformLocation(this.shaderProgram, "uMVMatrix");
}


scattergl.prototype.initGL = function(){

  this.gl = this.canvas.getContext("experimental-webgl");
  this.gl.viewportWidth = this.canvas.width;
  this.gl.viewportHeight = this.canvas.height;

  if (!this.gl){
    alert("Could not initialise Webthis.gl.");
  }
}
