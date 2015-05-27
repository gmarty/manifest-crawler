'use strict';

var config = require('../config/db.json');
var nano = require('nano')(config.host);

var path = require('path');
var Promise = require('promise/lib/es6-extensions');
var request = require('request');
var cheerio = require('cheerio');

var colors = require('colors');

var db = nano.use(config.name);

// For each URL stored in the DB, look for a manifest meta tag.
db.view('urls', 'urls', {include_docs: true}, function(err, body) {
  if (err) {
    console.error(err.reason);
    return;
  }

  // Let's get an array of promises.
  var promises = body.rows.map(function(doc) {
    return getUrlContent(doc);
  });

  // Execute the promises sequentially.
  var i = 0;
  next();

  function next() {
    if (typeof promises[i] !== 'function') {
      return;
    }

    promises[i]()
      .then(function(urls) {
        var url = urls[0], manifestUrl = urls[1];
        console.error('Successfully processed: '.green + url);

        if (manifestUrl) {
          console.error('Found: '.green + manifestUrl);
        }
        i++;
        return next();
      })
      .catch(function(err) {
        console.error(String(err).red);
        i++;
        return next();
      });
  }
});

/**
 * Get a document and return a promise that load the web page, look for a
 * manifest and store it if found.
 *
 * @param {Object} doc An object retrieved from CouchDB.
 * @returns {Function} A function that resolves a promise.
 */
function getUrlContent(doc) {
  return function() {
    return new Promise(function(resolve, reject) {
      console.log('Start processing ' + doc.value);
      request({url: doc.value, timeout: 1500}, function(err, response, body) {
        if (err || response.statusCode !== 200) {
          return reject(err);
        }

        var $ = cheerio.load(body);

        // Look for a manifest meta tag:
        // <link href="/manifest.json" rel="manifest">
        var hrefAttr = $('link[rel="manifest"]').attr('href');
        var manifestUrl = null;

        if (hrefAttr) {
          manifestUrl = path.join(doc.value, hrefAttr)
            .split('http://')
            .join('http:/')
            .split('http:/')
            .join('http://');

          // Store an entry for the manifest URL.
          db.insert({
            type: 'manifestUrl',
            url: manifestUrl,
            processed: false,
            insertedAt: Date.now()
          }, manifestUrl, function(err) {
            if (err) {
              return reject(err.reason);
            }
          });
        }

        var updatedDoc = doc.doc;
        updatedDoc.manifestUrl = manifestUrl;
        updatedDoc.processed = true;
        updatedDoc.processedAt = Date.now();

        db.insert(updatedDoc, doc.id, function(err) {
          if (err) {
            return reject(err.reason);
          }

          return resolve([doc.value, manifestUrl]);
        });
      });
    });
  }
}
