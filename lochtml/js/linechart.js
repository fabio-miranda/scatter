/**
 * Creates a line chart for data.
 * Data must be an array of [date, value].
 * @author Cesar Palomo cesarpalomo@gmail.com
 */
var LineChart = function(containerId, data, format) {
  var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = 1270 - margin.left - margin.right,
      height = 160 - margin.top - margin.bottom;

  var x = d3.time.scale()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom')
      .ticks(8);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .ticks(5);

  // A line generator.
  var line = d3.svg.line()
      .x(function(d) { return x(d[0]); })
      .y(function(d) { return y(d[1]); });

  // An area generator, for the light fill.
  var area = d3.svg.area()
      .x(function(d) { return x(d[0]); })
      .y0(height)
      .y1(function(d) { return y(d[1]); });

  var svg = d3.select(containerId)
    .append('svg')
      .attr('id', 'lineChart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  svg.append('text')
      .attr('x', width / 2)
      .attr('y', '-5')
      .style('text-anchor', 'middle')
      .text('Number of active calls');

  // Creation with data.
  var parseDate = d3.time.format('%d-%b-%y %H:00');
  data.forEach(function(d) {
    var date = new Date(0);
    date.setSeconds(d[0]);
    d[0] = date;
  });

  x.domain(d3.extent(data, function(d) { return d[0]; }));
  y.domain(d3.extent(data, function(d) { return d[1]; }));

  // Adds axis.
  svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);

  svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);

  // Add the area path.
  svg.append("path")
      .attr("class", "area")
      .attr("clip-path", "url(#clip)")
      .attr("d", area(data));

  // Adds line path.
  svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);
};
