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
