// builtin
var path = require('path');
var fs = require('fs');

// vendor
var express = require('express');
var makeup = require('makeup');
var enchilada = require('enchilada');
var LiveReloadServer = require('live-reload');

// local
var router = require('./router');

module.exports = function(opts) {
    opts = opts || {};

    var base = __dirname;
    var wwwroot = opts.root || process.cwd();

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

    app.use(router(wwwroot, opts));
    app.use(app.router);

    app.use(function(err, req, res, next) {
        // Sometimes err is a String
        // Someone, somewhere emits strings **cough** browserify **cough**
        if (typeof err === "string") {
            err = new Error(err)
        }

        res.json({
            message: err.message,
            stack: err.stack
        });
    });

    var server = app.listen(8080, function() {
        console.log('listening on port', server.address().port);
    });

    if (opts.live) {
        var live_port = opts.live = opts.live === true ? 9968 : opts.live

        LiveReloadServer({
            port: live_port
        })
    }
};

