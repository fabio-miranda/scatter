/**
 * @fileoverview snapshot.js Creates snapshots of data for each day,
 * with different divisions.
 *
 * @author (cesarpalomo@gmail.com) Cesar Palomo
 */



/**
 * Creates a sequence of snapshots to the gallery with data for
 * different times of days. Useful for creating thumbnails once for
 * reuse on hover cards.
 *
 * @param gallery gallery instance to add snapshot.
 */
/**
 * @fileoverview three.js SnapshotRecorder of snapshots of line trips.
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
var SnapshotRecorder = function(containerId, getSnapshot) {
  // Containers.
  this.containerId_ = containerId;
  this.getSnapshot_ = getSnapshot;

  // Items in gallery.
  this.entries_ = [];
  this.entriesDateSet_ = {};
};


/**
 * Adds snapshot.
 */
SnapshotRecorder.prototype.addSnapshot = function() {
  var snapshot = this.getSnapshot_();

  // Avoid duplicates.
  var timeText = getRenderedTimeText();
  if (timeText in this.entriesDateSet_) {
    return;
  }
  this.entriesDateSet_[timeText] = true;

  // Save snapshot of current canvas, and add to this.items.
  this.entries_.push({
    map_src: snapshot.map_src,
    overlay: snapshot.overlay,
    dateTime: timeText,
    numberOfPoints: getNumberOfPoints()
  });

  this.update();
};


/**
 * Updates gallery.
 */
SnapshotRecorder.prototype.update = function() {
  var gallery = this;
  var items = d3.select(this.containerId_)
    .selectAll('.item').data(this.entries_);

  // New items.
  var newItems = items
    .enter()
      .append('div')
      .classed('item', true);
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
};


/**
 * Builds html content with info about an item in the gallery,
 * such as date/time and number of samples.
 */
SnapshotRecorder.prototype.getItemInfo = function(item, i) {
  // Add text with details (date/time, number of samples).
  return '<p>' + item.dateTime + '</p>';
};





//var SnapshotRecorder = function(gallery) {
//  this.gallery_ = gallery;
//  this.animOn_ =  false;
//  this.timestep_ = 0;
//  this.finalTime_ = 0;
//  this.currentTime_ = 0;
//  this.readingData_ = false;
//
//  this.UPDATE_INTERVAL = 100;
//};
//
//// TODO continue
//
///**
// * Starts creation of snapshots between dates, in steps given by
// * time interval (initialTime, finalTime]. Times and interval are
// * given as timestamps in minutes.
// */
//SnapshotRecorder.prototype.start = function(initialTime, finalTime, timestep) {
//  this.timestep_ = timestep;
//  this.finalTime_ = finalTime;
//  this.currentTime_ = initialTime;
//  this.animOn_ = true;
//  this.readingData_ = false;
//
//  var that = this;
//  setInterval(
//    function() { update.call(that); },
//    that.UPDATE_INTERVAL
//  );
//};
//
//
///**
// * Received data callback. Process data and adds a snapshot to gallery.
// */
//SnapshotRecorder.prototype.receivedData = function() {
//  // TODO Updates rendering with received data.
//  // TODO After rendering is complete, saves snapshot and adds to gallery.
//
//
//  // Signal so that update read data for next timestep.
//  this.currentTime_ += this.timestep_;
//  this.readingData_ = false;
//};
//
//
///**
// * Updates recorder: if data should be processed again, tries to read it.
// */
//SnapshotRecorder.prototype.update = function() {
//  // Add text with details (date/time, number of samples).
//  return '<p>' +
//    item.dateTime + '<br>' +
//    '<b>' + item.numberOfPoints + '</b> samples' +
//    '</p>';
//};
