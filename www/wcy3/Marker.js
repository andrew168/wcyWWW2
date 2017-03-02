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

    Marker.RADIUS = 10;

    var p = Marker.prototype = new TQ.Element(null, null, null, null);

    p.attach = function() {
        this.jsonObj.x = this.host.jsonObj.x; // 相同的位置, 没有误差, 才会得到 真正的原点
        this.jsonObj.y = this.host.jsonObj.y;
    };

    p._parent_update = p.update;
    p.update2 = function(t) {
        this.moveToTop();
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
        var radius = Marker.RADIUS;
        s.graphics.ss(radius).beginStroke("#f0f").
            beginRadialGradientFill(["#FFF","#0FF"],[0,1],0,0,0,0,0,radius).
            drawCircle(0,0,radius).endFill();
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

    TQ.Marker = Marker;
}());
