/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-13 下午7:16
 */
window.TQ = window.TQ || {};

(function() {
  function DitherRemover() {
  }
  var p = DitherRemover;
  p._LENGTH = 20; // N点加权平均法消除抖动
  p.buffer = [];
  p._on = false;
  p.enabled = false;
  p.start = function(xx, yy) {
    this.buffer.splice(0);
    this.buffer.push({ x: xx, y: yy });
    this._on = true;
    return this.buffer[0];
  };

  p.close = function() {
    this.buffer.splice(0);
    this._on = false;
  };

  // 添加1个新的点, 获取消抖处理后的点
  p.smooth = function(xx, yy) {
    if (this.enabled) {
      if (!this._on) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
        return this.start(xx, yy);
      }
      if (__user_level == 8) {
        TQ.Log.debugInfo(xx + ", " + yy);
      }
      if (this.buffer.length >= this._LENGTH) {
        this.buffer.shift();
      }
      this.buffer.push({ x: xx, y: yy });
      xx = 0;
      yy = 0;
      var num = this.buffer.length;
      for (var i = 0; i < num; i++) {
        xx += this.buffer[i].x / num;
        yy += this.buffer[i].y / num;
      }
    }
    return { x: xx, y: yy };
  };

  p.isOn = function() { return this._on; };

  TQ.DitherRemover = DitherRemover;
}());
