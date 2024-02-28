/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Math库的扩充
 */

window.TQ = window.TQ || {};

(function MathExt() {
  function MathExt() {

  }

  MathExt.clamp = function(v, vmin, vmax) {
    if (v <= vmin) return vmin;
    if (v >= vmax) return vmax;
    return v;
  };
  MathExt.range = MathExt.clamp;

  // 把1-10的规范数字映射到[vmin,vmax]区间，
  MathExt.unifyValue10 = function(v, vmin, vmax) {
    var result = (vmin + v * (vmax - vmin) / 10);
    result = MathExt.clamp(result, vmin, vmax);
    return result;
  };

  MathExt.minZIndex = function(upperEle, ele, z) {
    if ((!ele) || (!ele.hasFlag(TQ.Element.IN_STAGE))) return upperEle;
    if (ele.getZ() >= z) {
      if (!upperEle) {
        upperEle = ele;
      } else if (upperEle.getZ() >= ele.getZ()) {
        upperEle = ele;
      }
    }

    return upperEle;
  };

  MathExt.findUpperBoundary = function(elements, z) {
    var upperEle = null;
    var ele = null;
    for (var i = 0; i < elements.length; i++) {
      ele = elements[i];
      upperEle = MathExt.minZIndex(upperEle, ele, z);
      if (ele.children && (ele.children.length > 0)) {
        var temp = MathExt.findUpperBoundary(ele.children, z);
        upperEle = MathExt.minZIndex(upperEle, temp, z);
      }
    }
    return upperEle;
  };

  /*
    去小数点后面3位有效数字
     */
  MathExt.round2 = function(f) {
    return Math.round(f * 100) / 100;
  };

  MathExt.DEG_TO_RAD = Math.PI / 180;
  MathExt.RAD_TO_DEG = 180 / Math.PI;
  TQ.MathExt = MathExt;
})();
