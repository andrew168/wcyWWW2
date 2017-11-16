/**
 * Created by Andrewz on 3/4/2017.
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 矩形元素，
 */
TQ = TQ || {};

(function () {
    // 用法: Rectangle是一种可变大小的修饰品Decoration. 也是Element类的子类.
    function Rectangle(level, desc) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof desc != 'string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        TQ.Element.call(this, level, desc); // 调用父类的初始化函数， 在子类构造函数中
    }

    var p = Rectangle.prototype = Object.create(TQ.Element.prototype); //继承父类的函数, 子类构造函数的参数，限制少
    p.constructor = Rectangle; //把构造函数也放到prototype中, 是的copy，clone之类的函数， 可以返回本子类的类别
    p.parent_fillGap = p.fillGap;
    p.fillGap = function (desc) {
        desc.pivotX = 0;
        desc.pivotY = 0;
        if (desc.width === undefined) {
            desc.width = 200;
        }
        if (desc.height === undefined) {
            desc.height = 100;
        }

        return this.parent_fillGap(desc);
    };

    p.createImage = function () {
        var jsonObj = this.jsonObj;
        var s = new createjs.Shape();
        s.x = jsonObj.x;
        s.y = jsonObj.y;
        s.graphics.clear(); // 清除老的边框
        TQ.Graphics.drawRect(s, 0, 0, this.getWidth(), this.getHeight());
        Rectangle.RADIUS = Math.min(this.getWidth(), this.getHeight()) / 2;
        TQ.Graphics.drawStar(s, 0, 0, 3 * Rectangle.RADIUS, 3 * Rectangle.RADIUS);
        TQ.Graphics.drawCircle(s, 0, 0, Rectangle.RADIUS);
        return s;
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        this.displayObj = this.createImage();
        this.loaded = true;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.getWidth = function () {
        return this.jsonObj.width;
    };

    p.getHeight = function () {
        return this.jsonObj.height;
    };

    TQ.Rectangle = Rectangle;
}());
