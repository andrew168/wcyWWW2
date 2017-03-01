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
            var bubble = new TextBubble(currScene.currentLevel, desc, host);
            //desc.src = "http://res.cloudinary.com/eplan/image/upload/v1484036387/c1.png";
            //desc.type = "Bitmap";
            //desc.autoFit = TQ.Element.FitFlag.NO;
            //bubble = TQ.SceneEditor.addItem(desc, TQ.MatType.PROP);
            host.addChild(bubble);
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
    p.update333 = function (t) {
        var hostObj = this.host.jsonObj;
        this.jsonObj.M = this.host.jsonObj.M;
        this.jsonObj.IM = this.host.jsonObj.IM;
        this.jsonObj.x = hostObj.x;
        this.jsonObj.y = hostObj.y;
        this.jsonObj.pivotX = hostObj.pivotX;
        this.jsonObj.pivotY = hostObj.pivotY;
        this.jsonObj.sx = hostObj.sx;
        this.jsonObj.sy = hostObj.sy;
        this.jsonObj.rotation = hostObj.rotation;
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
        var radius = TextBubble.RADIUS;
        s.graphics.ss(radius).beginStroke("#0F0").
            beginRadialGradientFill(["#FFF", "#F00"], [0, 1], 0, 0, 0, 0, 0, radius).
            drawCircle(0, 0, radius).endFill();
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
        // return TextBubble.RADIUS;
        return this.host.getWidth();
    };

    p.getHeight = function () {
        // return TextBubble.RADIUS;
        return this.host.getHeight();
    };

    // private
    function compose(host) {
        var hostObj = host.jsonObj,
            pos = host.getPositionInWorld();

        var jsonObj = {
            type: TQ.Element.DescType.TEXT_BUBBLE,
            x: pos.x,
            y: pos.y,
            pivotX: hostObj.pivotX,
            pivotY: hostObj.pivotY,
            sx: 1, //hostObj.sx,
            sy: 1, // hostObj.sy,
            rotation: hostObj.rotation
        };
        return jsonObj;
    }

    TQ.TextBubble = TextBubble;
}());
