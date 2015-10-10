/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function TextElement(level, desc) {
      if (level != null ) {  // 适用于 子类的定义, 不做任何初始化,只需要prototype
        this.level = level;
        this.children = [];
        this.decorations = null;
        this._isNewSkin = false;
        this._isHighlighting = false;
        this.animeCtrl = null;
        this.viewCtrl = null;
        this.state = (desc.state == undefined) ? 0 : desc.state;
        this.dirty = this.dirty2 = false;
        this.initialize(desc);
      }
    }

    var p = TextElement.prototype = new TQ.Element(null, null);

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并jsonObj
        var jsonObj = this.jsonObj;
        var txt = new createjs.Text(jsonObj.text, TQ.Utility.toCssFont(jsonObj.fontSize, jsonObj.fontFace), jsonObj.color);
        this.loaded = true;
        if (jsonObj.textAlign == null) {
            txt.textAlign = jsonObj.textAlign;
        } else {
            txt.textAlign = "left";
        }
        this.displayObj = txt;

        // hitArea 会随宿主物体的变换而变换， 所以，可以重用
        var shape2 = _createHitArea(0, 0, txt.rotation, txt.getMeasuredWidth(), txt.getMeasuredHeight());
        txt.hitArea = shape2;

        this._afterItemLoaded();
        this.setTRSAVZ();

        // stageContainer.addChild(shape2);
    };

    function _createHitArea(x, y, rotation, w, h) {
        var shape = new createjs.Shape();
        // shape.x = x;
        // shape.y = y;
        shape.rotation = rotation;
        shape.graphics.beginFill("#F00").drawRect(0, 0, w , h);
        return shape;
    }

    TQ.TextElement = TextElement;
}());
