/**
 * Class for scatter plot.
 *
 * @param data:
 *        Array with the size equal to # of points to be plotted.
 * @param xfunc function to access x value of one point in data.
 *        Given d,i, a point in data, should return x in d (e.g d[0], d.name etc)
 * @param yfunc function to access y value of one point in data.
 *        Given d,i, a point in data, should return y in d (e.g d[1], d.date etc)
 * @param rfunc function to access size of ray of one point in data.
 *        Given d,i, a point in data, should return x in d (e.g d[0], d.name etc)
 * @param classfunc function to access class of one point in data.
 * @param legend {x: "x axis", y: "y axis"}
 * @param margin margin settings in the format:
 *        {top, right, bottom, left}
 * @param parentNodeId html parent node to add chart.
 *        parentNodeId must not occur inside a svg node. E.g.: ".id", "#class".
 */
function ScatterPlot(data, xfunc, yfunc, rfunc,
  classfunc, onhoverfunc, legend, margin, parentNodeId) {

  this.data = data;
  this.xfunc = xfunc;
  this.yfunc = yfunc;
  this.rfunc = rfunc;
  this.classfunc = classfunc;
  this.onhoverfunc = onhoverfunc;
  this.legend = legend;
  this.margin = margin;
  this.parentNodeId = parentNodeId;

  this.initialize();
}

/**
 * Recreate chart with provided data and settings.
 */
ScatterPlot.prototype.setPoints = function(data, xfunc, yfunc, rfunc,
  classfunc, onhoverfunc, legend) {

  this.data = data;
  this.xfunc = xfunc;
  this.yfunc = yfunc;
  this.rfunc = xfunc;
  this.classfunc = classfunc;
  this.onhoverfunc = onhoverfunc;
  this.legend = legend;

  // TODO allow for dates

  // update domain
  //this.xDomain = [Infinity, -Infinity];
  //this.yDomain = [Infinity, -Infinity];
  //this.yDomain[0] = d3.min([this.yDomain[0], ylimits[0]]);
  //this.yDomain[1] = d3.max([this.yDomain[1], ylimits[1]]);

  console.log(this.xfunc(this.data, 0));

  // update domain for axes
  this.xscale
    .range([0, this.drawable.width])
    .domain(d3.extent(this.data,
    function(d,i) { return xfunc(d,i); })).nice();
  this.yscale
    .range([this.drawable.height, 0])
    .domain(d3.extent(this.data,
      function(d,i) { return yfunc(d,i); })).nice();
  this.xAxis
      .scale(this.xscale)
      .orient("bottom");
  this.yAxis
      .scale(this.yscale)
      .orient("left");
  this.xaxisgroup
    .attr("class", "xAxis")
    .call(this.xAxis);
  this.yaxisgroup
    .attr("class", "yAxis")
    .call(this.yAxis);

  //// update text for axis
  //this.xaxislegendtext.text(this.legend.x);
  //this.yaxislegendtext.text(this.legend.y);

  // update dots (TODO what about erase?)
  var that = this;
  var points = this.svg.selectAll("#dot")
    .data(this.data)
      //.attr("class", function(d,i) { return classfunc(d,i); })
      .attr("r", function(d,i) { return rfunc(d,i); })
      .attr("cx", function(d,i) { return that.xscale(xfunc(d,i)); })
      .attr("cy", function(d,i) { return that.yscale(yfunc(d,i)); })
      .on("mouseover", function(d,i) { return that.onhoverfunc(d,i); });
  points.enter()
      .append("circle")
      .attr("id", "dot")
      //.attr("class", function(d,i) { return classfunc(d,i); })
      .attr("r", function(d,i) { return rfunc(d,i); })
      .attr("cx", function(d,i) { return that.xscale(xfunc(d,i)); })
      .attr("cy", function(d,i) { return that.yscale(yfunc(d,i)); })
      .on("mouseover", function(d,i) { return that.onhoverfunc(d,i); });
  points.exit()
      .remove();
}

/**
 * Create chart with provided data and settings.
 */
ScatterPlot.prototype.initialize = function() {

  var xfunc = this.xfunc;
  var yfunc = this.yfunc;
  var rfunc = this.rfunc;
  var classfunc = this.classfunc;
  var parentNode = $(this.parentNodeId);
  this.plot = {width:  parentNode.width(),
               height: parentNode.height()
  };
  this.drawable = {width:  parentNode.width()  
                           - this.margin.left
                           - this.margin.right,
                   height: parentNode.height()
                           - this.margin.top
                           - this.margin.bottom
  };

  this.svg = d3.select(this.parentNodeId).append("svg")
      .attr("width", this.plot.width)
      .attr("height", this.plot.height)
      .attr("class", "scatterplot")
    .append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

  this.xscale = d3.scale.linear()
      .range([0, this.drawable.width])
      .domain([0,10]);

  this.yscale = d3.scale.linear()
      .range([this.drawable.height, 0])
      .domain([0.8,4]);

  this.xAxis = d3.svg.axis()
      .scale(this.xscale)
      .orient("bottom");

  this.yAxis = d3.svg.axis()
      .scale(this.yscale)
      .orient("left");

  this.xaxisgroup = this.svg.append("g")
      .attr("class", "x axis")         // TODO make this flexible
      .attr("transform", "translate(0," + this.drawable.height + ")")
      .call(this.xAxis);
  this.xaxislegendtext = this.xaxisgroup
    .append("text")
      .attr("class", "label")         // TODO make this flexible
      .attr("x", this.drawable.width)
      .attr("y", -6)                          // TODO make this flexible
      .style("text-anchor", "end");

  this.yaxisgroup = this.svg.append("g")
      .attr("class", "y axis")         // TODO make this flexible
      .call(this.yAxis);
  this.yaxislegendtext = this.yaxisgroup
    .append("text")
      .attr("class", "label")         // TODO make this flexible
      .attr("transform", "rotate(-90)")         // TODO make this flexible
      .attr("y", 6)                          // TODO make this flexible
      .attr("dy", ".71em")                   // TODO make this flexible
      .style("text-anchor", "end");

  this.setPoints(this.data, this.xfunc, this.yfunc, this.rfunc,
    this.classfunc, this.onhoverfunc, this.legend);

  // TODO this may change
  //var color = d3.scale.category10();

  // TODO allow for dates

      //.style("fill", function(d) { return color(2); });   // TODO make this flexible
      //.style("fill", function(d) { return color(d[2]); });   // TODO make this flexible

  // TODO
  //var legend = svg.selectAll(".legend")         // TODO make this flexible
  //    .data(color.domain())
  //  .enter().append("g")
  //    .attr("class", "legend")         // TODO make this flexible
  //    .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });  // TODO make this flexible

  //legend.append("rect")
  //    .attr("x", this.drawable.width - 18)              // TODO make this flexible
  //    .attr("width", 18)                               // TODO make this flexible
  //    .attr("height", 18)                              // TODO make this flexible
  //    .style("fill", color);

  //legend.append("text")
  //    .attr("x", this.drawable.width - 24)             // TODO make this flexible
  //    .attr("y", 9)                                    // TODO make this flexible
  //    .attr("dy", ".35em")                             // TODO make this flexible
  //    .style("text-anchor", "end")
  //    .text(function(d) { return d; });
};
