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

    p.setText = function (str, fontFamily, fontSize, fontColor) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); //应该是Text元素
        // 此处不用再检验, 因为他不直接对用户, 只要那些直接对用户的函数, 把好关就行.
        // 但是一定要断言, 确信: 外围站岗的尽责了.
        if (this.displayObj != null) {
            var txtObj = this.displayObj;
            txtObj.text = this.jsonObj.text = str;
            if (fontColor) {
                txtObj.color = this.jsonObj.color = fontColor;
            }
            if (fontSize) {
                this.jsonObj.fontSize = fontSize;
            }
            if (fontFamily){
                this.jsonObj.fontFace = fontFamily;
            }
            txtObj.font = TQ.Utility.toCssFont(this.jsonObj.fontSize, this.jsonObj.fontFace);

            // hitArea 不会根据str内容来更新， 所以：
            txtObj.hitArea = _createHitArea(txtObj.rotation, txtObj.getMeasuredWidth(), txtObj.getMeasuredHeight());
        }
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并jsonObj
        var jsonObj = this.jsonObj;
        var txtObj = new createjs.Text(jsonObj.text, TQ.Utility.toCssFont(jsonObj.fontSize, jsonObj.fontFace), jsonObj.color);
        this.loaded = true;
        if (jsonObj.textAlign == null) {
            txtObj.textAlign = jsonObj.textAlign;
        } else {
            txtObj.textAlign = "left";
        }

        // hitArea 会随宿主物体的变换而变换， 所以，可以重用
        txtObj.hitArea = _createHitArea(txtObj.rotation, txtObj.getMeasuredWidth(), txtObj.getMeasuredHeight());
        this.displayObj = txtObj;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    function _createHitArea(rotation, w, h) {
        var shape = new createjs.Shape();
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
