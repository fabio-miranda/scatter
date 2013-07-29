

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

  //var firsttime = eval(datatile['firsttime']);
  var numdim = datatile['numdim'];
  var dimperimage = datatile['dimperimage'];
  var numrelations = datatile['numrelations'];

  var image = new Image();
  image.index = datatile['index'];
  image.src="data:image/png;base64,"+datatile['data'];
  image.onload = function(){

    scattermatrix.update(
      datatile['type'],
      image,
      datatile['width'],
      datatile['numentries'],
      datatile['numdim'],
      this.index,
      datatile['numbin'],
      datatile['minvalue'],
      datatile['maxvalue']
    );

    scattermatrix.draw();
  }

}
/*
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
*/


function redrawscatterplots(){

  for(var i = 0; i<currentnumdim; i++){
    for(var j = 0; j<currentnumdim; j++){

      var dim1 = $('#dropdownmenu_dim1_'+i).val();
      var dim2 = $('#dropdownmenu_dim2_'+j).val();
      var dim3 = $('#dropdownmenu_dim3_'+j).val();

      scattermatrix.addscatter(i, j, dim1, dim2, dim3);
      //scattermatrix.draw();
    }
  }

  scattermatrix.draw();
}

function requestDataTiles(){
  for(var i = 0; i<currentnumdim; i++){
    for(var j = 0; j<currentnumdim; j++){

      var dim1 = $('#dropdownmenu_dim1_'+i).val();
      var dim2 = $('#dropdownmenu_dim2_'+j).val();
      var dim3 = $('#dropdownmenu_dim3_'+j).val();

      if(scattermatrix.hasDataTile('count', dim1, dim2) == false){
        $.post(
          '/getCountDataTile',
            {
              'datapath' : datapath,
              'numbinscatter' : $('#numbinscatter').val(),
              'i' : dim1,
              'j' : dim2,
            },
          cb_receiveDataTile
        );
      }

      if(scattermatrix.hasDataTile('index', dim1, dim2) == false){
        $.post(
          '/getIndexDataTile',
            {
              'datapath' : datapath,
              'numbinscatter' : $('#numbinscatter').val(),
              'i' : dim1,
              'j' : dim2,
            },
          cb_receiveDataTile
        );
      }

      if(scattermatrix.hasDataTile('entry', dim1, dim2, dim3) == false){
        $.post(
          '/getEntryDataTile',
            {
              'datapath' : datapath,
              'numbinscatter' : $('#numbinscatter').val(),
              'i' : dim1,
              'j' : dim2,
              'k' : dim3,
            },
          cb_receiveDataTile
        );
      }



      /*
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

  //third dimension
  dropdown = createdropdown('dropdownmenu_dim3_'+currentnumdim, values, onchange);
  table = document.getElementById('scatterplotdim3');
  row = table.insertRow(0);
  cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  var option=document.createElement("option");
  option.text = 'density';
  dropdown.add(option, null);
  $('#dropdownmenu_dim3_'+currentnumdim).val('density');
  

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
  var interpolationType = $('#interpolationType').val();
  var transparency = $('#transparency').val();

  var isLinear = false;
  if(interpolationType == 'Linear')
    isLinear = true;

  var hasAlpha = false;
  if(transparency == 'Alpha')
    hasAlpha = true;
  
  if(colorbrewer[color][dataclasses] != null){
    colorscale.setValues(colorbrewer[color][dataclasses], isLinear, hasAlpha);

    scattermatrix.setColorScale(colorscale.texdata);
    redrawscatterplots();
  }

}

function changeRenderType(){
  scattermatrix.changeRenderType($('#rendertype').prop('value'));
  scattermatrix.draw();
}

function changeKDEType(){
  scattermatrix.changeKDEType($('#kdetype').prop('value'));
  scattermatrix.draw();
}

function changeTransparency(){
  changeColorScale();
  scattermatrix.draw();
}

function changeDataset(value){
  window.location.search = 'datapath='+value;

}

function changeBandwidth(value){
  scattermatrix.changeBandwidth(value);

  scattermatrix.draw();

  //update slider and input
  $('#bandwidth').attr('value', value);
  $('#div_bandwidthslider').slider('value', value);
}

function changeZoom(delta){

  if($('#div_zoomslider').slider('value') + delta < 0.0) return;
  if($('#div_zoomslider').slider('value') + delta > 1.0) return;

  scattermatrix.changeZoom(delta);
  scattermatrix.draw();
  $('#div_zoomslider').slider('value', $('#div_zoomslider').slider('value')+delta);
}

function setZoom(value){
  scattermatrix.setZoom(value);
  scattermatrix.draw();
  $('#div_zoomslider').slider('value', value);
}

function changeWindowSize(){
  scattermatrix.changeWindowSize($('#windowsize').prop('value'));
  scattermatrix.draw();
}

function changeMeanSize(){
  scattermatrix.changeMeanSize($('#meansize').prop('value'));
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
  $('#dataclasses').val('9');

  changeColorScale();
}

function initialize(){

  $( "#div_bandwidthslider" ).slider({
    min: 0.001,
    max: 0.2,
    step: 0.001,
    slide: function( event, ui ) {
      changeBandwidth(ui.value);
    }
  });

  $( "#div_zoomslider" ).slider({
    min: 0.0,
    max: 1.0,
    step: 0.1,
    orientation: "vertical",
    slide: function( event, ui ) {
      setZoom(ui.value);
    }
  });

  scattermatrix = new ScatterGL(document.getElementById('scatterplotmatrix'));
  initColorScale();

  datapath = window.location.search.substring(window.location.search.indexOf('=')+1);
  $('#dataset').val(datapath);
  /*
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
  */
  
  $.post(
    '/getCountDataTile',
      {
        'datapath' : datapath,
        'numbinscatter' : $('#numbinscatter').val(),
        'i' : 0,
        'j' : 0,
      },
    cb_receiveDataTile
  );

  $.post(
    '/getIndexDataTile',
      {
        'datapath' : datapath,
        'numbinscatter' : $('#numbinscatter').val(),
        'i' : 0,
        'j' : 0,
      },
    cb_receiveDataTile
  );

  $.post(
    '/getEntryDataTile',
      {
        'datapath' : datapath,
        'numbinscatter' : $('#numbinscatter').val(),
        'i' : 0,
        'j' : 0,
        'k' : 'density',
      },
    cb_receiveDataTile
  );
  
  changeBandwidth(0.052);
  changeNumBin();
  changeWindowSize();
  changeMeanSize();
  changeKDEType();
  changeTransparency();

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