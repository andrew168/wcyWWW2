/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    'use strict';
    // 用法: 1) 拖入一个按钮可以换皮肤，可以定义新的动作
    //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
    //  Button的状态：
    //     不可见，
    //      可见（执行可见的action），
    //      被按下，执行（被按下的action），
    //     再次转为不可见，          初始化状态

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
        // console.log("stop it : " + video.paused);
    };

    p.play = function() {
        var video = this.displayObj.image;
        if (video.paused) {
            video.play();
        }
        // console.log("play it : " + video.paused);
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
