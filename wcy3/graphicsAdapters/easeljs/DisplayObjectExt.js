/**
 * Created by Andrewz on 3/7/19.
 */

(function() {
  var p = createjs.DisplayObject.prototype;
  // extended method
  p._matrix = new createjs.Matrix2D();
  p.getWidth = function() {
    return 10;
  };

  p.getHeight = function() {
    return 10;
  };

  p.getCenterX = function() {
    return this.x + this.getWidth() / 2;
  };

  p.getCenterY = function() {
    return this.y + this.getHeight() / 2;
  };

  p.naturalHeight = function() {
    return 0;
  };

  p.naturalWidth = function() {
    return 0;
  };

  /**
 * 是否拥有mouse Handler
 * @param {*} mouseEvents
 * @returns
 */
  p._hasMouseHandler = function(mouseEvents) {
    var listeners = this._listeners;
    return !!(mouseEvents & 1 &&

      (this.onPress || this.onClick || this.onDoubleClick || listeners &&
        (this.hasEventListener("mousedown") || this.hasEventListener("click") ||
          this.hasEventListener("dblclick"))) ||
      mouseEvents & 2 &&
      (this.onMouseOver || this.onMouseOut || this.cursor || listeners &&
        (this.hasEventListener("mouseover") || this.hasEventListener("mouseout"))));
  };
}());
