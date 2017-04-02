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
        if (!track) {
            // 第一次动画记录, 需要先初始化动画轨迹
            track = element.animeTrack = new TQ.AnimeTrack(jsonObj);
            assertNotUndefined(TQ.Dictionary.FoundNull, track);
        }

        TQ.AssertExt.invalidLogic(!!(track.x && track.y && track.sx && track.sy && track.rotation), "新case， 未赋值");
        if (element.hasFlag(TQ.Element.ROTATING)) {
            TrackRecorder.recordOneTrack(track.rotation, t, TQ.Pose.rotation, TrackRecorder.style);
        }

        if (element.hasFlag(TQ.Element.TRANSLATING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                TrackRecorder.recordOneTrack(track.x, t, TQ.Pose.x, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.TRANSLATING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                TrackRecorder.recordOneTrack(track.y, t, TQ.Pose.y, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.SCALING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                TrackRecorder.recordOneTrack(track.sx, t, TQ.Pose.sx, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.SCALING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                TrackRecorder.recordOneTrack(track.sy, t, TQ.Pose.sy, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.VISIBLE_CHANGED)) { // 允许改变关节物体各个关节的可见性
            TrackRecorder.recordOneTrack(track.visible, t, TQ.Pose.visible, TQ.TrackDecoder.JUMP_INTERPOLATION);
            element.clearFlag(TQ.Element.VISIBLE_CHANGED);
        }

        element.clearFlag(TQ.Element.TRANSLATING | TQ.Element.ROTATING | TQ.Element.SCALING
            | TQ.Element.ALPHAING | TQ.Element.ZING | TQ.Element.VISIBLE_CHANGED);
    };

    // 参见: Decorder的说明
    TrackRecorder.recordSag = function (element, sag) {
        var track = element.animeTrack;
        TQ.AssertExt.invalidLogic(!!(track && track.x && track.y && track.sx && track.sy && track.rotation), "新case， 未赋值");
        var SagType = TQ.AnimationManager.SagType;
        switch (sag.typeID) {
            case SagType.ROTATE:
                recordOneSag(track.rotation, sag);
                break;
            case SagType.TWINKLE:
                break;
            default:
                break;
        }
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

    function recordOneSag(track, sag) {
        // 相等的情况, 不修改原来帧的值, 只增加新的帧， 确保t只是增加的
        if (!track.sag) {
            track.sag = [];
        }

        track.sag.push(sag);
        track.sag.sort(compareSag);
    }

    function compareSag(sag1, sag2) {
        if (sag1.t1 > sag2.t1) {
            return 1;
        } else if (sag1.t1 < sag2.t1) {
            return -1;
        }
        return 0;
    }

    TQ.TrackRecorder = TrackRecorder;
}());
