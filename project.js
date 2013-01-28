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

    self._clone();
};

Project.prototype.__proto__ = EventEmitter.prototype;

Project.prototype.refresh = function() {
    var self = this;

    log.trace('refresh %s/%s', self.user, self.project);

    // if we are not ready, user will attach to the current status
    if (self.status !== 'ready') {
        return;
    }

    self._clone();
};

// clone project
Project.prototype._clone = function() {
    var self = this;
    log.trace('cloning: %s/%s', self.user, self.project);

    self.status = 'cloning';
    self.emit('status', self.status);

    var tmp_path = path.join(self.tmpbase, self.user, self.project);
    self.path = tmp_path;

    // already cloned
    if (fs.existsSync(tmp_path)) {
        return self._pull();
    }

    log.trace('dest path: ' + tmp_path);
    mkdirp.sync(tmp_path);

    // get project from github
    var repo_url = 'git://github.com/' + path.join(self.user, self.project) + '.git';
    var args = ['clone', repo_url, tmp_path];

    var child = spawn('git', args);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(chunk) {
        log.trace('git %s', chunk);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(chunk) {
        log.trace('git %s', chunk);
    });

    child.on('exit', function(code) {
        // if code is not good, fail?
        self._pull();
    });
};

Project.prototype._pull = function() {
    var self = this;
    self.status = 'updating';
    self.emit('status', self.status);

    log.trace('updating %s/%s', self.user, self.project);

    var opt = {
        cwd: self.path
    };

    var args = ['pull'];
    var git = spawn('git', ['pull'], opt);

    git.stdout.setEncoding('utf8');
    git.stdout.on('data', function(chunk) {
        log.trace('git %s', chunk);
    });

    git.stderr.setEncoding('utf8');
    git.stderr.on('data', function(chunk) {
        log.trace('git %s', chunk);
    });

    git.on('exit', function(code) {
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

// symlinking to self so examples can lookup properly
Project.prototype._setup = function() {
    var self = this;
    log.trace('setup');
    self.status = 'setup';
    self.emit('status', self.status);

    var name = JSON.parse(fs.readFileSync(path.join(self.path, 'package.json'), 'utf8')).name;
    var dest = path.join(self.path, 'node_modules', name);

    if (!fs.existsSync(dest)) {
        fs.symlinkSync(self.path, dest);
    };

    return self._ready();
};

Project.prototype._ready = function() {
    var self = this;

    log.trace('ready');
    self.status = 'ready';
    self.emit('status', self.status);
};

Project.prototype.route = function(req, res, next) {
    var self = this;

    // if not ready, then we only serve up the html page
    if (self.status !== 'ready') {
        // non dir paths are ignored in the early phase
        if (path.extname(req.path)) {
            // TODO(shtylman) or just wait until project is loaded?
            return next();
        }

        return res.sendfile(__dirname + '/views/index.html');
    }

    var full = path.join(self.path, req.path);

    // if user request a directory, serve up the entry html page
    if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
        if (req.prj) {
            req.prj.refresh();
        }

        return res.sendfile(__dirname + '/views/index.html');
    }

    var dir = path.join(self.path, path.dirname(req.path));

    // TODO(shtylman) should not need to make router every time
    // can be smarter about this
    req.url = req.url.replace(path.dirname(req.path), '');
    router(dir)(req, res, next);
};

module.exports = Project;
