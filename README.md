# Web Manifest Crawler

> A simple crawler for web manifest.

## Install

1. Clone or fork this repo.
2. [Install CouchDB](http://wiki.apache.org/couchdb/Installation).

## Usage

### Initialise the database

```bash
$ gulp init
```

You can inspect the database at all times by pointing your browser to `http://localhost:5984/_utils/database.html?crawler/_design/urls/_view/urls`.

### Start crawling

```bash
$ node ./bin/crawl
```

## What's the point of this project?

A list of web manifest of major websites (if not all) can be used in a great
variety of ways. Here are some suggested applications:

* Create a browser add-on to show an install button in search engine's SERP.
* Research how developers use manifests (popular fields, trends, common
mistakes...)
* Simple search engine to query manifest files content (name, icons...)
* Integration in OS (e.g. display a pin option on long press on a link, without
visiting/loading the page...)

The main interests lay in saving bandwidth (ideal for mobile!) and research
purposes.

## Todo

* Extract links from web pages and process them recursively.
* For now, we can probably limit manifest extraction to top domain pages.
* Get and store manifest files content.
* Create a command to dump the manifest files stored in the database.
* Allow the possibility to crawl several web pages at the same time.
