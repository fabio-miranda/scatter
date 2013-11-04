/**
 * Creates a line chart for data.
 * Data must be an array of [date, value].
 * @author Cesar Palomo cesarpalomo@gmail.com
 */
var LineChart = function(containerId, data, options) {
  var that = this;
  var options = options || {};
  options.margin = options.margin ||  
    {top: 20, right: 20, bottom: 60, left: 80};
  this.width = (options.width || 1270) - options.margin.left - options.margin.right;
  this.height = (options.height || 160) - options.margin.top - options.margin.bottom;
  this.containerId = containerId;
  this.groupClassId = options.groupClassId || 'line_chart';
  this.classId = 'line_chart';

  that.x = options.useTimeScaleForX ?
    d3.time.scale().range([0, that.width]) :
    options.useLogScaleForX ?
      d3.scale.log().clamp(true).range([0, that.width]) :
      d3.scale.linear().range([0, that.width]);

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

  d3.select(containerId).select('svg').remove();
  this.svg = d3.select(containerId)
    .append('svg')
      .classed(that.classId, true)
      .classed(that.groupClassId, true)
      .attr('width', that.width + options.margin.left + options.margin.right)
      .attr('height', that.height + options.margin.top + options.margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + options.margin.left + ',' + options.margin.top + ')');
  if (options.title) {
    this.svg.append('text')
        .attr('x', that.width / 2)
        .attr('y', '-5')
        .style('text-anchor', 'middle')
        .text(options.title);
  }

  var x_extent = 
    options.xExtent || d3.extent(data, function(d) { return d[0]; });
  if (options.useLogScaleForX) {
    if (x_extent[0] == 0) x_extent[0] = 0.01;
    if (x_extent[1] == 0) x_extent[1] = 0.01;
  }
  that.x.domain(x_extent);

  var y_extent =
    options.yExtent || d3.extent(data, function(d) { return d[1]; });
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
        'translate(' + (that.width / 2) + ', ' + (options.margin.bottom) + ')');
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
        'translate(' + (-options.margin.left + 20) + ', ' + (that.height / 2) + ') ' +
        'rotate(-90)');
  }

  if (data.length == 0) {
    return;
  }

  // Adds the area path.
  this.svg.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('clip-path', 'url(#clip)')
      .attr('d', area);

  // Adds line path.
  this.svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);

  // Creates lookup table to use for tooltip.
  var lookupTable = [];
  data.forEach(function(d) {
    lookupTable[d[0]] = d[1];
  });
  var getVerticalValue = function(date) {
    var lookupTableLength = data.length;
    var bisectDate = d3.bisector(function(d) {
        return d[0];
      }).left;
    var lowerIndex = bisectDate(data, date, 1);
    if (lowerIndex >= data.length) {
      return 0;
    }
    // Does not try to interpolate when in last value.
    if (lowerIndex == data.length - 1) {
      return data[data.length - 1][1];
    }

    // Interpolates value.
    var upperIndex = lowerIndex + 1;
    var lower = data[lowerIndex];
    var upper = data[upperIndex];
    var lowerTs = lower[0].getTime();
    var upperTs = upper[0].getTime();
    var lowerValue = lower[1];
    var upperValue = upper[1];
    var between = d3.interpolateNumber(lowerValue, upperValue);
    var t = (date.getTime() - lowerTs) / (upperTs - lowerTs);
    // TODO Generalize 0: will not work for charts with negative values.
    return Math.max(0, between(t));
  };

  var tooltipXFormat =
   options.tooltipXFormat || d3.time.format('%Y-%m-%d %I:%M%p');
  var tooltipYFormat = options.tooltipYFormat || d3.format('f');
  var showTooltipCircle = function(x, y) {
    var circle = that.svg.selectAll('.tooltipCircle').data([that]);
    circle.enter().append('circle')
        .attr('r', 3)
        .classed('tooltipCircle', true);
    circle
        .attr('cx', x)
        .attr('cy', y);
  };
  var hideTooltipCircle = function(x, y) {
    that.svg.selectAll('.tooltipCircle').data([that]).remove();
  };

  // Adds background rect for mouse events.
  this.svg.append('rect')
    .attr('opacity', 0)
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', that.width)
    .attr('height', that.height)
    .on('mouseover', function(option) {
      utils.showTooltip.call(utils);
    })
    .on('mousemove', function(option) {
      var cx = d3.mouse(this)[0];
      var cy = d3.mouse(this)[1];

      var invCx = that.x.invert(cx);
      var xText = tooltipXFormat(invCx);
      var yValue = getVerticalValue(invCx);
      var yText = tooltipYFormat(yValue);
      var tooltipText = xText + ', ' + yText;

      var yPos = that.y(yValue);
      showTooltipCircle(cx, yPos);
      utils.updateTooltip.call(utils, tooltipText);
    })
    .on('mouseout', function(option) {
      utils.hideTooltip.call(utils);
      hideTooltipCircle();
  });
};


/**
 * Creates/updates a brush rectangle from x1 to x2, with the total
 * height of the chart. Useful to show context during animation.
 */
LineChart.prototype.updateBrush = function(x1, x2) {
  var that = this;
  var brush = this.svg.selectAll('.brushGroup').data(['brush']);
  brush.enter().append('g').classed('brushGroup', true);

  // Translates brush's center.
  var brushXCenter = 0.5 * (this.x(x2) + this.x(x1));
  brush.attr('transform', 'translate(' + brushXCenter + ', 0)');

  // Updates line position.
  var lineSize = {
    w: this.x(x2) - this.x(x1),
    h: this.y(0) + 10
  };
  var linePos = {
    x: -0.5 * (this.x(x2) - this.x(x1)),
    y: -10
  };
  var brushLine = brush.selectAll('.brush').data(['brush']);
  brushLine.enter().append('rect').classed('brush', true);
  brushLine
    .attr('x', linePos.x)
    .attr('y', linePos.y)
    .attr('width', lineSize.w)
    .attr('height', lineSize.h);
};
