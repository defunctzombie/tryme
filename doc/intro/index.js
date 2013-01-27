
/**
# tryme

A simple and powerful way to demo your code and documentation without getting caught up writing static html pages or boring static code.

Just write your example using the some javascript and make it interactive! Try it by editing the code below.
*/

// change foo to whatever you want!
var button = document.createElement('button');
button.innerHTML = 'foo';

button // =>

/**
## demos

Play around with some of these cool demos.

* [typeahead](/shtylman/typeahead/example)
* [spin.js](/shtylman/spin.js/example)
* [ios-overlay](/shtylman/iOS-Overlay/example)

## add your own!

Examples are nothing more than basic javascript files in github repos! You can actually load any github repo into tryme by vising the proper url.

See the tryme guide for creating working examples.

## markdown parsing

Although you are free to just have comments in your javascript code, you can also spice up your tryme document with markdown. Just start create a comment block with `/** *\/` and anything in between will be rendered as markdown.
*/

/**
The source for this document can be found [here](). Check out the [tryme]() repo for the source to this whole project.
*/

'that\'s all folks!' // =>

