/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
window.TQ = window.TQ || {};

(function () {
    function OneChannel(value, interpolationStyle) {
        if ((value == undefined) || (value == null))
        {
            value = 0;
        }

        if (interpolationStyle === undefined) {
            interpolationStyle = TQ.TrackDecoder.LINE_INTERPOLATION;
        }

        this.initialize(value, interpolationStyle);
    }

    var p = OneChannel.prototype;
    p.t = [];
    p.value = [];
    p.c = [];
    p.initialize = function (value, interpolationStyle) {
        var t = TQ.FrameCounter.t();
        if ((value.value == undefined) || (value.value == null)){
            this.t = [t];  // 只有一帧, 不能搞出来2
            this.value = [value];
            this.c = [interpolationStyle];
        } else {
            this.t = value.t;
            this.value = value.value;
            this.c = value.c;
            if (value.sags) {
                this.sags = value.sags;
            }
        }
        this.tid1 = (value.tid1 == undefined) ? 0: value.tid1;
        this.tid2 = (value.tid2 == undefined) ? 0: value.tid2;
    };

    p.erase = function () {
        assertEqualsDelta("t == 0", 0, TQ.FrameCounter.t(), 0.001);
        this.initialize(this.value[0]);  // 简单地丢弃原来的轨迹数组, 重新建立一个新的
    };

    p.reset = function() {
        this.t = [this.t[0]];  // 只有一帧, 不能搞出来2
        this.value = [this.value[0]];
        this.c = [1];
        this.tid1 = 0;
        this.tid2 = 0;
    };

    TQ.OneChannel = OneChannel;
})();
