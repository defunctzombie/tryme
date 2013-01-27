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

    // remove the current dir path
    // the base is used to synthesize a path for client side require
    var base = wwwroot.replace(__dirname, '');

    router.get('/tryme-main.js', function(req, res, next) {
        var out = '';

        var bundle = new script.file(__dirname + '/main.js', {
            main: true,
            debug: true
        });

        // add our example to the bundle so requires can be located
        bundle.require(path.join(wwwroot + '/index.js'));

        bundle.generate(function(err, src) {
            if (err) {
                return next(err);
            }

            // add client require
            src = script.client.toString() + '\n' + src;

            // here be dragons
            // this is how we make require think that we are actually in
            // our base path. Otherwise require looks up using the wrong path
            src += '\nvar orig = require;\n\
                require = function(name) {\n\
                    return orig.call({ _parent: {\n\
                        path: \'' + base + '/\'\n\
                    }}, name);\n\
                };\
            ';

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
