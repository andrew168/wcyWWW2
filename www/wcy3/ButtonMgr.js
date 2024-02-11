/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Sound的Manager, 负责Sound的preload, play, stop, 等一系列工作.
 * 是singleton
 */
TQ = TQ || {};
(function() {
  function ButtonMgr() {
  }

  ButtonMgr.items = [];
  ButtonMgr.initialize = function() {
  };

  ButtonMgr.addItem = function(ele) {
    if (ButtonMgr.items.indexOf(ele) >= 0) { // 避免同一个元素（跨场景的），重复插入
      return;
    }
    ButtonMgr.items.push(ele);
  };

  ButtonMgr.deleteItem = function(ele) {
    var id = ButtonMgr.items.indexOf(ele);
    if (id >= 0) {
      ButtonMgr.items.splice(id, 1);
    }
  };

  ButtonMgr.removeAll = function() {
    for (var i = ButtonMgr.items.length - 1; i >= 0; i--) {
      var ele = ButtonMgr.items[i];
      ButtonMgr.items.splice(i, 1);
    }
  };

  ButtonMgr.close = function() {
    ButtonMgr.removeAll();
    ButtonMgr.items.splice(0);
  };

  TQ.ButtonMgr = ButtonMgr;
}());
