
var datatile;

function update(){

  var points = [];
  var count = 0;
  for(var i in data){
    if(data[i].x > 0){
      points[count] = {};
      points[count].x = data[i].x;
      points[count].y = data[i].y;
      count++;
    }
  }
  console.log(points);
  var rfunc = function(d) {return 5;}
  var xfunc = function(d) { return d.x; }
  var yfunc = function(d) { return d.y; }
  scatterplot.setPoints(points, xfunc, yfunc, rfunc, null, null, {x: "", y: ""});

}

function scatterd3(){
  var percent0 = [];
  percent0[0] = {};
  percent0[0].x = 0;
  percent0[0].y = 0;
  var margin = {top: 10, right: 10, bottom: 20, left: 80};
  var rfunc = function(d) {return 1;}
  var xfunc = function(d) { return d.x; }
  var yfunc = function(d) { return d.y; }
  scatterplot = new ScatterPlot(percent0, xfunc, yfunc, rfunc, null, null, {x: "", y: "# Vehicles"}, margin, "#scatterplot");
  update();
}

function createscatterplot(datatile){
  var matrix = document.getElementById('matrix');
  var id = 'scatter_'+datatile['dim1']+'.'+datatile['dim2'];

  var newcanvas = document.createElement('canvas');
  newcanvas.setAttribute('id',id);
  newcanvas.setAttribute('class','scatterplot');
  matrix.appendChild(newcanvas);
  new scattergl(newcanvas , datatile['data']);
}

function initialize(){

  

  for(var i = 0; i<1; i++){
    for(var j = 0; j<16; j++){
      var postdata = {'dim1': i, 'dim2' : j};
      
      $.post('/data', postdata, createscatterplot);
    }
  }

  return;

}


window.onload = initialize;