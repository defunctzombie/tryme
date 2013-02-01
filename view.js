// builtin
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');
var https = require('https');

// vendor
var express = require('express');
var log = require('bookrc');
var enchilada = require('enchilada');
var makeup = require('makeup');
var eio = require('engine.io-stream');

// local
var Project = require('./project');

var kProduction = process.env.NODE_ENV === 'production';
var tmpdir = __dirname + '/tmp';

// shoe streams of projects we support
// user/project -> project
var projects = {};

var app = express();

app.use(express.favicon());

// serve static resources
app.use(enchilada({
    src: __dirname + '/static',
    cache: kProduction,
    compress: kProduction
}));
app.use('/css/style.css', makeup(__dirname + '/static/css/style.css'));
app.use(express.static(__dirname + '/static'));

app.use(function(req, res, next) {
    var ext = path.extname(req.path);

    // if a path doesn't terminate in a /, make it so!
    if (!ext && req.path[req.path.length - 1] !== '/') {
        return res.redirect(req.path + '/');
    }

    next();
});

app.use(app.router);

app.use(function(err, req, res, next) {
    log.error(err);
    next(err);
});

app.get('/', function(req, res) {
    res.redirect('/shtylman/tryme/');
});

app.get('/:user/:project', function(req, res, next) {
    req.url = req.url + '/';
    next();
});

app.get('/:user/:project/*', function(req, res, next) {
    var user = req.param('user');
    var project = req.param('project');
    var key = user + '/' + project;
    var prj = projects[key]
    if (prj) {
        return next();
    }

    var opt = {
        host: 'github.com',
        path: '/' + user + '/' + project
    };

    var hreq = https.get(opt, function(hres) {
        log.trace('http response for %s/%s -> %d', user, project,
                  hres.statusCode);

        hres.on('end', function() {
            if (hres.statusCode !== 200) {
                return res.send(404);
            }
            next();
        });
        hres.on('error', next);
    });

    hreq.on('error', next);
});

// handle per project requests
app.get('/:user/:project/*', function(req, res, next) {
    var user = req.param('user');
    var project = req.param('project');

    var key = user + '/' + project;
    var prj = projects[key]
    if (!prj) {
        // setup a new project
        prj = projects[key] = new Project({
            user: user,
            project: project,
            tmpbase: tmpdir
        });

        var io = eio(function(stream) {
            stream.write(prj.status);
            prj.on('status', function(status) {
                stream.write(status);
            });
        });

        // clients get project status info from this stream
        io.attach(server, '/' + key + '/status');
    }

    req.prj = prj;

    // strip the project url part from the path
    req.url = req.url.replace('/' + user + '/' + project, '');

    // allow the project to try to handle the request
    prj.route(req, res, next);
});

var server;

function start() {
    server = app.listen(8080, function() {
        // nodejitsu app server seems to break server.address()
        // so we need to check that we got something we can use
        var addr = server.address();
        if (addr) {
            log.trace('server listening on %d', addr.port);
        }
    });
}

return start();

// cleanup all project dirs
function clean(cb) {
    // always start off with a clean tmp dir
    var cmd = 'rm -rf ' + tmpdir + '/*';
    log.trace('cleanup : %s', cmd);
    exec(cmd, function(err, stdout, stderr) {
        cb(err);
    });
}

process.once('uncaughtException', function(err) {
    log.panic(err);
    setTimeout(process.exit.bind(process, -1), 500);
});
