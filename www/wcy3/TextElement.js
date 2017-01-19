/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function TextElement(level, desc) {
        TQ.Element.call(this, level, desc);
    }

    TextElement.prototype = Object.create(TQ.Element.prototype);
    TextElement.prototype.constructor = TextElement;

    var p = TextElement.prototype = new TQ.Element(null, null);

    p.getColor = function() {
        return this.jsonObj.color;
    };

    p.getText = function() {
        return this.jsonObj.text;
    };

    p.getFontSize = function() {
        return this.jsonObj.fontSize;
    };

    p.isText = function() {
        return true;
    };

    p.setColor = function(fontColor) {
        this.setText(null, null, null, fontColor);
    };

    p.setSize = function(fontSize) {
        this.setText(null, null, fontSize);
    };

    p.setFont = function(fontFamily) {
        this.setText(null, fontFamily);
    };

    p.setText = function (str, fontFamily, fontSize, fontColor) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); //应该是Text元素
        // 此处不用再检验, 因为他不直接对用户, 只要那些直接对用户的函数, 把好关就行.
        // 但是一定要断言, 确信: 外围站岗的尽责了.
        if (this.displayObj != null) {
            var txtObj = this.displayObj;
            if (str) {
                txtObj.text = this.jsonObj.text = str;
            }

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
            txtObj.hitArea = this.createHitArea(txtObj.rotation, txtObj.getMeasuredWidth(), this.getBBoxHeight());

            TQ.DirtyFlag.setElement(this);
        }
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并jsonObj
        if (this.autoFitFlag) {
            this.autoFit();
        }

        var jsonObj = this.jsonObj;
        var txtObj = this.displayObj = new createjs.Text(jsonObj.text, TQ.Utility.toCssFont(jsonObj.fontSize, jsonObj.fontFace), jsonObj.color);
        this.loaded = true;
        if (jsonObj.textAlign == null) {
            txtObj.textAlign = jsonObj.textAlign;
        } else {
            txtObj.textAlign = "left";
        }

        // hitArea 会随宿主物体的变换而变换， 所以，可以重用
        txtObj.hitArea = this.createHitArea(txtObj.rotation, txtObj.getMeasuredWidth(), this.getBBoxHeight());
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.createHitArea = function(rotation, w, h) {
        var shape = new createjs.Shape();
        shape.rotation = rotation;
        shape.graphics.beginFill("#F00").drawRect(0, 0, w , h);
        TQ.DirtyFlag.setElement(this);
        return shape;
    };

    p.getBBoxHeight = function() {
        var factor = 1.4; // the measured height is not exact cover the full font.
        return factor * this.displayObj.getMeasuredHeight();
    };

    p.createHighlighter = function() {
        var txtObj = this.displayObj;
        txtObj.text = this.jsonObj.text;
        this.highter = this.createBBox(txtObj.scaleX, txtObj.scaleY, txtObj.rotation, txtObj.getMeasuredWidth(), this.getBBoxHeight());
        stageContainer.addChild(this.highter);
    };

    p.deleteHighlighter = function() {
        if (!this.highter) {
            return;
        }

        stageContainer.removeChild(this.highter);
        this.highter = null;
    };

    p.parent_fillGap = p.fillGap;
    p.parent_autoFit = p.autoFit;
    p.fillGap = function(desc) {
        if (desc.font) {
            _upgradeFont(desc);
        }
        if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
        if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
        if (!desc.color)  desc.color = TQ.Config.color;
        return this.parent_fillGap(desc);
    };

    p.autoFit = function() {
        TQ.Assert(this.autoFitFlag === TQ.Element.FitFlag.KEEP_SIZE, "text只能是keepSize!");
        TQ.Assert(this.jsonObj.fontSize !== undefined, "必须先定义fontSize！");
        var desc = this.jsonObj;
        desc.sx = 1;
        desc.sy = 1;
        desc.rotation = 0;
        // desc.pivotX = 0.5;
        // desc.pivotY = 0.5;
        var obj_pdc = this.ndc2Pdc(desc);
        if (this.autoFitFlag === TQ.Element.FitFlag.KEEP_SIZE) {
            obj_pdc.sx = 1;
            obj_pdc.sy = 1;
            obj_pdc.fontSIze = desc.fontSize;
        }
        this.scaleTo(obj_pdc);
        this.moveTo(obj_pdc);
    };

    // 样例： <font color="#f74107" size="6" face="隶书">用克隆键</font>
    p.toHtmlStr = function () {
        return '<font color="' + this.jsonObj.color + '" size="' +
            ((this.jsonObj.fontSize - 6) / 5) + '" face="' +
            this.jsonObj.fontFace + '">' +
            this.jsonObj.text + '</font>';
    };

    p.parent_update = p.update;
    p.update = function (t) {
        this.parent_update(t);
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
