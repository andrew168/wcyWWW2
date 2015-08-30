/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Math库的扩充
 */

window.TQ = window.TQ || {};

(function MathExt() {
    function MathExt() {

    }

    MathExt.range = function(v, vmin, vmax) {
        if (v <= vmin) return vmin;
        if (v >= vmax) return vmax;
        return v;
    };

    MathExt.minZIndex = function (upperEle, ele, z) {
        if ((!ele) || (!ele.hasFlag(TQ.Element.IN_STAGE))) return upperEle;
        if (ele.jsonObj.zIndex >= z) {
            if (!upperEle) {
                upperEle = ele;
            } else if (upperEle.jsonObj.zIndex >= ele.jsonObj.zIndex) {
                upperEle = ele;
            }
        }

        return upperEle;
    };

    MathExt.findUpperBoundary = function (elements, z) {
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

    MathExt.DEG_TO_RAD = Math.PI/180;
    MathExt.RAD_TO_DEG = 180/Math.PI;
    TQ.MathExt = MathExt;
}) ();