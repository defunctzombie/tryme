#!/usr/bin/env node
// simple server for previewing a single project
// usage: tryme [options] /path/to/tryme/folder

// builtin
var path = require('path');
var fs = require('fs');

// vendor
var express = require('express');
var makeup = require('makeup');
var enchilada = require('enchilada');
var argv = require('optimist').argv;
var LiveReloadServer = require('live-reload');

// local
var router = require('../router');

var base = path.resolve(__dirname + '/../');
var wwwroot = path.resolve(process.cwd(), argv[2]);

// get project path
// get package.json path
var pkg_path = wwwroot;

if (!fs.existsSync(path.join(wwwroot, 'package.json'))) {
    pkg_path = path.resolve(pkg_path, '..');
}

// TODO(shtylman) setup symlink to self

var app = express();

// TODO(shtylman) make a nice logo
app.use(express.favicon());
app.use(enchilada(base + '/static'));
app.use('/css/style.css', makeup(base + '/static/css/style.css'));
app.use(express.static(base + '/static'));
app.use(function(req, res, next) {
    var ext = path.extname(req.path);

    // if a path doesn't terminate in a /, make it so!
    if (!ext && req.path[req.path.length - 1] !== '/') {
        return res.redirect(req.path + '/');
    }

    next();
});

app.use(router(wwwroot, argv));
app.use(app.router);

app.use(function(err, req, res, next) {
    res.send(err.stack);
});

var server = app.listen(8080, function() {
    console.log('listening on port', server.address().port);
});

if(argv.live) {
    var LIVE_PORT = argv.live = argv.live === true ? 9968 : argv.live

    LiveReloadServer({
        port: LIVE_PORT
    })
}

// vim: ft=javascript
