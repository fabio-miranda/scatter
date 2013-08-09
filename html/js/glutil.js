
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

function points(gl){

  this.array = [];
  this.pointsBuffer = null;
  this.color = null;

  this.pointsBuffer = gl.createBuffer();
  this.pointsBuffer.itemSize = 2;

  this.numrasterpoints = 0;

}

points.prototype.add = function(x, y, group){
  
  this.array.push(x);
  this.array.push(y);

  this.numrasterpoints++;
}

points.prototype.reset = function(x, y){
  
  this.array.length = 0;
  this.numrasterpoints=0;
}


points.prototype.draw = function(gl, shaderProgram, mvMatrix, pMatrix){

  //TODO: optimize? Do we really need to call bufferData for every point inserted?
  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  var numpoints = this.array.length / 2;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.array), gl.DYNAMIC_DRAW);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  //TODO: do this every frame?
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.pointsBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.pointsBuffer.itemSize, gl.FLOAT, false, 0, 0);


  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.POINTS, 0, numpoints);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}

function lines(gl){

  this.array = {};
  this.linesBuffer = null;
  this.color = null;

  this.linesBuffer = gl.createBuffer();
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

  if(this.array[group] == null)
    this.array[group] = [];

  console.log(group);

  this.array[group].push(x0);
  this.array[group].push(y0);
  //this.array.push(x1);
  //this.array.push(y1);

  //this.numrasterpoints += distance(x0, y0, x1, y1);
  this.numrasterpoints+=1;

}


lines.prototype.draw = function(gl, shaderProgram, mvMatrix, pMatrix, group){

  if(this.array[group] == null)
    return;

  //TODO: optimize? Do we really need to call bufferData for every point inserted?
  gl.bindBuffer(gl.ARRAY_BUFFER, this.linesBuffer);
  var numlines = this.array[group].length / 2;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.array[group]), gl.DYNAMIC_DRAW);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  //TODO: do this every frame?
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.linesBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.linesBuffer.itemSize, gl.FLOAT, false, 0, 0);


  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.LINE_STRIP, 0, numlines);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
}



function quad(gl, hasTexture){

  this.quadBuffer = null;
  this.texCoordBuffer = null;
  this.color = null;
  this.hasTexture = hasTexture;

  this.initBuffers(gl);

}

quad.prototype.initBuffers = function(gl){

  //vertices
  this.quadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
  var vertices = [
       1.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       1.0,  0.0,  0.0,
       0.0,  0.0,  0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  this.quadBuffer.itemSize = 3;
  this.quadBuffer.numItems = 4;

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

}

quad.prototype.draw = function(gl, shaderProgram, mvMatrix, pMatrix, tex0, tex1, tex2, tex3, tex4){

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  //TODO: do this every frame?
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.quadBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  if(tex0 != null){
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, this.texCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex0);
    gl.uniform1i(shaderProgram.sampler0, 0);
  }

  if(tex1 != null){
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tex1);
    gl.uniform1i(shaderProgram.sampler1, 1);
  }

  if(tex2 != null){
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, tex2);
    gl.uniform1i(shaderProgram.sampler2, 2);
  }

  if(tex3 != null){
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, tex3);
    gl.uniform1i(shaderProgram.sampler3, 3);
  }

  if(tex4 != null){
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, tex4);
    gl.uniform1i(shaderProgram.sampler4, 4);
  }


  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.quadBuffer.numItems);

  //see: http://www.mjbshaw.com/2013/03/webgl-fixing-invalidoperation.html
  gl.disableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  if(tex0 != null)
    gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
}

