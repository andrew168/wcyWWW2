
window.TQ = window.TQ || {};

TQ.MoveCtrl = (function() {
  var _self = {
    initialize: initialize
  };

  function initialize() {
    TQ.MessageBox.toast(TQ.Locale.getStr("already in lowest layer!"));
    TQ.MessageBox.toast(TQ.Locale.getStr("couldn't move any more！"));
    TQ.MessageBox.toast(TQ.Locale.getStr("screenshot uploaded successfully!"));
  }

  return _self;
})();
