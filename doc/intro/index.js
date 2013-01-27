
/**
You are viewing an interactive page! Edit the javascript snippet below and see.
*/

// change foo to whatever you want!
var button = document.createElement('button');
button.innerHTML = 'foo';

button // =>

/**
# tryme

tryme is a simple way to share interactive demos and examples for javascript widgets. Just point the url to any valid github project folder with some javascript and enjoy!

## demos

Play around with some of these cool demos.

* [typeahead](/shtylman/typeahead/example/)
* [spin.js](/shtylman/spin.js/example/)
* [ios-overlay](/shtylman/iOS-Overlay/example/)

## add your own!

Examples are nothing more than basic javascript files in github repos! You can actually load any github repo into tryme by vising the proper url.

See the tryme guide for creating working examples.

## markdown parsing

Although you are free to just have comments in your javascript code, you can also spice up your tryme document with markdown. Just start create a comment block with `/** *\/` and anything in between will be rendered as markdown.
*/

/**
This document is an interactive example found [here](https://github.com/shtylman/tryme/blob/master/doc/intro/index.js). Check out the [tryme](https://github.com/shtylman/tryme) repo for the source and more!
*/

'that\'s all folks!' // =>

