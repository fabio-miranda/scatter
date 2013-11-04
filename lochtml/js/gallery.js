/**
 * @fileoverview gallery.js Gallery of snapshots of line trips.
 *
 * @author (cesarpalomo@gmail.com) Cesar Palomo
 */



/**
 * Manages a gallery with snapshots of states of application.
 * The gallery contains thumbnails representing the canvas state
 * when snapshot was created for a specific filters configuration.
 *
 * @param containerId id for gallery div element.
 */
var Gallery = function(containerId) {
  // Container.
  this.containerId_ = containerId;

  this.CITY_FOLDER_ =
    ['NY/', 'LA/', 'SF/', 'Paris/', 'SP/', 'Tokyo/', 'Seoul/'];

  // Entries in gallery.
  this.entries_ = [];
  this.entriesDateSet_ = [];
  for (var i = 0; i < this.CITY_FOLDER_.length; i++) {
    this.entries_[i] = [];
    this.entriesDateSet_[i] = {};
  }

  this.lineChartsVisible_ = true;
  this.thumbsVisible_ = true;

  // Constants for content display.
  this.THUMB_LIST_WIDTH = 1260;
  this.THUMB_LIST_HEIGHT = 150;
  this.NUMBER_OF_THUMBS_ = 8;
  this.THUMB_W_H = 150;
  this.THUMB_PADDING_X = 2;
  this.THUMB_LIST_PADDING_LEFT = 45;

  this.LINE_CHART_WIDTH = 1258;
  this.LINE_CHART_HEIGHT = 100;
  this.LINE_CHART_PADDING_LEFT = 45;
  this.TITLE_WIDTH = this.THUMB_LIST_PADDING_LEFT;
  this.TITLE_HEIGHT = 100;

  this.PADDING_TOP_ = 3;

  // Creates control buttons.
  this.createControlButtons();

  this.IMAGES_FOLDER_ = '../img/daymultiples/';
  this.THUMBS_FOLDER_ = 'thumbs-blues/';

  // Constant for image with empty map. Used as thumbs background.
  this.EMPTY_MAP_THUMB_ = 'empty.png';

  this.currentCityIndex_ = 0;
};


/**
 * Adds entry to gallery.
 */
Gallery.prototype.addEntry = function(entry) {
  var entries = this.getEntries_();
  var entriesDateSet = this.getEntriesDateSet_();

  // Avoid duplicates.
  if (entry.date in entriesDateSet) {
    return;
  }

  // Stores internally and updates.
  entriesDateSet[entry.date] = true;
  entries.push({
    date: entry.date,
    data: entry.data
  });

  this.update_();

  // Since line charts or thumbs might be hidden, update visibility
  // after each new entry is added.
  this.updateRowsComponentsVisibility_();
};


// Updates current city index.
Gallery.prototype.setCityIndex = function(cityIndex) {
  this.currentCityIndex_ = cityIndex;
  this.update_();
};


/**
 * Gets entries for current city.
 */
Gallery.prototype.getEntries_ = function() {
  return this.entries_[this.currentCityIndex_];
};


/**
 * Returns number of thumbs.
 */
Gallery.prototype.getNumberOfThumbs = function() {
  return self.NUMBER_OF_THUMBS_;
};

/**
 * Gets entries date set for current city.
 */
Gallery.prototype.getEntriesDateSet_ = function() {
  return this.entriesDateSet_[this.currentCityIndex_];
};


// Returns path to images for a specific city.
Gallery.prototype.getPathToImages_ = function(cityIndex) {
  return this.IMAGES_FOLDER_ + this.CITY_FOLDER_[cityIndex];
};


// Returns path to thumbs for a specific city.
Gallery.prototype.getPathToThumbs = function(cityIndex) {
  return this.getPathToImages_(cityIndex) + this.THUMBS_FOLDER_;
};


Gallery.prototype.getPathToEmptyMap = function(cityIndex) {
  return this.getPathToImages_(cityIndex) + this.EMPTY_MAP_THUMB_;
};


Gallery.prototype.createControlButtons = function() {
  var gallery = this;
  var options = [
    {
      src: USE_DARK_STYLE ?
        '../img/graphIcon-blackStyle.png' : '../img/graphIcon-whiteStyle.png',
      onClickCallback: function() {
        return gallery.toggleLineChartsVisibility.call(gallery);
      },
      isVisibleCallback: function() {
        return gallery.lineChartsVisible_;
      }
    },
    {
      src: USE_DARK_STYLE ?
        '../img/thumbsIcon-blackStyle.png' : '../img/thumbsIcon-whiteStyle.png',
      onClickCallback: function() {
        return gallery.toggleThumbsVisibility.call(gallery);
      },
      isVisibleCallback: function() {
        return gallery.thumbsVisible_;
      }
    }
  ];

  d3.select('#gallery_control').selectAll('img').data(options)
    .enter().append('img')
      .attr('src', function(option, i) {
        return option.src;
      })
      .classed('selected', function(option, i) {
        return option.isVisibleCallback();
      })
      .style('margin-left', function(option, i) {
        return i ? '2px' : '0px';
      })
      .on('click', function(option, i) {
        if (option.onClickCallback()) {
          d3.select(this).classed('selected', option.isVisibleCallback());
        }
  });
};


/**
 * Updates line charts visibility.
 */
Gallery.prototype.updateLineChartsVisibility = function() {
  var gallery = this;
  var rows = this.getRows_();

  // Updates visibility of all line charts.
  this.getLineCharts_(rows)
    .attr('visibility', this.lineChartsVisible_ ? 'visible' : 'hidden');

  // Updates rows height.
  rows.style('height', gallery.getRowsHeight_() + 'px');

  // Updates thumbs list y position using margin-top.
  this.getThumbs_(rows)
    .style('margin-top', gallery.getThumbsMarginTop_() + 'px');
};


/**
 * Toggles line charts visibility.
 * Returns whether visibility actually changed.
 */
Gallery.prototype.toggleLineChartsVisibility = function() {
  // Either the charts or the thumbs must be visible.
  if ((!this.thumbsVisible_ && this.lineChartsVisible_) ||
      this.getEntries_().length == 0) {
    return false;
  }
  this.lineChartsVisible_ = !this.lineChartsVisible_;
  this.updateLineChartsVisibility();
  return true;
};


/**
 * Updates thumbs visibility.
 */
Gallery.prototype.updateThumbsVisibility = function() {
  var gallery = this;
  var rows = this.getRows_();

  // Updates visibility of all thumbs lists.
  this.getThumbs_(rows)
    .attr('visibility', this.thumbsVisible_ ? 'visible' : 'hidden');

  // Updates rows height.
  rows.style('height', gallery.getRowsHeight_() + 'px');

  // Updates thumbs list y position using margin-top.
  this.getLineCharts_(rows)
    .style('margin-top', gallery.getLineChartMarginTop_() + 'px');
};


/**
 * Toggles thumbs visibility.
 * Returns whether visibility actually changed.
 */
Gallery.prototype.toggleThumbsVisibility = function() {
  // Either the charts or the thumbs must be visible.
  if ((!this.lineChartsVisible_ && this.thumbsVisible_) ||
      this.getEntries_().length == 0) {
    return false;
  }
  this.thumbsVisible_ = !this.thumbsVisible_;
  this.updateThumbsVisibility();
  return true;
};


/**
 * Updates rows components visibility.
 */
Gallery.prototype.updateRowsComponentsVisibility_ = function() {
  this.updateLineChartsVisibility();
  this.updateThumbsVisibility();
};


/**
 * Returns D3 selection with rows in gallery.
 */
Gallery.prototype.getRows_ = function() {
  var cityIndex = this.currentCityIndex_;
  return d3.select(this.containerId_)
    .selectAll('.row').data(this.getEntries_(), function(item, i) {
      return cityIndex + '-' + item + '-' + i;
  });
};


/**
 * Returns rows height, given contents visibility.
 */
Gallery.prototype.getRowsHeight_ = function() {
  var height = this.PADDING_TOP_;
  height += this.lineChartsVisible_ ? this.LINE_CHART_HEIGHT : 0;
  height += this.thumbsVisible_ ? this.THUMB_LIST_HEIGHT + this.PADDING_TOP_: 0;
  return height;
};


/**
 * Returns margin top for line chart in each row, given contents visibility.
 */
Gallery.prototype.getLineChartMarginTop_ = function() {
  return this.PADDING_TOP_;
};


/**
 * Returns margin top for thumbs list in each row, given contents visibility.
 */
Gallery.prototype.getThumbsMarginTop_ = function() {
  return this.lineChartsVisible_ ?
    this.LINE_CHART_HEIGHT + 2 * this.PADDING_TOP_ :
    this.PADDING_TOP_;
};


/**
 * Given a selection of rows in gallery,
 * returns D3 selection with SVG for line chart in rows.
 */

Gallery.prototype.getLineCharts_ = function(rows) {
  return rows.select('.line_chart');
};


/**
 * Given a selection of rows in gallery,
 * returns D3 selection with SVG for thumbs in the rows.
 */

Gallery.prototype.getThumbs_ = function(rows) {
  return rows.select('.thumbs_list');
};


/**
 * Updates gallery.
 */
Gallery.prototype.update_ = function() {
  var gallery = this;

  var getEntryId = function(entry) {
    return 'gallery_entry_' + entry.date;
  };

  var rows = this.getRows_();
  rows.exit().remove();

  // TODO must update all rows, not only the new ones.
  // Adds new rows.
  var newRows = rows.enter()
    .append('div')
    .classed('row', true)
    .attr('id', function(entry, i) {
      return getEntryId(entry);
    });

  // SVG for day description.
  newRows.append('svg')
    .attr('width', gallery.TITLE_WIDTH)
    .attr('height', gallery.TITLE_HEIGHT)
    .append('text')
    .style('text-anchor', 'middle')
    .text(function(entry, i) {return entry.date;})
    .attr(
      'transform',
      'translate(' + (gallery.LINE_CHART_PADDING_LEFT / 2) + ', ' +
                      gallery.LINE_CHART_PADDING_LEFT + ') ' +
      'rotate(-90)');

  // SVG for line charts.
  var options = {
    width: gallery.LINE_CHART_WIDTH - gallery.LINE_CHART_PADDING_LEFT,
    height: gallery.LINE_CHART_HEIGHT -10,
    useTimeScaleForX: true,
    yAxisTitle: 'Samples',
    xTicks: 8,
    yTicks: 3,
    margin: {top: 8, right: 10, bottom: 22, left: 80},
    yExtent: [0, 5000],
    tooltipXFormat: d3.time.format('%I:%M%p'),
    tooltipYFormat: function(v) { return d3.format('f')(v) + ' samples';},
  };
  newRows.append('svg')
      .classed('line_chart', true)
      .attr('width', gallery.LINE_CHART_WIDTH - gallery.LINE_CHART_PADDING_LEFT)
      .attr('height', gallery.LINE_CHART_HEIGHT)
      .style('margin-left', gallery.LINE_CHART_PADDING_LEFT)
      .style('margin-top', gallery.getLineChartMarginTop_.call(gallery))
      .each(function(entry, i) {
        var container = '#' + getEntryId(entry) + ' .line_chart';
        // Parse date to set fixed x domain interval to the current date.
        var day = Date.parse(entry.date);
        day += new Date().getTimezoneOffset() * 60000;
        options.xExtent = [day, day + 86399000];
        new LineChart(
          container,
          entry.data,
          options);
      });

  // SVG for thumbs.
  var thumbs = newRows.append('svg')
      .classed('thumbs_list', true)
      .attr('width', gallery.THUMB_LIST_WIDTH)
      .attr('height', gallery.THUMB_LIST_HEIGHT)
      .style('margin-top', gallery.getThumbsMarginTop_.call(gallery));

  var thumbIndices = d3.range(gallery.NUMBER_OF_THUMBS_);

  // Adds images in thumbs.
  var emptyThumbs = thumbs.selectAll('image.thumb_bg').data(thumbIndices);
  // Enter
  emptyThumbs
    .enter()
      .append('image')
      .classed('thumb_bg', true)
      .attr('width', gallery.THUMB_W_H)
      .attr('height', gallery.THUMB_W_H)
      .attr('x', function(entry, i) {
        return gallery.THUMB_LIST_PADDING_LEFT + i * (gallery.THUMB_W_H + gallery.THUMB_PADDING_X);
      })
      .attr('y', 0);
  // Update
  emptyThumbs
      .attr('xlink:href', gallery.getPathToEmptyMap.call(gallery, gallery.currentCityIndex_));

  var pointsThumbs = thumbs.selectAll('image.thumb_fg').data(thumbIndices);
  // Enter
  pointsThumbs
    .enter()
      .append('image')
      .classed('thumb_fg', true)
      .attr('width', gallery.THUMB_W_H)
      .attr('height', gallery.THUMB_W_H)
      .attr('x', function(itemIndex, i) {
        return gallery.THUMB_LIST_PADDING_LEFT + i * (gallery.THUMB_W_H + gallery.THUMB_PADDING_X);
      })
      .attr('y', 0);
  pointsThumbs
      .attr('xlink:href', function(itemIndex, i) {
        var parentData = d3.select(this.parentNode).datum();
        var date = parentData.date;
        var time = d3.time.format("%Y-%m-%d").parse(date).getTime() / 1000;
        var elapsedDays = (time - ANIM_TS_INITIAL) / 86400;
        var imageIndex = itemIndex + elapsedDays * gallery.NUMBER_OF_THUMBS_;
        var pathToThumbs =
          gallery.getPathToThumbs.call(gallery, gallery.currentCityIndex_);
        return pathToThumbs + imageIndex + '.jpg';
      });

  // Map text legend.
  var thumbsLegend = [
    '0:00-2:59 am',
    '3:00-5:59 am',
    '6:00-8:59 am',
    '9:00-11:59 am',
    '0:00-2:59 pm',
    '3:00-5:59 pm',
    '6:00-8:59 pm',
    '9:00-11:59 pm'
  ];
  thumbs.selectAll('text').data(thumbsLegend)
    .enter()
      .append('text')
      .attr('x', function(legend, i) {
        return gallery.THUMB_LIST_PADDING_LEFT + i * (gallery.THUMB_W_H + gallery.THUMB_PADDING_X);
      })
      .attr('y', gallery.THUMB_W_H - gallery.PADDING_TOP_)
      .text(function(legend, i) {
        return legend;
      });
};


/**
 * Builds html content with info about an item in the gallery,
 * such as date/time and number of samples.
 */
Gallery.prototype.getItemInfo = function(item, i) {
  // Add text with details (date/time, number of samples).
  return '<p>' +
    item.dateTime + '<br>' +
    '<b>' + item.numberOfPoints + '</b> samples' +
    '</p>';
};
