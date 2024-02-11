/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};
(function() {
  /*
     geoBox是纯几何的边界盒. 不包含图形显示信息
     用于计算元件的缩放
  */
  function GeoBox(host) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, !!host && !host.isVirtualObject());
    // 把Image元素最初的边界盒随物体一起旋转，再计算新的边界盒，
    // 结果是 一个比较大的边界盒
    pivotX = host.jsonObj.pivotX,
    pivotY = host.jsonObj.pivotY,
    w = host.getWidth(),
    h = host.getHeight(),
    x1 = -pivotX * w,
    y1 = -pivotY * h,
    x2 = x1 + w,
    y2 = y1 + h,
    objPts = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 }];

    for (const i in objPts) {
      objPts[i] = host.object2World(objPts[i]);
    }

    this.xmin = Math.min(Math.min(objPts[0].x, objPts[1].x),
      Math.min(objPts[2].x, objPts[3].x));
    this.xmax = Math.max(Math.max(objPts[0].x, objPts[1].x),
      Math.max(objPts[2].x, objPts[3].x));
    this.ymin = Math.min(Math.min(objPts[0].y, objPts[1].y),
      Math.min(objPts[2].y, objPts[3].y));
    this.ymax = Math.max(Math.max(objPts[0].y, objPts[1].y),
      Math.max(objPts[2].y, objPts[3].y));

    this.w = this.xmax - this.xmin;
    this.h = this.ymax - this.ymin;
    this.xc = (this.xmin + this.xmax) / 2;
    this.yc = (this.ymin + this.ymax) / 2;
  }

  var p = GeoBox.prototype;

  p.combine = function(box) {
    this.xmin = Math.min(this.xmin, box.xmin);
    this.xmax = Math.max(this.xmax, box.xmax);
    this.ymin = Math.min(this.ymin, box.ymin);
    this.ymax = Math.max(this.ymax, box.ymax);
    this.w = this.xmax - this.xmin;
    this.h = this.ymax - this.ymin;
    this.xc = (this.xmin + this.xmax) / 2;
    this.yc = (this.ymin + this.ymax) / 2;
    return this;
  };

  p.getWidth = function() {
    return (this.w);
  };

  p.getHeight = function() {
    return (this.h);
  };

  TQ.GeoBox = GeoBox;
}());
