/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: Marker是一种修饰品Decoration. 也是Element类的子类.
    function Marker(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.decorations = null;
        this.host = null;
        this._isNewSkin = false;
        jsonObj.pivotX = (jsonObj.pivotX === undefined) ? 0 : jsonObj.pivotX; // Marker图元的原点已经在正中心了
        jsonObj.pivotY = (jsonObj.pivotY === undefined) ? 0 : jsonObj.pivotY;
        this.initialize(jsonObj);
    }

    Marker.init = function() {
        markers.splice(0);
        workingMarkers.splice(0);
    };

    Marker.RADIUS = 32; // 2个字的大小
    var GRADIENT_COLOR_S = "#00F",
        GRADIENT_COLOR_E = "#F00";

    var p = Marker.prototype = new TQ.Element(null, null, null, null);

    p._parent_update = p.update;
    p.update2 = function(t, noRecording) {
        this._parent_update(t, noRecording);
        this.moveToTop();
    };

    p.getTsrInHostObj = function() {
        if (!this.jsonObj.tsrObj) {
            this.jsonObj.tsrObj = TQ.Base.Utility.shadowCopy(TQ.CreateJSAdapter.getDefaultRootTsr());
        }
        return this.jsonObj.tsrObj;
    };

    p.limitHostNoRotation = function() {
        if (this.host) {
            var rotation = this.host.getRotation();
            if (!TQ.Utility.equalToZero(rotation)) {
                // ToDo: 提示
                this.host.rotateTo(0);
            }
        }
    };

    p.moveToTop = function() {
        var id = stageContainer.getNumChildren();
        stageContainer.setChildIndex(this.displayObj, id - 1);
    };

    p.createImage = function() {
        var s = this.displayObj;
        if (!s) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }

        s.graphics.clear(); // 清除老的边框
        TQ.Graphics.drawCircle(s, 0, 0, Marker.RADIUS, GRADIENT_COLOR_S, GRADIENT_COLOR_E);
    };

    p._loadMarker = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var jsonObj = this.jsonObj;
        var s = new createjs.Shape();
        this.loaded = true;
        s.x = jsonObj.x;
        s.y = jsonObj.y;
        this.displayObj = s;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.apply = function(ele) {
        this.jsonObj.x = ele.jsonObj.x;
        this.jsonObj.y = ele.jsonObj.y;
        this.dirty2 = true;
        this.setFlag(TQ.Element.TRANSLATING);
        if (TQBase.LevelState.isOperatingCanvas()){
            this.createImage();
        }
    };

    p.isMarker = function() {
        return true;
    };

    p.getWidth = function () {
        return 2 * Marker.RADIUS;
    };

    p.getHeight = function () {
        return 2 * Marker.RADIUS;
    };

    p.reset = function () {
        this.jsonObj.x = 0;
        this.jsonObj.y = 0;
        this.jsonObj.sx = 1;
        this.jsonObj.sy = 1;
        this.jsonObj.rotation = 0;
        this.jsonObj.animeTrack = this.animeTrack = null;
        this.jsonObj.M = this.jsonObj.IM = null;
    };

    p.allowRecording = function () {
        return false;
    };

    p.noScaleRotation = function() { // marker， 任何时候都是一样的大小， 方位， 不旋转
        this.jsonObj.rotation = 0;
        this.jsonObj.sx = 1;
        this.jsonObj.sy = 1;
    };

    p.tsrObject2World = function (pose) {
        var bakIsVis = this.jsonObj.isVis;
        TQ.CreateJSAdapter.tsrObject2World.call(this, pose);
        this.jsonObj.isVis = bakIsVis;
        this.noScaleRotation();
    };

    /// singleton
    var markers = [],
        workingMarkers = [];

    Marker.getOne = function () {
        var decs = markers.pop();
        if (decs == null) {
            decs = TQ.Element.build(currScene.currentLevel, {isVis: 0, type: TQ.ElementType.JOINT_MARKER});
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

    TQ.Marker = Marker;
}());
