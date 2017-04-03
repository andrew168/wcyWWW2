/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function TextElement(level, desc) {
        TQ.Element.call(this, level, desc);
        if (!this.disableBubble && !this.getTextBubble()) {
            // 默认都有bubble， 除非明确取消
            var host = this;

            if (TQ.Config.textBubbleOn) {
                setTimeout(function () { // 用timeout避免超大时间片
                    TQ.TextBubble.attachTo(host);
                });
            }
        }
    }

    TextElement.prototype = Object.create(TQ.Element.prototype);
    TextElement.prototype.constructor = TextElement;

    var p = TextElement.prototype = new TQ.Element(null, null);
    p.parent_detachDecoration = p.detachDecoration;
    p.attachMarker = function () {
        var bubble = this.getTextBubble();
        if (bubble) {
            return bubble.attachAnchorMarker();
        }
    };

    p.detachDecoration = function () {
        var bubble = this.getTextBubble();
        if (bubble) {
            bubble.detachAnchorMarker();
        }
        // return this.parent_detachDecoration();
    };

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

    p.parent_setColor = p.setColor;
    p.setColor = function(fontColor) {
        this.parent_setColor(fontColor);
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
            txtObj.hitArea = this.createHitArea(txtObj.rotation, txtObj.getMeasuredWidth(), this.getHeight());

            TQ.DirtyFlag.setElement(this);
        }
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并jsonObj
        var jsonObj = this.jsonObj;
        var txtObj = this.displayObj = new createjs.Text(jsonObj.text, TQ.Utility.toCssFont(jsonObj.fontSize, jsonObj.fontFace), jsonObj.color);
        this.loaded = true;
        if (jsonObj.textAlign == null) {
            txtObj.textAlign = jsonObj.textAlign;
        } else {
            txtObj.textAlign = "left";
        }

        // hitArea 会随宿主物体的变换而变换， 所以，可以重用
        txtObj.hitArea = this.createHitArea(txtObj.rotation, txtObj.getMeasuredWidth(), this.getHeight());
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.hasBubble = function() {
        return !!this.getTextBubble();
    };

    //p.addBubble = function() {
    //    var bubble;
    //    if (!this.jsonObj.bubble) {
    //        bubble = new TQ.TextBubble(this);
    //    } else {
    //        bubble = new TQ.TextBubble(this.jsobObj.bubble);
    //    }
    //
    //    this.addChildDirect(bubble);
    //};

    p.createHitArea = function(rotation, w, h) {
        var shape = new createjs.Shape();
        shape.rotation = rotation;
        shape.graphics.beginFill("#F00").drawRect(0, 0, w , h);
        TQ.DirtyFlag.setElement(this);
        return shape;
    };

    p.parent_hightlight = p.highlight;
    p.highlight = function (enable) {
        this.parent_hightlight(enable);
        var bubble = this.getTextBubble();
        if (!bubble) {
            return;
        }

        bubble.highlight(enable);
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

    p.onMoveMarker = function(marker, ptWorld) { // keep anchor's position in world
        //ToDo: 文本的pivot 与bubble对不上号
    };

    p.autoFit = function() {
        TQ.Assert(this.autoFitFlag === TQ.Element.FitFlag.KEEP_SIZE, "text只能是keepSize!");
        TQ.Assert(this.jsonObj.fontSize !== undefined, "必须先定义fontSize！");
        var desc = this.jsonObj;
        this.fontScaleOne(desc);
        desc.rotation = 0;
    };

    // 样例： <font color="#f74107" size="6" face="隶书">用克隆键</font>
    p.toHtmlStr = function () {
        return '<font color="' + this.jsonObj.color + '" size="' +
            ((this.jsonObj.fontSize - 6) / 5) + '" face="' +
            this.jsonObj.fontFace + '">' +
            this.jsonObj.text + '</font>';
    };

    p.parent_update = p.update;
    p.update = function (t, noRecording) {
        this.parent_update(t, noRecording);
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

    p.getWidth = function () {
        return this.displayObj.getMeasuredWidth();
    };

    p.getHeight = function () {
        var h = this.displayObj.getMeasuredHeight();
        h = h * 1.8;
        return h;
    };

    TQ.TextElement = TextElement;
}());
