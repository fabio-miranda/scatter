
function scattergl(canvas, datatile){
  this.canvas = canvas;
  this.datatile = datatile;
  this.gl = null;
  this.shaderProgram = null;
  this.texture = null;
  this.quadBuffer = null;
  this.texCoordBuffer = null;
  this.mvMatrix = mat4.create();
  this.pMatrix = mat4.create();

  this.initialize();
}

scattergl.prototype.initialize = function(){
  this.initGL(this.canvas);

  //texture
  this.texture = this.gl.createTexture();
  var image = new Image();
  image.src="data:image/png;base64,"+this.datatile;
  var that = this;
  image.onload = function(){
    createTexture(that.gl, that.gl.RGBA, that.gl.RGBA, that.gl.UNSIGNED_BYTE, image, that.texture);

    that.initShaders();
    that.initBuffers();

    that.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    that.gl.enable(that.gl.DEPTH_TEST);

    that.drawScene();
  }
}


scattergl.prototype.setMatrixUniforms = function(){
  this.gl.uniformMatrix4fv(this.shaderProgram.pMatrixUniform, false, this.pMatrix);
  this.gl.uniformMatrix4fv(this.shaderProgram.mvMatrixUniform, false, this.mvMatrix);
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

scattergl.prototype.initBuffers = function(){

  //vertices
  this.quadBuffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
  var vertices = [
       1.0,  1.0,  0.0,
      -1.0,  1.0,  0.0,
       1.0, -1.0,  0.0,
      -1.0, -1.0,  0.0
  ];
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
  this.quadBuffer.itemSize = 3;
  this.quadBuffer.numItems = 4;


  //tex coord
  this.texCoordBuffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
   
  var texCoords = [
       1.0,  1.0,
      -1.0,  1.0,
       1.0, -1.0,
      -1.0, -1.0,
  ];
   
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW);
  this.texCoordBuffer.itemSize = 2;
  this.texCoordBuffer.numItems = 4;
}


scattergl.prototype.initGL = function(){

  this.gl = this.canvas.getContext("experimental-webgl");
  this.gl.viewportWidth = this.canvas.width;
  this.gl.viewportHeight = this.canvas.height;

  if (!this.gl){
    alert("Could not initialise Webthis.gl.");
  }
}

scattergl.prototype.drawScene = function(){
  this.gl.viewport(0, 0, this.gl.viewportWidth, this.gl.viewportHeight);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);
  mat4.identity(this.mvMatrix);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
  this.gl.vertexAttribPointer(this.shaderProgram.vertexPositionAttribute, this.quadBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
  this.gl.vertexAttribPointer(this.shaderProgram.textureCoordAttribute, this.texCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
  
  this.gl.activeTexture(this.gl.TEXTURE0);
  this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  this.gl.uniform1i(this.gl.getUniformLocation(this.shaderProgram, "uSampler"), 0);

  this.setMatrixUniforms();
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadBuffer.numItems);
}
