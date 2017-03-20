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

    var p = AnchorMarker.prototype = Object.create(TQ.Marker.prototype);
    p.parent_getTsrInHostObj = p.getTsrInHostObj;

    p.getTsrInHostObj = function () {
        var tsrObj = this.parent_getTsrInHostObj();
        if (this.host) {// 在初次创建的时候， 可能没有host
            var anchor = this.host.getAnchorInObject();
            tsrObj.x = anchor.x;
            tsrObj.y = anchor.y;
        }
        return tsrObj;
    };


    /// singleton
    var decorations = [],
        workingDecorations = [];

    AnchorMarker.getOne = function () {
        var decs = decorations.pop();
        if (decs == null) {
            var ele = TQ.Element.build(currScene.currentLevel, {isVis: 0, type: TQ.Element.DescType.ANCHOR_MARKER});
            decs = [ele];
        }
        workingDecorations.push(decs);
        return decs;
    };

    AnchorMarker.recycleDecoration = function (decoration) {
        var id = workingDecorations.indexOf(decoration);
        workingDecorations.splice(id, 1);
        decorations.push(decoration);
    };

    TQ.AnchorMarker = AnchorMarker;
}());
