'use strict';

var fs = require('fs');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var svn = require('gulp-svn');

var config = require('./config/db.json');
var nano = require('nano')(config.host);

/**
 * Drop the database.
 */
gulp.task('drop-db', function(cb) {
  nano.db.destroy(config.name, function(err) {
    if (err) {
      console.error(err.reason);
    }
    cb();
  });
});

/**
 * Create an empty database.
 */
gulp.task('create-db', function(cb) {
  nano.db.create(config.name, function(err) {
    if (err) {
      console.error(err.reason);
    }
    cb();
  });
});

/**
 * Check in websites list.
 * Note: SVN is used here for its ability to checkin subfolders, so make sure
 * it is installed before you call this task.
 */
gulp.task('checkin-urls', function(cb) {
  svn.checkout('https://github.com/HTTPArchive/httparchive/trunk/lists', 'lists', function(err) {
    if (err) {
      console.error(err);
    }
    cb();
  });
});

/**
 * Populate the database with a static list of URLs.
 */
function populateDB(fileName) {
  return function() {
    var list = fs.readFileSync('lists/' + fileName, {encoding: 'utf-8'})
      .trim()
      .split('\n')
      .map(String);
    var db = nano.use(config.name);

    list.forEach(function(url) {
      db.insert({
        type: 'url',
        url: url,
        processed: false,
        insertedAt: Date.now()
      }, url, function(err) {
        if (err) {
          console.error(err.reason);
        }
      });
    });
  }
}
gulp.task('populate-db-100', populateDB('top100.txt'));
gulp.task('populate-db-1000', populateDB('top1000.txt'));

/**
 * Insert the views.
 */
gulp.task('create-url-views', function(cb) {
  var db = nano.use(config.name);

  db.insert({
    language: 'javascript',
    views: {
      urls: {
        map: 'function(doc) {\n' +
        '  if (doc.type === \'url\' && doc.processed === false) {\n' +
        '    emit(doc._id, doc.url);\n' +
        '  }\n' +
        '}'
      },
      manifestUrls: {
        map: 'function(doc) {\n' +
        '  if (doc.type === \'manifestUrl\' && doc.processed === false) {\n' +
        '    emit(doc._id, doc.url);\n' +
        '  }\n' +
        '}'
      }
    }
  }, '_design/urls', function(err) {
    if (err) {
      console.error(err.reason);
    }
    cb();
  });
});
gulp.task('create-views', function() {
  runSequence('create-url-views');
});

/**
 * Create a database prepopulated with popular website URLs.
 */
gulp.task('init', function() {
  runSequence('drop-db', 'create-db',
    'checkin-urls', 'create-views', 'populate-db-100');
});
