
function getShader(gl, filename, isFragShader) {


  var xmlhttp = new XMLHttpRequest(); 
  xmlhttp.open("GET", filename, false); 
  xmlhttp.send(); 
  var str = xmlhttp.responseText;


  var shader;
  if (isFragShader)
      shader = gl.createShader(gl.FRAGMENT_SHADER);
  else
      shader = gl.createShader(gl.VERTEX_SHADER);

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
  }

  return shader;
}

function createTexture(gl, iformat, format, type, image, tex){

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); 

  gl.texImage2D(gl.TEXTURE_2D, 0, iformat, format, type, image);


  gl.bindTexture(gl.TEXTURE_2D, null);

  //delete [] initialvalues;

}

function quad(gl, texture2d, texture4d){

  this.quadBuffer = null;
  this.texCoordBuffer = null;
  this.color = null;
  this.texture2d = texture2d;
  this.texture4d = texture4d;

  this.initBuffers(gl);

}

quad.prototype.initBuffers = function(gl){

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

  if(this.texture2d != null){
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

}

quad.prototype.draw = function(gl, shaderProgram, mvMatrix, pMatrix){

  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.quadBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  if(this.texture2d != null){
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture2d);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler0"), 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture2d);
    gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler1"), 0);
  }

  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.quadBuffer.numItems);
}

