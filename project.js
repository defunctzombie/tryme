// builtin
var spawn = require('child_process').spawn;
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');

// vendor
var log = require('bookrc');
var mkdirp = require('mkdirp');

// local
var npm_install = require('./npm');
var router = require('./router');

var Project = function(info) {
    var self = this;

    self.user = info.user;
    self.project = info.project;
    self.tmpbase = info.tmpbase;

    log.trace('new project: %s/%s', self.user, self.project);

    self.status = 'init';

    // default status is init
    self.emit('status', 'init');

    // start the cloning phase
    // cloning also verifies up to date project
    self._clone();
};

Project.prototype.__proto__ = EventEmitter.prototype;

// clone project
Project.prototype._clone = function() {
    var self = this;
    log.trace('cloning: %s/%s', self.user, self.project);

    self.status = 'cloning';
    self.emit('status', self.status);

    var tmp_path = path.join(self.tmpbase, self.user, self.project);
    self.path = tmp_path;

    log.trace('dest path: ' + tmp_path);
    mkdirp.sync(tmp_path);

    // TODO(shtylman) if exists, whipe and update
    // git clean -xdf && git reset --hard HEAD && git pull

    // get project from github
    var repo_url = 'git://github.com/' + path.join(self.user, self.project) + '.git';
    var args = ['clone', repo_url, tmp_path];

    var child = spawn('git', args);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(chunk) {
        // emit events to client?
        console.log(chunk);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(chunk) {
        console.log(chunk);
    });

    child.on('exit', function(code) {
        // if code is not good, fail?
        self._install();
    });
};

// npm install for project
Project.prototype._install = function() {
    var self = this;
    self.status = 'installing';
    self.emit('status', self.status);

    log.trace('installing %s/%s', self.user, self.project);

    npm_install(self.path, function(err) {
        self._setup();
    });
};

// symlinking for examples
Project.prototype._setup = function() {
    var self = this;
    log.trace('setup');
    self.status = 'setup';
    self.emit('status', self.status);

    // setup the project router
    // the router will handle the url requests for the project

    self._ready();
    return;

    var name = JSON.parse(fs.readFileSync(self.path + '/package.json', 'utf8')).name;

    mkdirp.sync(self.path + '/example/node_modules');
    var dest = self.path + '/example/node_modules/' + name;

    try {
        fs.symlinkSync(self.path, dest);
    } catch (e) {};

    self.router = router(self.path + '/example');

};

Project.prototype._ready = function() {
    var self = this;

    log.trace('ready');
    self.status = 'ready';
    self.emit('status', self.status);
};

Project.prototype.route = function(req, res, next) {
    var self = this;

    // if not ready, then we certainly can't handle the request
    if (self.status !== 'ready') {
        return next();
    }

    var full = path.join(self.path, req.path);

    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        return next();
    }

    var name = JSON.parse(fs.readFileSync(path.join(self.path, 'package.json'), 'utf8')).name;

    var first = req.path.split('/')[1];
    var subdir = path.join(self.path, first, 'node_modules');

    if (!fs.existsSync(subdir)) {
        fs.mkdirSync(subdir);
    }

    var dest = path.join(subdir, name);
    try {
        fs.symlinkSync(self.path, dest);
    } catch (err) {};

    var dir = path.join(self.path, path.dirname(req.path));

    // TODO(shtylman) should not need to make router every time
    // can be smarter about this
    req.url = req.url.replace(path.dirname(req.path), '');
    router(dir)(req, res, next);
};

module.exports = Project;
