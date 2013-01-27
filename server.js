"use strict";

// emit a `client` event on the window with the given packet object
function send(packet) {
  var event = document.createEvent("CustomEvent")
  event.initCustomEvent("client", false, true, packet)
  window.dispatchEvent(event)
}

// listen for `server` events on window for packets
// packets contain source to evaluate
function server() {
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
  }, false)
}
module.exports = server
