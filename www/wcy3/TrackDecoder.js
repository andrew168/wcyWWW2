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
    TrackDecoder.LINE_INTERPOLATION = 1;
    TrackDecoder.JUMP_INTERPOLATION = 0;
    /*  animeTrack(Object coordinate) ==> World coordinate
     *  插值t时刻的轨迹，并保存到时间坐标系（jsonObj）之中，供绘制
     *  animeTrack: 保存关节点的运动数据，是在父物体坐标系下， 而且是经过关节点改进的父物体坐标系）。
     *  jsonObj 是世界坐标系下的绝对运动数据，（可以直接送给绘图设备变换系统）
     *
     */
    TrackDecoder.calculate = function (track, jsonObj, t) {
        // 计算本物体坐标系下的值
        TQ.Pose.rotation = ((track.rotation == undefined) || (track.rotation == null)) ?
            TQ.poseDefault.rotation : TrackDecoder.calOneTrack(track.rotation, t);

        TQ.Pose.x = ((track.x == undefined) || (track.x == null)) ?
            TQ.poseDefault.x : TrackDecoder.calOneTrack(track.x, t);

        TQ.Pose.y = ((track.y == undefined) || (track.y == null)) ?
            TQ.poseDefault.y : TrackDecoder.calOneTrack(track.y, t);

        TQ.Pose.sx = ((track.sx == undefined) || (track.sx == null)) ?
            TQ.poseDefault.sx : TrackDecoder.calOneTrack(track.sx, t);

        TQ.Pose.sy = ((track.sy == undefined) || (track.sy == null)) ?
            TQ.poseDefault.sy : TrackDecoder.calOneTrack(track.sy, t);

        TQ.Pose.visible = ((track.visible == undefined) || (track.visible == null)) ?
            TQ.poseDefault.visible : TrackDecoder.calOneTrack(track.visible, t);
    };

    TrackDecoder.calOneTrack = function (track, t) {
        TrackDecoder.searchInterval(t, track);
        if (track.tid1 == track.tid2) {
            // assertTrue("只有1帧或者时间出现负增长, ",track.tid1 == 0 );
            // track.tid1 = 0;
            return track.value[track.tid1];
        }
        var t1 = track.t[track.tid1];
        var t2 = track.t[track.tid2];
        var v1 = track.value[track.tid1];
        var v2 = track.value[track.tid2];
        var v = v1; //不插补， 脉冲替换, 适用于 正向播放， 不是倒放

        if (t1 > t2) {  // 容错, 发现错误的轨迹数据
            TQ.Log.out("Data Error, Skip t=" + t + " t1=" + t1 +" t2 = " + t2 +" id1=" +track.tid1 + " tid2=" + track.tid2);
            return v1;
        }

        if (t <= t1) {  // 下超界
            v = v1;
        } else if (t >= t2) { //  上超界，
            v = v2;
        } else {
            if (track.c[track.tid2] == TrackDecoder.LINE_INTERPOLATION) { // 0： interpolation
                v = ((t - t1) * (v1 - v2) / (t1 - t2)) + v1;
            } else {
                v = v1;
            }
        }
        return v;
    };

    TrackDecoder.searchInterval = function(t, track)
    {
        assertValid(TQ.Dictionary.INVALID_PARAMETER, track.tid1);  //"有效的数组下标"
        // 处理特殊情况, 只有1帧:
        if (track.t.length<=1) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, track.tid1 == 0 ); //只有1帧
            track.tid1 = track.tid2 = 0;
            return;
        }

        // 确定下边界: t1, 比 t小
        var tid1 = track.tid1;
        if (t < track.t[tid1]) {
            for (; t <= track.t[tid1]; tid1--) {
                if (tid1 <= 0) {
                    tid1 = 0;
                    break;
                }
            }
        }
        var tid2 = TQ.MathExt.range(tid1 + 1, 0, (track.t.length -1));

        // 确定上边界: t2, 比 t大, 同时,容错, 跳过错误的轨迹数据, 在中间的
        if ( t > track.t[tid2]) {  //  1) 下边界太小了, 不是真正的下边界; 2) 在录制时间段之外;
            for (; t > track.t[tid2]; tid2++) {
                if ( track.t[tid1] >  track.t[tid2]) {
                    //TQ.Log.out("data error, skip t=" + t + " t1=" + track.t[tid1] +" t2 = " + track.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
                }
                if (tid2 >= (track.t.length -1)) {
                    tid2 = track.t.length -1;
                    break;
                }
            }
        }

        tid1 = TQ.MathExt.range(tid2 - 1, 0, (track.t.length -1));
        if (track.t[tid1] > track.t[tid2]) {  // 容错, 发现错误的轨迹数据, 在末尾
            // TQ.Log.out("data error, skip t=" + t + " t1=" + track.t[tid1] +" t2 = " + track.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
            tid2 = tid1;
        }
        track.tid1 = tid1;
        track.tid2 = tid2;
    };

    TrackDecoder.calculateLastFrame = function(track) {
        var tMax = 0;
        if ( (!track) || (!track.t)) {return tMax;}
        var num = track.t.length;
		tMax = track.t[0];
        if (num > 1) { // 数据合理性检查
            for (var i = 1; i < num; i++) {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, tMax <= track.t[i]);
                tMax = Math.max(tMax, track.t[i]);
            }
        }

        tMax = track.t[num - 1];
        return tMax;
    };
    TQ.TrackDecoder = TrackDecoder;
}());