'use strict';

var config = require('../config/db.json');
var nano = require('nano')(config.host);

var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

var db = nano.use(config.name);

// For each URL stored in the DB, look for a manifest meta tag.
db.view('urls', 'urls', {limit: 100, include_docs: true}, function(err, body) {
  if (err) {
    console.error(err.reason);
    return;
  }

  body.rows.forEach(function(doc) {
    console.log(doc.value);
    request(doc.value, function(err, response, body) {
      if (err || response.statusCode !== 200) {
        console.error(err);
        return;
      }

      var $ = cheerio.load(body);

      // Look for a manifest meta tag:
      // <link href="/manifest.json" rel="manifest">
      var hrefAttr = $('link[rel="manifest"]').attr('href');
      var manifestUrl = null;

      if (hrefAttr) {
        manifestUrl = path.join(doc.value, hrefAttr);
        console.log(manifestUrl);

        // Store an entry for the manifest URL.
        db.insert({
          type: 'manifestUrl',
          url: manifestUrl,
          processed: false,
          insertedAt: Date.now()
        }, manifestUrl, function(err) {
          if (err) {
            console.error(err.reason);
          }
        });
      }

      var updatedDoc = doc.doc;
      updatedDoc.manifestUrl = manifestUrl;
      updatedDoc.processed = true;
      updatedDoc.processedAt = Date.now();

      db.insert(updatedDoc, doc.id, function(err) {
        if (err) {
          console.error(err.reason);
        }
      });
    })
  });
});
