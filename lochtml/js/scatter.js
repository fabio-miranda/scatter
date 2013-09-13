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



var requestData = function() {
  // TODO Decide timestamp interval to request data.
  var ts1 = 653249807;
  var ts2 = 1600021007;

  requestPoints(ts1, ts2);

  changeBandwidth(0.052);
  changeTransparency();
};


// Sets up user interface elements. Should be called only once.
var setupUI = function() {
  // Sets up map.
  initMap();
  canvas = canvaslayer.canvas;
  $('#scatterplotmatrix').hide();
  $('#zoom').hide();

  // Sets up sliders.
  $( "#div_bandwidthslider" ).slider({
    min: 0.001,
    max: 4.0,
    step: 0.001,
    slide: function( event, ui ) {
      changeBandwidth(ui.value);
    }
  });

  $( "#div_alphaslider" ).slider({
    min: 0.0,
    max: 10.0,
    value: 1.0,
    step: 0.001,
    slide: function( event, ui ) {
      //changeColorScale();
      setAlphaMultiplier(ui.value);
    }
  });

  // Instantiates webgl renderer.
  var NUM_DIM = 2;
  var NUM_ENTRIES = 0;
  var USE_STREAMING = true;
  var IS_LINE = false;
  var KDE_TYPE = 'kde';
  scattermatrix = new ScatterGL(
    canvas, NUM_DIM, NUM_ENTRIES, USE_STREAMING, IS_LINE, KDE_TYPE);

  // Sets up color scale.
  colorscale = new ColorScale(document.getElementById('colorscale'));
  initColorScale();
};


var getMapBoundaries = function(latlng0, latlng1) {
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
  return new google.maps.LatLngBounds(sw,ne);
};


var cb_receivedPoints = function(data) {
  // Sets up scatter matrix.
  var NUM_BIN_SCATTER = 512;
  var USE_DENSITY = 1;  //TODO: change that!
  scattermatrix.setTexturesSize(NUM_BIN_SCATTER);
  scattermatrix.useDensity = USE_DENSITY;

  // Sets map boundaries.
  var min_lat = data['min_lat']; 
  var min_lon = data['min_lon'];
  var max_lat = data['max_lat']; 
  var max_lon = data['max_lon'];

  var latlng0 = new google.maps.LatLng(min_lat, min_lon);
  var latlng1 = new google.maps.LatLng(max_lat, max_lon);
  scattermatrix.setGeoInfo(latlng0, latlng1);

  var bounds = getMapBoundaries(latlng0, latlng1);
  map.fitBounds(bounds);

  scattermatrix.primitives.reset();

  //console.log(data);

  // TODO change
  for (pos in data['points']) {
    var point = data['points'][pos];

    var lat = (point[3] - min_lat) / (max_lat - min_lat);
    var lon = (point[4] - min_lon) / (max_lon - min_lon);
    
    //console.log(data['points'][pos]['i']+', '+data['points'][pos]['j']);

    // Uses 0 for group: not used for this app.
    var group = 0;
    // NOTE: must inform lon for x and lat for y here.
    scattermatrix.primitives.add(lon, lat, group);
  }

  changeBandwidth(data['h'] * 20.0);
  
  console.log(data);
  draw();
};


var requestPoints = function(ts1, ts2) {
  $.post(
      '/getPoints',
      {
        'query_ts1' : ts1,
        'query_ts2' : ts2
      },
      cb_receivedPoints
    );
};


var createdropdown = function(id, values, onchange, className) {
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
};


var changeColorScale = function() {
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

  var fixedAlpha = null;
  if(alphaType == 'alpha_fixed')
    fixedAlpha = 1.0;
  
  if(colorbrewer[color][dataclasses] != null){
    colorscale.setValues(colorbrewer[color][dataclasses],
      isColorLinear, isAlphaLinear, fixedAlpha);

    scattermatrix.setColorScale(colorscale.texdata);
    draw();
  }
};


var changeTransparency = function() {
  changeColorScale();
  draw();
};


var changeBandwidth = function(value) {
  scattermatrix.changeBandwidth(value);

  draw();

  //update slider and input
  $('#bandwidth').attr('value', value);
  $('#div_bandwidthslider').slider('value', value);
};



var setAlphaMultiplier = function(value) {
  $('#div_alphaslider').slider('value', value);
  scattermatrix.setAlphaMultiplier(value);
  draw();
};


var initColorScale = function() {
  var values = [];
  for (var color in colorbrewer) {
    values.push(color);
  }

  var dropbox = createdropdown('colorbrewer', values, changeColorScale);
  $('#div_colorbrewer').append(dropbox);

  var dropbox = createdropdown('dataclasses', [3,4,5,6,7,8,9,10,11,12], changeColorScale);
  $('#div_dataclasses').append(dropbox);
  $('#dataclasses').val('9');

  changeColorScale();
};

var resize = function() {
  scattermatrix.draw(map, canvaslayer);
};

var draw = function() {
  scattermatrix.flagUpdateTexture = true;
  scattermatrix.draw(map, canvaslayer);
};

var initMap = function() {
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
        "featureType": "administrative",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "landscape",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "poi",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "transit",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "water",
        "stylers": [
          { "lightness": -100 }
        ]
      },{
        "featureType": "landscape",
        "stylers": [
          { "visibility": "on" },
          { "saturation": -100 },
          { "lightness": -80 }
        ]
      }
//      {
//        stylers: [
//          { hue: "#00ffe6" },
//          { saturation: -100 } //-20
//        ]
//      },{
//        featureType: "road",
//        elementType: "geometry",
//        stylers: [
//          { lightness: 100 },
//          { visibility: "simplified" }
//        ]
//      },{
//        featureType: "road",
//        elementType: "labels",
//        stylers: [
//          { visibility: "off" }
//        ]
//      }
    ]
  };
  var div = document.getElementById('div_map');
  map = new google.maps.Map(div, mapOptions);

  var canvasLayerOptions = {
    map: map,
    resizeHandler: resize,
    animate: false,
    updateHandler: draw
  };
  canvaslayer = new CanvasLayer(canvasLayerOptions);

};

var initialize = function(){
  setupUI();
  requestData();
};


window.onload = initialize;
