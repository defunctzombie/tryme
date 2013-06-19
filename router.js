// builtin
var fs = require('fs');
var path = require('path');

// vendor
var express = require('express');
var npmcss = require('npm-css');
var browserify = require('browserify');
var mime = require('mime');
var marked = require('marked');
var hljs = require('highlight.js');
var lsr = require('ls-r');

var main_js = browserify([__dirname + '/main_js.js']);

// create a router for project files
module.exports = function(wwwroot, argv) {
    argv = argv || {}

    var static_serve = express.static(wwwroot);

    var pkginfo = JSON.parse(fs.readFileSync(wwwroot + '/package.json'));

    return function(req, res, next) {
        var req_path = req.path;

        var basename = path.basename(req_path);

        // if path is a directory
        // then decide base
        var full_path = path.join(wwwroot, req_path);

        if (req.path === '/module-style.css') {
            if (!pkginfo || !pkginfo.style) {
                res.contentType('text/css');
                res.send('');
                return;
            }

            var csspath = path.join(wwwroot, pkginfo.style);
            return serve_css(csspath, res);
        }

        if (!fs.existsSync(full_path)) {
            return res.send(404);
        }

        if (fs.statSync(full_path).isDirectory()) {
            return decide_base(req, res, next);
        }

        // we don't know what type of file to serve
        if (!basename) {
            return decide_base(req, res, next);
        }

        var type = mime.lookup(basename);

        switch (type) {
        case 'text/x-markdown':
            return serve_markdown(full_path, res);
        case 'application/javascript':
            return serve_javascript(full_path, res, next);
        case 'text/css':
            return serve_css(full_path, res);
        }

        return static_serve(req, res, next);
    };

    function decide_base(req, res, next) {
        var base_path = path.join(wwwroot, req.path);

        if (!fs.existsSync(base_path)) {
            return res.send(404);
        }

        var files = fs.readdirSync(base_path);

        for (var i=0 ; i<files.length; ++i) {
            var file = files[i];
            var full_path = path.join(base_path, file);

            if (/^readme.md/i.test(file) || /^readme.markdown/i.test(file)) {
                return serve_markdown(full_path, res);
            }
        }
        for (var i=0 ; i<files.length; ++i) {
            var file = files[i];
            var full_path = path.join(base_path, file);

            if (/^index.js/i.test(file)) {
                return serve_javascript(full_path, res);
            }
        }

        return render_index(base_path, res);
    }

    function render_index(base_path, res) {
        lsr(base_path, function (err, _, stats) {
            var files = stats.filter(function (s) {
                return s.isFile()
            })
            var paths = files.map(function (s) {
                return s.path
            })
            var rels = paths.map(function (uri) {
                return path.relative(wwwroot, uri)
            })
            var links = rels.map(function (uri) {
                return "<div><a href='/" + uri + "'>" + uri + "</a></div>"
            })
            var html = links.join("")
            res.send(html)
        })
    }

    function serve_css(full_path, res) {
        res.contentType('text/css');
        res.send(npmcss(full_path));
    }

    function serve_javascript(full_path, res, next) {
        // load up the template for markdown
        var html = fs.readFileSync(__dirname + '/views/javascript.html', 'utf8');

        var src = fs.readFileSync(full_path, 'utf8');

        function server() {
            window.require = require;
            // emit a `client` event on the window with the given packet object
            function send(packet) {
                var event = document.createEvent("CustomEvent")
                event.initCustomEvent("client", false, true, packet)
                window.dispatchEvent(event)
            }
            window.addEventListener("server", function(event) {
                var packet = event.detail
                var result
                try {
                    result = window.eval(packet.source)
                }
                catch (error) {
                    result = error
                }
                send({ from: packet.to, message: result })
            }, false);
        };

        // insert code to evaluate source files and send back message
        // the evaluation needs to happen inside of our require container
        var full_src = src + ';\n(' + server.toString() + ')();';

        // temp file must be in same folder for relative requires
        var tempjs = path.dirname(full_path) + '/__tryme.temp.js';
        fs.writeFileSync(tempjs, full_src);

        var bundle = browserify(tempjs);
        bundle.bundle(function(err, module_src) {
            if (fs.existsSync(tempjs)) {
                fs.unlinkSync(tempjs);
            }

            if (err) {
                return next(err);
            }

            var out = module_src;
            var live_text = '<script src="//localhost:' + argv.live +
                '"></script>'
            html = html
            .replace('{{body}}', src)
            .replace('{{script}}', out)
            .replace('{{extra}}', argv.live ? live_text : '')

            return res.send(html);
        });
    }

    function serve_markdown(full_path, res) {

        // load up the template for markdown
        var html = fs.readFileSync(__dirname + '/views/readme.html', 'utf8');

        var src = fs.readFileSync(full_path, 'utf8');

        var count = 0;
        var blocks = [];
        var evals = [];
        var markdown = marked(src, {
            gfm: true,
            highlight: function(code, lang) {

                function reg_highlight() {
                    if (lang && hljs.LANGUAGES[lang]) {
                        return hljs.highlight(lang, code).value;
                    }
                    else {
                        return hljs.highlightAuto(code).value;
                    }
                }

                if (lang !== 'javascript' && lang !== 'js') {
                    return reg_highlight();
                }

                if (code.indexOf('// =>') < 0) {
                    return reg_highlight();
                }

                count++;
                blocks.push(code + '\n');

                // evaluators so code is run inside of the bundle
                evals.push('make_block(' + count + ', function(src) { return eval(src); })');

                return '</code></pre>' +
                    '<div><textarea style="display: none" class="code-block" id="code-block-' + count + '">' + code + '</textarea></div><div class="tryme-output" id="output-' + count + '"></div>' +
                    '<pre><code>';
            }
        });

        var src = blocks.join(';\n') + evals.join(';\n');
        var tempjs = wwwroot + '/__tryme.temp.js';
        fs.writeFileSync(tempjs, src);

        var bundle = browserify(tempjs);
        bundle.bundle(function(err, module_src) {
            if (fs.existsSync(tempjs)) {
                fs.unlinkSync(tempjs);
            }

            if (err) {
                return res.send(err.message);
            }

            var out = module_src;
            html = html.replace('{{body}}', markdown).replace('{{script}}', out);
            return res.send(html);
        });
    };
};

