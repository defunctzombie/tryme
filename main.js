var Editor = require("./core")

var persist = require("./code-mirror/persist")
var share = require("./code-mirror/share")
var server = require("./server")

// Start an evaluation server
server()

// wait for server to tell us that stuff is ready to be loaded
// open a connection stream
// get a stream for our page?
// the stream would be for the project we are interested in?
//

// load the js we want to execute
// that becomes the editor value

function getXMLHttpRequestObject() {
  var ref = null;
  if (window.XMLHttpRequest) {
    ref = new XMLHttpRequest();
  } else if (window.ActiveXObject) { // Older IE.
    ref = new ActiveXObject("MSXML2.XMLHTTP.3.0");
  }
  return ref;
}

var xmlhttp = getXMLHttpRequestObject();

xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4){
      init_editor(xmlhttp.responseText);
    }
};
xmlhttp.open('GET', 'index.js', true);
xmlhttp.send(null);

function init_editor(src) {
  var editor = Editor(document.body, {
    value: src,
    electricChars: true,
    autofocus: true,
    theme: "solarized dark",
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

