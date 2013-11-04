var RECORD_IMAGES = false;

var USE_DARK_STYLE = true;

var histogram;
var scattermatrix;
var calendar = null;
var map = null;
var canvaslayer = null;
var datapath;
var info;
var colorscale;
var canvas;
var map_text_layer = null;
var gallery = null;
var numberOfPoints = 0;
var lastReceivedDateTime = null;
var pointsSummaryData = null;
var idsSamplesCountData = null;
var pointsSummaryChart = null;
var utils = null;
var lastPointsRequestTime = 0;

var currentCityIndex = 0;
var useMap = false;
var useStreaming = false;
var isline = false;
var datapath;
var currententry;
var numentries;

var ANIM_STEP = 1 * 60 * 60;                       // animation step: 60 minutes.
var ANIM_TS_INITIAL =  1375243200;             // Initial timestamp in the animation.
var ANIM_TS_FINAL = 1377748800 - ANIM_STEP;    // Final timestamp in the animation.

if (RECORD_IMAGES) {
  ANIM_STEP = 3 * 60 * 60;                                     // animation step: 3 hours.
  ANIM_TS_INITIAL += 27 * 86400;                                // Initial timestamp in the animation.
  ANIM_TS_FINAL = ANIM_TS_INITIAL + 9 * 86400 - ANIM_STEP;    // Final timestamp in the animation.
}


var anim_prev_ts = Infinity;
var anim_cur_ts = ANIM_TS_INITIAL;             // Current timestamp in the animation.
var anim_on = false;                           // Animation on/off flag.
var ANIMATION_INTERVAL = 200;
var previous_zoom_level = null;

var snapshotControl;


var toggleAnimation = function(enabled) {
  anim_on = enabled;
  var images = {true: '../img/anim-pause.png', false: '../img/anim-play.png'};

  var svg = d3.selectAll('#play_button').data(['play_button'])
    .on('click', function () {
      toggleAnimation(!anim_on);
    });
    
  var radius = 20;
  var image = svg.selectAll('image').data(['play_button']);
  image
    .enter().append('svg:image')
    .attr('x', '0')
    .attr('y', '0')
    .attr('width', radius)
    .attr('height', radius);
  image.attr('xlink:href', images[anim_on]);
};


var setupAnimButtons = function() {
  var radius = 20;

  // Forward button.
  d3.selectAll('#fw_button').data(['fw_button'])
      .on('click', function () {
        // Forwards animation one time step.
        toggleAnimation(false);
        var anim_ts = Math.min(ANIM_TS_FINAL, anim_cur_ts + ANIM_STEP);
        $('#div_animslider').slider('value', anim_ts);
      })
      .selectAll('image').data(['fw_button'])
    .enter()
      .append('svg:image')
      .attr('x', '0')
      .attr('y', '0')
      .attr('width', radius)
      .attr('height', radius)
      .attr('xlink:href', '../img/anim-fw.png');

  // Rewind button.
  d3.selectAll('#rw_button').data(['rw_button'])
      .on('click', function () {
        // Rewinds animation one time step.
        toggleAnimation(false);
        var anim_ts = Math.max(ANIM_TS_INITIAL, anim_cur_ts - ANIM_STEP);
        $('#div_animslider').slider('value', anim_ts);
      })
      .selectAll('image').data(['rw_button'])
    .enter()
      .append('svg:image')
      .attr('x', '0')
      .attr('y', '0')
      .attr('width', radius)
      .attr('height', radius)
      .attr('xlink:href', '../img/anim-rw.png');
};


var createDateFromTimestampInMinutes = function(ts) {
  var date = new Date(0);
  date.setUTCSeconds(ts);
  return date;
};


var getNumberOfPoints = function() {
  return numberOfPoints;
};


var updateAnimation = function() {
  if (RECORD_IMAGES) {
    console.log(getRenderedTimeText());
    gallery.addSnapshot();
  }

  if (anim_cur_ts == anim_prev_ts) {
    return;
  }
  if (anim_on) {
    // Advances step in animation, of stops when finished.
    if (anim_cur_ts == ANIM_TS_FINAL) {
      toggleAnimation(false);
    } else {
      anim_prev_ts = anim_cur_ts;
      anim_cur_ts += ANIM_STEP;
    }
    $( '#div_animslider' ).slider('value', anim_cur_ts);

    //requestPoints();
    console.log('anim_cur_ts ' + anim_cur_ts);
    console.log('limit: ' + (ANIM_TS_FINAL));
  }
  // Updates overlay for text on top of the map.
  updateMapOverlay();

  if (pointsSummaryChart) {
    var date1 = createDateFromTimestampInMinutes(anim_cur_ts);
    var date2 = createDateFromTimestampInMinutes(anim_cur_ts + ANIM_STEP);
    pointsSummaryChart.updateBrush(date1, date2);
  }
};


var parseDateTime = function(ts) {
  var date = createDateFromTimestampInMinutes(ts);

  var daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  var month = date.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  var day = date.getDate();
  day = day < 10 ? '0' + day : day;
  var dw = daysOfWeek[date.getDay()];
  var year = date.getFullYear();
  
  var dateStr = dw + ' ' + month + '/' + day + '/' + year;

  var hour = date.getHours();
  hour = hour < 10 ? '0' + hour : hour;
  var min = date.getMinutes();
  min = min < 10 ? '0' + min : min;
  var timeStr = hour + ':' + min;

  return {date: dateStr, time: timeStr};
};


var getRenderedTimeText = function() {
  if (!lastReceivedDateTime) {
    return '';
  }

  var initial = parseDateTime(lastReceivedDateTime);
  var final = parseDateTime(lastReceivedDateTime + ANIM_STEP - 60);

  if (initial.date != final.date) {
    var initialText = initial.date + ' ' + initial.time;
    var finalText = final.date + ' ' + final.time;
    return initialText + ' - ' + finalText;
  } else {
    var initialText = initial.date + ' ' + initial.time;
    return initialText + ' - ' + final.time;
  }
};


var setAnimCurTime = function(ts) {
  anim_cur_ts = ts;
  requestPoints();
};


var requestPoints = function() {
  // TODO remove
  console.log(map.getBounds());

  console.log('trying');

  // Ignores requests that happen to often.
  var pointsRequestTime = new Date().getTime();
  if (anim_on ||
      pointsRequestTime - lastPointsRequestTime > ANIMATION_INTERVAL) {
    lastPointsRequestTime = pointsRequestTime;

    var ts1 = anim_cur_ts;
    var ts2 = anim_cur_ts + ANIM_STEP;

    requestPointsData(ts1, ts2, currentCityIndex);
  }
  console.log('did');
};


var onSelectCityCB = function(cityIndex) {
  currentCityIndex = cityIndex;
  gallery.setCityIndex(cityIndex);
  setupPlots();

  // TODO update UI with this city data, including requesting new data.
};


// Sets up user interface elements. Should be called only once.
var setupUI = function() {
  // Sets correct css.
  var head = document.getElementsByTagName('head')[0];
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = USE_DARK_STYLE ? 'css/style-black.css' : 'css/style-white.css';
  head.appendChild(link);

  utils = new Utils();

  // Sets up map.
  initMap();
  canvas = canvaslayer.canvas;
  $('#scatterplotmatrix').hide();
  $('#zoom').hide();

  // Sets up sliders.
  var bandwidth_value = 0.0005;
  $( '#div_bandwidthslider' ).slider({
    min: 0.0002,
    value: bandwidth_value,
    max: 0.01,
    step: 0.0001,
    slide: function( event, ui ) {
      var must_redraw = true;
      changeBandwidth(ui.value, must_redraw);
    }
  });

  var alpha_value = 9;
  $( '#div_alphaslider' ).slider({
    min: 0.0,
    max: 12.0,
    value: alpha_value,
    step: 0.001,
    slide: function( event, ui ) {
      //changeColorScale();
      setAlphaMultiplier(ui.value);
    }
  });

  $( '#div_pointslider' ).slider({
    min: 0.0,
    max: 10.0,
    value: 1.0,
    step: 1.0,
    slide: function( event, ui ) {
      setPointSize(ui.value);
    }
  });

  var lastSlide = 0;
  $( '#div_animslider' ).slider({
    min: ANIM_TS_INITIAL,
    max: ANIM_TS_FINAL,
    value: ANIM_TS_INITIAL,
    step: ANIM_STEP,
    stop: function(event, ui) {
      setAnimCurTime(ui.value);
    },
    change: function(event, ui) {
      setAnimCurTime(ui.value);
    },
    slide: function(event, ui) {
      toggleAnimation(false);
      setAnimCurTime(ui.value);
    }
  });
  setAnimCurTime(ANIM_TS_INITIAL);

  // Instantiates webgl renderer.
  var NUM_DIM = 2;
  var NUM_ENTRIES = 0;
  var USE_STREAMING = true;
  var IS_LINE = false;
  var KDE_TYPE = 'kde';
  scattermatrix = new ScatterGL(
    canvas, NUM_DIM, NUM_ENTRIES, USE_STREAMING, IS_LINE, KDE_TYPE, bandwidth_value, alpha_value);
  // Sets up scatter matrix.
  var NUM_BIN_SCATTER = 512;
  var USE_DENSITY = 1;  //TODO: change that!
  scattermatrix.setTexturesSize(NUM_BIN_SCATTER);
  scattermatrix.useDensity = USE_DENSITY;

  // Sets up color scale.
  colorscale = new ColorScale(document.getElementById('color_scale'));
  initColorScale();

  var must_redraw = false;
  changeBandwidth(bandwidth_value, must_redraw);

  toggleAnimation(anim_on);

  setupAnimButtons();
  setupGallery();
  setupCitiesOptions();
  setupPlots();
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


var cb_receivedPointsData = function(data) {
  numberOfPoints = data['points'].length;
  lastReceivedDateTime = +data['ts1'];

  // Sets map boundaries.
  var min_lat = data['min_lat']; 
  var min_lon = data['min_lon'];
  var max_lat = data['max_lat']; 
  var max_lon = data['max_lon'];
  var latlng0 = new google.maps.LatLng(min_lat, min_lon);
  var latlng1 = new google.maps.LatLng(max_lat, max_lon);
  scattermatrix.setGeoInfo(latlng0, latlng1);
  //var bounds = getMapBoundaries(latlng0, latlng1);
  //map.fitBounds(bounds);

  //console.log('npoints: ' + data['points'].length)


  scattermatrix.primitives.reset();

  //console.log(data);

  var inv_len_lat = 1 / (max_lat - min_lat);
  var inv_len_lon = 1 / (max_lon - min_lon);
  for (pos in data['points']) {
    var point = data['points'][pos];
    var point_lat = point[0];
    var point_lon = point[1];
    var point_acc = point[2];
    // TODO(Fabio): Use accuracy to define bandwith.

    var lat = (point_lat - min_lat) * inv_len_lat;
    var lon = (point_lon - min_lon) * inv_len_lon;
    
    //console.log(data['points'][pos]['i']+', '+data['points'][pos]['j']);

    // Uses 0 for group: not used for this app.
    var group = 0;

    // NOTE: must inform lon for x and lat for y here.
    scattermatrix.primitives.add(lon, lat, group);
  }
  scattermatrix.primitives.updateBuffer();

  var must_redraw = false;
  // TODO update bandwidth! changeBandwidth(data['h'] * 20.0, must_redraw);
  
  //console.log(data);
  draw();
};


var requestPointsData = function(ts1, ts2, currentCityIndex) {
  $.post(
    '/getPoints',
    {
      'query_ts1' : ts1,
      'query_ts2' : ts2,
      'city_index' : currentCityIndex
    },
    cb_receivedPointsData
  );
};


var cb_receivedPointsSummaryData = function(data) {
  pointsSummaryData = data;
  createCalendar();
  createPointsSummaryChart();
};


var requestPointsSummaryData = function() {
  $.post(
    '/getPointsSummary',
    {
      'city_index' : currentCityIndex
    },
    cb_receivedPointsSummaryData
  );
};


var cb_receivedIdsSamplesCountData = function(data) {
  idsSamplesCountData = data;
  createIdsSampleCountSummaryChart();
};


var requestIdsSamplesCountData = function(ts1, ts2) {
  $.post(
    '/getIdsSampleCountSummary',
    {
      'city_index' : currentCityIndex
    },
    cb_receivedIdsSamplesCountData
  );
};


var createdropdown = function(id, values, onchange, className) {
  //TODO: replace with jquery
  var dropdown = document.createElement('select');
  dropdown.id = id;
  dropdown.className = className;
  dropdown.onchange = onchange;

  for(var i=0; i<values.length; i++){
    var option=document.createElement('option');
    option.text = values[i];
    dropdown.add(option, null);
  }

  return dropdown;
};


var changeColorScale = function() {
  var colorType = $('#colorType').prop('value');
  var alphaType = $('#alphaType').prop('value');
  var kdetype = $('#kdetype').prop('value');

  //console.log($('#div_alphaslider').slider('value'));

  var isColorLinear = false;
  var isAlphaLinear = false;
  if(colorType == 'color_linear')
    isColorLinear = true;
  if(alphaType == 'alpha_linear')
    isAlphaLinear = true;

  var fixedAlpha = null;
  if(alphaType == 'alpha_fixed')
    fixedAlpha = 1.0;
  
  var colors = getColorsForColorScale();
  if (colors != null) {
    colorscale.setValues(
      colors, isColorLinear, isAlphaLinear, fixedAlpha);

    scattermatrix.setColorScale(colorscale.texdata);
    draw();

    // Updates calendar color scale.
    if (calendar) {
      calendar.setColorScale(getColorsForCalendarColorScale());
    }
  }
};


var getColorsForColorScale = function() {
  var color = $('#colorbrewer').prop('value');
  var dataclasses = $('#dataclasses').prop('value');
  
  var colors = colorbrewer[color][dataclasses];
  return USE_DARK_STYLE ? colors : colors.reverse();
};


var getColorsForCalendarColorScale = function() {
  return getColorsForColorScale().reverse();
};


var changeTransparency = function() {
  changeColorScale();
  draw();
};


var changeRenderType = function(value) {
  scattermatrix.changeKDEType(value);
  draw();
};


var changeBandwidth = function(value, must_redraw) {
  scattermatrix.changeBandwidth(value);

  if (must_redraw) {
    draw();
  }

  //update slider and input
  $('#bandwidth').attr('value', value);
  $('#div_bandwidthslider').slider('value', value);
};


var setAlphaMultiplier = function(value) {
  $('#div_alphaslider').slider('value', value);
  scattermatrix.setAlphaMultiplier(value);
  draw();
};


var setPointSize = function(value) {
  scattermatrix.setPointSize(value);
  draw();
};


var initColorScale = function() {
  var values = [];
  for (var color in colorbrewer) {
    values.push(color);
  }

  var dropbox = createdropdown('colorbrewer', values, changeColorScale);
  $('#div_colorbrewer').append(dropbox);
  var initialColor = USE_DARK_STYLE ? 'Blues' : 'YlOrRd';
  $('#colorbrewer').val(initialColor);


  var dropbox = createdropdown('dataclasses', [3,4,5,6,7,8,9,10,11,12], changeColorScale);
  $('#div_dataclasses').append(dropbox);
  $('#dataclasses').val('3');

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

  var BRIGHT_STYLE = [
    {
      'featureType': 'all',
      'stylers': [
        { 'saturation': -100 }
      ]
    },{
      'featureType': 'water',
      'stylers': [
        { 'visibility': 'simplified' },
        { 'lightness': -5 }
      ]
    },{
      'featureType': 'poi',
      'stylers': [
        { 'lightness': 50 }
      ]
    },{
      'featureType': 'road',
      'stylers': [
        { 'lightness': 60 }
      ]
    }
  ];

  var DARK_STYLE = [
    {
      'featureType': 'all',
      'stylers': [
        { 'invert_lightness': true },
        { 'saturation': -100 }
      ]
    },{
      'featureType': 'water',
      'stylers': [
        { 'visibility': 'simplified' },
        { 'lightness': -100 }
      ]
    },{
      'featureType': 'poi',
      'stylers': [
        { 'lightness': -30 }
      ]
    },{
      'featureType': 'road',
      'stylers': [
        { 'lightness': -40 }
      ]
    }
  ];


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
    styles: USE_DARK_STYLE ? DARK_STYLE : BRIGHT_STYLE
  };

  var div = document.getElementById('map_container');
  map = new google.maps.Map(div, mapOptions);

  var canvasLayerOptions = {
    map: map,
    resizeHandler: resize,
    animate: false,
    updateHandler: draw
  };
  canvaslayer = new CanvasLayer(canvasLayerOptions);

  // Sets up zoom handler callback.
  google.maps.event.addListener(map, 'zoom_changed', function() {
    updateOnZoom(map.getZoom());
  });
};


var updateMapOverlay = function() {
  var svg = d3.select('#map_overlay')
      .selectAll('svg').data(['map_overlay']);
  svg.enter().append('svg');

  var dateText = svg.selectAll('#date').data(['map_overlay']);
  dateText
    .enter().append('svg:text')
    .attr('id', 'date')
    .attr('x', 50)
    .attr('y', 15)
    .attr('dy', '.31em');
  dateText.text(getRenderedTimeText());

  var numberOfPointsText =
    svg.selectAll('#numberOfPoints').data(['map_overlay']);
  numberOfPointsText
    .enter().append('svg:text')
    .attr('id', 'numberOfPoints')
    .attr('x', 50)
    .attr('y', 40)
    .attr('dy', '.31em');
  numberOfPointsText.text(getNumberOfPoints() + ' samples');
};


var updateOnZoom = function(zoom_level) {
  if (previous_zoom_level != null) {
    previous_zoom_level = zoom_level;
  }

  var dZoom = previous_zoom_level - zoom_level;

  

  // TODO use old_zoom_level to adjust bandwidth.

  //console.log('zoom_level' + zoom_level);
  // TODO
  //var bandwidth = 0.025 + Math.max(0, (zoom_level - 11) * (0.1 / 3));
  //var must_redraw = false;
  //changeBandwidth(bandwidth, must_redraw);
};


var initialize = function(){
  setupUI();
  requestPoints();

  setInterval(function() {
      updateAnimation();
    },
    ANIMATION_INTERVAL
  );
};


var toDataURL = function() {
  // Use static google maps API to save map.
  var zoomLevel = map.getZoom();
  var center = map.getCenter();
  var centerStr = center.lat() + ',' + center.lng();
  var water_lightness = USE_DARK_STYLE ? -90 : 20;
  var landscape_lightness = USE_DARK_STYLE ? -70 : 90;
  var requestUrl =
    'http://maps.google.com/maps/api/staticmap' +
    '?sensor=false&size=640x640' +
    '&zoom=' + zoomLevel +
    '&center=' + centerStr + 
    '&style=feature:all|saturation:-100' +
    '&style=feature:water|lightness:' + water_lightness +
    '&style=feature:landscape|lightness:' + landscape_lightness +
    '&style=element:labels|visibility:off&style=feature:poi|visibility:off|' +
    '&style=feature:administrative|element:geometry|visibility:off' +
    '&style=feature:road|visibility:off&style=feature:transit|visibility:off';
  // Saves canvas layer on top of the map to save current rendering results.
  return {map_src: requestUrl, overlay: scattermatrix.toDataURL()};
};


var setupGallery = function() {
  // Sets up gallery.
  if (RECORD_IMAGES) {
    gallery = new SnapshotRecorder('#gallery_items', toDataURL);
  } else {
    gallery = new Gallery('#gallery_items', toDataURL);
  }
};


var setupPlots = function() {
  requestPointsSummaryData();
  //requestIdsSamplesCountData();
}
  

var getDataForDay = function(date) {
  // Keeps entries for this date.
  var dateFormat = d3.time.format('%Y-%m-%d');
  return pointsSummaryData.filter(function(d) {
    return date == dateFormat(d[0]);
  });
};


var onCalendarDayClick = function(date, value) {
  gallery.addEntry({
    date: date,
    data: getDataForDay(date)
  });
};


var onCalendarDayMouseOver = function(date, value) {
  var container = d3.select('#day_small_multiples_container');
  container.attr('visibility', 'visible');

  // Updates title with date and number of samples.
  container.select('.day_title')
    .text(date + ' - ' + value + ' samples');

  // Updates thumbnails for different times of day.
  var THUMB_W_H = 90;

  var currentTime = d3.time.format("%Y-%m-%d").parse(date).getTime() / 1000;
  var elapsedDays = (currentTime - ANIM_TS_INITIAL) / 86400;
  var numberOfThumbs = gallery.getNumberOfThumbs.call(gallery);
  var index = elapsedDays * gallery.getNumberOfThumbs.call(gallery);
  var thumbIndices = d3.range(index, index + numberOfThumbs);

  var thumbs_bg =
    container.selectAll('image.thumb_bg').data(thumbIndices)
  thumbs_bg.enter()
    .append('image')
    .classed('thumb_bg', true)
    .attr('width', THUMB_W_H)
    .attr('height', THUMB_W_H)
    .attr('x', function(imageIndex, i) {
      var column = i % (numberOfThumbs / 2);
      return 1 + 91 * column;
    })
    .attr('y', function(imageIndex, i) {
      var row = Math.floor(2 * i / numberOfThumbs);
      return 28 + 91 * row;
    })
    .attr('xlink:href', gallery.getPathToEmptyMap(currentCityIndex));

  var thumbs_fg =
    container.selectAll('image.thumb_fg').data(thumbIndices)
  thumbs_fg.enter()
    .append('image')
    .classed('thumb_fg', true)
    .attr('width', THUMB_W_H)
    .attr('height', THUMB_W_H)
    .attr('x', function(imageIndex, i) {
      var column = i % (numberOfThumbs / 2);
      return 1 + 91 * column;
    })
    .attr('y', function(imageIndex, i) {
      var row = Math.floor(2 * i / numberOfThumbs);
      return 28 + 91 * row;
    });
  thumbs_fg.attr('xlink:href', function(imageIndex, i) {
      // If number of samples is zero, shows empty thumbnail.
      if (value == 0) {
        return gallery.getPathToEmptyMap(currentCityIndex);
      } else {
        // TODO might have to update thumbs in calendar when changed city.
        return gallery.getPathToThumbs(currentCityIndex) + imageIndex + '.jpg';
      }
  });


  // Shows line chart for this day.
  var options = {
    width: 600,
    height: 130,
    useTimeScaleForX: true,
    yAxisTitle: 'Samples',
    xTicks: 8,
    yTicks: 3,
    margin: {top: 30, right: 10, bottom: 30, left: 80},
    title: date + ' - ' + value + ' samples',
    tooltipXFormat: d3.time.format('%I:%M%p'),
    tooltipYFormat: function(v) { return d3.format('f')(v) + ' samples';},
  };
  new LineChart(
    '#day_line_chart_container',
    getDataForDay(date),
    options);
};


var onCalendarDayMouseOut = function(date, value) {
//  d3.select('#day_small_multiples_container').attr('visibility', 'hidden');
//  d3.select('#day_line_chart_container .line_chart').attr('visibility', 'hidden');
};


var createCalendar = function() {
  // Removes calendar, in case it already existed (when city changed).
  d3.selectAll('#calendar svg').remove();

  // Summarizes values by date.
  var pointsByDate = {};
  var dateFormat = d3.time.format('%Y-%m-%d');
  for (var entry_index in pointsSummaryData) {
    var entry = pointsSummaryData[entry_index];
    var ts = entry[0];
    var entryNumberOfPoints = entry[1];

    var date = createDateFromTimestampInMinutes(ts);
    date.setHours(0, 0, 0);

    var dateIndex = dateFormat(date);
    var dateEntry = pointsByDate[dateIndex];

    var pointsInDate = dateEntry ? dateEntry[1] : 0;
    pointsByDate[dateIndex] = [date, pointsInDate + entryNumberOfPoints];
  }
  var dateEntries = [];
  for (var dateIndex in pointsByDate) {
    dateEntries.push(pointsByDate[dateIndex]);
  }

  // Creates calendar.
  var options = {
    cellWidth: 20,
    cellHeight: 25,
    paddingX: 25,
    paddingY: 20,
    cellTextFormatter: function(date, value) {
      return date + ': ' + value + ' samples';
    },
    colors: getColorsForCalendarColorScale(),
    onClick: onCalendarDayClick,
    onMouseOver: onCalendarDayMouseOver,
    onMouseOut: onCalendarDayMouseOut
  };
  calendar = new Calendar('#calendar', dateEntries, options);
};

var createPointsSummaryChart = function() {
  // Removes chart, in case it already existed (when city changed).
  d3.selectAll('#points_summary_chart_container svg').remove();

  // Converts ts to date.
  pointsSummaryData.forEach(function(d) {
    var date = createDateFromTimestampInMinutes(d[0]);
    d[0] = date;
  });
  var options = {
    width: 620,
    height: 100,
    useTimeScaleForX: true,
    yAxisTitle: 'Samples',
    xTicks: 7,
    yTicks: 3,
    margin: {top: 10, right: 0, bottom: 30, left: 80},
    tooltipXFormat: d3.time.format('%m/%d %I:%M%p'),
    tooltipYFormat: function(v) { return d3.format('f')(v) + ' samples';},
  };
  pointsSummaryChart = new LineChart(
    '#points_summary_chart_container',
    pointsSummaryData,
    options);
}

var createIdsSampleCountSummaryChart = function() {
  var options = {
    useTimeScaleForY: false,
    useLogScaleForY: true,
    xAxisTitle: 'Samples',
    yAxisTitle: 'Users',
    yTicks: 3,
    height: 300,
    title: 'Samples per users',
    tooltipXFormat: d3.format('f'),
    tooltipYFormat: function(v) { return d3.format('f')(v) + ' samples';},
  };
  new LineChart(
    '#ids_samples_count_chart_container',
    idsSamplesCountData,
    options);
}

window.onload = initialize;
