/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    'use strict';
    function VideoElement(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.instance = null;
        this._isNewSkin = false;
        this.state2 = VideoElement.INVISIBLE;
        this.initialize(jsonObj);
    }

    var p = VideoElement.prototype = new TQ.Element(null, null);

    p.getImageResource = function(item, jsonObj) {
        return _createVideoElement(jsonObj.src);
    };

    p._parent_doShow = p.doShow;
    p.doShow = function(isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible && TQ.FrameCounter.isPlaying()) {
            this.play();
        } else {
            this.stop();
        }
    };

    p.stop = function() {
        var video = this.displayObj.image;
        if (!video.paused) {
            // video.currentTime = 0;  //  可以回到 头部
            video.pause();
        }
        // TQ.Log.debugInfo("stop it : " + video.paused);
    };

    p.play = function() {
        var video = this.displayObj.image;
        if (video.paused) {
            video.play();
        }
        // TQ.Log.debugInfo("play it : " + video.paused);
    };

    var _createVideoElement = function(src) {
        var __video = document.createElement('video');
        __video.src = TQ.ResourceManager.toFullPath(src);
        __video.autoplay = false;
        // __video.controls = true;
        __video.setAttribute("controls", "false");
        return __video;
    };

    TQ.VideoElement = VideoElement;
}());
