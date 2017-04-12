/**
 * Created by Andrewz on 2/25/2017.
 */
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: TextBubble是一种可变大小的修饰品Decoration. 也是Element类的子类.
    function TextBubble(level, desc, host) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof desc != 'string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.host = host;
        TQ.Element.call(this, level, desc); // 调用父类的初始化函数， 在子类构造函数中
    }

    TextBubble.attachTo = function(host) {
        if (!host) {
            host = TQ.SelectSet.peekLatestEditableEle();
        }

        if (host && host.hasBubble && !host.hasBubble()) {
            var desc = compose(host),
                bubble = host.addChild(desc);
            setTimeout(function() {
                host.detachDecoration();
                bubble.attachAnchorMarker();
            })
        }
    };

    TextBubble.detachFrom = function (host) {
        if (!host) {
            host = TQ.SelectSet.peekLatestEditableEle();
        }

        if (!host) {
            return;
        }

        if (!host.hasBubble && host.isMarker()) {
            var bubble = host.host;
            host = bubble.host;
        }

        if (!!host && host.hasBubble && host.hasBubble()) {
            bubble = host.getTextBubble();
            host.removeChild(bubble);
            bubble.doShow(false);
        }
    };

    TextBubble.RADIUS = 10;
    TextBubble.BORDER_WIDTH = 10;

    var p = TextBubble.prototype = Object.create(TQ.Element.prototype); //继承父类的函数, 子类构造函数的参数，限制少
    p.constructor = TextBubble; //把构造函数也放到prototype中, 是的copy，clone之类的函数， 可以返回本子类的类别
    p._parent_update = p.update;
    p.update = function (t, noRecording) {
        textPivot2Bubble(this.jsonObj, this.host);
        this._parent_update(t, noRecording);
        this.updateLayer();
        this.dirty = false;
    };

    p.parent_doShow = p.doShow;
    p.doShow = function (flag) {
        if (this.anchorMarker && !flag) {
            this.anchorMarker.doShow(flag);
        }

        this.parent_doShow(flag);
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
        TQ.Graphics.drawBubble(s, this.jsonObj.textBubble);
    };

    p.createModal = function() {
        if (!this.jsonObj.textBubble) {
            // 左下角， + pivot
            var anchorWidth = 20,
                xc = 0,
                yc = 0,
                w = this.getWidth(),
                h = this.getHeight(),

                xmin = xc - w / 2,  // 已经改为物体坐标， 便于使用
                ymin = yc - h / 2,
                xmax = xc + w / 2,
                ymax = yc + h / 2,
                xa = xmin + w / 2,
                xa1 = xa + anchorWidth / 2,
                xa3 = xa - anchorWidth / 2,
                ya1 = ymin, // anchor在下边缘
                ya3 = ymin,
                ya = ya1 - 100;

            this.jsonObj.textBubble = { // 从设备坐标简单地变为 对象坐标： Y轴变负
                xmin: xmin,
                ymin: ymin,
                width: w,
                height: h,
                radiusTL: 1,
                radiusTR: 1,
                radiusBL: 1,
                radiusBR: 1,
                anchor: [{x: xa1, y: ya1},
                    {x: xa, y: ya},
                    {x: xa3, y: ya3}
                ]
            };
        }
    };

    p.onMoveMarker = function (marker, ptWorld) {
        TQ.CommandMgr.directDo(new TQ.MoveAnchorCommand(this, ptWorld));
    };

    p.moveAnchorTo = function(ptWorld) {
        var ptObj = this.world2Object(ptWorld);
        var anchor = this.getAnchorInObject();
        anchor.x = ptObj.x;
        anchor.y = ptObj.y;
        this.createImage();
        TQ.DirtyFlag.setElement(this);
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
        this.createImage();
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.apply = function (ele) {
        this.dirty2 = true;
    };

    p.isTextBubble = function () {
        return true;
    };

    p.isEditable = function () {
        return false;
    };

    p.getWidth = function() {
        return this.host.getWidth();
    };

    p.getHeight = function () {
        return this.host.getHeight();
    };

    p.allowRecording = function () {
        return false;
    };

    p.getAnchorInObject = function() {
        return this.jsonObj.textBubble.anchor[1];
    };

    p.attachAnchorMarker = function () {
        var anchorMarker = TQ.AnchorMarker.getOne();
        this.attachDecoration([anchorMarker]);
        this.anchorMarker = this.decorations[0];
        this.updateAnchorMarker();
    };

    p.updateAnchorMarker = function() {
        if (this.anchorMarker) {
            var ptObj = this.getAnchorInObject(),
                ptWorld = this.object2World(ptObj);
            this.anchorMarker.moveTo(ptWorld);
        }
    };

    p.detachAnchorMarker = function () {
        this.detachDecoration();
    };

    // private
    function compose(host) {
        // 除了pivot，其余都是物体坐标系下的缺省值
        var jsonObj = {
            type: TQ.ElementType.TEXT_BUBBLE,
            x: 0,
            y: 0,
            sx: 1,
            sy: 1,
            rotation: 0
        };
        textPivot2Bubble(jsonObj, host);
        return jsonObj;
    }

    function textPivot2Bubble(jsonObj, host) {
        var hostObj = host.jsonObj;
        jsonObj.pivotX = hostObj.pivotX - 0.5;
        jsonObj.pivotY = hostObj.pivotY - 0.5;
    }

    TQ.TextBubble = TextBubble;
}());
