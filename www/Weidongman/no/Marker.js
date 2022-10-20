/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
  // 用法: Marker是一种修饰品Decoration. 也是Element类的子类.
  function Marker(level, jsonObj) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
    this.level = level;
    this.children = [];
    this.decorations = null;
    this.host = null;
    this._isNewSkin = false;
    this.initialize(jsonObj);
  }

  var p = Marker.prototype = new TQ.Element(null, null, null, null);

  p.attach = function() {
    this.jsonObj.x = this.host.jsonObj.x; // 相同的位置, 没有误差, 才会得到 真正的原点
    this.jsonObj.y = this.host.jsonObj.y;
  };

  p._parent_update = p.update;
  p.update2 = function(t) {
    var ele = this.host;
    this.moveToTop();
    if (this.isUserControlling() && TQ.InputMap.mouseMoving) {
      this._parent_update(t);
      var dwx = this.jsonObj.x - ele.jsonObj.x;
      var dwy = this.jsonObj.y - ele.jsonObj.y;
      TQ.CommandMgr.directDo(new TQ.MovePivotCommand(ele,
        ele.calPivot(TQ.Pose.x, TQ.Pose.y),
        {x:ele.jsonObj.x + dwx,
          y:ele.jsonObj.y + dwy},
        this));
    }
  };

  p._loadMarker = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
    var jsonObj = this.jsonObj;
    var s = new createjs.Shape();
    var radius = 10;
    s.x = jsonObj.x;
    s.y = jsonObj.y;
    this.displayObj = s;
    this.setTRSAVZ();
    this._afterItemLoaded();
  };

  p.apply = function(ele) {
    this.jsonObj.x = ele.jsonObj.x;
    this.jsonObj.y = ele.jsonObj.y;
    this.dirty2 = true;
    this.setFlag(Element.TRANSLATING);
    if (TQBase.LevelState.isOperatingCanvas()){
      ele.updateHighlighter(this.displayObj);
    }
  };

  TQ.Marker = Marker;
}());
