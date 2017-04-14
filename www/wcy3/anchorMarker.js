/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: AnchorMarker是一种修饰品Decoration, 特殊的Marker，只附着在气泡的anchor上.
    function AnchorMarker(level, jsonObj) {
        TQ.Marker.call(this, level, jsonObj);
    }

    AnchorMarker.init = function () {
        markers.splice(0);
        workingMarkers.splice(0);
    };

    var GRADIENT_COLOR_S = "#007",
        GRADIENT_COLOR_E = "#00F";

    var p = AnchorMarker.prototype = Object.create(TQ.Marker.prototype);
    p.parent_getTsrInHostObj = p.getTsrInHostObj;

    p.getTsrInHostObj = function () {
        var tsrObj = this.parent_getTsrInHostObj();

        if (this.host) {// 在初次创建的时候， 可能没有host
            if (!this.host.getAnchorInObject) {
                TQ.AssertExt.invalidLogic("应该有anchor！");
            } else {
                var anchor = this.host.getAnchorInObject();
                tsrObj.x = anchor.x;
                tsrObj.y = anchor.y;
            }
        }
        return tsrObj;
    };

    p.createImage = function () {
        var s = this.displayObj;
        if (!s) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }

        s.graphics.clear(); // 清除老的边框
        TQ.Graphics.drawCircle(s, 0, 0, TQ.Marker.RADIUS, GRADIENT_COLOR_S, GRADIENT_COLOR_E);
    };

    /// singleton
    var markers = [],
        workingMarkers = [];

    AnchorMarker.getOne = function () {
        var decs = markers.pop();
        if (!decs) {
            decs = TQ.Element.build(currScene.currentLevel, {isVis: 0, type: TQ.ElementType.ANCHOR_MARKER});
        }
        workingMarkers.push(decs);
        return decs;
    };

    p.recycle = function () {
        var aMarker = this;
        var id = workingMarkers.indexOf(aMarker);
        workingMarkers.splice(id, 1);
        markers.push(aMarker);
        aMarker.removeFromStage();
    };

    TQ.AnchorMarker = AnchorMarker;
}());
