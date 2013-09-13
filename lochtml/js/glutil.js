
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

function deleteFBO(gl, fbo){
  if(gl.isFramebuffer(fbo))
    gl.deleteFramebuffer(fbo);
}

function clearFBO(gl, fbo){
  gl.bindFramebuffer( gl.FRAMEBUFFER, fbo);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer( gl.FRAMEBUFFER, null );
}

function createFBO(gl, interpolation, width, height, iformat, format, type, tex, fbo){

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture( gl.TEXTURE_2D, tex );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpolation);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpolation); 

  //gl.texImage2D( gl.TEXTURE_2D, 0, gl.ALPHA, w,h, 0, gl.ALPHA, gl.FLOAT, null );    
  gl.texImage2D(gl.TEXTURE_2D, 0, iformat, width, height, 0, format, type, null);

  gl.bindTexture( gl.TEXTURE_2D, null );
  gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );
  gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 );

  gl.checkFramebufferStatus( gl.FRAMEBUFFER );

  gl.bindFramebuffer( gl.FRAMEBUFFER, null );

}

function createTextureFromArray(gl, interpolation, width, height, iformat, format, type, data, tex){

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpolation);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpolation); 

  gl.texImage2D(gl.TEXTURE_2D, 0, iformat, width, height, 0, format, type, data);


  gl.bindTexture(gl.TEXTURE_2D, null);

  //delete [] initialvalues;

}

function createTextureFromImage(gl, interpolation, iformat, format, type, image, tex){

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, interpolation);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, interpolation); 

  gl.texImage2D(gl.TEXTURE_2D, 0, iformat, format, type, image);


  gl.bindTexture(gl.TEXTURE_2D, null);

  //delete [] initialvalues;

}

function distance(x0, y0, x1, y1){
    return Math.sqrt((x0 -= x1) * x0 + (y0 -= y1) * y0);
};

function points(gl, hasTexture){

  this.gl = gl;
  this.array = {};
  this.pointsBuffer = null;
  this.color = null;
  this.hasTexture = hasTexture;

  this.pointsBuffer = gl.createBuffer();
  this.pointsBuffer.itemSize = 2;
  /*
  if(this.hasTexture){
    //tex coord
    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    
    
    var texCoords = [
         1.0,  1.0,
         0.0,  1.0,
         1.0,  0.0,
         0.0,  0.0,
    ];
    

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
    this.texCoordBuffer.itemSize = 2;
    this.texCoordBuffer.numItems = 4;
  }
  */
  this.numrasterpoints = 0;

}

points.prototype.add = function(x, y, group){

  if(this.array[group] == null)
    this.array[group] = [];
  
  this.array[group].push(x);
  this.array[group].push(y);

  this.numrasterpoints+=1.0;

  //TODO: optimize? Do we really need to call bufferData for every point inserted?
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pointsBuffer);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.array[group]), this.gl.DYNAMIC_DRAW);
  //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, 0);
}

points.prototype.reset = function(){

  for(group in this.array){
    this.array[group].length = 0;
    delete this.array[group];
  }
  
  this.array = {};
  this.numrasterpoints=0;
}


points.prototype.draw = function(shaderProgram, mvMatrix, pMatrix, group, tex0, tex1){

  if(this.array[group] == null)
    return;

  //TODO: optimize? Do we really need to call bufferData for every point inserted?
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pointsBuffer);
  var numpoints = this.array[group].length / 2;
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.array[group]), this.gl.DYNAMIC_DRAW);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  //TODO: do this every frame?
  this.gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pointsBuffer);
  this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointsBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

  if(tex0 != null){
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex0);
    this.gl.uniform1i(shaderProgram.sampler0, 0);
  }

  if(tex1 != null){
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex1);
    this.gl.uniform1i(shaderProgram.sampler1, 1);
  }


  this.gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  this.gl.drawArrays(this.gl.POINTS, 0, numpoints);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  this.gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  if(tex0 != null)
    this.gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
}

function lines(gl){

  this.gl = gl;
  this.array = {};
  this.linesBuffer = null;
  this.color = null;

  this.linesBuffer = [];
  this.linesBuffer.itemSize = 2;

  this.numrasterpoints = 0;

}

lines.prototype.reset = function(x, y){

  for(group in this.array){
    this.array[group].length = 0;
    delete this.array[group];
  }
  
  this.array = {};
  this.numrasterpoints=0;
}

lines.prototype.add = function(x0, y0, group){

  if(this.array[group] == null){
    this.array[group] = [];
    this.linesBuffer[group] = this.gl.createBuffer();
  }

  this.array[group].push(x0);
  this.array[group].push(y0);
  //this.array.push(x1);
  //this.array.push(y1);

  var length = this.array[group].length;
  if(length > 2){
    this.numrasterpoints += distance(x0, y0, this.array[group][length-4], this.array[group][length-3]);
  }
  //this.numrasterpoints+=0.01;

  //TODO: optimize? Do we really need to call bufferData for every point inserted?
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linesBuffer[group]);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.array[group]), this.gl.DYNAMIC_DRAW);
  //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, 0);

}


lines.prototype.draw = function(shaderProgram, mvMatrix, pMatrix, group){

  if(this.array[group] == null)
    return;

  var numlines = this.array[group].length / 2;

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  //TODO: do this every frame?
  this.gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.linesBuffer[group]);
  this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.linesBuffer.itemSize, this.gl.FLOAT, false, 0, 0);


  this.gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  this.gl.drawArrays(this.gl.LINE_STRIP, 0, numlines);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  this.gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}



function quad(gl, hasTexture){
  this.gl = gl;
  this.quadBuffer = null;
  this.texCoordBuffer = null;
  this.color = null;
  this.hasTexture = hasTexture;

  this.initBuffers(gl);

}

quad.prototype.initBuffers = function(){

  //vertices
  this.quadBuffer = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
  var vertices = [
       1.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       1.0,  0.0,  0.0,
       0.0,  0.0,  0.0
  ];
  this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
  this.quadBuffer.itemSize = 3;
  this.quadBuffer.numItems = 4;

  if(this.hasTexture){
    //tex coord
    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    
    
    var texCoords = [
         1.0,  1.0,
         0.0,  1.0,
         1.0,  0.0,
         0.0,  0.0,
    ];
    

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW);
    this.texCoordBuffer.itemSize = 2;
    this.texCoordBuffer.numItems = 4;
  }

}

quad.prototype.draw = function(shaderProgram, mvMatrix, pMatrix, tex0, tex1, tex2, tex3, tex4){

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  //TODO: do this every frame?
  this.gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);
  this.gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.quadBuffer.itemSize, this.gl.FLOAT, false, 0, 0);
  
  if(tex0 != null){
    this.gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.texCoordBuffer.itemSize, this.gl.FLOAT, false, 0, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex0);
    this.gl.uniform1i(shaderProgram.sampler0, 0);
  }

  if(tex1 != null){
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex1);
    this.gl.uniform1i(shaderProgram.sampler1, 1);
  }

  if(tex2 != null){
    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex2);
    this.gl.uniform1i(shaderProgram.sampler2, 2);
  }

  if(tex3 != null){
    this.gl.activeTexture(this.gl.TEXTURE3);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex3);
    this.gl.uniform1i(shaderProgram.sampler3, 3);
  }

  if(tex4 != null){
    this.gl.activeTexture(this.gl.TEXTURE4);
    this.gl.bindTexture(this.gl.TEXTURE_2D, tex4);
    this.gl.uniform1i(shaderProgram.sampler4, 4);
  }

  this.gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  this.gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, this.quadBuffer.numItems);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  this.gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  if(tex0 != null)
    this.gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);

}

