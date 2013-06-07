

var scattermatrix;
var count=0;
var currentdim=0;
var dim=16;
function createscatterplot(datatile){

  var image = new Image();
  image.src="data:image/png;base64,"+datatile['data'];
  var that = this;
  image.onload = function(){
    scattermatrix.addscatter(datatile['dim1'], datatile['dim2'], image);
    adddimension(document.getElementById('scatterplotdim2'));
    count++;
    if(count==1)
      scattermatrix.draw();
  } 
}

function adddimension(table, isVertical){

  var rowcount = table.rows.length;
  var row = table.insertRow(rowcount);

  var cellcount = table.cells.length;
  var cell1 = row.insertCell(0);

  return;
  var newtd = document.createElement('td');
  newtd.innerHTML = 'a'

  if(isVertical){
    var newtr = document.createElement('tr');
    newtr.appendChild(newtd);
    node.appendChild(newtr);  
  }
  else{
    node.appendChild(newtd);
  }
}

function removedimension(){

}

function initialize(){
  /*
  scattermatrix = new scattergl(document.getElementById('scatterplotmatrix'));
  for(var i = 0; i<8; i++){
    for(var j = 0; j<8; j++){
      var postdata = {'dim1': i, 'dim2' : j};
      
      $.post('/data', postdata, createscatterplot);
    }
  }
  */
  //scattermatrix = new scattergl(document.getElementById('scatterplotmatrix'));
  //$.post('/data', {'dim1': 0, 'dim2' : 0}, createscatterplot);

  adddimension(document.getElementById('scatterplotdim2'), true);
}


window.onload = initialize;