// builtin
var fs = require('fs');

// vendor
var log = require('bookrc');
var npm = require('npm');

// run npm install at location
var install = function(path, cb) {

    var modules_path = path + '/node_modules';

    // npm is too globaly leaky and doesn't behave if this doesn't exit
    if (!fs.existsSync(modules_path)) {
        fs.mkdirSync(path + '/node_modules');
    }

    // npm.load doesn't actually do anything after the first load
    // we have it here just to avoid other state management elsewhere
    npm.load({}, function (err, npm) {
        if (err) {
            return log.error(err);
        }

        // use the npm object, now that it's loaded.
        log.trace('setting config %s', path);

        // override prefix so npm knows where we actually are
        npm.prefix = path;

        /*
        npm.registry.log.http = function(a) {
            //console.log(a);
        };
        npm.registry.log.warn = function(a) {
            //console.log(a);
        };
        */

        log.trace('npm cache %s', npm.cache);
        log.trace('npm prefix %s', npm.prefix);
        log.trace('npm root %s', npm.root);

        npm.install(cb);
    });
}

// because npm api is a global leaky mess, so we have to maintain an install queue
var install_queue = [];
var npm_install = function(path, cb) {
    var item = {
        path: path,
        cb: cb
    };

    if (install_queue.length) {
        return install_queue.push(item);
    }

    (function next(item) {
        var item = item || install_queue.shift();

        // no more items in the queue
        if (!item) {
            return;
        }

        install(item.path, function(err) {
            item.cb(err);
            next();
        });
    })(item);
};

// queue an item for installation
module.exports = npm_install;
