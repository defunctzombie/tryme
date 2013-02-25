# tryme

tryme is an interactive readme and demo viewer for javascript

[live demo](http://tryme.jit.su) of tryme in action on itself!

```javascript
// change foo to whatever you want!
var button = document.createElement('button');
button.innerHTML = 'foo';

button // =>
```

## demos

Play around with some of these cool demos.

* [d3-examples](http://tryme.jit.su/shtylman/d3-examples)
* [piecon](http://tryme.jit.su/shtylman/piecon)
* [spin.js](http://tryme.jit.su/shtylman/spin.js)
* [typeahead](http://tryme.jit.su/shtylman/typeahead/example)
* [ios-overlay](http://tryme.jit.su/shtylman/iOS-Overlay/example)

## make your own

A tryme is simply a readme with the javascript code sections given special cow powers! If you want to make a javascript code block special, just add a `// =>` at the end.

The tryme.jit.su web service will load any github repo and let users play around with your README and code examples.

## cli

You can use tryme locally for testing, debug, and play before publishing your work.

```
npm install -g tryme
tryme /path/to/project
```

Tryme server is now running and you can open a browser to play around with your README or other example files.

## credits

This project is made possible by the many awesome ones that have come before it.

* [interactive](https://github.com/Gozala/interactivate)
* [codemirror](http://codemirror.net/)

See the dependencies for a full list; you might just learn something.
