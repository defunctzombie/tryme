// builtin
var fs = require('fs');
var path = require('path');

// vendor
var express = require('express');
var browserify = require('browserify');
var npmcss = require('npm-css');

// create a router for project files
module.exports = function(wwwroot) {
    var router = new express.Router();

    router.get('/tryme-main.js', function(req, res) {
        var out = '';
        var bundle = browserify({ debug: true });

        bundle.addEntry(__dirname + '/main.js');

        // need to bundle up main js and launch that
        // but also need to include index.js stuff so we get those requires

        out += bundle.bundle();

        var app = browserify({ debug: true });

        // add the js file from the example so we can use requires
        // within the example
        app.require(path.join(wwwroot, '/index.js'));

        out += app.bundle();

        res.contentType('application/javascript');
        res.send(out);
    });

    // expose style.css as app.css
    router.get('/style.css', function(req, res, next) {
        var css_entry = wwwroot + '/style.css';
        res.contentType('text/css');

        // if no css file, send empty css
        if (!fs.existsSync(css_entry)) {
            return res.send('');
        }

        res.send(npmcss(wwwroot + '/style.css'));
    });

    // all other files will be served from examples folder
    router.get('*', express.static(wwwroot));

    return router.middleware;
};
