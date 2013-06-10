

var scattermatrix;
var count=0;
var currentnumdim=0;
var dim=16;
var info;

function createscatterplot(datatile){

  var image = new Image();
  image.src="data:image/png;base64,"+datatile['data'];
  var that = this;
  image.onload = function(){
    scattermatrix.addscatter(datatile['i'], datatile['j'], datatile['dim1'], datatile['dim2'], image);
    count++;

    if(count >= currentnumdim*currentnumdim)
      scattermatrix.draw();
  } 
}


function createdropdown(dim){

  //TODO: replace with jquery
  var dropdown = document.createElement("select");
  dropdown.id = 'dropdownmenu_'+dim+'_'+currentnumdim;
  dropdown.className = 'dropdownmenu';
  dropdown.onchange = function(){
    scattermatrix.reset();
    count = 0;
    redrawscatterplots();
  };

  for(var i=0; i<info[dim]; i++){
    var option=document.createElement("option");
    option.text = i;
    dropdown.add(option, null);
  }
  dropdown.value = currentnumdim;

  return dropdown;
}

function redrawscatterplots(){

  for(var i = 0; i<currentnumdim; i++){
    for(var j = 0; j<currentnumdim; j++){
      var postdata = {'i': i, 'j': j, 'dim1': $('#dropdownmenu_dim1_'+i).val(), 'dim2' : $('#dropdownmenu_dim2_'+j).val()};
      
      $.post('/data', postdata, createscatterplot);
    }
  }

}

function addscatterplot(){
  scattermatrix.reset();
  count = 0;
  adddimension();
  redrawscatterplots();
}

function removescatterplot(){

  scattermatrix.reset();
  count = 0;
  removedimension();
  redrawscatterplots();

}

function adddimension(){

  //TODO: replace with jquery

  //horizontal
  var dropdown = createdropdown('dim1');
  var table = document.getElementById('scatterplotdim1');
  row = table.rows[0];
  var cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);


  //vertical
  dropdown = createdropdown('dim2');
  table = document.getElementById('scatterplotdim2');
  row = table.insertRow(0);
  cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);


  currentnumdim++;
}

function removedimension(){

  if(currentnumdim <= 1)
    return;

  //horizontal
  var table = document.getElementById('scatterplotdim1');
  var row = table.rows[0];
  row.deleteCell(currentnumdim-1);



  //vertical
  table = document.getElementById('scatterplotdim2');
  //table.deleteRow(currentnumdim-1);
  table.deleteRow(0);


  currentnumdim--;

}

function initializeLayout(json){
  info = json;
  scattermatrix = new scattergl(document.getElementById('scatterplotmatrix'));
  $.post('/data', {'i': 0, 'j': 0, 'dim1': 0, 'dim2' : 0}, createscatterplot);
  adddimension();
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

  $.post('/info', {}, initializeLayout);

}


window.onload = initialize;