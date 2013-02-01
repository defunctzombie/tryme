// builtin
var fs = require('fs');
var path = require('path');

// vendor
var express = require('express');
var npmcss = require('npm-css');
var script = require('script');
var mime = require('mime');
var marked = require('marked');

var main_md = script.file(__dirname + '/main_markdown.js', {
    debug: true,
    main: true
});

var main_js = script.file(__dirname + '/main_js.js', {
    debug: true,
    main: true
});

var client = script.client.toString();
var js_main;
var md_main;

main_js.generate(function(err, src) {
    if (err) {
        throw err;
    }

    js_main = src;
});

main_md.generate(function(err, src) {
    if (err) {
        throw err;
    }

    md_main = src;
});

// create a router for project files
module.exports = function(wwwroot) {

    var static_serve = express.static(wwwroot);

    return function(req, res, next) {
        var req_path = req.path;

        var basename = path.basename(req_path);

        // if path is a directory
        // then decide base
        var full_path = path.join(wwwroot, req_path);

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
            return serve_javascript(full_path, res);
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

        return res.send(404);
    };

    function serve_css(full_path, res) {
        res.contentType('text/css');
        res.send(npmcss(full_path));
    }

    function serve_javascript(full_path, res) {
        // load up the template for markdown
        var html = fs.readFileSync(__dirname + '/views/javascript.html', 'utf8');

        var src = fs.readFileSync(full_path, 'utf8');

        var bundle = script.file(full_path, {
            debug: true
        });

        bundle.generate(function(err, module_src) {
            if (err) {
                return next(err);
            }

            var out = client + module_src + js_main;

            // here be dragons
            // this is how we make require think that we are actually in /
            // so that when we require from within our editor code it will work
            out += '\nvar orig = require;\n' +
            'require = function(name) {\n' +
                'return orig.call({ _parent: {path: \'/\'}}, name);' +
            '\n};';

            html = html.replace('{{body}}', src).replace('{{script}}', out);
            return res.send(html);
        });
    }

    function serve_markdown(full_path, res) {

        // load up the template for markdown
        var html = fs.readFileSync(__dirname + '/views/readme.html', 'utf8');

        var src = fs.readFileSync(full_path, 'utf8');

        var count = 0;
        var blocks = [];
        var markdown = marked(src, {
            gfm: true,
            highlight: function(code, lang) {
                if (lang !== 'javascript' && lang !== 'js') {
                    return code;
                }

                if (code.indexOf('// =>') < 0) {
                    return code;
                }

                count++;
                blocks.push(code);

                return '</code></pre>' +
                    '<div><textarea style="display: none" class="code-block" id="code-block-' + count + '">' + code + '</textarea></div><div class="tryme-output" id="output-' + count + '"></div>' +
                    '<pre><code>';
            }
        });

        var src = blocks.join(';');
        fs.writeFileSync(wwwroot + '/_README.md.js', src);

        var bundle = script.file(wwwroot + '/_README.md.js', {
            debug: true
        });

        bundle.generate(function(err, module_src) {
            fs.unlinkSync(wwwroot + '/_README.md.js');
            if (err) {
                return next(err);
            }

            var out = client + module_src + md_main;

            // here be dragons
            // this is how we make require think that we are actually in /
            // so that when we require from within our editor code it will work
            out += '\nvar orig = require;\n' +
            'require = function(name) {\n' +
                'return orig.call({ _parent: {path: \'/\'}}, name);' +
            '\n};';

            html = html.replace('{{body}}', markdown).replace('{{script}}', out);
            return res.send(html);
        });
    };
};

