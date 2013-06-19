
function colorscale(parentnode){
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

  this.image = {};
  this.imgsize = {};
  this.numrelations = {};
  this.numdim = {};
  this.numbin = {};
  this.texture = {};
  //this.sizedatatile = {};

  this.initGL();
  this.initShaders();

  this.selection = new selectionquad(this.gl);
}