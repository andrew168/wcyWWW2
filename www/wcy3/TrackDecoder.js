/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  解释动画轨迹的数据， 计算每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function TrackDecoder()
    {

    }

    /*  animeTrack(Object coordinate) ==> World coordinate
     *  插值t时刻的轨迹，并保存到时间坐标系（jsonObj）之中，供绘制
     *  animeTrack: 保存关节点的运动数据，是在父物体坐标系下， 而且是经过关节点改进的父物体坐标系）。
     *  jsonObj 是世界坐标系下的绝对运动数据，（可以直接送给绘图设备变换系统）
     *
     */
    //ToDo: 是否 参数 JSONObj可以省略？
    TrackDecoder.calculate = function (ele, t) {
        var track = ele.animeTrack,
            tsrObj = TQ.Pose;
        // 计算本物体坐标系下的值
        tsrObj.rotation = ((track.rotation == undefined) || (track.rotation == null)) ?
            TQ.poseDefault.rotation : TrackDecoder.calOneChannel(track, track.rotation, t);

        tsrObj.x = (!track.x) ?
            TQ.poseDefault.x : TrackDecoder.calOneChannel(track, track.x, t);
        TQ.Assert.isTrue(!isNaN(tsrObj.x),  "x 为 NaN！！！");

        tsrObj.y = (!track.y) ?
            TQ.poseDefault.y : TrackDecoder.calOneChannel(track, track.y, t);
        TQ.Assert.isTrue(!isNaN(tsrObj.y),  "y 为 NaN！！！");

        tsrObj.sx = (!track.sx) ?
            TQ.poseDefault.sx : TrackDecoder.calOneChannel(track, track.sx, t);

        tsrObj.sy = (!track.sy) ?
            TQ.poseDefault.sy : TrackDecoder.calOneChannel(track, track.sy, t);

        tsrObj.visible = (!track.visible) ?
            TQ.poseDefault.visible : TrackDecoder.calOneChannel(track, track.visible, t);

        tsrObj.alpha = (!track.alpha) ?
            TQ.poseDefault.alpha : TrackDecoder.calOneChannel(track, track.alpha, t);

        var colorR = (!track.colorR) ?
            TQ.Utility.getColorR(TQ.poseDefault.color) : TrackDecoder.calOneChannel(track, track.colorR, t),

            colorG = (!track.colorG) ?
            TQ.Utility.getColorG(TQ.poseDefault.color) : TrackDecoder.calOneChannel(track, track.colorG, t),

            colorB = (!track.colorB) ?
            TQ.Utility.getColorB(TQ.poseDefault.color) : TrackDecoder.calOneChannel(track, track.colorB, t);

        tsrObj.color = TQ.Utility.RGB2Color(Math.round(colorR), Math.round(colorG), Math.round(colorB));

        TQ.Log.tsrDebugInfo("TSR in Object " + ele.jsonObj.type + ele.id, tsrObj);
    };

    TrackDecoder.calOneChannel = function (trackTBD, channel, t) {
        // ToDo: 在Sag控制的时间段，用SAG， 否则用普通的
        // * FlyIn: t < te;
        // * FlyOut: ts < t
        var sag = findSag(channel, t);
        if (sag) {
            return calSag(sag, channel, t);
        }

        // ToDo: 没有track， 只有sag， 以sag的末尾状态保持下去
        // 在Sag结束的时候， 更新track， 以保存以sag的末尾状态保持下去
        return calTrack(channel, t);
    };

    function findSag(channel, t) {
        if (!channel.hasSag()) {
            return null;
        }

        var SagCategory = TQ.AnimationManager.SagCategory,
            n = channel.sags.length,
            i,
            item,
            lastSag = null;
        for (i = 0; i < n; i++) {
            item = channel.sags[i];
            if (!item) {
                continue;
            }
            switch (item.categoryID) {
                case SagCategory.IN:
                    if ((t < item.t2)) {
                        return item;
                    }
                    break;
                case SagCategory.OUT:
                    if (item.t1 < t) {
                        return item;
                    }
                    break;
                default:
                    if ((item.t1 <= t) && (t <= item.t2)) { // idle SAG
                        return item;
                    }
            }
        }
        return lastSag;
    }

    function calSag(sag, channel, t) {
        if (sag.typeID === TQ.AnimationManager.SagType.TWINKLE) {
            return calVisible(sag, channel, t);
        }

        // 通用于各个SAG， x,y,z,   scale, rotation, alpha, etc
        var dampingT0 = TQ.SpringEffect.getDampingT0(sag),
            deltaY = 0;
        if (t > dampingT0) { // 对于SAG结束后的状态， 保留SAG最后一刻的值
            if (t < sag.t2) {
                deltaY = TQ.SpringEffect.cal(sag, t - dampingT0);
            }
            t = dampingT0;
        } else if (t < sag.t1) {
            t = sag.t1;
        }
        return sag.value0 + (t - sag.t1) * sag.actualSpeed + deltaY;
    }

    function calVisible(sag, channel, t) {
        var T = sag.hideT + sag.showT,
            cycleNumber = Math.floor((t - sag.t1) / T),
            thisCycle = t - sag.t1 - T * cycleNumber;
        if (thisCycle < sag.hideT) {
            return 0;
        }
        return 1;
    }

    function calTrack(channel, t)
    {
        channel.searchInterval(t);
        if (channel.hasSag()) {
            return channel.value[0];
        } else if (channel.tid1 == channel.tid2) {
            return channel.value[channel.tid1];
        }
        var t1 = channel.t[channel.tid1];
        var t2 = channel.t[channel.tid2];
        var v1 = channel.value[channel.tid1];
        var v2 = channel.value[channel.tid2];
        var v = v1; //不插补， 脉冲替换, 适用于 正向播放， 不是倒放

        if (t1 > t2) {  // 容错, 发现错误的轨迹数据
            TQ.Log.out("Data Error, Skip t=" + t + " t1=" + t1 +" t2 = " + t2 +" id1=" +channel.tid1 + " tid2=" + channel.tid2);
            return v1;
        }

        if (t <= t1) {  // 下超界
            v = v1;
        } else if (t >= t2) { //  上超界，
            v = v2;
        } else {
            if (channel.c[channel.tid2] == TQ.Channel.LINE_INTERPOLATION) { // 0： interpolation
                v = ((t - t1) * (v1 - v2) / (t1 - t2)) + v1;
            } else {
                v = v1;
            }
        }
        return v;
    }

    TQ.TrackDecoder = TrackDecoder;
}());
