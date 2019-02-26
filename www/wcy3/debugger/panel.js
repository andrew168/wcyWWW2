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

    TQ.State.audioMethod = parseInt(TQ.Utility.readLocalStorage('audioMethod', 4));
    window.debugger_audioMethod = function(method) {
      TQ.State.audioMethod = method;
      TQ.Utility.writeLocalStorage('audioMethod', TQ.State.audioMethod);
    };

    panel = TQ.DomUtility.createElement(document.body, 'div', 'id-debug-panel', 'debug-panel-layer');
    panel.innerHTML = htmlStr;
    TQ.DomUtility.showElement(panel);
    panel.addEventListener("touchstart", onTouchStart, false);
    panel.addEventListener("touchmove", onTouchMove, false);
    var startX, startY,
      startTop, startLeft;
    startTop = TQ.Utility.readLocalStorage('startTop', 0);
    startLeft = TQ.Utility.readLocalStorage('startLeft', 0);
    panel.style.left = startLeft + 'px';
    panel.style.top = startTop + 'px';

    function onTouchStart(evt) {
      var touch = evt.touches[0];
      if (touch) {
        startX = touch.clientX;
        startY = touch.clientY;
        startTop = TQ.Utility.getCssSize(panel.style.top);
        startLeft = TQ.Utility.getCssSize(panel.style.left);
      }
    }

    function onTouchMove(evt) {
      var touch = evt.touches[0];
      if (touch) {
        deltaX = touch.clientX - startX;
        deltaY = touch.clientY - startY;
        panel.style.left = startLeft + deltaX + 'px';
        panel.style.top = startTop + deltaY + 'px';
      }
    }
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
