/**
 * Created by Andrewz on 2/26/19.
 */
var TQDebugger = TQDebugger || {};
TQDebugger.Panel = (function () {
  var panel,
  eleLog;
  return {
    init: init,
    open: open,
    close: close,
    logInfo: logInfo
    // addButton: addButton
  };

  function init() {
    if (panel) {
      return;
    }

    var htmlStr = '<button onclick="debugger_audioMethod(1);">声音1</button>' +
      '<button onclick="debugger_audioMethod(2);">声音2</button>' +
      '<button onclick="debugger_audioMethod(3);">声音3</button>' +
      '<div id="id-debug-info">debug info</div>';

    window.debugger_audioMethod = function(method) {
      TQ.State.audioMethod = method;
    };

    panel = TQ.DomUtility.createElement(document.body, 'div', 'id-debug-panel', 'debug-panel-layer');
    panel.innerHTML = htmlStr;
    TQ.DomUtility.showElement(panel);
  }

  function open() {
    TQ.DomUtility.showElement(panel);
  }

  function close() {
    TQ.DomUtility.hideElement(panel);
  }

  function logInfo(msg) {
    if (!eleLog) {
      eleLog = document.getElementById('id-debug-info');
    }

    eleLog.innerHTML += '<p>' + msg + '</p>';
  }
}());
