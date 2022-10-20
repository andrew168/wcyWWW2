/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};
(function () {
  /*
     * Point: 是点状元素，Element类的特殊子类. 必须附在某个host上， 但是与host的相对位置不固定
     * 没有旋转，固定大小, 位置可变。
     * 不可修改形状和大小
     */
  var POINT_RADIUS = 10;
  function Point(level, desc, host) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof desc != 'string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
    this.host = host;
    TQ.Element.call(this, level, desc); // 调用父类的初始化函数， 在子类构造函数中
  }

  var p = Point.prototype = Object.create(TQ.Element.prototype); //继承父类的函数, 子类构造函数的参数，限制少

  p.constructor = Point; //把构造函数也放到prototype中, 是的copy，clone之类的函数， 可以返回本子类的类别
  p._parent_update = p.update;

  p.update = function () {
    this.anchor.world = this.host.object2World(this.anchor.obj);
    this.jsonObj.x = this.anchor.world.x;
    this.jsonObj.y = this.anchor.world.y;
    this.setTRSAVZ();
    this.dirty = this.dirty2 = false;
  };

  p.updateLayer = function () { //  总是紧接着host的下一层
  };

  p.createImage = function () {
    // 将替换已有的image，如果有的话
    var s = this.displayObj;
    if (!s) {
      TQ.Log.criticalError(TQ.Dictionary.FoundNull);
      return;
    }

    s.graphics.clear(); // 清除老的边框
    TQ.Graphics.drawCircle(s, 0, 0, POINT_RADIUS);
  };

  p.createModal = function () {
    this.createImage();
  };

  p._doLoad = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
    var s = new createjs.Shape();
    this.loaded = true;
    s.x = 0;
    s.y = 0;
    this.displayObj = s;
    this.createModal();
    this._afterItemLoaded();
    this.setTRSAVZ();
  };

  p.apply = function (ele) {
    this.dirty2 = true;
  };

  p.isPoint = function () {
    return true;
  };

  p.isEditable = function () {
    return false;
  };

  p.getWidth = function () {
    return POINT_RADIUS;
  };

  p.getHeight = function () {
    return POINT_RADIUS;
  };

  p.allowRecording = function () {
    return false;
  };

  p.toJSON = function () { // 不保存
    return null;
  };

  p.recycle = function () {
    var aMarker = this;
    aMarker.removeFromStage();
  };
  p.moveToTop = p.reset = function () {
  };

  function compose(host) {
    // 除了pivot，其余都是物体坐标系下的缺省值
    var jsonObj = {
      type: TQ.ElementType.POINT,
      x: 0,
      y: 0,
      sx: 1,
      sy: 1,
      rotation: 0
    };
    jsonObj.pivotX = 0;
    jsonObj.pivotY = 0;
    return jsonObj;
  }

  Point.attachTo = function (host, anchor) {
    TQ.AssertExt.isNotNull(host);
    if (anchor) {
      var desc = compose(),
        point = TQ.Element.build(host.level, desc, host);
      point.anchor = anchor;
      host.attachDecoration([point]);
      point.update(); //必须update以计算坐标
    }

    return point;
  };

  Point.detachFrom = function (host) {
    TQ.AssertExt.invalidLogic(host);
    if (host) {
      var pt = this;
      pt.doShow(false);
      host.removeChild(pt);
    }
  };

  TQ.Point = Point;
}());
