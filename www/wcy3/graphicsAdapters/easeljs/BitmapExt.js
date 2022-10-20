/**
 * Created by Andrewz on 3/7/19.
 */

(function () {
  var p = createjs.Bitmap.prototype;
  // extended method
  p.getWidth = function (ignoreScale) {
    //  ���û�и�����, ��JS���� null, ���Զ�תΪfalse
    scale = (ignoreScale) ? 1 : this.scaleY;
    if (this.sourceRect) {
      return scale * this.sourceRect.width;
    }

    return scale * this.image.naturalWidth;
  };

  p.getHeight = function (ignoreScale) {
    scale = (ignoreScale) ? 1 : this.scaleY;
    if (this.sourceRect) {
      return scale * this.sourceRect.height;
    }

    return scale * this.image.naturalHeight;
  };

  p.naturalHeight = function () {
    return this.image.naturalHeight;
  };

  p.naturalWidth = function () {
    return this.image.naturalWidth;
  };
}());
