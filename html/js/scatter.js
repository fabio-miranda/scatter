

var histogram;
var scattermatrix;
var currentnumdim=0;
var dim=16;
var datapath;
var info;
var colorscale;
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
    
    var values = new Array(scattermatrix.numdim);
    for(var i=0; i<scattermatrix.numdim; i++)
      values[i] = i;

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


function createdropdown(id, values, onchange, className){

  //TODO: replace with jquery
  var dropdown = document.createElement("select");
  dropdown.id = id;
  dropdown.className = className;
  dropdown.onchange = onchange;

  for(var i=0; i<values.length; i++){
    var option=document.createElement("option");
    option.text = values[i];
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

function adddimension(){

  //TODO: replace with jquery

  var onchange = function(){
    scattermatrix.reset();
    requestDataTiles();
    redrawscatterplots();
    scattermatrix.draw();
  };

  var values = new Array(scattermatrix.numdim);
  for(var i=0; i<scattermatrix.numdim; i++)
    values[i] = i;

  //horizontal
  var dropdown = createdropdown('dropdownmenu_dim1_'+currentnumdim, values, onchange);
  var table = document.getElementById('scatterplotdim1');
  row = table.rows[0];
  var cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  $('#dropdownmenu_dim1_'+currentnumdim).val(currentnumdim);


  //vertical
  dropdown = createdropdown('dropdownmenu_dim2_'+currentnumdim, values, onchange);
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

function changeColorScale(){

  colorscale = new ColorScale(document.getElementById('colorscale'));

  var color = $('#colorbrewer').val();
  var dataclasses = $('#dataclasses').val();
  var checked = $('#isLinear').prop('checked');
  
  if(colorbrewer[color][dataclasses] != null){
    colorscale.setValues(colorbrewer[color][dataclasses], checked);

    scattermatrix.setColorScale(colorscale.texdata);
    redrawscatterplots();
  }

}

function changeBandwidth(value){
  scattermatrix.changeBandwidth(value);
  scattermatrix.draw();

  //update slider and input
  $('#bandwidth').attr('value', value);
  $('#bandwidthslider').attr('value', value);
}

function changeWindowSize(){
  scattermatrix.changeWindowSize($('#windowsize').prop('value'));
  scattermatrix.draw();
}

function initColorScale(){

  var values = new Array();
  for(var color in colorbrewer)
    values.push(color);


  var dropbox = createdropdown('colorbrewer', values, changeColorScale);
  $('#div_colorbrewer').append(dropbox);

  var dropbox = createdropdown('dataclasses', [3,4,5,6,7,8,9,10,11,12], changeColorScale);
  $('#div_dataclasses').append(dropbox);

  changeColorScale();
}

function initialize(){

  $( "#div_bandwidthslider" ).slider({
    id: 'bandwidthslider',
    min: 0,
    max: 0.2,
    step: 0.001,
    slide: function( event, ui ) {
      changeBandwidth(ui.value);
    }
  });

  scattermatrix = new ScatterGL(document.getElementById('scatterplotmatrix'));
  initColorScale();
  changeWindowSize();

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

  changeBandwidth(0.01);

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