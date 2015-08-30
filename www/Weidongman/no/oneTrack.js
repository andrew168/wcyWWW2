/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
window.TQ = window.TQ || {};

(function () {
    function OneTrack(value) {
        if ((value == undefined) || (value == null))
        {
            value = 0;
        }

        this.initialize(value);
    }

    var p = OneTrack.prototype;
    p.t = [];
    p.value = [];
    p.c = [];
    p.initialize = function (value) {
        var t = TQ.FrameCounter.t();
        if ((value.value == undefined) || (value.value == null)){
            this.t = [t];  // 只有一帧, 不能搞出来2
            this.value = [value];
            this.c = [1];
        } else {
            this.t = value.t;
            this.value = value.value;
            this.c = value.c;
        }
        this.tid1 = (value.tid1 == undefined) ? 0: value.tid1;
        this.tid2 = (value.tid2 == undefined) ? 0: value.tid2;
    };

    p.erase = function () {
        assertEqualsDelta("t == 0", 0, TQ.FrameCounter.t(), 0.001);
        this.initialize(this.value[0]);  // 简单地丢弃原来的轨迹数组, 重新建立一个新的
    };

    TQ.OneTrack = OneTrack;
})();
