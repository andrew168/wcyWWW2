/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};
(function() {
  /**
     * GarbageCollector, 回收被deleted的元素，
     * 支持undelete
     * @class GarbageCollector
     * @static
     **/
  var GarbageCollector = function() {
    throw "GarbageCollector cannot be instantiated";
  };
  GarbageCollector._members = [];

  GarbageCollector.initialize = function() {
    GarbageCollector.clear();
  };

  GarbageCollector.add = function(ele) {
    GarbageCollector._members.push(ele);
  };

  GarbageCollector.remove = function(ele) {
    if (!ele) return;
    var id = GarbageCollector._members.indexOf(ele);
    if (id >= 0) GarbageCollector._members.splice(id, 1);
    return ele;
  };

  GarbageCollector.reset = function() {
    GarbageCollector._members.splice(0);
  };

  GarbageCollector.clear = function() {
    for (var i = 0; i < GarbageCollector._members.length; i++) {
      var ele = GarbageCollector._members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      GarbageCollector._members.splice(i, 1);
      ele.destroy();
    }

    GarbageCollector.reset();
  };

  TQ.GarbageCollector = GarbageCollector;
}());
