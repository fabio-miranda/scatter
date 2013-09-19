/**
 * @fileoverview three.js Gallery of snapshots of line trips.
 *
 * @author (cesarpalomo@gmail.com) Cesar Palomo
 */



/**
 * Manages a gallery with snapshots of states of application.
 * The gallery contains thumbnails representing the canvas state
 * when snapshot was created for a specific filters configuration.
 *
 * @param containerId id for gallery div element.
 * @param saveButtonId id for element whose click event will trigger
 *     creation of snapshot and addition to gallery.
 * @param getSnapshot function to get the content for a snapshot.
 */
var Gallery = function(containerId, getSnapshot) {
  // Containers.
  this.containerId_ = containerId;
  this.getSnapshot_ = getSnapshot;

  // Items in gallery.
  this.items_ = [];
};


/**
 * Adds snapshot to gallery.
 * Saves an internal 
 */
Gallery.prototype.addSnapshot = function() {
  // Save snapshot of current canvas, and add to this.items.
  var snapshot = this.getSnapshot_();
  this.items_.push({
    map_src: snapshot.map_src,
    overlay: snapshot.overlay,
    dateTime: getRenderedTimeText(),
    numberOfPoints: getNumberOfPoints()
  });

  this.update();
};


/**
 * Updates gallery.
 */
Gallery.prototype.update = function() {
  var gallery = this;
  var items = d3.select(this.containerId_)
    .selectAll('.item').data(this.items_, function(item, i) {
      return item + '-' + i;
  });

  // New items.
  var newItems = items
    .enter()
      .append('div')
      .classed('item', true);
  // Adds map image.
  newItems
    .append('img')
    .attr('src', function(item, i) {
      return item.map_src;
  });
  // Adds map overlay.
  newItems
    .append('img')
    .attr('src', function(item, i) {
      return item.overlay;
  });
  // Adds item information.
  newItems
    .append('div')
    .classed('item_info', true)
    .html(function(item, i) {
      return gallery.getItemInfo(item, i);
  });

  // Remove missing items.
  items.exit().remove();
};


/**
 * Builds html content with info about an item in the gallery,
 * such as date/time and number of points.
 */
Gallery.prototype.getItemInfo = function(item, i) {
  // Add text with details (date/time, number of points).
  return '<p>' +
    item.dateTime + '<br>' +
    '<b>' + item.numberOfPoints + '</b> points' +
    '</p>';
};
