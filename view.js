// builtin
var path = require('path');
var exec = require('child_process').exec;
var fs = require('fs');

// vendor
var express = require('express');
var log = require('bookrc');
var enchilada = require('enchilada');
var makeup = require('makeup');
var shoe = require('shoe');

// local
var Project = require('./project');

var tmpdir = __dirname + '/tmp';

// shoe streams of projects we support
// user/project -> project
var projects = {};

var app = express();

app.use(express.favicon());

// serve static resources
app.use(enchilada(__dirname + '/static'));
app.use('/css/style.css', makeup(__dirname + '/static/css/style.css'));
app.use(express.static(__dirname + '/static'));
app.use(app.router);

// handle per project requests
app.get('/:user/:project/*', function(req, res, next) {

    // TODO(shtylman) this is a hack, in the future if a dir page
    // has other dirs in it, show those in a list
    if (fs.existsSync(tmpdir + req.path) && fs.statSync(tmpdir + req.path).isDirectory()) {
        if (req.path[req.path.length - 1] !== '/') {

            return res.redirect(req.path + '/');
        }
    }

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

        // setup forward stream to notify client of progress
        var sock = shoe(function(stream) {
            stream.write(prj.status);
            prj.on('status', function(status) {
                stream.write(status);
            });
        });

        // clients get project status info from this stream
        sock.install(server, '/' + key + '/status');
    }

    // strip the project url part from the path
    req.url = req.url.replace('/' + user + '/' + project, '');

    // allow the project to try to handle the request
    prj.route(req, res, next);
});

// app init handler
// returns the main app landing page
// and triggers a project to start
app.use(function(req, res, next) {
    // if no extension, return the html file
    var ext = path.extname(req.path);
    if (ext) {
        return next();
    }
    res.sendfile(__dirname + '/static/index.html');
});

var server;

function start() {
    server = app.listen(8080);
}

// always start off with a clean tmp dir
var cmd = 'rm -rf ' + tmpdir + '/*';
log.trace('cleanup : %s', cmd);
exec(cmd, function(err, stdout, stderr) {
    if (err) {
        return log.panic(err);
    }

    start();
});

