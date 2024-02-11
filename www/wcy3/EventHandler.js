TQ = TQ || {};
(function() {
  /** *
     * 通用的事件处理机制， 可以添加任意事件的处理函数， 可以附加到任何class上，使其立即具有事件处理能力
     * @constructor
     */
  function EventHandler() {
  }
  var p = EventHandler.prototype;

  EventHandler.initialize = function(target) {
    target.addHandler = p.addHandler;
    target.removeHandler = p.removeHandler;
    target.removeAllHandlers = p.removeAllHandlers;
    target.hasHandler = p.hasHandler;
    target.handleEvent = p.handleEvent;
  };

  // constructor:

  p._handlers = null;
  p._captureHandlers = null;
  p.initialize = function() {};

  // public methods:
  p.handleEvent = function(eventName) {
    if (!this._handlers) return;
    var arr = this._handlers[eventName];
    if (arr) {
      for (var i = 0, num = arr.length; i < num; i++) {
        var fn1 = arr[i];
        if (fn1) fn1();
      }
    }
  };

  p.addHandler = function(type, handler, useCapture) {
    var handlers;
    if (useCapture) {
      handlers = this._captureHandlers = this._captureHandlers || {};
    } else {
      handlers = this._handlers = this._handlers || {};
    }
    var arr = handlers[type];
    if (arr) { this.removeHandler(type, handler, useCapture); } // 确保同一个函数，对每一个事件都不能重复使用。
    arr = handlers[type]; // remove may have deleted the array
    if (!arr) { handlers[type] = [handler]; } else { arr.push(handler); }
    return handler;
  };

  p.removeHandler = function(type, handler, useCapture) {
    var handlers = useCapture ? this._captureHandlers : this._handlers;
    if (!handlers) { return; }
    var arr = handlers[type];
    if (!arr) { return; }
    for (var i = 0, l = arr.length; i < l; i++) {
      if (arr[i] == handler) {
        if (l == 1) { delete (handlers[type]); } // allows for faster checks.
        else { arr.splice(i, 1); }
        break;
      }
    }
  };

  p.removeAllHandlers = function(type) {
    if (!type) { this._handlers = this._captureHandlers = null; } else {
      if (this._handlers) { delete (this._handlers[type]); }
      if (this._captureHandlers) { delete (this._captureHandlers[type]); }
    }
  };

  p.hasHandler = function(type) {
    var handlers = this._handlers; var captureListeners = this._captureHandlers;
    return !!((handlers && handlers[type]) || (captureListeners && captureListeners[type]));
  };

  TQ.EventHandler = EventHandler;
}());
