/**
 * Created by Andrewz on 2/12/19.
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 矩形元素，
 */
TQ = TQ || {};

(function () {
  // 用法: Circle是一种可变大小的简单元素. 也是Element类的子类.
  function Circle(level, desc) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof desc != 'string');
    TQ.Element.call(this, level, desc); // 调用父类的初始化函数， 在子类构造函数中
  }

  var p = Circle.prototype = Object.create(TQ.Element.prototype); //继承父类的函数, 子类构造函数的参数，限制少
  p.constructor = Circle; //把构造函数也放到prototype中, 使得copy，clone之类的函数， 可以返回本子类的类别
  p.parent_fillGap = p.fillGap;
  p.fillGap = function (desc) {
    if (desc.pivotX === undefined) {
      desc.pivotX = 0.5;
      desc.pivotY = 0.5;
    }
    if (desc.radius === undefined) {
      desc.radius = 10;
    }
    if (desc.width === undefined) {
      desc.width = desc.radius;
    }
    if (desc.height === undefined) {
      desc.height = desc.width;
    }

    return this.parent_fillGap(desc);
  };

  p.createImage = function () {
    var jsonObj = this.jsonObj;
    var s = new createjs.Shape();
    var x0 = jsonObj.x,
      y0 = jsonObj.y,
      r = jsonObj.radius;
    s.x = x0;
    s.y = y0;
    s.graphics.clear(); // 清除老的边框
    TQ.Graphics.drawSolidCircle(s, '#FF0000', x0, y0, r);
    return s;
  };

  p._doLoad = function () {
    assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
    this.displayObj = this.createImage();
    this.loaded = true;
    this._afterItemLoaded();
    this.setTRSAVZ();
  };

  p.getWidth = function () {
    return this.jsonObj.radius;
  };

  p.getHeight = function () {
    return this.jsonObj.radius;
  };

  TQ.Circle = Circle;
}());
