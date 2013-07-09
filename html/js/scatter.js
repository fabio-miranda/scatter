

var histogram;
var scattermatrix;
var currentnumdim=0;
var dim=16;
var datapath;
var info;
var useKDE = true;


function cb_receiveDataTile(datatile){

  scattermatrix.numdim = datatile['numdim'];

  if(document.getElementById('dropdownmenu_dim1_0') == null){
    adddimension();
  }

  redrawscatterplots();

  var firsttime = eval(datatile['firsttime']);
  var numdim = datatile['numdim'];
  var dimperimage = datatile['dimperimage'];
  var numrelations = datatile['numrelations'];

  var image = new Image();
  image.index = datatile['index'];
  image.src="data:image/png;base64,"+datatile['data'];
  image.onload = function(){

    scattermatrix.update(
      datatile['numrelations'],
      image,
      datatile['width'],
      datatile['numdim'],
      datatile['dimperimage'],
      this.index,
      datatile['numbin'],
      datatile['minvalue'],
      datatile['maxvalue']
    );

    scattermatrix.draw();
  }

}

function cb_receiveDataTileHistogram(datatile){

  if(document.getElementById('histogramdim') == null){

    histogram = new Histogram($('#histogram'), $('#histogramdiv'));
    scattermatrix.setHistogram(histogram);

    var onchange = function(){
      histogram.setDim($('#histogramdim').val());
      histogram.draw(scattermatrix.getSelection());
    };
    var dropdown = createdropdown('histogramdim', onchange);
    document.getElementById('histogramdropdowndim').appendChild(dropdown);
  }

  //histogram
  var image = new Image();
  image.index = datatile['index'];
  image.src="data:image/png;base64,"+datatile['data'];
  image.onload = function(){

    histogram.update(
      image,
      datatile['width'],
      datatile['height'],
      datatile['numdim'],
      datatile['numbin'],
      datatile['numbin']
    );

    scattermatrix.draw();
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

function requestDataTiles(){
  for(var i = 0; i<currentnumdim; i++){
    for(var j = 0; j<currentnumdim; j++){

      var dim0 = parseInt($('#dropdownmenu_dim1_'+i).val());
      var dim1 = parseInt($('#dropdownmenu_dim2_'+j).val());

      if(scattermatrix.hasDataTile('2', dim0, dim1) == false){
        $.post(
          '/getDataTile2D',
            {
              'datapath' : datapath,
              'firsttime' : false,
              'numbinscatter' : $('#numbinscatter').val(),
              //'dimperimage' : dimperimage,
              'i' : dim0,
              'j' : dim1,
            },
          cb_receiveDataTile
        );
      }
      /*
      for(var k = 0; k<currentnumdim; k++){
        for(var l = 0; l<currentnumdim; l++){

          var dim2 = parseInt($('#dropdownmenu_dim1_'+k).val());
          var dim3 = parseInt($('#dropdownmenu_dim2_'+l).val());

          if(scattermatrix.hasDataTile('4', i, j, k, l) == false){
            $.post(
              '/getDataTile4D',
                {
                  'firsttime' : false,
                  'numbinscatter' : $('#numbinscatter').val(),
                  'dimperimage' : dimperimage,
                  'i' : dim0,
                  'j' : dim1,
                  'k' : dim2,
                  'l' : dim3,
                },
              cb_receiveDataTile
            );
          }
        }
      }
      
      if(scattermatrix.hasDataTile('histogram', i, j) == false){
        $.post(
          '/getDataTileHistogram',
            {
              'firsttime' : false,
              'numbinscatter' : $('#numbinscatter').val(),
              'numbinhistogram' : $('#numbinscatter').val(),
              'dimperimage' : dimperimage,
              'i' : dim0,
              'j' : dim1,
            },
          cb_receiveDataTileHistogram
        );
      }
      */

    }
  }
}


function changeNumBin(){
  scattermatrix.reset();
  scattermatrix.resetDataTiles();
  requestDataTiles();
}

function changeBandwidth(){
  scattermatrix.changeBandwidth($('#bandwidth').val());
  scattermatrix.draw();
}


function adddimension(){

  //TODO: replace with jquery

  var onchange = function(){
    scattermatrix.reset();
    requestDataTiles();
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
  requestDataTiles();
  redrawscatterplots();
}

function removescatterplot(){
  scattermatrix.reset();
  removedimension();
  requestDataTiles();
  redrawscatterplots();
}

function initialize(){

  scattermatrix = new ScatterGL(document.getElementById('scatterplotmatrix'));

  datapath = window.location.search.substring(window.location.search.indexOf('=')+1);
  
  $.post(
    '/getDataTile2D',
      {
        'datapath' : datapath,
        'firsttime' : false,
        'numbinscatter' : $('#numbinscatter').val(),
        //'dimperimage' : dimperimage,
        'i' : 0,
        'j' : 0,
      },
    cb_receiveDataTile
  );

  /*
  $.post(
    '/getDataTile4D',
      {
        'firsttime' : false,
        'numbinscatter' : $('#numbinscatter').val(),
        'dimperimage' : dimperimage,
        'i' : 0,
        'j' : 0,
        'k' : 0,
        'l' : 0,
      },
    cb_receiveDataTile
  );

  $.post(
    '/getDataTileHistogram',
      {
        'firsttime' : false,
        'numbinscatter' : $('#numbinscatter').val(),
        'numbinhistogram' : $('#numbinscatter').val(),
        'dimperimage' : dimperimage,
        'i' : 0,
        'j' : 0,
      },
    cb_receiveDataTileHistogram
  );
  */
}


window.onload = initialize;