// builtin
var fs = require('fs');
var path = require('path');

// vendor
var express = require('express');
var npmcss = require('npm-css');
var script = require('script');

// create a router for project files
module.exports = function(wwwroot) {
    var router = new express.Router();

    // main tryme app bundle
    var bundle = new script.file(__dirname + '/main.js', {
        main: true,
        debug: true
    });

    var app_src;

    router.get('/tryme-main.js', function(req, res, next) {
        if (app_src) {
            return next();
        }

        // generate main tryme app bundle
        bundle.generate(function(err, src) {
            if (err) {
                return next(err);
            }

            app_src = script.client.toString() + '\n' + src;
            next();
        });
    });

    router.get('/tryme-main.js', function(req, res, next) {

        // the module bundle will contain the code for our example
        // this bundle has no main and is just for including the example code
        var module_bundle = script.file(path.join(wwwroot + '/index.js'), {
            debug: true
        });

        // add client require
        var src = app_src;

        module_bundle.generate(function(err, module_src) {
            if (err) {
                return next(err);
            }

            src += module_src;

            // here be dragons
            // this is how we make require think that we are actually in /
            // so that when we require from within our editor code it will work
            src += '\nvar orig = require;\n\
            require = function(name) {\
                return orig.call({ _parent: {path: \'/\'}}, name);\
            };';

            res.contentType('application/javascript');
            res.send(src);
        });
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
