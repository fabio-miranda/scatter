/**
 * @fileoverview Contains commonly used functions throughout the
 * application.
 *
 * @author (cesarpalomo@gmail.com) Cesar Palomo
 */


var Utils = function() {
  this.createTooltipDiv_();
};


Utils.prototype.createTooltipDiv_ = function() {
  // Creates a div for tooltip content.
  this.tooltipDiv = d3.select('body')
    .append('div')
    .classed('tooltip', true)
      .style('opacity', 1e-6);
};


Utils.prototype.showTooltip = function() {
  this.tooltipDiv.transition()
      .duration(500)
      .style('opacity', 1);
};


Utils.prototype.hideTooltip = function() {
  this.tooltipDiv.transition()
      .duration(500)
      .style('opacity', 1e-6);
};


Utils.prototype.updateTooltip = function(text) {
  this.tooltipDiv
      .text(text)
      .style('left', (d3.event.pageX + 5) + 'px')
      .style('top', (d3.event.pageY - 12) + 'px');
};
