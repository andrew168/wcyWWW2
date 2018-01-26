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

    TrackRecorder.style = TQ.Channel.LINE_INTERPOLATION;
    TrackRecorder.initialize = function () {};

    // 参见: Decorder的说明
    TrackRecorder.record = function (element, t) {
        t = TQ.FrameCounter.gridSnap(t);
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
            track.rotation.record(track, t, TQ.Pose.rotation, TrackRecorder.style);
        }

        if (element.hasFlag(TQ.Element.TRANSLATING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                track.x.record(track, t, TQ.Pose.x, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.TRANSLATING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                track.y.record(track, t, TQ.Pose.y, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.SCALING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                track.sx.record(track, t, TQ.Pose.sx, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.SCALING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                track.sy.record(track, t, TQ.Pose.sy, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.VISIBLE_CHANGED)) { // 允许改变关节物体各个关节的可见性
            track.visible.record(track, t, TQ.Pose.visible, TQ.Channel.JUMP_INTERPOLATION);
            element.clearFlag(TQ.Element.VISIBLE_CHANGED);
        }

        if (element.hasFlag(TQ.Element.ALPHAING)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                track.alpha.record(track, t, TQ.Pose.alpha, TrackRecorder.style);
            }
        }

        if (element.hasFlag(TQ.Element.COLOR_CHANGED)) {
            if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                track.colorR.record(track, t, TQ.Utility.getColorR(TQ.Pose.color), TrackRecorder.style);
                track.colorG.record(track, t, TQ.Utility.getColorG(TQ.Pose.color), TrackRecorder.style);
                track.colorB.record(track, t, TQ.Utility.getColorB(TQ.Pose.color), TrackRecorder.style);
            }
        }

        if ((track.x.t.length > TQ.Config.MAX_KEYFRAME)  ||
            (track.y.t.length > TQ.Config.MAX_KEYFRAME) ||
            (track.sx.t.length > TQ.Config.MAX_KEYFRAME) ||
            (track.sy.t.length > TQ.Config.MAX_KEYFRAME) ||
            (track.rotation.t.length > TQ.Config.MAX_KEYFRAME) ||
            (track.alpha.t.length > TQ.Config.MAX_KEYFRAME) ||
            (track.colorR.t.length > TQ.Config.MAX_KEYFRAME)) {
            TQ.MessageBox.toast(TQ.Locale.getStr('the animation of this element is out of limit!'));
        }

        element.clearFlag(TQ.Element.TRANSLATING | TQ.Element.ROTATING | TQ.Element.SCALING
            | TQ.Element.ALPHAING | TQ.Element.ZING | TQ.Element.VISIBLE_CHANGED | TQ.Element.COLOR_CHANGED);
    };

    // 参见: Decorder的说明
    TrackRecorder.recordSag = function (element, sags) {
        var track = element.animeTrack;
        TQ.AssertExt.invalidLogic(!!(track && track.x && track.y && track.sx && track.sy && track.rotation), "新case， 未赋值");
        var SagType = TQ.AnimationManager.SagType,
            sag =sags[0],
            sag2= (sags.length >= 2) ? sags[1] : sag;

        switch (sag.typeID) {
            case SagType.FADE_IN:
            case SagType.FADE_OUT:
                recordOneSag(track.alpha, sag);
                break;

            case SagType.SCALE_IN:
            case SagType.SCALE_OUT:
                recordOneSag(track.sx, sag);
                recordOneSag(track.sy, sag2);
                break;

            case SagType.ROTATE:
                recordOneSag(track.rotation, sag);
                break;
            case SagType.LEFT_IN:
            case SagType.LEFT_OUT:
            case SagType.RIGHT_IN:
            case SagType.RIGHT_OUT:
                recordOneSag(track.x, sag);
                break;

            case SagType.TOP_IN:
            case SagType.TOP_OUT:
            case SagType.BOTTOM_IN:
            case SagType.BOTTOM_OUT:
                recordOneSag(track.y, sag);
                break;

            case SagType.TWINKLE:
                recordOneSag(track.visible, sag);
                break;
            default:
                break;
        }

        switch (sag.categoryID) {
            case TQ.AnimationManager.IN:
                track.inSagType = sag.type;
                break;
            case TQ.AnimationManager.IDLE:
                track.idleSagType = sag.type;
                break;
            case TQ.AnimationManager.OUT:
            default :
                track.outSagType = sag.type;
        }

        track.hasSag = true;
        adjustIdleSagTime(track);
    };

    function adjustIdleSagTime(track) {
        var inSag = track.getInSag(),
            tInSagEnd = inSag ? inSag.t2 : 0;
        track.forEachChannel(function (channel) {
            channel.setIdleSagT1(tInSagEnd);
        });
    }

    TrackRecorder.removeSag = function (element, sag) {
        var track = element.animeTrack;
        var SagType = TQ.AnimationManager.SagType,
            sagTypeId = sag.typeID,
            SagCategoryID = sag.categoryID;
        switch (sagTypeId) {
            case SagType.FADE_IN:
            case SagType.FADE_OUT:
                track.alpha.removeOneSag(SagCategoryID, sagTypeId);
                break;

            case SagType.SCALE_IN:
            case SagType.SCALE_OUT:
                track.sx.removeOneSag(SagCategoryID, sagTypeId);
                track.sy.removeOneSag(SagCategoryID, sagTypeId);
                break;

            case SagType.ROTATE:
                track.rotation.removeOneSag(SagCategoryID, sagTypeId);
                break;
            case SagType.LEFT_IN:
            case SagType.LEFT_OUT:
            case SagType.RIGHT_IN:
            case SagType.RIGHT_OUT:
                track.x.removeOneSag(SagCategoryID, sagTypeId);
                break;

            case SagType.TOP_IN:
            case SagType.TOP_OUT:
            case SagType.BOTTOM_IN:
            case SagType.BOTTOM_OUT:
                track.y.removeOneSag(SagCategoryID, sagTypeId);
                break;

            case SagType.TWINKLE:
                track.visible.removeOneSag(SagCategoryID, sagTypeId);
                break;
            default:
                break;
        }

        track.updateSagFlag();
    };

    TrackRecorder.getSag = function (element, sagTypeId) {
        var track = element.animeTrack,
            SagType = TQ.AnimationManager.SagType;
        if (!track) { //新添加的物体， 可能短时间没有track，
            return null;
        }

        switch (sagTypeId) {
            case SagType.FADE_IN:
            case SagType.FADE_OUT:
                return getOneSag(track.alpha, sagTypeId);

            case SagType.SCALE_IN:
            case SagType.SCALE_OUT:
                return getOneSag(track.sx, sagTypeId);

            case SagType.ROTATE:
                return getOneSag(track.rotation, sagTypeId);
            case SagType.LEFT_IN:
            case SagType.LEFT_OUT:
            case SagType.RIGHT_IN:
            case SagType.RIGHT_OUT:
                return getOneSag(track.x, sagTypeId);

            case SagType.TOP_IN:
            case SagType.TOP_OUT:
            case SagType.BOTTOM_IN:
            case SagType.BOTTOM_OUT:
                return getOneSag(track.y, sagTypeId);

            case SagType.TWINKLE:
                return getOneSag(track.visible, sagTypeId);
            default:
                TQ.Log.debugInfo("unknown case");
                break;
        }
    };

    TrackRecorder.recordOneChannel = function (track, channel, t, v, interpolationMethod) {
        assertDepreciated(TQ.Dictionary.isDepreciated + "， 移到了channel类中的record！");
        assertNotNull(TQ.Dictionary.FoundNull, channel);
        assertNotUndefined(TQ.Dictionary.FoundNull, channel.tid1);
        assertNotNull(TQ.Dictionary.FoundNull,channel.tid1);
        return channel.record(track, t, v, interpolationMethod);
    };

    function removeAllSags(element) {
        var track = element.animeTrack;
        track.alpha.sags = null;
        track.x.sags = null;
        track.y.sags = null;
        track.sx.sags = null;
        track.sy.sags = null;
        track.rotation.sags = null;
        track.visible.sags = null;
    }

    function getOneSag(track, sagTypeId) {
        if (!track.sags) {
            return false;
        }

        var sags = track.sags,
            n = sags.length,
            i;
        for (i = 0; i < n; i++) {
            var item = sags[i];
            if (!item ) {
                continue;
            }

            if (item.typeID === sagTypeId) {
                return item;
            }
        }
        return false;
    }

    function recordOneSag(channel, sag) {
        // 相等的情况, 不修改原来帧的值, 只增加新的帧， 确保t只是增加的
        if (!channel.sags) {
            channel.sags = [];
        }

        channel.sags[sag.categoryID] = sag; // ToDo: 仅支持1个入场，1个出场动画，1个idle

        // track.sags.sort(compareSag);
    }

    function compareSag(sag1, sag2) {
        if (sag1.t1 > sag2.t1) {
            return 1;
        } else if (sag1.t1 < sag2.t1) {
            return -1;
        }
        return 0;
    }

    function trimOneChannel(channel, t) {
        // 处理特殊情况, 只有1帧:
        if (channel.t.length <= 1) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, channel.tid1 == 0); //只有1帧
            channel.tid1 = channel.tid2 = 0;
            return;
        }

        // 确定下边界: t1, 比 t小
        var tid1 = channel.t.length - 1;
        for (; t <= channel.t[tid1]; tid1--) {
            if (tid1 <= 0) {
                tid1 = 0;
                break;
            }
        }

        channel.value[tid1] = TQ.TrackDecoder.calOneChannel(null, channel, t);
        channel.t[tid1] = (TQ.Config.insertAtT0On ? 0 : t);
        channel.t = channel.t.splice(tid1, 1);
        channel.value = channel.value.splice(tid1, 1);
        channel.c = channel.c.splice(tid1, 1);
        channel.tid1 = channel.tid2 = 0;
    }

    TrackRecorder.removeAllSags = removeAllSags;
    TQ.TrackRecorder = TrackRecorder;
}());
