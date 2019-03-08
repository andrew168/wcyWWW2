/**
 * Created by Andrewz on 3/7/19.
 */

(function () {
  var p = createjs.DisplayObject.prototype;
// extended method
  p.getWidth = function () {
    return 10;
  };

  p.getHeight = function () {
    return 10;
  };

  p.getCenterX = function () {
    return this.x + this.getWidth() / 2;
  };

  p.getCenterY = function () {
    return this.y + this.getHeight() / 2;
  };

  p.naturalHeight = function () {
    return 0;
  };

  p.naturalWidth = function () {
    return 0;
  };

}());
