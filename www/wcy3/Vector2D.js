/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function() {
  // 这个构造函数， 应该很少被外面直接调用， 因为是其中的值是没有初始化的。
  //  替代地， 应该用create函数, 直接构造有变换的矩阵
  function Vector2D() {
  }

  var p = Vector2D.prototype = $V([1, 0]);

  Vector2D.create = function(elements) {
    var M = new Vector2D();
    return M.setElements(elements);
  };

  Vector2D.calDirection = function(startP, endP) {
    var direction = Vector2D.create([endP.x - startP.x, endP.y - startP.y]);
    var unitVector = direction.toUnitVector();
    return Vector2D.create(unitVector.elements);
  };

  p.angle360 = function() {
    assertFalse("vector  not 0", ((this.elements[0] == 0) && (this.elements[1] == 0)));
    TQ.AssertExt.invalidLogic(this.elements.length === 2, "必须是2D向量， 不能用齐次坐标");
    var angle = this.angleFrom($V([1, 0])) * TQ.MathExt.RAD_TO_DEG;
    var x = this.elements[0];
    var y = this.elements[1];

    if (y > 0) {
      return angle;
    } else if (y < 0) {
      return (360 - angle);
    } else {
      if (x > 0) {
        return angle;
      } else if (x < 0) {
        return 180;
      }
      assertTrue("vector is 0, has no angle", false);
      return 0; // 即使有错, 也应该返回一个值, 不能悬空; 要纠错,尽可能让程序可以执行.
    }
  };

  p.signFrom = function(vFrom) {
    var A = $V([vFrom.elements[0], vFrom.elements[1], 0]);
    var B = $V([this.elements[0], this.elements[1], 0]);
    var normal = A.cross(B);
    var z = normal.elements[2];
    // sign
    return (z > 0) ? 1 : -1;
  };

  p.angle360From = function(vFrom) {
    // 扩充： 原库是用acos计算角度， 所以， 在[0,180)范围取值。没有负值。i.e. 只管角度的大小，不管方向。
    // 这里用 方向来扩充到 （-180， 180）
    return this.signFrom(vFrom) * TQ.MathExt.RAD_TO_DEG * this.angleFrom(vFrom);
  };

  TQ.Vector2D = Vector2D;
}());
