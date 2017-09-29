/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
window.TQ = window.TQ || {};

(function () {
    function Channel(value, interpolationStyle) {
        if ((value == undefined) || (value == null))
        {
            value = 0;
        }

        if (interpolationStyle === undefined) {
            interpolationStyle = TQ.Channel.LINE_INTERPOLATION;
        }

        this.initialize(value, interpolationStyle);
    }

    Channel.LINE_INTERPOLATION = 1;
    Channel.JUMP_INTERPOLATION = 0;

    var p = Channel.prototype;
    p.t = [];
    p.value = [];
    p.c = [];
    p.initialize = function (value, interpolationStyle) {
        if ((value.value == undefined) || (value.value == null)){
            var t = (TQ.Config.insertAtT0On? 0: TQ.FrameCounter.t());
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

        this.tid1 = 0; // 这是2个临时变量，现在是fixedUp阶段，不需要恢复存盘前的 tid1、2,
        this.tid2 = 0;
    };

    p.erase = function () {
        assertEqualsDelta("t == 0, //ToDo:这是不是错误的限制？", 0, TQ.FrameCounter.t(), 0.001);
        this.initialize(this.value[0]);  // 简单地丢弃原来的轨迹数组, 重新建立一个新的
    };

    p.reset = function() {
        this.t = [this.t[0]];  // 只有一帧, 不能搞出来2
        this.value = [this.value[0]];
        this.c = [1];
        this.tid1 = 0;
        this.tid2 = 0;
    };

    p.removeOneCategorySag = function(categoryID)
    {
        if (!this.sags || this.sags.length <=0) {
            return;
        }

        var n = this.sags.length,
            i;
        for (i = 0; i < n; i++) {
            var item = this.sags[i];
            if (!item) {
                continue;
            }

            if (item.categoryID === categoryID) {
                return this.sags.splice(i, 1);
            }
        }
    };

    p.calculateLastFrame = function() {
        var tMax = 0,
            tInMax = 0,
            tOutMax = 0;
        if (this.sags) {
            this.sags.forEach(function (sag) {
                if (sag) {
                    switch (sag.categoryID) {
                        case TQ.AnimationManager.SagCategory.IN:
                            tInMax = Math.max(sag.t2);
                            break;
                        case TQ.AnimationManager.SagCategory.IDLE:
                            // ToDo: idle时间是弹性的， = 总时间 - 入场时间 - 离场时间
                            break;
                        case TQ.AnimationManager.SagCategory.OUT:
                            // ToDo: 计算离场时间
                            break;
                        default :
                            break;
                    }
                }
            });

            tMax = tInMax + tOutMax;
            return tMax;
        }

        if (!this.t) {
            return tMax;
        }
        var num = this.t.length;
        tMax = this.t[0];
        if (num > 1) { // 数据合理性检查
            for (var i = 1; i < num; i++) {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, tMax <= this.t[i]);
                tMax = Math.max(tMax, this.t[i]);
            }
        }

        tMax = this.t[num - 1];
        return tMax;
    };

    p.setIdleSagT1 = function (t1) {
        if (!this.sags || this.sags.length <= 0) {
            return;
        }

        var idleSag = this.sags[TQ.AnimationManager.SagCategory.IDLE];
        if (idleSag) {
            idleSag.t1 = t1;
        }
    };

    p.getInSag = function() {
        return (this.sags && this.sags[TQ.AnimationManager.SagCategory.IN]) ?
            this.sags[TQ.AnimationManager.SagCategory.IN] : null;
    };

    p.getInSagType = function () {
        var sag = this.getInSag();
        return (sag) ? sag.typeID : null;
    };

    TQ.OneChannel = Channel;
    TQ.Channel = Channel;
})();
