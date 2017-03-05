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
        this.name = "TextBubble";
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
    p.update = function (t) {
        textPivot2Bubble(this.jsonObj, this.host);
        this.updateLayer();
        this._parent_update(t);
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
        TQ.Graphics.drawRect(s, 0, 0, this.getWidth(), this.getHeight());
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
