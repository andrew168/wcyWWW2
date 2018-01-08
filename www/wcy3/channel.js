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

    p.record = function (track, t, v, interpolationMethod) {
        assertNotUndefined(TQ.Dictionary.FoundNull, this.tid1);
        assertNotNull(TQ.Dictionary.FoundNull, this.tid1);
        interpolationMethod = (interpolationMethod == null) ? TQ.Channel.LINE_INTERPOLATION : interpolationMethod;
        this.searchInterval(t, this);
        var tid1 = this.tid1;
        var tid2 = this.tid2;

        // 相等的情况, 只修改原来帧的值, 不增加新的帧
        var EPSILON = 0.01;
        var rewrite = false;
        if (track.hasSag) {
            id = 0;
            rewrite = true;
        } else if (Math.abs(t - this.t[tid1]) < EPSILON) {
            id = tid1;
            rewrite = true;
        } else if (Math.abs(t - this.t[tid2]) < EPSILON) {
            id = tid2;
            rewrite = true;
        }

        if (rewrite) {
            this.value[id] = v;
            this.c[id] = interpolationMethod;
            return v;
        }

        // 以下添加新的帧
        var id = tid2;      // 在tid2位置插入: 正好查到区间内 [t1, t, t2]
        if (t >= this.t[tid2]) { // 在末尾插入 [t1, t2, t]
            id = tid2 + 1;
        } else if (t < this.t[tid1]) { // 在前面插入 [t, t1, t2]
            id = tid1;
        }

        // 直接记录, 不优化
        this.t.splice(id, 0, t);
        this.c.splice(id, 0, interpolationMethod);
        this.value.splice(id, 0, v);
        return v;
    };

    p.searchInterval = function (t) {
        assertValid(TQ.Dictionary.INVALID_PARAMETER, this.tid1);  //"有效的数组下标"
        // 处理特殊情况, 只有1帧:
        if (this.t.length <= 1) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.tid1 == 0); //只有1帧
            this.tid1 = this.tid2 = 0;
            return;
        }

        // 确定下边界: t1, 比 t小
        var tid1 = this.tid1;
        if (t < this.t[tid1]) {
            for (; t <= this.t[tid1]; tid1--) {
                if (tid1 <= 0) {
                    tid1 = 0;
                    break;
                }
            }
        }
        var tid2 = TQ.MathExt.range(tid1 + 1, 0, (this.t.length - 1));

        // 确定上边界: t2, 比 t大, 同时,容错, 跳过错误的轨迹数据, 在中间的
        if (t > this.t[tid2]) {  //  1) 下边界太小了, 不是真正的下边界; 2) 在录制时间段之外;
            for (; t > this.t[tid2]; tid2++) {
                if (this.t[tid1] > this.t[tid2]) {
                    //TQ.Log.out("data error, skip t=" + t + " t1=" + this.t[tid1] +" t2 = " + this.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
                }
                if (tid2 >= (this.t.length - 1)) {
                    tid2 = this.t.length - 1;
                    break;
                }
            }
        }

        tid1 = TQ.MathExt.range(tid2 - 1, 0, (this.t.length - 1));
        if (this.t[tid1] > this.t[tid2]) {  // 容错, 发现错误的轨迹数据, 在末尾
            // TQ.Log.out("data error, skip t=" + t + " t1=" + this.t[tid1] +" t2 = " + this.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
            tid2 = tid1;
        }
        this.tid1 = tid1;
        this.tid2 = tid2;
    };

    p.trim = function (t1, t2) {
        if (this.hasSag()) {
            return this.trimSags(t1, t2);
        }

        var id1, id2;
        this.searchInterval(t1);
        id1 = this.tid1;
        this.searchInterval(t2);
        id2 = this.tid2;
        if ((id1 > id2) || (id2 === 0)) {// 空的channel，
            return;
        }

        if (t1 < this.t[id1]) { //左出界
            id1--; // 减1， 确保[0]被cut
        }

        if (this.t[id2] < t2) { //右出界
            var BIG_NUMBER = 65535;// 因为自动拍摄的数据量很大，
            id2 += BIG_NUMBER; // 大的数字， 确保都cut掉
        }
        //要保留tid1, 也要保留tid2，中间的n=tid2- tid1 - 1不保存
        if ((id1+1) < this.t.length) {
            this.t.splice(id1 + 1, id2 - id1 - 1);
            this.value.splice(id1 + 1, id2 - id1 - 1);
            this.c.splice(id1 + 1, id2 - id1 - 1);
        }

        var tArray= this.t,
            dt = t2 - t1;
        for (var i = 0; i < tArray.length; i++) {
            if (tArray[i] > t1 ) {
                tArray[i] -= dt;
            }
        }

        // maintain tid1,tid2
        if (this.t.length <= 1) {
            this.tid1 = this.tid2 = 0;
        }

        if (t1 < 0) {
            t1 = 0;
        }

        this.searchInterval(t1);
    };

    p.trimSags = function (t1, t2) {
        var self = this,
            hasSag = false,
            dt = t2 - t1;
        this.sags.forEach(function (sag) {
            if (sag) {
                if (((sag.t1 < t1) && (t1 < sag.t2)) ||
                    ((sag.t1 < t2) && (t2 < sag.t2))) {
                    self.removeOneCategorySag(sag.categoryID);
                } else {
                    hasSag = true;
                    if (t1 < sag.t1) {
                        sag.t1 -= dt;
                        sag.t2 -= dt;
                    }
                }
            }
        });

        if (!hasSag) {
            delete(this.sags);
        }
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

    p.hasSag = function() {
        return (this.sags && this.sags.length > 0);
    };

    TQ.OneChannel = Channel;
    TQ.Channel = Channel;
})();
