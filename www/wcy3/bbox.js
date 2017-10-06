/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};
(function () {
    /*
     BBox是一种特殊的修饰品Decoration. 也是Element类的子类.
     它的角度总是水平，不随host旋转。但是， 会计算新的大小和位置，确保它是boundary box
     */
    function BBox(level, desc, host) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof desc != 'string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.host = host;
        TQ.Element.call(this, level, desc); // 调用父类的初始化函数， 在子类构造函数中
    }

    var showPointOn = false;
    var p = BBox.prototype = Object.create(TQ.Element.prototype); //继承父类的函数, 子类构造函数的参数，限制少

    p.constructor = BBox; //把构造函数也放到prototype中, 是的copy，clone之类的函数， 可以返回本子类的类别
    p._parent_update = p.update;

    p.update = function (t, noRecording) {
        if (!this.host) {  // 发生在删除， detach的时候
            return;
        }
        if (this.dirty || this.dirty2) {
            this.createModal();
        }
        this.jsonObj.x = this.jsonObj.bbox.xc;
        this.jsonObj.y = this.jsonObj.bbox.yc;
        this.jsonObj.pivotX = 0.5;
        this.jsonObj.pivotY = -0.5;
        this.setTRSAVZ();
        TQ.Log.debugInfo("BBOX: jsonObj = " + this.jsonObj.x + ',' + this.jsonObj.y);
        this.dirty = this.dirty2 = false;
    };

    p.updateLayer = function () { //  总是紧接着host的下一层
        var hostZ = this.host.getZ();
        if (hostZ !== (this.getZ() + 1)) {
            // 新添加， 在host之后添加的， 所以在host之上
            // 后附加的，重复利用的bubble, 可能在host之下N层
            this.moveToZ(hostZ); // 正好移到host的z， 把host顶起来
        }
    };

    p.createImage = function () {
        // 将替换已有的image，如果有的话
        var s = this.displayObj;
        if (!s) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }

        s.graphics.clear(); // 清除老的边框
        var radius = 0,
            bbox = this.jsonObj.bbox;
        TQ.Graphics.drawRectC(s, 0, 0, bbox.w, bbox.h, radius);
    };

    p.createModal = function () {
        var hasPoint = false;
        if (this.host.has(TQ.ElementType.POINT)) {
            hasPoint = true;
        }

        var bbox = {},
            host = this.host,
            pivotX = host.jsonObj.pivotX,
            pivotY = host.jsonObj.pivotY,
            w = host.getWidth(),
            h = host.getHeight(),
            x1 = -pivotX * w,
            y1 = -pivotY * h,
            x2 = x1 + w,
            y2 = y1 + h,
            objPts = [
                {x: x1, y: y1},
                {x: x2, y: y1},
                {x: x2, y: y2},
                {x: x1, y: y2}];

        TQ.Log.matrixDebugInfo("bbox", host.jsonObj.M);
        objPts.forEach(function (pt) {
            if (!hasPoint && showPointOn) {
                TQ.Point.attachTo(host, {obj: pt, world: null});
            }
            pt = host.object2World(pt);
            if ((bbox.xmin === undefined) || (bbox.xmin > pt.x)) {
                bbox.xmin = pt.x;
            }
            if ((bbox.xmax === undefined) || (bbox.xmax < pt.x)) {
                bbox.xmax = pt.x;
            }
            if ((bbox.ymin === undefined) || (bbox.ymin > pt.y)) {
                bbox.ymin = pt.y;
            }
            if ((bbox.ymax === undefined) || (bbox.ymax < pt.y)) {
                bbox.ymax = pt.y;
            }
        });

        bbox.w = bbox.xmax - bbox.xmin;
        bbox.h = bbox.ymax - bbox.ymin;
        bbox.xc = (bbox.xmin + bbox.xmax) / 2;
        bbox.yc = (bbox.ymin + bbox.ymax) / 2;
        if (!this.jsonObj.bbox || !TQ.Utility.equalBoxSize(this.jsonObj.bbox, bbox)) {
            this.jsonObj.bbox = bbox;
            this.createImage();
        } else {
            this.jsonObj.bbox = bbox;
        }

    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var jsonObj = this.jsonObj;
        var s = new createjs.Shape();
        this.loaded = true;
        s.x = jsonObj.x;
        s.y = jsonObj.y;
        this.displayObj = s;
        this.createModal();
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.apply = function (ele) {
        this.dirty2 = true;
    };

    p.isBBox = function () {
        return true;
    };

    p.isEditable = function () {
        return false;
    };

    p.getWidth = function () {
        return (this.jsonObj.bbox.w);
    };

    p.getHeight = function () {
        return (this.jsonObj.bbox.h);
    };

    p.allowRecording = function () {
        return false;
    };

    p.toJSON = function () { // 不保存
        return null;
    };

    p.recycle = p.moveToTop = p.reset = function () {
    };

    function compose(host) {
        // 除了pivot，其余都是物体坐标系下的缺省值
        var jsonObj = {
            type: TQ.ElementType.BBOX,
            x: 0,
            y: 0,
            sx: 1,
            sy: 1,
            rotation: 0
        };
        jsonObj.pivotX = 0;
        jsonObj.pivotY = 0;
        return jsonObj;
    }

    BBox.attachTo = function (host) {
        TQ.AssertExt.isNotNull(host);
        if (host && !host.hasBBox()) {
            var desc = compose(host),
                bbox = TQ.Element.build(host.level, desc, host);
            host.attachDecoration([bbox]);
        }
    };

    BBox.detachFrom = function (host) {
        TQ.AssertExt.invalidLogic(host && host.hasBBox);
        if (host && host.hasBBox()) {
            var bbox = host.getBBox();
            host.removeChild(bbox);
            bbox.doShow(false);
        }
    };

    TQ.BBox = BBox;
}());
