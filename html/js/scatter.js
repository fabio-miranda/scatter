

var histogram;
var scattermatrix;
var count=0;
var currentnumdim=0;
var dim=16;
var dimperimage = 4;
var info;


function cb_updatescatterplot(datatile){

  scattermatrix.numdim = datatile['numdim'];

  if(document.getElementById('histogramdim') == null){
    var onchange = function(){
      histogram.setDim($('#histogramdim').val());
      histogram.draw(scattermatrix.getSelection());
    };
    var dropdown = createdropdown('histogramdim', onchange);
    document.getElementById('histogramdropdowndim').appendChild(dropdown);
  }

  if(document.getElementById('dropdownmenu_dim1_0') == null){
    adddimension();
  }



  redrawscatterplots();


  var firsttime = eval(datatile['firsttime']);
  var numdim = datatile['numdim'];

  var dimperimage = datatile['2']['dimperimage'];
  for(var i=0; i<numdim/dimperimage; i++){
    for(var j=i; j<numdim/dimperimage; j++){
      var index = i+' '+(j+1);

      //2
      var image2 = new Image();
      image2.src="data:image/png;base64,"+datatile['2'][index]['data'];
      var that = this;
      image2.onload = function(){

        scattermatrix.update(
          datatile['2'][index]['numrelations'],
          image2,
          datatile['2'][index]['width'],
          datatile['2'][index]['numdim'],
          datatile['2']['dimperimage'],
          datatile['2'][index]['dim0'],
          datatile['2'][index]['dim1'],
          datatile['2'][index]['numbin']
        );

        scattermatrix.draw();
      }
    }
  }

  var dimperimage = datatile['4']['dimperimage'];
  for(var i=0; i<numdim/dimperimage; i++){
    for(var j=i; j<numdim/dimperimage; j++){
      var index = i+' '+(j+1);

      //4
      var image4 = new Image();
      image4.src="data:image/png;base64,"+datatile['4'][index]['data'];
      var that = this;
      image4.onload = function(){

        scattermatrix.update(
          datatile['4'][index]['numrelations'],
          image4,
          datatile['4'][index]['width'],
          datatile['4'][index]['numdim'],
          datatile['4']['dimperimage'],
          datatile['4'][index]['dim0'],
          datatile['4'][index]['dim1'],
          datatile['4'][index]['numbin']
        );

        scattermatrix.draw();
      }
    }
  }


  var dimperimage = datatile['histogram']['dimperimage'];
  for(var i=0; i<numdim/dimperimage; i++){
    for(var j=i; j<numdim/dimperimage; j++){
      var index = i+' '+(j+1);

      //histogram
      var imagehist = new Image();
      imagehist.src="data:image/png;base64,"+datatile['histogram'][index]['data'];
      var that = this;
      imagehist.onload = function(){

        histogram.update(
          imagehist,
          datatile['histogram'][index]['width'],
          datatile['histogram'][index]['height'],
          datatile['histogram'][index]['numdim'],
          datatile['histogram'][index]['numbin'],
          datatile['histogram'][index]['numbin']
        );

        scattermatrix.draw();
      }
    }
  }


}


function createdropdown(id, onchange){

  //TODO: replace with jquery
  var dropdown = document.createElement("select");
  dropdown.id = id;
  dropdown.className = 'dropdownmenu';
  dropdown.onchange = onchange;

  for(var i=0; i<scattermatrix.numdim; i++){
    var option=document.createElement("option");
    option.text = i;
    dropdown.add(option, null);
  }

  return dropdown;
}


function redrawscatterplots(){

  for(var i = 0; i<currentnumdim; i++){
    for(var j = 0; j<currentnumdim; j++){
      scattermatrix.addscatter(i, j, parseInt($('#dropdownmenu_dim1_'+i).val()), parseInt($('#dropdownmenu_dim2_'+j).val()));
      //scattermatrix.draw();
    }
  }

  scattermatrix.draw();
}


function changeNumBin(){
  scattermatrix.reset();
  count = 0;

  //TODO: numbinhistogram with a different bin count
  $.post(
    '/data',
      {
        'firsttime' : false,
        'numbinscatter' : $('#numbinscatter').val(),
        'numbinhistogram': $('#numbinscatter').val(),
        'dimperimage': dimperimage
      },
    cb_updatescatterplot
  );
}


function adddimension(){

  //TODO: replace with jquery

  var onchange = function(){
    scattermatrix.reset();
    count = 0;
    redrawscatterplots();
    scattermatrix.draw();
  };

  //horizontal
  var dropdown = createdropdown('dropdownmenu_dim1_'+currentnumdim, onchange);
  var table = document.getElementById('scatterplotdim1');
  row = table.rows[0];
  var cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  $('#dropdownmenu_dim1_'+currentnumdim).val(currentnumdim);


  //vertical
  dropdown = createdropdown('dropdownmenu_dim2_'+currentnumdim, onchange);
  table = document.getElementById('scatterplotdim2');
  row = table.insertRow(0);
  cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  $('#dropdownmenu_dim2_'+currentnumdim).val(currentnumdim);

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

function addscatterplot(){
  scattermatrix.reset();
  adddimension();
  redrawscatterplots();
}

function removescatterplot(){
  scattermatrix.reset();
  removedimension();
  redrawscatterplots();
}

function initialize(){

  scattermatrix = new ScatterGL(document.getElementById('scatterplotmatrix'));
  histogram = new Histogram($('#histogram'), $('#histogramdiv'));
  scattermatrix.setHistogram(histogram);

  
  $.post(
    '/data',
      {
        'firsttime' : true,
        'numbinscatter' : 2,
        'numbinhistogram': 2,
        'dimperimage' : dimperimage
      },
    cb_updatescatterplot
  );

}


window.onload = initialize;