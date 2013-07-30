
measureTime = true;

function ScatterQuad(gl, i, j, dim1, dim2, dim3){
  this.i = i;
  this.j = j;
  this.dim1 = dim1;
  this.dim2 = dim2;
  this.dim3 = dim3;
  this.quad = new quad(gl, true);
}

function SelectionQuad(gl){
  this.quad = new quad(gl, false);
  this.p0 = [0, 0];
  this.p1 = [0, 0];
  this.bottomleft = [0, 0];
  this.topright = [0, 0];//[gl.viewportWidth, gl.viewportHeight];
}

function Datatile(gl, image, imgsize, numpoints, numdim, index, numbin, minvalue, maxvalue){
  this.image = image;
  this.imgsize = imgsize;
  this.numpoints = numpoints;
  this.numdim = numdim;
  this.index = index;
  this.numbin = numbin;
  this.minvalue = minvalue;
  this.maxvalue = maxvalue;

  this.texture = gl.createTexture();
  createTextureFromImage(gl, gl.NEAREST, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image, this.texture);
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
  this.bandwidth = 0.01;
  this.kdetype = 'KDE';
  this.rendertype = 'Single'
  this.drawReady = false;
  this.drawOutliers = false;
  this.zoomLevel = 0.0;
  this.outliersThreshold = 0.5;
  this.outliersSize = 4.0;
  this.translation = [0.0,0.0];

  this.numbin = null;
  this.datatiles = {};
  this.histogram = null;
  this.colorscaletex = null;
  this.useDensity = false;

  this.initGL();
  this.initShaders();

  this.fbo1 = this.gl.createFramebuffer();
  this.fbotex1 = this.gl.createTexture();
  this.fbo2 = this.gl.createFramebuffer();
  this.fbotex2 = this.gl.createTexture();
  this.fbofinal = this.gl.createFramebuffer();
  this.fbotexfinal = this.gl.createTexture();
  //createFBO(this.gl, this.canvas.width, this.canvas.height, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.fbotex, this.fbo);

  this.finalquad = new quad(this.gl, true);

  this.selection = new SelectionQuad(this.gl);
}


ScatterGL.prototype.update = function(type, image, imgsize, numpoints, numdim, index, numbin, minvalue, maxvalue){


  if(this.datatiles[type] == null)
    this.datatiles[type] = {};

  this.numbin = numbin;
  this.numdim = numdim;
  this.datatiles[type][index] = new Datatile(this.gl, image, imgsize, numpoints, numdim, index, numbin, minvalue, maxvalue);

  //For float textures, only NEAREST is supported? (http://www.khronos.org/registry/gles/extensions/OES/OES_texture_float.txt)
  createFBO(this.gl, this.gl.LINEAR, this.numbin, this.numbin, this.gl.RGBA, this.gl.RGBA, this.gl.FLOAT, this.fbotex1, this.fbo1);
  createFBO(this.gl, this.gl.LINEAR, this.numbin, this.numbin, this.gl.RGBA, this.gl.RGBA, this.gl.FLOAT, this.fbotex2, this.fbo2);
  createFBO(this.gl, this.gl.LINEAR, this.numbin, this.numbin, this.gl.RGBA, this.gl.RGBA, this.gl.FLOAT, this.fbotexfinal, this.fbofinal);

  this.updateTexture();
}

ScatterGL.prototype.addscatter = function(i, j, dim1, dim2, dim3){

  if(this.scatterplots[i+' '+j] != null) return;

  if(dim3 == 'density'){
    this.useDensity = true;
    dim3 = 0;
  }
  else{
    this.useDensity = false;
  }

  this.scatterplots[i+' '+j] = new ScatterQuad(this.gl, i, j, dim1, dim2, dim3);
  this.maxdim = Math.max(i, j, this.maxdim);

  this.updateTexture();

}

ScatterGL.prototype.setHistogram = function(histogram){

  this.histogram = histogram;

}

ScatterGL.prototype.setColorScale = function(colorscalevalues){

  //No shared resource. I create the texture two times, one for each canvas
  this.colorscaletex = this.gl.createTexture();
  createTextureFromArray(this.gl, this.gl.NEAREST, colorscalevalues.length/4, 1, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, colorscalevalues, this.colorscaletex);

  this.updateTexture();

}

ScatterGL.prototype.changeBandwidth = function(bandwidth){

  this.bandwidth = bandwidth;

  this.updateTexture();

}

ScatterGL.prototype.changeZoom = function(delta){
  this.zoomLevel += delta;
}

ScatterGL.prototype.setZoom = function(zoomLevel){
  this.zoomLevel = zoomLevel;
}

ScatterGL.prototype.changeKDEType = function(kdetype){

  this.kdetype = kdetype;

  this.updateTexture();

}

ScatterGL.prototype.changeRenderType = function(rendertype){

  this.rendertype = rendertype;

  this.updateTexture();

}

ScatterGL.prototype.changeOutliers = function(drawOutliers){

  this.drawOutliers = drawOutliers;

  this.updateTexture();

}

ScatterGL.prototype.setOutliersThreshold = function(value){

  this.outliersThreshold = value;

  this.updateTexture();

}

ScatterGL.prototype.setOutliersSize = function(value){

  this.outliersSize = value;

  this.updateTexture();

}

ScatterGL.prototype.changeWindowSize = function(windowSize){

  this.windowSize = windowSize;

  this.updateTexture();

}

ScatterGL.prototype.changeMeanSize = function(meanSize){

  this.meanSize = meanSize;

  this.updateTexture();

}

ScatterGL.prototype.hasDataTile = function(type, i, j, k){

  var index = i+' '+j;

  if(k != null)
    index = index+' '+k;

  if(this.datatiles[type] == null)
    return false;

  if(this.datatiles[type][index] == null)
    return false

  return true;
}



ScatterGL.prototype.reset = function(){

  delete this.scatterplots;
  this.scatterplots = {};
  this.maxdim = 0;

}


ScatterGL.prototype.resetDataTiles = function(){

  delete this.datatiles;
  this.datatiles = {};

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

ScatterGL.prototype.updateKDE = function(scatter, index01, index012, pass, numgroups, width, height){

  this.gl.useProgram(this.multipass_kdeShader);

  //horizontal pass
  this.gl.viewport(0, 0, this.numbin, this.numbin);
  //this.gl.viewport(i*width, j*height, width, height);
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo2);
  this.gl.uniform1f(this.multipass_kdeShader.minCountValue, this.datatiles['count'][index01].minvalue);
  this.gl.uniform1f(this.multipass_kdeShader.maxCountValue, this.datatiles['count'][index01].maxvalue);
  this.gl.uniform1f(this.multipass_kdeShader.minIndexValue, this.datatiles['index'][index01].minvalue);
  this.gl.uniform1f(this.multipass_kdeShader.maxIndexValue, this.datatiles['index'][index01].maxvalue);
  this.gl.uniform1f(this.multipass_kdeShader.minEntryValue, this.datatiles['entry'][index012].minvalue);
  this.gl.uniform1f(this.multipass_kdeShader.maxEntryValue, this.datatiles['entry'][index012].maxvalue);
  this.gl.uniform1f(this.multipass_kdeShader.numBins, this.numbin);
  this.gl.uniform1f(this.multipass_kdeShader.numPoints, this.datatiles['count'][index01].numpoints);
  this.gl.uniform1f(this.multipass_kdeShader.bandwidth, this.bandwidth);
  this.gl.uniform1f(this.multipass_kdeShader.windowSize, this.windowSize);
  this.gl.uniform1f(this.multipass_kdeShader.isFirstPass, 1.0);
  this.gl.uniform1f(this.multipass_kdeShader.useDensity, this.useDensity);
  this.gl.uniform1f(this.multipass_kdeShader.entryDataTileWidth, this.datatiles['entry'][index012].imgsize);
  this.gl.uniform1f(this.multipass_kdeShader.passValue, this.datatiles['entry'][index012].minvalue+pass);
  this.gl.uniform1f(this.multipass_kdeShader.numPassValues, numgroups);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  scatter.quad.draw(
    this.gl,
    this.multipass_kdeShader,
    this.mvMatrix,
    this.pMatrix,
    this.datatiles['count'][index01].texture,
    this.colorscaletex,
    this.datatiles['index'][index01].texture,
    this.datatiles['entry'][index012].texture
  );
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
  //return;

  //vertical pass
  this.gl.viewport(0, 0, this.numbin, this.numbin);
  //this.gl.viewport(i*width, j*height, width, height);
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbofinal);
  if(pass==0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  this.gl.uniform1f(this.multipass_kdeShader.isFirstPass, 0.0);
  
  scatter.quad.draw(
    this.gl,
    this.multipass_kdeShader,
    this.mvMatrix,
    this.pMatrix,
    this.fbotex2,
    this.colorscaletex,
    this.datatiles['index'][index01].texture,
    this.datatiles['entry'][index012].texture
  );
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );

  this.gl.useProgram(null);
}

ScatterGL.prototype.updateSingleAKDEPass = function(akdePass, isHorizontal, scatter, index01, index012, pass, numgroups, tex){

  this.gl.uniform1f(this.multipass_akdeShader[akdePass].minCountValue, this.datatiles['count'][index01].minvalue);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].maxCountValue, this.datatiles['count'][index01].maxvalue);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].minIndexValue, this.datatiles['index'][index01].minvalue);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].maxIndexValue, this.datatiles['index'][index01].maxvalue);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].minEntryValue, this.datatiles['entry'][index012].minvalue);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].maxEntryValue, this.datatiles['entry'][index012].maxvalue);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].numBins, this.numbin);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].numPoints, this.datatiles['count'][index01].numpoints);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].bandwidth, this.bandwidth);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].windowSize, this.windowSize);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].isFirstPass, isHorizontal);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].useDensity, this.useDensity);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].entryDataTileWidth, this.datatiles['entry'][index012].imgsize);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].passValue, this.datatiles['entry'][index012].minvalue+pass);
  this.gl.uniform1f(this.multipass_akdeShader[akdePass].numPassValues, numgroups);

  scatter.quad.draw(
    this.gl,
    this.multipass_akdeShader[akdePass],
    this.mvMatrix,
    this.pMatrix,
    tex,
    this.colorscaletex,
    this.datatiles['index'][index01].texture,
    this.datatiles['entry'][index012].texture
  );

}

ScatterGL.prototype.updateAKDE = function(scatter, index01, index012, pass, numgroups, width, height){

  //first pass (f)
  {
    this.gl.useProgram(this.multipass_akdeShader[0]);

    //horizontal pass
    this.gl.viewport(0, 0, this.numbin, this.numbin);
    //this.gl.viewport(i*width, j*height, width, height);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.updateSingleAKDEPass(0, 1, scatter, index01, index012, pass, numgroups, this.datatiles['count'][index01].texture);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
    //return;

    //vertical pass
    this.gl.viewport(0, 0, this.numbin, this.numbin);
    //this.gl.viewport(i*width, j*height, width, height);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo2);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.updateSingleAKDEPass(0, 0, scatter, index01, index012, pass, numgroups, this.fbotex1);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
    //return;
  }


  //second pass (g)
  {
    this.gl.useProgram(this.multipass_akdeShader[1]);

    this.gl.uniform1f(this.multipass_akdeShader[1].meanSize, this.meanSize);

    //horizontal pass
    this.gl.viewport(0, 0, this.numbin, this.numbin);
    //this.gl.viewport(i*width, j*height, width, height);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.updateSingleAKDEPass(1, 1, scatter, index01, index012, pass, numgroups, this.fbotex2);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
    //return;

    /*
    //vertical pass
    //this.gl.viewport(0, 0, this.numbin, this.numbin);
    this.gl.viewport(i*width, j*height, width, height);
    //this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo2);
    this.gl.uniform1f(this.multipass_akdeShader[1].isFirstPass, 0.0);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    scatter.quad.draw(
      this.gl,
      this.multipass_akdeShader[1],
      this.mvMatrix,
      this.pMatrix,
      this.fbotex1,
      null
    );
    //this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null);
    return;
    */
  }


  //third pass (^f)
  {
    this.gl.useProgram(this.multipass_akdeShader[2]);

    //horizontal pass
    this.gl.viewport(0, 0, this.numbin, this.numbin);
    //this.gl.viewport(i*width, j*height, width, height);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo2);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.updateSingleAKDEPass(2, 1, scatter, index01, index012, pass, numgroups, this.fbotex1);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
    //return;

    //vertical pass
    this.gl.viewport(0, 0, this.numbin, this.numbin);
    //this.gl.viewport(i*width, j*height, width, height);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbofinal);
    if(pass==0)
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.updateSingleAKDEPass(2, 0, scatter, index01, index012, pass, numgroups, this.fbotex2, this.colorscaletex);
    this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
  }

}

ScatterGL.prototype.updateDiscrete = function(scatter, index01, index012, width, height){

  this.gl.useProgram(this.discreteShader);

  this.gl.uniform1f(this.discreteShader.minCountValue, this.datatiles['count'][index01].minvalue);
  this.gl.uniform1f(this.discreteShader.maxCountValue, this.datatiles['count'][index01].maxvalue);
  this.gl.uniform1f(this.discreteShader.minIndexValue, this.datatiles['index'][index01].minvalue);
  this.gl.uniform1f(this.discreteShader.maxIndexValue, this.datatiles['index'][index01].maxvalue);
  this.gl.uniform1f(this.discreteShader.minEntryValue, this.datatiles['entry'][index012].minvalue);
  this.gl.uniform1f(this.discreteShader.maxEntryValue, this.datatiles['entry'][index012].maxvalue);
  this.gl.uniform1f(this.discreteShader.useDensity, this.useDensity);
  this.gl.uniform1f(this.discreteShader.entryDataTileWidth, this.datatiles['entry'][index012].imgsize);

  this.gl.viewport(0, 0, this.numbin, this.numbin);
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbofinal);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  scatter.quad.draw(
    this.gl,
    this.discreteShader,
    this.mvMatrix,
    this.pMatrix,
    this.datatiles['count'][index01].texture,
    this.colorscaletex,
    this.datatiles['index'][index01].texture,
    this.datatiles['entry'][index012].texture
  );
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null);
  this.gl.useProgram(null);

}

ScatterGL.prototype.updateOutliers = function(scatter, index01, index012, numgroups){

  this.gl.useProgram(this.outliersShader);

  //horizontal pass
  this.gl.viewport(0, 0, this.numbin, this.numbin);
  //this.gl.viewport(i*width, j*height, width, height);
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo1);
  this.gl.uniform1f(this.outliersShader.minCountValue, this.datatiles['count'][index01].minvalue);
  this.gl.uniform1f(this.outliersShader.maxCountValue, this.datatiles['count'][index01].maxvalue);
  this.gl.uniform1f(this.outliersShader.minIndexValue, this.datatiles['index'][index01].minvalue);
  this.gl.uniform1f(this.outliersShader.maxIndexValue, this.datatiles['index'][index01].maxvalue);
  this.gl.uniform1f(this.outliersShader.minEntryValue, this.datatiles['entry'][index012].minvalue);
  this.gl.uniform1f(this.outliersShader.maxEntryValue, this.datatiles['entry'][index012].maxvalue);
  this.gl.uniform1f(this.outliersShader.numBins, this.numbin);
  this.gl.uniform1f(this.outliersShader.numPoints, this.datatiles['count'][index01].numpoints);
  this.gl.uniform1f(this.outliersShader.bandwidth, this.bandwidth);
  this.gl.uniform1f(this.outliersShader.outliersSize, this.outliersSize);
  this.gl.uniform1f(this.outliersShader.isFirstPass, 1.0);
  this.gl.uniform1f(this.outliersShader.useDensity, this.useDensity);
  this.gl.uniform1f(this.outliersShader.entryDataTileWidth, this.datatiles['entry'][index012].imgsize);
  this.gl.uniform1f(this.outliersShader.numPassValues, numgroups);
  this.gl.uniform1f(this.outliersShader.outliersThreshold, this.outliersThreshold);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  scatter.quad.draw(
    this.gl,
    this.outliersShader,
    this.mvMatrix,
    this.pMatrix,
    this.datatiles['count'][index01].texture,
    this.colorscaletex,
    this.datatiles['index'][index01].texture,
    this.datatiles['entry'][index012].texture,
    this.fbotexfinal
  );
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );
  //return;

  //vertical pass
  this.gl.viewport(0, 0, this.numbin, this.numbin);
  //this.gl.viewport(i*width, j*height, width, height);
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbo2);

  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  this.gl.uniform1f(this.outliersShader.isFirstPass, 0.0);
  
  scatter.quad.draw(
    this.gl,
    this.outliersShader,
    this.mvMatrix,
    this.pMatrix,
    this.fbotex1,
    this.colorscaletex,
    this.datatiles['index'][index01].texture,
    this.datatiles['entry'][index012].texture,
    this.fbotexfinal
  );
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );

  this.gl.useProgram(null);

  //just send to final tex
  this.gl.useProgram(this.simpleShader);
  this.gl.viewport(0, 0, this.numbin, this.numbin);
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, this.fbofinal);
  this.gl.uniform2f(this.simpleShader.scale, 1.0, 1.0);
  this.gl.uniform2f(this.simpleShader.translation, 0.0, 0.0);


  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  
  scatter.quad.draw(
    this.gl,
    this.simpleShader,
    this.mvMatrix,
    this.pMatrix,
    this.fbotex2
  );
  this.gl.bindFramebuffer( this.gl.FRAMEBUFFER, null );

  this.gl.useProgram(null);

}


ScatterGL.prototype.updateTexture = function(){

  if(this.scatterplots['0 0'] == null)
    return;
  
  this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

  //plots
  //var width = this.gl.viewportWidth / (this.maxdim + 1);
  //var height = this.gl.viewportHeight / (this.maxdim + 1);
  var width = this.canvas.width / (this.maxdim + 1);
  var height = this.canvas.height / (this.maxdim + 1);
  mat4.identity(this.mvMatrix);
  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);

  var scatter = this.scatterplots['0 0'];
  var dim0 = scatter.dim1;
  var dim1 = scatter.dim2;
  var dim2 = scatter.dim3;

  if(this.hasDataTile('count', dim0, dim1) && this.hasDataTile('index', dim0, dim1) && this.hasDataTile('entry', dim0, dim1, dim2)){
    var now1, now1;
    if(measureTime)
      now1 = window.performance.now();

    this.drawReady = true;
    var index01 = dim0+' '+dim1;
    var index012 = dim0+' '+dim1+' '+dim2;

    
    //render
    var numgroups;
    var startgroup;
    if(this.useDensity)
      numgroups = 1;
    else
      numgroups = this.datatiles['entry'][index012].maxvalue - this.datatiles['entry'][index012].minvalue + 1;

    
    if(this.rendertype == 'Multi' && this.kdetype == 'KDE'){
      for(var i=0; i<numgroups; i++){
        this.updateKDE(scatter, index01, index012, i, numgroups, width, height);
      }
    }
    else if(this.rendertype == 'Multi' && this.kdetype == 'AKDE'){
      for(var i=0; i<numgroups; i++){
        this.updateAKDE(scatter, index01, index012, i, numgroups, width, height);
      }
    }
    else if(this.rendertype == 'Single' && this.kdetype == 'KDE'){
      this.updateKDE(scatter, index01, index012, 0, numgroups, width, height);
    }
    else if(this.rendertype == 'Single' && this.kdetype == 'AKDE'){
      this.updateAKDE(scatter, index01, index012, 0, numgroups, width, height);
    }
    else if(this.kdetype == 'Discrete'){
      this.updateDiscrete(scatter, index01, index012, width, height);
    }

    if(this.drawOutliers){
      this.updateOutliers(scatter, index01, index012, numgroups);
    }

    if(measureTime){
      //glfinish does not work (equal to glflush)
      //to make sure everything is done by the time we measure the time, just do a readPixels, instead of glfinish
      var pixelValues = new Uint8Array(4 * 1);
      this.gl.readPixels(0, 0, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixelValues);
      
      var now2 = window.performance.now();
      console.log(now2 - now1);

    }
  }
}

ScatterGL.prototype.draw = function(){

  //this.update();

  if(this.drawReady == false) return;

  //var width = this.gl.viewportWidth / (this.maxdim + 1);
  //var height = this.gl.viewportHeight / (this.maxdim + 1);
  var width = this.canvas.width / (this.maxdim + 1);
  var height = this.canvas.height / (this.maxdim + 1);

  mat4.identity(this.mvMatrix);
  mat4.ortho(this.pMatrix, 0, 1, 0, 1, 0, 1);

  this.gl.useProgram(this.simpleShader);
  this.gl.viewport(0, 0, width, height);
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  this.gl.uniform2f(this.simpleShader.scale, 1.0-this.zoomLevel, 1.0-this.zoomLevel);
  this.gl.uniform2f(this.simpleShader.translation, this.translation[0]/this.gl.viewportWidth, this.translation[1]/this.gl.viewportHeight);

  this.finalquad.draw(
    this.gl,
    this.simpleShader,
    this.mvMatrix,
    this.pMatrix,
    this.fbotexfinal
  );

  this.gl.useProgram(null);

  //selection
  /*
  this.gl.useProgram(this.selectionShader);
  var width, height;
  
  width = this.selection.topright[0] - this.selection.bottomleft[0];
  height = this.selection.topright[1] - this.selection.bottomleft[1];
  if(width > 0 && height > 0){
    this.gl.viewport(this.selection.bottomleft[0], this.selection.bottomleft[1], width, height);
    this.selection.quad.draw(this.gl, this.selectionShader, this.mvMatrix, this.pMatrix);
  }
  */
}


ScatterGL.prototype.initShaders = function(){
  /*
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
  this.scatterShader.minValue = this.gl.getUniformLocation(this.scatterShader, 'uMinValue');
  this.scatterShader.maxValue = this.gl.getUniformLocation(this.scatterShader, 'uMaxValue');
  this.scatterShader.numDim = this.gl.getUniformLocation(this.scatterShader, 'uNumDim');
  this.scatterShader.selectionDim = this.gl.getUniformLocation(this.scatterShader, 'uSelectionDim');
  this.scatterShader.selectionBinRange = this.gl.getUniformLocation(this.scatterShader, 'uSelectionBinRange');
  this.scatterShader.sampler0 = this.gl.getUniformLocation(this.scatterShader, "uSampler0");
  this.scatterShader.sampler0 = this.gl.getUniformLocation(this.scatterShader, "uSampler1");

  this.scatterShader.pMatrixUniform = this.gl.getUniformLocation(this.scatterShader, "uPMatrix");
  this.scatterShader.mvMatrixUniform = this.gl.getUniformLocation(this.scatterShader, "uMVMatrix");

  this.gl.useProgram(null);
  */
  //kde
  var fragmentShader = getShader(this.gl, "./js/glsl/multipass_kde.frag", true);
  var vertexShader = getShader(this.gl, "./js/glsl/simple.vert", false);

  this.multipass_kdeShader = this.gl.createProgram();
  this.gl.attachShader(this.multipass_kdeShader, vertexShader);
  this.gl.attachShader(this.multipass_kdeShader, fragmentShader);
  this.gl.linkProgram(this.multipass_kdeShader);

  if (!this.gl.getProgramParameter(this.multipass_kdeShader, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.multipass_kdeShader);

  this.multipass_kdeShader.vertexPositionAttribute = this.gl.getAttribLocation(this.multipass_kdeShader, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.multipass_kdeShader.vertexPositionAttribute);

  this.multipass_kdeShader.textureCoordAttribute = this.gl.getAttribLocation(this.multipass_kdeShader, "aTexCoord");
  this.gl.enableVertexAttribArray(this.multipass_kdeShader.textureCoordAttribute);

  this.multipass_kdeShader.minCountValue = this.gl.getUniformLocation(this.multipass_kdeShader, 'uMinCountValue');
  this.multipass_kdeShader.maxCountValue = this.gl.getUniformLocation(this.multipass_kdeShader, 'uMaxCountValue');
  this.multipass_kdeShader.minIndexValue = this.gl.getUniformLocation(this.multipass_kdeShader, 'uMinIndexValue');
  this.multipass_kdeShader.maxIndexValue = this.gl.getUniformLocation(this.multipass_kdeShader, 'uMaxIndexValue');
  this.multipass_kdeShader.minEntryValue = this.gl.getUniformLocation(this.multipass_kdeShader, 'uMinEntryValue');
  this.multipass_kdeShader.maxEntryValue = this.gl.getUniformLocation(this.multipass_kdeShader, 'uMaxEntryValue');
  this.multipass_kdeShader.numBins = this.gl.getUniformLocation(this.multipass_kdeShader, 'uNumBins');
  this.multipass_kdeShader.isFirstPass = this.gl.getUniformLocation(this.multipass_kdeShader, 'uIsFirstPass');
  this.multipass_kdeShader.useDensity = this.gl.getUniformLocation(this.multipass_kdeShader, 'uUseDensity');
  this.multipass_kdeShader.bandwidth = this.gl.getUniformLocation(this.multipass_kdeShader, 'uBandwidth');
  this.multipass_kdeShader.windowSize = this.gl.getUniformLocation(this.multipass_kdeShader, 'uWindowSize');
  this.multipass_kdeShader.numPoints = this.gl.getUniformLocation(this.multipass_kdeShader, 'uNumPoints');
  this.multipass_kdeShader.sampler0 = this.gl.getUniformLocation(this.multipass_kdeShader, "uSamplerCount");
  this.multipass_kdeShader.sampler1 = this.gl.getUniformLocation(this.multipass_kdeShader, "uSamplerColorScale");
  this.multipass_kdeShader.sampler2 = this.gl.getUniformLocation(this.multipass_kdeShader, "uSamplerIndex");
  this.multipass_kdeShader.sampler3 = this.gl.getUniformLocation(this.multipass_kdeShader, "uSamplerEntry");
  this.multipass_kdeShader.entryDataTileWidth = this.gl.getUniformLocation(this.multipass_kdeShader, "uEntryDataTileWidth");
  this.multipass_kdeShader.passValue = this.gl.getUniformLocation(this.multipass_kdeShader, "uPassValue");
  this.multipass_kdeShader.numPassValues = this.gl.getUniformLocation(this.multipass_kdeShader, "uNumPassValues");


  this.multipass_kdeShader.pMatrixUniform = this.gl.getUniformLocation(this.multipass_kdeShader, "uPMatrix");
  this.multipass_kdeShader.mvMatrixUniform = this.gl.getUniformLocation(this.multipass_kdeShader, "uMVMatrix");

  this.gl.useProgram(null);


  //akde
  this.multipass_akdeShader = [];
  for(var i=0; i<3; i++){

    var fragmentShader = getShader(this.gl, "./js/glsl/multipass_akde"+i+".frag", true);
    var vertexShader = getShader(this.gl, "./js/glsl/simple.vert", false);

    this.multipass_akdeShader[i] = this.gl.createProgram();
    this.gl.attachShader(this.multipass_akdeShader[i], vertexShader);
    this.gl.attachShader(this.multipass_akdeShader[i], fragmentShader);
    this.gl.linkProgram(this.multipass_akdeShader[i]);

    if (!this.gl.getProgramParameter(this.multipass_akdeShader[i], this.gl.LINK_STATUS)) {
      alert("Could not initialise shaders");
    }

    this.gl.useProgram(this.multipass_akdeShader[i]);

    this.multipass_akdeShader[i].vertexPositionAttribute = this.gl.getAttribLocation(this.multipass_akdeShader[i], "aVertexPosition");
    this.gl.enableVertexAttribArray(this.multipass_akdeShader[i].vertexPositionAttribute);

    this.multipass_akdeShader[i].textureCoordAttribute = this.gl.getAttribLocation(this.multipass_akdeShader[i], "aTexCoord");
    this.gl.enableVertexAttribArray(this.multipass_akdeShader[i].textureCoordAttribute);

    this.multipass_akdeShader[i].minCountValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uMinCountValue');
    this.multipass_akdeShader[i].maxCountValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uMaxCountValue');
    this.multipass_akdeShader[i].minIndexValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uMinIndexValue');
    this.multipass_akdeShader[i].maxIndexValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uMaxIndexValue');
    this.multipass_akdeShader[i].minEntryValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uMinEntryValue');
    this.multipass_akdeShader[i].maxEntryValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uMaxEntryValue');
    this.multipass_akdeShader[i].numBins = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uNumBins');
    this.multipass_akdeShader[i].isFirstPass = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uIsFirstPass');
    this.multipass_akdeShader[i].useDensity = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uUseDensity');
    this.multipass_akdeShader[i].bandwidth = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uBandwidth');
    this.multipass_akdeShader[i].windowSize = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uWindowSize');
    this.multipass_akdeShader[i].numPoints = this.gl.getUniformLocation(this.multipass_akdeShader[i], 'uNumPoints');
    this.multipass_akdeShader[i].sampler0 = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uSamplerCount");
    this.multipass_akdeShader[i].sampler1 = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uSamplerColorScale");
    this.multipass_akdeShader[i].sampler2 = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uSamplerIndex");
    this.multipass_akdeShader[i].sampler3 = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uSamplerEntry");
    this.multipass_akdeShader[i].entryDataTileWidth = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uEntryDataTileWidth");
    this.multipass_akdeShader[i].passValue = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uPassValue");
    this.multipass_akdeShader[i].numPassValues = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uNumPassValues");


    this.multipass_akdeShader[i].pMatrixUniform = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uPMatrix");
    this.multipass_akdeShader[i].mvMatrixUniform = this.gl.getUniformLocation(this.multipass_akdeShader[i], "uMVMatrix");

    this.gl.useProgram(null);

  }

  this.multipass_akdeShader[1].meanSize = this.gl.getUniformLocation(this.multipass_akdeShader[1], 'uMeanSize');

  //discrete
  var fragmentShader = getShader(this.gl, "./js/glsl/discrete.frag", true);
  var vertexShader = getShader(this.gl, "./js/glsl/simple.vert", false);

  this.discreteShader = this.gl.createProgram();
  this.gl.attachShader(this.discreteShader, vertexShader);
  this.gl.attachShader(this.discreteShader, fragmentShader);
  this.gl.linkProgram(this.discreteShader);

  if (!this.gl.getProgramParameter(this.discreteShader, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.discreteShader);

  this.discreteShader.vertexPositionAttribute = this.gl.getAttribLocation(this.discreteShader, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.discreteShader.vertexPositionAttribute);

  this.discreteShader.textureCoordAttribute = this.gl.getAttribLocation(this.discreteShader, "aTexCoord");
  this.gl.enableVertexAttribArray(this.discreteShader.textureCoordAttribute);

  this.discreteShader.minCountValue = this.gl.getUniformLocation(this.discreteShader, 'uMinCountValue');
  this.discreteShader.maxCountValue = this.gl.getUniformLocation(this.discreteShader, 'uMaxCountValue');
  this.discreteShader.minIndexValue = this.gl.getUniformLocation(this.discreteShader, 'uMinIndexValue');
  this.discreteShader.maxIndexValue = this.gl.getUniformLocation(this.discreteShader, 'uMaxIndexValue');
  this.discreteShader.minEntryValue = this.gl.getUniformLocation(this.discreteShader, 'uMinEntryValue');
  this.discreteShader.maxEntryValue = this.gl.getUniformLocation(this.discreteShader, 'uMaxEntryValue');
  this.discreteShader.numBins = this.gl.getUniformLocation(this.discreteShader, 'uNumBins');
  this.discreteShader.isFirstPass = this.gl.getUniformLocation(this.discreteShader, 'uIsFirstPass');
  this.discreteShader.useDensity = this.gl.getUniformLocation(this.discreteShader, 'uUseDensity');
  this.discreteShader.bandwidth = this.gl.getUniformLocation(this.discreteShader, 'uBandwidth');
  this.discreteShader.windowSize = this.gl.getUniformLocation(this.discreteShader, 'uWindowSize');
  this.discreteShader.numPoints = this.gl.getUniformLocation(this.discreteShader, 'uNumPoints');
  this.discreteShader.sampler0 = this.gl.getUniformLocation(this.discreteShader, "uSamplerCount");
  this.discreteShader.sampler1 = this.gl.getUniformLocation(this.discreteShader, "uSamplerColorScale");
  this.discreteShader.sampler2 = this.gl.getUniformLocation(this.discreteShader, "uSamplerIndex");
  this.discreteShader.sampler3 = this.gl.getUniformLocation(this.discreteShader, "uSamplerEntry");
  this.discreteShader.entryDataTileWidth = this.gl.getUniformLocation(this.discreteShader, "uEntryDataTileWidth");

  this.discreteShader.pMatrixUniform = this.gl.getUniformLocation(this.discreteShader, "uPMatrix");
  this.discreteShader.mvMatrixUniform = this.gl.getUniformLocation(this.discreteShader, "uMVMatrix");

  this.gl.useProgram(null);

  //zoom
  var fragmentShader = getShader(this.gl, "./js/glsl/zoom.frag", true);
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

  this.simpleShader.translation = this.gl.getUniformLocation(this.simpleShader, "uTranslation");
  this.simpleShader.scale = this.gl.getUniformLocation(this.simpleShader, "uScale");
  this.simpleShader.sampler0 = this.gl.getUniformLocation(this.simpleShader, "uSampler0");

  this.simpleShader.pMatrixUniform = this.gl.getUniformLocation(this.simpleShader, "uPMatrix");
  this.simpleShader.mvMatrixUniform = this.gl.getUniformLocation(this.simpleShader, "uMVMatrix");

  this.gl.useProgram(null);

  //outliers
  var fragmentShader = getShader(this.gl, "./js/glsl/outliers.frag", true);
  var vertexShader = getShader(this.gl, "./js/glsl/simple.vert", false);

  this.outliersShader = this.gl.createProgram();
  this.gl.attachShader(this.outliersShader, vertexShader);
  this.gl.attachShader(this.outliersShader, fragmentShader);
  this.gl.linkProgram(this.outliersShader);

  if (!this.gl.getProgramParameter(this.outliersShader, this.gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  this.gl.useProgram(this.outliersShader);

  this.outliersShader.vertexPositionAttribute = this.gl.getAttribLocation(this.outliersShader, "aVertexPosition");
  this.gl.enableVertexAttribArray(this.outliersShader.vertexPositionAttribute);

  this.outliersShader.textureCoordAttribute = this.gl.getAttribLocation(this.outliersShader, "aTexCoord");
  this.gl.enableVertexAttribArray(this.outliersShader.textureCoordAttribute);

  this.outliersShader.minCountValue = this.gl.getUniformLocation(this.outliersShader, 'uMinCountValue');
  this.outliersShader.maxCountValue = this.gl.getUniformLocation(this.outliersShader, 'uMaxCountValue');
  this.outliersShader.minIndexValue = this.gl.getUniformLocation(this.outliersShader, 'uMinIndexValue');
  this.outliersShader.maxIndexValue = this.gl.getUniformLocation(this.outliersShader, 'uMaxIndexValue');
  this.outliersShader.minEntryValue = this.gl.getUniformLocation(this.outliersShader, 'uMinEntryValue');
  this.outliersShader.maxEntryValue = this.gl.getUniformLocation(this.outliersShader, 'uMaxEntryValue');
  this.outliersShader.numBins = this.gl.getUniformLocation(this.outliersShader, 'uNumBins');
  this.outliersShader.isFirstPass = this.gl.getUniformLocation(this.outliersShader, 'uIsFirstPass');
  this.outliersShader.bandwidth = this.gl.getUniformLocation(this.outliersShader, 'uBandwidth');
  this.outliersShader.outliersSize = this.gl.getUniformLocation(this.outliersShader, 'uOutliersSize');
  this.outliersShader.numPoints = this.gl.getUniformLocation(this.outliersShader, 'uNumPoints');
  this.outliersShader.sampler0 = this.gl.getUniformLocation(this.outliersShader, "uSamplerCount");
  this.outliersShader.sampler1 = this.gl.getUniformLocation(this.outliersShader, "uSamplerColorScale");
  this.outliersShader.sampler2 = this.gl.getUniformLocation(this.outliersShader, "uSamplerIndex");
  this.outliersShader.sampler3 = this.gl.getUniformLocation(this.outliersShader, "uSamplerEntry");
  this.outliersShader.sampler4 = this.gl.getUniformLocation(this.outliersShader, "uSamplerFinal");
  this.outliersShader.entryDataTileWidth = this.gl.getUniformLocation(this.outliersShader, "uEntryDataTileWidth");
  this.outliersShader.outliersThreshold = this.gl.getUniformLocation(this.outliersShader, "uOutliersThreshold");


  this.outliersShader.pMatrixUniform = this.gl.getUniformLocation(this.outliersShader, "uPMatrix");
  this.outliersShader.mvMatrixUniform = this.gl.getUniformLocation(this.outliersShader, "uMVMatrix");

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

  this.translation = [this.translation[0]+xy[0]-this.selection.p1[0], this.translation[1]+xy[1]-this.selection.p1[1]];

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
  //this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
  this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
  this.gl.clearColor(1, 1, 1, 1);

  var float_texture_ext = this.gl.getExtension('OES_texture_float');

  if (!this.gl){
    alert("Could not initialise Webgl.");
  }
  if(!float_texture_ext){
    alert("OES_texture_float not supported.");
  }
}
