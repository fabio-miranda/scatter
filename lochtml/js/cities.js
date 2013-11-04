var CITIES = [
  ['New York', {
    min_lat: 40.49574,
    max_lat: 40.9176,
    min_lon: -74.2557,
    max_lon: -73.6895
  }],
  ['Los Angeles', {
    min_lat: 33.502075, min_lon: -119.312897,
    max_lat: 34.201936, max_lon: -117.605896
    //max_lat: 34.3373061,
    //max_lon: -118.1552891,
    //min_lat: 33.7036917,
    //min_lon: -118.6681759
  }],
  ['San Francisco', {
    min_lat: 37.608699, min_lon: -122.568626,
    max_lat: 37.811318, max_lon: -122.374306
    //min_lat: 37.64395973118276,
    //min_lon: -122.5511609029785,
    //max_lat: 37.81774003824961,
    //max_lon: -122.3314343404785
  }],
  ['Paris', {
    min_lat: 48.797663, min_lon: 2.186966,
    max_lat: 48.938584, max_lon: 2.519302
    //max_lat: 48.9021449,
    //max_lon: 2.4699208,
    //min_lat: 48.815573,
    //min_lon: 2.224199
  }],
  ['Sao Paulo', {
    min_lat: -23.79687,  min_lon: -46.876602,
    max_lat: -23.463463, max_lon: -46.360245
  }],
  ['Tokyo', {
    min_lat: 35.587701,
    min_lon: 139.453583,
    max_lat: 35.804066,
    max_lon: 139.838104
  }],
  ['Seoul', {
    min_lat: 37.464955, min_lon: 126.78257,
    max_lat: 37.669597, max_lon: 127.168465
    //max_lat: 37.7017495,
    //max_lon: 127.1835899,
    //min_lat: 37.4259627,
    //min_lon: 126.7645827
  }]
];


// Creates cities entries.
var setupCitiesOptions = function() {
  d3.select('#cities_panel').selectAll('.entry').data(CITIES)
    .enter().append('div')
    .classed('entry', true)
    .on('click', function(cityEntry, i) {
      selectCity(i, cityEntry[1]);
      // TODO deselect all cities.
      // TODO select this city.
    })
    .append('svg')
    .append('text')
    .attr('x', 70)
    .attr('y', 20)
    .attr('dy', '.31em')
    .text(function(cityEntry, i) {
      return cityEntry[0];
    });

  // TODO simulate click in one city, to set div as selected.
  selectCity(0, CITIES[0][1]);
};


var selectCity = function(cityIndex, cityCoords) {
  onSelectCityCB(cityIndex);
  centerMapInCoords(cityCoords);
};


var centerMapInCoords = function(coords) {
  var latlng0 = new google.maps.LatLng(coords.min_lat, coords.min_lon);
  var latlng1 = new google.maps.LatLng(coords.max_lat, coords.max_lon);
  var bounds = getMapBoundaries(latlng0, latlng1);
  map.fitBounds(bounds);
};
