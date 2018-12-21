/**
 * Created by Andrewz on 4/5/2017.
 */
TQ = TQ || {};

(function () {
  // 用法: Marker是一种修饰品Decoration. 也是Element类的子类.
  var OP_TYPE = {
    UNKNOWN: 'unknown',
    SCALE_X: 'scale x',
    SCALE_Y: 'scale y',
    SCALE_XY: 'scale xy'
  };

  // class 中的所有私有变量，都是各个class共用的，都可以修改，如果有多个实例， 就会冲突。
  var lastOpType = OP_TYPE.UNKNOWN;

  function ScaleCalculator() {
    this.reset();
  }

  var p = ScaleCalculator.prototype;
  p.reset = function () {
    this.sx = 1;
    this.sy = 1;
    this.type = OP_TYPE.UNKNOWN;
    lastOpType = OP_TYPE.UNKNOWN; // 必须重新初始化， 否则，之前的值会保留
  };

  p.determineScale = function (ele, e) {
    var gesture = e.gesture;
    var dx = gesture.deltaX,
      dy = gesture.deltaY,
      scale = e.gesture.scale;
    // TQ.Log.warn("gesture: (dx, dy):" + gesture.deltaX + ', ' + gesture.deltaY + '  velocity(x, y)' + gesture.velocityX + ', ' + gesture.velocityY);

    // 变换到物体空间
    var TANGENT_8_DEGREE = 0.14054; // i.e. tan(8 degree)
    var dObj = ele.dDc2Object({x: dx, y: dy});
    dx = Math.abs(dObj.x);
    dy = Math.abs(dObj.y);

    var opType;
    if ((dx > dy) && (dx * TANGENT_8_DEGREE > dy)) {
      opType = OP_TYPE.SCALE_X;
    } else if ((dy > dx) && (dy * TANGENT_8_DEGREE > dx)) {
      opType = OP_TYPE.SCALE_Y;
    } else {
      opType = OP_TYPE.SCALE_XY;
    }

    if (lastOpType !== OP_TYPE.UNKNOWN) {
      if (opType !== lastOpType) {
        opType = lastOpType;
      }
    }

    lastOpType = opType;
    switch (opType) {
      case OP_TYPE.SCALE_X:
        this.sx = scale;
        // this.sy = undefined; do not refresh it; keep old value
        break;
      case OP_TYPE.SCALE_Y:
        this.sy = scale;
        break;
      case OP_TYPE.SCALE_XY:
        this.sx = scale;
        this.sy = scale;
        break;
    }

    this.type = opType;
    TQ.Log.warn("gesture: (dx, dy):" + gesture.deltaX.toFixed(2) + ',' + gesture.deltaY.toFixed(2) +
      ' (in Object Space:(dx, dy) =' + dx.toFixed(2) + ', ' + dy.toFixed(2) +
      '  scale(x, y)' + this.sx.toFixed(2) + ', ' + this.sy.toFixed(2));
  };

  TQ.ScaleCalculator = ScaleCalculator;
}());
