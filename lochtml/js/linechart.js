/**
 * Creates a line chart for data.
 * Data must be an array of [date, value].
 * @author Cesar Palomo cesarpalomo@gmail.com
 */
var LineChart = function(containerId, data, title, format) {
  var format = format || {};
  var margin = {top: 20, right: 20, bottom: 60, left: 80},
      width = (format.width || 1270) - margin.left - margin.right,
      height = (format.height || 160) - margin.top - margin.bottom;

  var x = format.useTimeScaleForX ?
    d3.time.scale().range([0, width]) :
    format.useLogScaleForX ?
      d3.scale.log().clamp(true).range([0, width]) :
      d3.scale.linear().range([0, width]);

  var y = format.useTimeScaleForY ?
    d3.time.scale().range([height, 0]) :
    format.useLogScaleForY ?
      d3.scale.log().clamp(true).range([height, 0]) :
      d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom');
  if (format.xTicks) {
    xAxis.ticks(format.xTicks);
  }

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');
  if (format.yTicks) {
    yAxis.ticks(format.yTicks);
  }

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
      .classed('line_chart', true)
      //.attr('id', 'line_chart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  svg.append('text')
      .attr('x', width / 2)
      .attr('y', '-5')
      .style('text-anchor', 'middle')
      .text(title);

  var x_extent = d3.extent(data, function(d) { return d[0]; });
  if (format.useLogScaleForX) {
    if (x_extent[0] == 0) x_extent[0] = 0.01;
    if (x_extent[1] == 0) x_extent[1] = 0.01;
  }
  x.domain(x_extent);

  var y_extent = d3.extent(data, function(d) { return d[1]; });
  if (format.useLogScaleForY) {
    if (y_extent[0] == 0) y_extent[0] = 0.01;
    if (y_extent[1] == 0) y_extent[1] = 0.01;
  }
  y.domain(d3.extent(y_extent));

  // Adds axis.
  var xAxisGroup = svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);
  if (format.xAxisTitle) {
    xAxisGroup.append('text')
      .style('text-anchor', 'middle')
      .text(format.xAxisTitle)
      .attr(
        'transform',
        'translate(' + (width / 2) + ', ' + (margin.bottom) + ')');
  }

  var yAxisGroup = svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
  if (format.yAxisTitle) {
    yAxisGroup.append('text')
      .style('text-anchor', 'middle')
      .text(format.yAxisTitle)
      .attr(
        'transform',
        'translate(' + (-margin.left + 20) + ', ' + (height / 2) + ') ' +
        'rotate(-90)');
  }

  // Add the area path.
  svg.append('path')
      .attr('class', 'area')
      .attr('clip-path', 'url(#clip)')
      .attr('d', area(data));

  // Adds line path.
  svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);
};
