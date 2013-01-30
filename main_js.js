var Editor = require("./core")

var persist = require("./code-mirror/persist")
var share = require("./code-mirror/share")
var server = require("./server")

// Start an evaluation server
server()

module.exports.init_editor = init_editor;

function init_editor(src) {
  var editor = Editor(document.body, {
    value: src,
    electricChars: true,
    autofocus: true,
    theme: "solarized light",
    mode: "javascript",
    extraKeys: {
      "Tab": function indent(editor) {
        if (!editor.getOption("indentWithTabs")) {
          var size = editor.getOption("indentUnit")
          var indentation = Array(size + 1).join(" ")
          editor.replaceSelection(indentation, "end")
        }
      }
    }
  })

  // Enable persistence of the editor buffer.
  // TODO(shtylman) need way to clear the buffer
  //persist(editor)

  // triggers editor to update and runs output stuff
  editor.setValue(editor.getValue());

  // Enable sharing
  //share(editor)
}

var src = document.querySelector('#src').textContent;
init_editor(src);

