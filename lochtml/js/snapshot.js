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
var SnapshotRecorder = function(gallery) {
  this.gallery_ = gallery;
  this.animOn_ =  false;
  this.timestep_ = 0;
  this.finalTime_ = 0;
  this.currentTime_ = 0;
  this.readingData_ = false;

  this.UPDATE_INTERVAL = 100;
};

// TODO continue

/**
 * Starts creation of snapshots between dates, in steps given by
 * time interval (initialTime, finalTime]. Times and interval are
 * given as timestamps in minutes.
 */
SnapshotRecorder.prototype.start = function(initialTime, finalTime, timestep) {
  this.timestep_ = timestep;
  this.finalTime_ = finalTime;
  this.currentTime_ = initialTime;
  this.animOn_ = true;
  this.readingData_ = false;

  var that = this;
  setInterval(
    function() { update.call(that); },
    that.UPDATE_INTERVAL
  );
};


/**
 * Received data callback. Process data and adds a snapshot to gallery.
 */
SnapshotRecorder.prototype.receivedData = function() {
  // TODO Updates rendering with received data.
  // TODO After rendering is complete, saves snapshot and adds to gallery.


  // Signal so that update read data for next timestep.
  this.currentTime_ += this.timestep_;
  this.readingData_ = false;
};


/**
 * Updates recorder: if data should be processed again, tries to read it.
 */
SnapshotRecorder.prototype.update = function() {
  // Add text with details (date/time, number of samples).
  return '<p>' +
    item.dateTime + '<br>' +
    '<b>' + item.numberOfPoints + '</b> samples' +
    '</p>';
};
