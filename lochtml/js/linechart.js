/**
 * Creates a line chart for data.
 * Data must be an array of [date, value].
 * @author Cesar Palomo cesarpalomo@gmail.com
 */
var LineChart = function(containerId, data, title, options) {
  var that = this;
  var options = options || {};
  var margin = {top: 20, right: 20, bottom: 60, left: 80},
      width = (options.width || 1270) - margin.left - margin.right;
  this.height = (options.height || 160) - margin.top - margin.bottom;
  this.containerId = containerId;
  this.classId = 'line_chart';

  that.x = options.useTimeScaleForX ?
    d3.time.scale().range([0, width]) :
    options.useLogScaleForX ?
      d3.scale.log().clamp(true).range([0, width]) :
      d3.scale.linear().range([0, width]);

  that.y = options.useTimeScaleForY ?
    d3.time.scale().range([that.height, 0]) :
    options.useLogScaleForY ?
      d3.scale.log().clamp(true).range([that.height, 0]) :
      d3.scale.linear().range([that.height, 0]);

  var xAxis = d3.svg.axis()
      .scale(that.x)
      .orient('bottom');
  if (options.xTicks) {
    xAxis.ticks(options.xTicks);
  }

  var yAxis = d3.svg.axis()
      .scale(that.y)
      .orient('left');
  if (options.yTicks) {
    yAxis.ticks(options.yTicks);
  }

  // A line generator.
  var line = d3.svg.line()
      .x(function(d) { return that.x(d[0]); })
      .y(function(d) { return that.y(d[1]); });

  // An area generator, for the light fill.
  var area = d3.svg.area()
      .x(function(d) { return that.x(d[0]); })
      .y0(that.height)
      .y1(function(d) { return that.y(d[1]); });

  this.svg = d3.select(containerId)
    .append('svg')
      .classed(that.classId, true)
      .attr('width', width + margin.left + margin.right)
      .attr('height', that.height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  this.svg.append('text')
      .attr('x', width / 2)
      .attr('y', '-5')
      .style('text-anchor', 'middle')
      .text(title);

  var x_extent = d3.extent(data, function(d) { return d[0]; });
  if (options.useLogScaleForX) {
    if (x_extent[0] == 0) x_extent[0] = 0.01;
    if (x_extent[1] == 0) x_extent[1] = 0.01;
  }
  that.x.domain(x_extent);

  var y_extent = d3.extent(data, function(d) { return d[1]; });
  if (options.useLogScaleForY) {
    if (y_extent[0] == 0) y_extent[0] = 0.01;
    if (y_extent[1] == 0) y_extent[1] = 0.01;
  }
  that.y.domain(d3.extent(y_extent));

  // Adds axis.
  var xAxisGroup = this.svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + that.height + ')')
      .call(xAxis);
  if (options.xAxisTitle) {
    xAxisGroup.append('text')
      .style('text-anchor', 'middle')
      .text(options.xAxisTitle)
      .attr(
        'transform',
        'translate(' + (width / 2) + ', ' + (margin.bottom) + ')');
  }

  var yAxisGroup = this.svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
  if (options.yAxisTitle) {
    yAxisGroup.append('text')
      .style('text-anchor', 'middle')
      .text(options.yAxisTitle)
      .attr(
        'transform',
        'translate(' + (-margin.left + 20) + ', ' + (that.height / 2) + ') ' +
        'rotate(-90)');
  }

  // Creates lookup table to use for tooltip.
  var lookupTable = [];
  data.forEach(function(d) {
    lookupTable[d[0]] = d[1];
  });

  // Add the area path.
  this.svg.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('clip-path', 'url(#clip)')
      .attr('d', area)
      .on("mousemove", function (d, i) {
        var cx = d3.mouse(this)[0];
        var cy = d3.mouse(this)[1];
        var invCx = that.x.invert(cx);
        var invCy = that.y.invert(cy);
        console.log('[' + cx + ', ' + (that.height - cy) + ']');
        console.log('[' + invCx + ', ' + invCy + ']');
      })
      .on('mouseover', function(option) {
        utils.showTooltip.call(utils);
      })
      .on('mousemove', function(option) {
        var cx = d3.mouse(this)[0];
        var cy = d3.mouse(this)[1];
        var invCx = that.x.invert(cx);
        var invCy = that.y.invert(cy);
        // TODO var text = '[' + invCx + ', ' + invCy + ']';
        var text = invCx;
        utils.updateTooltip.call(utils, text);
      })
      .on('mouseout', function(option) {
        utils.hideTooltip.call(utils);
  });

  // Adds line path.
  this.svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);
};


/**
 * Creates/updates a brush rectangle from x1 to x2, with the total
 * height of the chart. Useful to show context during animation.
 */
LineChart.prototype.updateBrush = function(x1, x2) {
  var that = this;
  var brush = this.svg.selectAll('.brush').data(['brush']);
  brush.enter().append('rect').classed('brush', true);
  brush
    .attr('x', this.x(x1))
    .attr('y', 0)
    .attr('width', this.x(x2) - this.x(x1))
    .attr('height', this.y(0));
};
