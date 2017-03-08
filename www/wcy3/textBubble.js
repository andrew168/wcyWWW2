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
        this.name = "TextBubble";
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof desc != 'string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.host = host;
        TQ.Element.call(this, level, desc); // 调用父类的初始化函数， 在子类构造函数中
    }

    TextBubble.attachTo = function(host) {
        if (!host) {
            host = TQ.SelectSet.peekLatestEditableEle();
        }

        if (host) {
            var desc = compose(host);
            host.addChild(desc);
        }
    };

    TextBubble.detachFrom = function (host) {
        if (!host) {
            host = TQ.SelectSet.peekLatestEditableEle();
        }

        if (!!host) {
            bubble = host.getTextBubble();
            host.removeChild(bubble);
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
    };

    p.updateLayer = function () { //  总是紧接着host的下一层
        var newZ = this.host.getZ() - 1;
        if (newZ !== this.getZ()) {
            this.moveToZ(newZ);
        }
    };

    p.createImage = function () {
        var s = this.displayObj;
        if (!s) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }

        s.graphics.clear(); // 清除老的边框
        if (!this.jsonObj.textBubble) {
            // 左下角， + pivot
            var anchorWidth = 20,
                xc = 0,
                yc = 0,
                w = this.getWidth(),
                h = this.getHeight(),

                xmin = xc - w / 2,  // 这些值被直接用于绘图， 所以是设备坐标
                ymin = yc - h / 2,
                xmax = xc + w / 2,
                ymax = yc + h / 2,
                xa = xmin + w / 2,
                xa1 = xa + anchorWidth / 2,
                xa3 = xa - anchorWidth / 2,
                ya1 = ymin,
                ya3 = ymin,
                ya = ya1 - 100;

            this.jsonObj.textBubble = { // 从设备坐标简单地变为 对象坐标： Y轴变负
                xmin: xmin,
                ymin: -ymax,
                width: w,
                height: h,
                radiusTL: 1,
                radiusTR: 1,
                radiusBL: 1,
                radiusBR: 1,
                anchor: [{x: xa1, y: -ya1},
                    {x: xa, y: -ya},
                    {x: xa3, y: -ya3}
                ]
            };
        }

        TQ.Graphics.drawBubble(s, this.jsonObj.textBubble);
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var jsonObj = this.jsonObj;
        var s = new createjs.Shape();
        this.loaded = true;
        s.x = jsonObj.x;
        s.y = jsonObj.y;
        this.displayObj = s;
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

    p.getWidth = function() {
        return this.host.getWidth();
    };

    p.getHeight = function () {
        return this.host.getHeight();
    };

    p.parent_hightlight = p.highlight;
    p.highlight = function (enable) {
        this.parent_hightlight(enable);
        if (this._isHighlighting) {
            if (!this.decorations) {
                this.attachDecoration(TQ.SelectSet.getDecoration());
            }
        } else {
            if (!!this.decorations) {
                this.detachDecoration();
            }
        }
    };

    p.allowRecording = function () {
        return false;
    };

    // private
    function compose(host) {
        // 除了pivot，其余都是物体坐标系下的缺省值
        var jsonObj = {
            type: TQ.Element.DescType.TEXT_BUBBLE,
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
