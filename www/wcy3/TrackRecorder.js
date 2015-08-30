/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  记录每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function TrackRecorder()
    {

    }
    TrackRecorder.style = TQ.TrackDecoder.LINE_INTERPOLATION;
    TrackRecorder.initialize = function () {};

    // 参见: Decorder的说明
    TrackRecorder.record = function (element, t) {
        var track = element.animeTrack;
        var jsonObj = element.jsonObj;
        // TQ.Pose 中已经是物体空间的值(在Update中调用的), 如果是成组的或者Bone运动,则是父物体坐标系下的值.
        // ToDo: 2 记录单个的操作, 而不是每次都记录所有的轨道

        // 记录本物体坐标系下的值
        if ((track == undefined) || (track == null)) {
            // 第一次动画记录, 需要先初始化动画轨迹
            track = element.animeTrack = new TQ.AnimeTrack(jsonObj);
            assertNotUndefined(TQ.Dictionary.FoundNull, track);
        }
        if ((track.rotation == undefined) || (track.rotation == null)) {
            assertNotUndefined(TQ.Dictionary.FoundNull, track.tid1);
        }

        if ((track.rotation == undefined) || (track.rotation == null)) {
            track.rotation =new TQ.OneTrack(TQ.Pose.rotation);
        } else {
            if (element.hasFlag(TQ.Element.ROTATING)) {
                TrackRecorder.recordOneTrack(track.rotation, t, TQ.Pose.rotation, TrackRecorder.style);
            }
        }

        if ((track.x == undefined) || (track.x == null)) {
            new TQ.OneTrack(TQ.Pose.x);
        } else {
            if (element.hasFlag(TQ.Element.TRANSLATING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.x, t, TQ.Pose.x, TrackRecorder.style);
                }
            }
        }

        if  ((track.y == undefined) || (track.y == null)) {
            new TQ.OneTrack(TQ.Pose.y);
        } else {
            if (element.hasFlag(TQ.Element.TRANSLATING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.y, t, TQ.Pose.y, TrackRecorder.style);
                }
            }
        }

        if ((track.sx == undefined) || (track.sx == null)) {
            track.sx =  new TQ.OneTrack(TQ.Pose.sx);
        } else {
            if (element.hasFlag(TQ.Element.SCALING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.sx, t, TQ.Pose.sx, TrackRecorder.style);
                }
            }
        }

        if ((track.sy == undefined) || (track.sy == null)) {
            track.sy =  new TQ.OneTrack(TQ.Pose.sy);
        } else {
            if (element.hasFlag(TQ.Element.SCALING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.sy, t, TQ.Pose.sy, TrackRecorder.style);
                }
            }
        }

        if ((track.visible == undefined) || (track.visible == null)) {
            track.visible =  new TQ.OneTrack(TQ.Pose.visible);
        } else {
            if (element.hasFlag(TQ.Element.VISIBLE_CHANGED)) { // 允许改变关节物体各个关节的可见性
                TrackRecorder.recordOneTrack(track.visible, t, TQ.Pose.visible, TQ.TrackDecoder.JUMP_INTERPOLATION);
                element.clearFlag(TQ.Element.VISIBLE_CHANGED);
            }
        }

        element.clearFlag(TQ.Element.TRANSLATING | TQ.Element.ROTATING | TQ.Element.SCALING
            | TQ.Element.ALPHAING | TQ.Element.ZING | TQ.Element.VISIBLE_CHANGED);
    };

    TrackRecorder.erase = function (element) {
        element.animeTrack.erase();
    };

    TrackRecorder.recordOneTrack = function (track, t, v, interpolationMethod) {
        assertNotNull(TQ.Dictionary.FoundNull, track);
        assertNotUndefined(TQ.Dictionary.FoundNull, track.tid1);
        assertNotNull(TQ.Dictionary.FoundNull,track.tid1);
        interpolationMethod = (interpolationMethod==null)? TQ.TrackDecoder.LINE_INTERPOLATION : interpolationMethod;
        TQ.TrackDecoder.searchInterval(t, track);
        var tid1 = track.tid1;
        var tid2 = track.tid2;

        // 相等的情况, 只修改原来帧的值, 不增加新的帧
        var EPSILON = 0.01;
        var rewrite = false;
        if ( Math.abs(t - track.t[tid1]) < EPSILON ) {
            id = tid1;
            rewrite = true;
        } else if ( Math.abs(t - track.t[tid2]) < EPSILON ) {
            id = tid2;
            rewrite = true;
        }

        if (rewrite) {
            track.value[id] = v;
            track.c[id] = interpolationMethod;
            return v;
        }

		    // 以下添加新的帧
        var id = tid2;      // 在tid2位置插入: 正好查到区间内 [t1, t, t2]
        if (t >= track.t[tid2]) { // 在末尾插入 [t1, t2, t]
            id = tid2+1;
        } else if (t < track.t[tid1]) { // 在前面插入 [t, t1, t2]
            id = tid1;
        }

        // 直接记录, 不优化
        track.t.splice(id, 0, t);
        track.c.splice(id, 0, interpolationMethod);
        track.value.splice(id, 0, v);
        return v;
    };

    TQ.TrackRecorder = TrackRecorder;
}());