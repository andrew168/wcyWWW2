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

    p.getText = function() {
        return this.jsonObj.text;
    };

    p.setText = function(str) {
        this.jsonObj.text = str;
    };

    p.setText = function (str, fontFamily, fontSize, fontColor) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); //应该是Text元素
        // 此处不用再检验, 因为他不直接对用户, 只要那些直接对用户的函数, 把好关就行.
        // 但是一定要断言, 确信: 外围站岗的尽责了.
        if (this.displayObj != null) {
            this.displayObj.text = this.jsonObj.text = str;
            if (fontColor) {
                this.displayObj.color = this.jsonObj.color = fontColor;
            }
            if (fontSize) {
                this.jsonObj.fontSize = fontSize;
            }
            if (fontFamily){
                this.jsonObj.fontFace = fontFamily;
            }
            this.displayObj.font = TQ.Utility.toCssFont(this.jsonObj.fontSize, this.jsonObj.fontFace);
        }
    };

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

    p.parent_fillGap = p.fillGap;
    p.fillGap = function(desc) {
        if (desc.font) {
            _upgradeFont(desc);
        }
        if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
        if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
        if (!desc.color)  desc.color = TQ.Config.color;
        return this.parent_fillGap(desc);
    };

    // 样例： <font color="#f74107" size="6" face="隶书">用克隆键</font>
    p.toHtmlStr = function () {
        return '<font color="' + this.jsonObj.color + '" size="' +
            ((this.jsonObj.fontSize - 6) / 5) + '" face="' +
            this.jsonObj.fontFace + '">' +
            this.jsonObj.text + '</font>';
    };

    Element.parseHtmlStr = function (jsonObj, htmlStr) {
        jsonObj.text = TQ.Utility.extractTag("font", htmlStr, jsonObj.text);
        var oldSize = jsonObj.fontSize;
        jsonObj.fontSize = TQ.Utility.extractAttr("font", "size", htmlStr, jsonObj.fontSize);
        if (oldSize != jsonObj.fontSize) {
            jsonObj.fontSize = jsonObj.fontSize * 5 + 6;
        }
        jsonObj.fontFace = TQ.Utility.extractAttr("font", "face", htmlStr, jsonObj.fontFace);
        jsonObj.color = TQ.Utility.extractAttr("font", "color", htmlStr, jsonObj.color);
    };


    // private:
    function _upgradeFont (desc) { // R308引入，
        var str = desc.font.replace("px", "");
        var arr = str.split(" ");
        if (arr.length >= 1) {
            if (!desc.fontFace)  desc.fontFace = arr[1];
            if (!desc.fontSize)  desc.fontSize = arr[0];
        }
        if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
        if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
        if (!desc.color)  desc.color = TQ.Config.color;
    }

    TQ.TextElement = TextElement;
}());
