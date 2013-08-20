

var histogram;
var scattermatrix;
var map = null;
var canvaslayer = null;
var datapath;
var info;
var colorscale;
var canvas;

var useMap = false;
var useStreaming = false;
var isline = false;
var datapath;
var currententry;
var numentries;
var delay;

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split(',');//query.split('&');
  for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=');
      if (decodeURIComponent(pair[0]) == variable) {
          return decodeURIComponent(pair[1]);
      }
  }
  return false;
}

function cb_receiveInfo(data){

  var numdim = data['numdim'];
  var totalentries = data['numentries'];
  var hasgeoinfo = data['hasgeoinfo'];
  var isline = data['isline'];

  if(numentries<=0)
    numentries = totalentries;

  if(useMap){
    initMap();
    canvas = canvaslayer.canvas;
    $('#div_map').width('800px');
    $('#div_map').height('800px');
    $('#scatterplotmatrix').hide();
    $('#zoom').hide();
  }
  else{
    canvas = document.getElementById('scatterplotmatrix');
    $('#scatterplotmatrix').width('800px');
    $('#scatterplotmatrix').height('800px');
    $('#div_map').hide();
  }

  $( "#div_bandwidthslider" ).slider({
    min: 0.001,
    max: 4.0,
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

  $( "#div_outliersslider" ).slider({
    min: 0.0,
    max: 1.0,
    value: 0.5,
    step: 0.01,
    slide: function( event, ui ) {
      setOutliersThreshold(ui.value);
    }
  });

  $( "#div_outlierssizeslider" ).slider({
    min: 2.0,
    max: 16.0,
    value: 4.0,
    step: 1.0,
    slide: function( event, ui ) {
      setOutliersSize(ui.value);
    }
  });

  $( "#div_contourwidthslider" ).slider({
    min: 0.0,
    max: 5.0,
    value: 0.5,
    step: 0.25,
    slide: function( event, ui ) {
      setContourWidth(ui.value);
    }
  });

  $( "#div_alphaslider" ).slider({
    min: 0.0,
    max: 2.0,
    value: 1.0,
    step: 0.001,
    slide: function( event, ui ) {
      //changeColorScale();
      setAlphaMultiplier(ui.value);
    }
  });

  //scattermatrix = new ScatterGL(document.getElementById('scatterplotmatrix'));
  scattermatrix = new ScatterGL(canvas, numdim, numentries, useStreaming, isline);
  colorscale = new ColorScale(document.getElementById('colorscale'));
  initColorScale();

  if(datapath.length == 0){
    datapath = './data/iris/datatiles/';
    changeDataset(datapath);
  }
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

  dim0 = 0;
  dim1 = 0;
  dim2 = 'density';
  if(getQueryVariable('dim0') != false)
    dim0 = getQueryVariable('dim0');
  if(getQueryVariable('dim1') != false)
    dim1 = getQueryVariable('dim1');
  if(getQueryVariable('dim2') != false)
    dim2 = getQueryVariable('dim2');

  requestData(dim0, dim1, dim2);

  adddimension();
  changeBandwidth(0.052);
  changeWindowSize();
  changeMeanSize();
  changeKDEType();
  changeTransparency();
  changeOutliers();
  setContourWidth(0);

}

function requestData(dim1, dim2, dim3){
  if(useStreaming)
    requestPoints(dim1, dim2, dim3);
  else
    requestDataTiles(dim1, dim2, dim3);
}

function cb_receivePoint(data){

  scattermatrix.setTexturesSize($('#numbinscatter').val());
  scattermatrix.useDensity = 1; //TODO: change that!

  if(useMap != false){
    var latlng0 = new google.maps.LatLng(data['minj'],data['mini']);
    var latlng1 = new google.maps.LatLng(data['maxj'],data['maxi']);
    scattermatrix.setGeoInfo(latlng0, latlng1);
    //map.fitBounds(new google.maps.LatLngBounds(latlng0, latlng1));
    //map.setZoom(map.getZoom()+1);

    //fitBounds doesnt zoom in as good as it should.
    //Fix: https://code.google.com/p/gmaps-api-issues/issues/detail?id=3117
    var bounds = new google.maps.LatLngBounds(latlng0, latlng1);
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();

    var lat1 = sw.lat();
    var lng1 = sw.lng();
    var lat2 = ne.lat();
    var lng2 = ne.lng();

    var dx = (lng1 - lng2) / 2.;
    var dy = (lat1 - lat2) / 2.;
    var cx = (lng1 + lng2) / 2.;
    var cy = (lat1 + lat2) / 2.;

    // work around a bug in google maps...///
    lng1 = cx + dx / 1.5;
    lng2 = cx - dx / 1.5;
    lat1 = cy + dy / 1.5;
    lat2 = cy - dy / 1.5;
    /////////////////////////////////////////
    
    sw = new google.maps.LatLng(lat1,lng1);
    ne = new google.maps.LatLng(lat2,lng2);
    bounds = new google.maps.LatLngBounds(sw,ne);
    map.fitBounds(bounds);
  }

  scattermatrix.primitives.reset();

  //console.log(data);

  for(pos in data['points']){
    var x = (data['points'][pos]['i'] - data['mini']) / (data['maxi'] - data['mini']);
    var y = (data['points'][pos]['j'] - data['minj']) / (data['maxj'] - data['minj']);
    var group = data['points'][pos]['k'];
    scattermatrix.primitives.add(x, y, group);
  }
  

  draw();

  //requestPoints();
}
/*
function cb_receiveLine(point){

  scattermatrix.points.array.push(point['i0']);
  scattermatrix.points.array.push(point['i1']);
  scattermatrix.points.array.push(point['j0']);
  scattermatrix.points.array.push(point['j1']);

  update(map, canvaslayer);

  requestPoints();
}
*/

function requestPoints(dim1, dim2, dim3){

  $.post(
      '/getPoint',
        {
          'datapath' : datapath,
          'numbinscatter' : $('#numbinscatter').val(),
          'i' : dim1,
          'j' : dim2,
          'k' : dim3,
          'entry' : currententry,
          'numentries' : numentries
        },
      cb_receivePoint
    );

  if(delay){
    currententry+=numentries;
    //https://developer.mozilla.org/en-US/docs/Web/API/window.setTimeout?redirectlocale=en-US&redirectslug=DOM%2Fwindow.setTimeout
    setTimeout(requestPoints, delay, dim1, dim2, dim3);
  }
}

function cb_receiveDataTile(datatile){

  scattermatrix.numdim = datatile['numdim'];


  //var firsttime = eval(datatile['firsttime']);
  var numdim = datatile['numdim'];
  if(datatile['hasgeoinfo'] > 0 && useMap != false){
    var latlng0 = new google.maps.LatLng(datatile['lat0'],datatile['lng0']);
    var latlng1 = new google.maps.LatLng(datatile['lat1'],datatile['lng1']);
    scattermatrix.setGeoInfo(latlng0, latlng1);
    map.fitBounds(new google.maps.LatLngBounds(latlng0, latlng1));
  }

  var image = new Image();
  image.dim1 = datatile['dim1'];
  image.dim2 = datatile['dim2'];
  image.dim3 = datatile['dim3'];
  image.src="data:image/png;base64,"+datatile['data'];
  image.onload = function(){

    scattermatrix.setDataTile(
      datatile['type'],
      image,
      datatile['width'],
      datatile['numentries'],
      datatile['numdim'],
      this.dim1, this.dim2, this.dim3,
      datatile['numbin'],
      datatile['minvalue'],
      datatile['maxvalue']
    );

    draw();
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

    update(map, canvaslayer);
  }

}
*/

function requestDataTiles(dim1, dim2, dim3){

  $.post(
    '/getCountDataTile',
      {
        'datapath' : datapath,
        'numbinscatter' : $('#numbinscatter').val(),
        'i' : dim1,
        'j' : dim2,
        'k' : dim3,
      },
    cb_receiveDataTile
  );


  $.post(
    '/getIndexDataTile',
      {
        'datapath' : datapath,
        'numbinscatter' : $('#numbinscatter').val(),
        'i' : dim1,
        'j' : dim2,
        'k' : dim3,
      },
    cb_receiveDataTile
  );


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


function changeNumBin(){
  var dim1 = $('#dropdownmenu_dim1_0').val();
  var dim2 = $('#dropdownmenu_dim2_0').val();
  var dim3 = $('#dropdownmenu_dim3_0').val();
  requestData(dim1, dim2, dim3);
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
    var dim1 = $('#dropdownmenu_dim1_0').val();
    var dim2 = $('#dropdownmenu_dim2_0').val();
    var dim3 = $('#dropdownmenu_dim3_0').val();

    scattermatrix.reset();
    requestData(dim1, dim2, dim3);
  };

  var values = new Array(scattermatrix.numdim);
  for(var i=0; i<scattermatrix.numdim; i++)
    values[i] = i;

  //horizontal
  var dropdown = createdropdown('dropdownmenu_dim1_0', values, onchange);
  var table = document.getElementById('scatterplotdim1');
  row = table.rows[0];
  var cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  $('#dropdownmenu_dim1_0').val(0);


  //vertical
  dropdown = createdropdown('dropdownmenu_dim2_0', values, onchange);
  table = document.getElementById('scatterplotdim2');
  row = table.insertRow(0);
  cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  $('#dropdownmenu_dim2_0').val(0);

  //third dimension
  dropdown = createdropdown('dropdownmenu_dim3_0', values, onchange);
  table = document.getElementById('scatterplotdim3');
  row = table.insertRow(0);
  cell = row.appendChild(document.createElement("td"));
  //cell.innerHTML = currentnumdim;
  cell.appendChild(dropdown);
  var option=document.createElement("option");
  option.text = 'density';
  dropdown.add(option, null);
  $('#dropdownmenu_dim3_0').val('density');

  for(var i=0; i<3; i++){
    var dim = getQueryVariable('dim'+i);
    if(dim!=false){
      $('#dropdownmenu_dim'+(i+1)+'_0').val(dim);
    }
  }

}

function changeColorScale(){

  var color = $('#colorbrewer').prop('value');
  var dataclasses = $('#dataclasses').prop('value');
  var colorType = $('#colorType').prop('value');
  var alphaType = $('#alphaType').prop('value');
  var kdetype = $('#kdetype').prop('value');

  console.log($('#div_alphaslider').slider('value'));

  var isColorLinear = false;
  var isAlphaLinear = false;
  if(colorType == 'color_linear')
    isColorLinear = true;
  if(alphaType == 'alpha_linear')
    isAlphaLinear = true;

  if(alphaType == 'alpha_fixed')
    fixedAlpha = 1.0;
  
  if(colorbrewer[color][dataclasses] != null){
    colorscale.setValues(colorbrewer[color][dataclasses], isColorLinear, isAlphaLinear, fixedAlpha);

    scattermatrix.setColorScale(colorscale.texdata);
    draw();
  }

}

function changeKDEType(){
  scattermatrix.changeKDEType($('#kdetype').prop('value'));
  draw();
}

function changeTransparency(){
  changeColorScale();
  draw();
}

function changeDataset(value){
  window.location.search = 'datapath='+value;
}

function changeOutliers(){
  var value = $('#outliers').prop('value');
  if(value == 'Outliers')
    scattermatrix.changeOutliers(true);
  else
    scattermatrix.changeOutliers(false);
  draw();
}

function changeBandwidth(value){
  scattermatrix.changeBandwidth(value);

  draw();

  //update slider and input
  $('#bandwidth').attr('value', value);
  $('#div_bandwidthslider').slider('value', value);
}

function changeZoom(delta){

  if($('#div_zoomslider').slider('value') + delta < 0.0) return;
  if($('#div_zoomslider').slider('value') + delta > 1.0) return;

  scattermatrix.changeZoom(delta);
  draw();
  $('#div_zoomslider').slider('value', $('#div_zoomslider').slider('value')+delta);
}

function setZoom(value){
  scattermatrix.setZoom(value);
  draw();
  $('#div_zoomslider').slider('value', value);
}

function setOutliersThreshold(value){
  scattermatrix.setOutliersThreshold(value);
  draw();
}

function setOutliersSize(value){
  scattermatrix.setOutliersSize(value);
  draw();
}

function setContourWidth(value){
  $('#div_contourwidthslider').slider('value', value);
  scattermatrix.setContourWidth(value);
  draw();
}

function setAlphaMultiplier(value){
  $('#div_alphaslider').slider('value', value);
  scattermatrix.setAlphaMultiplier(value);
  draw();
}


function changeWindowSize(){
  scattermatrix.changeWindowSize($('#windowsize').prop('value'));
  draw();
}

function changeMeanSize(){
  scattermatrix.changeMeanSize($('#meansize').prop('value'));
  draw();
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

function resize(){
  scattermatrix.draw(map, canvaslayer);
}

function draw(){
  scattermatrix.draw(map, canvaslayer);
}

function initMap(){

  var mapOptions = {
    zoom: 1,
    center: new google.maps.LatLng(0,0),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    panControl: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: false,
    overviewMapControl: false,
    styles : [
      {
        stylers: [
          { hue: "#00ffe6" },
          { saturation: -20 } //-20
        ]
      },{
        featureType: "road",
        elementType: "geometry",
        stylers: [
          { lightness: 100 },
          { visibility: "simplified" }
        ]
      },{
        featureType: "road",
        elementType: "labels",
        stylers: [
          { visibility: "off" }
        ]
      }
    ]
  };
  var div = document.getElementById('div_map');
  map = new google.maps.Map(div, mapOptions);

  var canvasLayerOptions = {
    map: map,
    resizeHandler: resize,
    animate: false,
    updateHandler: update
  };
  canvaslayer = new CanvasLayer(canvasLayerOptions);

}

function initialize(){

  datapath = getQueryVariable('datapath');
  useMap = getQueryVariable('map');
  useStreaming = getQueryVariable('streaming');

  if(getQueryVariable('entry'))
    currententry=parseInt(getQueryVariable('entry'));
  else
    currententry=0;


  if(getQueryVariable('numentries'))
    numentries=parseInt(getQueryVariable('numentries'));
  else
    numentries=0;

  if(getQueryVariable('delay'))
    delay = parseInt(getQueryVariable('delay'))
  else
    delay = false;

  $.post(
      '/getInfo',
        {
          'datapath' : datapath
        },
      cb_receiveInfo
    );

}


window.onload = initialize;