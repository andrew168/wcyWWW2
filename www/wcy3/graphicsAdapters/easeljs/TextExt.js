/**
 * Created by Andrewz on 3/7/19.
 */

(function () {
  var p = createjs.Text.prototype;
  p.getWidth = function () {
    return this.getMeasuredWidth();
  };

  p.getHeight = function () {
    return this.getMeasuredHeight();
  };

  p.naturalHeight = function () {
    return this.getMeasuredHeight();
  };

  p.naturalWidth = function () {
    return this.getMeasuredWidth();
  };

}());
