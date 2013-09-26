/**
 * Creates a gaussian chart for data.
 * Data must be an array of [x, incidence].
 * @author Cesar Palomo cesarpalomo@gmail.com
 */
var GaussianChart = function(containerId, data, title, options) {
  var options = options || {};
  var margin = {top: 20, right: 20, bottom: 60, left: 80},
      width = (options.width || 1270) - margin.left - margin.right,
      height = (options.height || 160) - margin.top - margin.bottom;

  var stats = this.computeStats(data);

  var x = options.useTimeScaleForX ?
    d3.time.scale().range([0, width]) :
    d3.scale.linear().range([0, width]);

  var y = options.useTimeScaleForY ?
    d3.time.scale().range([height, 0]) :
    options.useLogScaleForY ?
      d3.scale.log().clamp(true).range([height, 0]) :
      d3.scale.linear().range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient('bottom');
  if (options.xTicks) {
    xAxis.ticks(options.xTicks);
  }

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');
  if (options.yTicks) {
    yAxis.ticks(options.yTicks);
  }

  // A line generator.
  var line = d3.svg.line()
      .x(function(d) { return x(d[0] - stats.meanX); })
      .y(function(d) { return y(d[1]); });

  // An area generator, for the light fill.
  var area = d3.svg.area()
      .x(function(d) { return x(d[0] - stats.meanX); })
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

  var x_extent = [stats.meanX - stats.maxWidth, stats.meanX + stats.maxWidth];
  x.domain(x_extent);

  var y_extent = d3.extent(data, function(d) { return d[1]; });
  if (options.useLogScaleForY) {
    if (y_extent[0] == 0) y_extent[0] = 0.01;
    if (y_extent[1] == 0) y_extent[1] = 0.01;
  }
  y.domain(d3.extent(y_extent));

  // Adds axis.
  var xAxisGroup = svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(xAxis);
  if (options.xAxisTitle) {
    xAxisGroup.append('text')
      .style('text-anchor', 'middle')
      .text(options.xAxisTitle)
      .attr(
        'transform',
        'translate(' + (width / 2) + ', ' + (margin.bottom) + ')');
  }

  var yAxisGroup = svg.append('g')
      .attr('class', 'y axis')
      .call(yAxis);
  if (options.yAxisTitle) {
    yAxisGroup.append('text')
      .style('text-anchor', 'middle')
      .text(options.yAxisTitle)
      .attr(
        'transform',
        'translate(' + (-margin.left + 20) + ', ' + (height / 2) + ') ' +
        'rotate(-90)');
  }

  // Creates lookup table to use for tooltip.
  var lookupTable = [];
  data.forEach(function(d) {
    lookupTable[d[0]] = d[1];
  });

  // Add the area path.
  svg.append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('clip-path', 'url(#clip)')
      .attr('d', area)
      .on("mousemove", function (d, i) {
        var cx = d3.mouse(this)[0];
        var cy = d3.mouse(this)[1];
        var invCx = x.invert(cx);
        var invCy = y.invert(cy);
        console.log('[' + cx + ', ' + (height - cy) + ']');
        console.log('[' + invCx + ', ' + invCy + ']');
      })
      .on('mouseover', function(option) {
        utils.showTooltip.call(utils);
      })
      .on('mousemove', function(option) {
        var cx = d3.mouse(this)[0];
        var cy = d3.mouse(this)[1];
        var invCx = x.invert(cx);
        var invCy = y.invert(cy);
        // TODO var text = '[' + invCx + ', ' + invCy + ']';
        var text = invCx;
        utils.updateTooltip.call(utils, text);
      })
      .on('mouseout', function(option) {
        utils.hideTooltip.call(utils);
  });

  // Adds line path.
  svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line);
};


/**
 * Compute statistics for data.
 * Returns object with maxX, minX, maxWidth, meanX.
 */
GaussianChart.prototype.computeStats = function(data) {
  data.sort(function(a, b) {
    // Returns 1 when a > b, -1 otherwise.
    return 2 * (a[0] > b[0]) - 1;
  });

  var meanX = 0;
  var maxX = -Infinity;
  var minX = Infinity;

  // Move this to backend: should return mean value for bucket, not
  // starting value.
  var HALF_INTERVAL = 5;

  var sumY = 0;
  var countY = 0;
  var maxY = -Infinity;
  data.forEach(function(d) {
    var x = d[0] + HALF_INTERVAL;
    var count = d[1] / 100;

    countY += count;
    sumY += count * x;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);

    maxY = Math.max(maxY, d[1]);
  });
  var meanY = sumY / countY;

  // Finds corresponding X for mean Y.
  var meanX = 0;
  var minDist = Infinity;
  var prefixSum = 0;
  for (var entry in data) {
    var d = data[entry];
    var x = d[0] + HALF_INTERVAL;
    prefixSum += d[1];
    var dist = Math.abs(meanY - prefixSum);
    if (dist < minDist) {
      minDist = dist;
      meanX = x;
    }
  }

  return {
    minX: minX,
    maxX: maxX,
    maxWidth: Math.max(meanX - minX, maxX - meanX),
    meanX: meanX,
    maxY: maxY,
    invMaxY: 1 / maxY
  };
};
