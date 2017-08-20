/**
 * Created by Andrewz on 3/28/2017.
 * SAG: Simple Animation Generator
 */
var TQ = TQ || {};
TQ.AnimationManager = (function () {
    'use strict';
    var UNLIMIT = 99999999,
        FLY_IN_POS_0 = -100, // 从屏幕外开始
        FLY_OUT_POS_1 = -100, // 到屏幕外结束
        DEFAULT_DELAY = 0,
        DEFAULT_DURATION = 16; //frames

    var SagCategory = {
            IN: 1,
            IDLE: 2,
            OUT: 3
        },

        SagType = {
            // translate
            RIGHT_IN: 'sag right in',
            LEFT_IN: 'sag left in',
            BOTTOM_IN: 'sag bottom in',
            TOP_IN: 'sag top in',

            RIGHT_OUT: 'sag right out',
            LEFT_OUT: 'sag left out',
            BOTTOM_OUT: 'sag bottom out',
            TOP_OUT: 'sag top out',

            SCALE_IN: 'sag scale in',
            SCALE_OUT: 'sag scale out',

            ROTATE: 'sag rotate',
            TWINKLE: 'sag twinkle',

            // opacity change
            FADE_IN: 'sag fade in',
            FADE_OUT: 'sag fade out'
        };

    var removeSag = TQ.TrackRecorder.removeSag,
        getSag = TQ.TrackRecorder.getSag,
        state = {
            delay: DEFAULT_DELAY,
            duration: DEFAULT_DURATION,
            leftIn: false,
            leftOut: false,
            rightIn: false,
            rightOut: false,
            topIn: false,
            topOut: false,
            bottomIn: false,
            bottomOut: false,
            scaleIn: false,
            scaleOut: false,
            rotate: false,
            fadeIn: false,
            fadeOut: false,
            twinkle: false
        },

        speeds = {
            leftIn: 2.5, // 1--5,
            leftOut: 2.5,
            rightIn: 2.5,
            rightOut: 2.5,
            topIn: 2.5,
            topOut: 2.5,
            bottomIn: 2.5,
            bottomOut: 2.5,
            scaleIn: 2.5,
            scaleOut: 2.5,
            rotate: 2.5,
            fadeIn: 2.5,
            fadeOut: 2.5,
            twinkle: 2.5
        },

        animationList = [
            "rotate",
            "twinkle",
            "scaleIn",
            "scaleOut",
            "fadeIn",
            "fadeOut",

            "leftIn",
            "rightIn",
            "topIn",
            "bottomIn",

            "leftOut",
            "rightOut",
            "topOut",
            "bottomOut"
        ],

        instance = {
            state: state,
            speeds: speeds,
            SagCategory: SagCategory,
            SagType: SagType,

            initialize: initialize,
            removeAllSags: removeAllSags,
            reset: reset,
            save: save,

            rotate: rotate,
            twinkle: twinkle,
            scaleIn: scaleIn,
            scaleOut: scaleOut,
            fadeIn: fadeIn,
            fadeOut: fadeOut,

            leftIn: leftIn,
            rightIn: rightIn,
            topIn: topIn,
            bottomIn: bottomIn,

            leftOut: leftOut,
            rightOut: rightOut,
            topOut: topOut,
            bottomOut: bottomOut
        };

    return instance;

    function initialize() {

    }

    function reset(ele) {
        if (!ele) {
            ele = TQ.SelectSet.peekLatestEditableEle();
            if (!ele) {
                state.hasSag = false;
                state.delay = DEFAULT_DELAY;
                state.duration = DEFAULT_DURATION;
                state.leftIn = false;
                state.leftOut = false;
                state.rightIn = false;
                state.rightOut = false;
                state.topIn = false;
                state.topOut = false;
                state.bottomIn = false;
                state.bottomOut = false;
                state.scaleIn = false;
                state.scaleOut = false;
                state.rotate = false;
                state.fadeIn = false;
                state.fadeOut = false;
                state.twinkle = false;
                return false;
            }
        }

        var num = 0;
        num += checkSag(ele, SagType.LEFT_IN);
        num += checkSag(ele, SagType.LEFT_OUT);
        num += checkSag(ele, SagType.RIGHT_IN);
        num += checkSag(ele, SagType.RIGHT_OUT);
        num += checkSag(ele, SagType.TOP_IN);
        num += checkSag(ele, SagType.TOP_OUT);
        num += checkSag(ele, SagType.BOTTOM_IN);
        num += checkSag(ele, SagType.BOTTOM_OUT);
        num += checkSag(ele, SagType.SCALE_IN);
        num += checkSag(ele, SagType.SCALE_OUT);
        num += checkSag(ele, SagType.ROTATE);
        num += checkSag(ele, SagType.FADE_IN);
        num += checkSag(ele, SagType.FADE_OUT);
        num += checkSag(ele, SagType.TWINKLE);
        state.hasSag = (num > 0);
        if (!state.hasSag) {
            state.delay = DEFAULT_DELAY;
            state.duration = DEFAULT_DURATION;
        }
        return true;
    }

    function rotate() {
        console.log("rotate");
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.rotate) {
            removeSag(ele, SagType.ROTATE);
            state.rotate = false;
            return;
        }

        var endAngle = ele.getRotation(),
            startAngle = endAngle - 360,
            sag = composeFlyInSag(SagType.ROTATE, startAngle, endAngle);
        state.rotate = true;
        return recordSag(sag);
    }

    function twinkle() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.twinkle) { // remove
            removeSag(ele, SagType.TWINKLE);
            state.twinkle = false;
            return;
        }

        console.log("twinkle");
        var speed = getSpeed(SagType.TWINKLE);
        var showT = 1 / speed.actualSpeed,
            hideT = showT,
            sag = {
                categoryID: SagCategory.IDLE,
                typeID: SagType.TWINKLE,
                showT: showT,
                hideT: hideT,
                speed: speed.normSpeed, // only for UI // ToDo: 实际的speed
                t1: 0,
                t2: UNLIMIT // end time
            };

        state.twinkle = true;
        return recordSag(sag);
    }

    function recordSag(sag) {
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            sagId;

        if (ele) {
            sagId = TQ.TrackRecorder.recordSag(ele, sag);
        }

        setTimeout(function () {
            TQ.Scene.doReplay(composePreviewOptions(sag));
        }, 100);

        return sagId;
    }

    function composePreviewOptions(sag) {
        var t1, t2,
            currentTime = TQ.FrameCounter.t();
        switch (sag.typeID) {
            case SagType.TWINKLE:
                t1 = currentTime;
                t2 = t1 + 3 * (sag.hideT + sag.showT);
                break;
            case SagType.LEFT_IN:
            case SagType.RIGHT_IN:
            case SagType.BOTTOM_IN:
            case SagType.TOP_IN:
            case SagType.FADE_IN:
            case SagType.SCALE_IN:
                t1 = sag.t1;
                t2 = sag.t2;
                currentTime = Math.max(t2, currentTime);
                break;

            case SagType.LEFT_OUT:
            case SagType.RIGHT_OUT:
            case SagType.BOTTOM_OUT:
            case SagType.TOP_OUT:
            case SagType.FADE_OUT:
            case SagType.SCALE_OUT:
                t1 = sag.t1;
                t2 = sag.t2;
                currentTime = Math.min(t1, currentTime);
                break;

            default:
                t1 = sag.t1;
                t2 = sag.t2;
                break;
        }

        return {tStart: t1, tEnd: t2, stopAt: currentTime};
    }

    function leftIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.leftIn) { // remove
            removeSag(ele, SagType.LEFT_IN);
            state.leftIn = false;
            return;
        }

        console.log("left in");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyInSag(SagType.LEFT_IN, FLY_IN_POS_0, posInWorld.x);
        state.leftIn = true;
        return recordSag(sag);
    }

    function rightIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.rightIn) { // remove
            removeSag(ele, SagType.RIGHT_IN);
            state.rightIn = false;
            return;
        }

        console.log("right in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxData().width,
            sag = composeFlyInSag(SagType.RIGHT_IN, startPos, posInWorld.x);
        state.rightIn = true;
        return recordSag(sag);
    }

    function bottomIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.bottomIn) { // remove
            removeSag(ele, SagType.BOTTOM_IN);
            state.bottomIn = false;
            return;
        }

        console.log("bottom in");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyInSag(SagType.BOTTOM_IN, FLY_IN_POS_0, posInWorld.y);
        state.bottomIn = true;
        return recordSag(sag);
    }

    function topIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.topIn) {
            removeSag(ele, SagType.TOP_IN);
            state.topIn = false;
            return;
        }

        console.log("top in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxData().height,
            sag = composeFlyInSag(SagType.TOP_IN, startPos, posInWorld.y);
        state.topIn = true;
        return recordSag(sag);
    }

    function leftOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.leftOut) { // remove
            removeSag(ele, SagType.LEFT_OUT);
            state.leftOut = false;
            return;
        }

        console.log("left out");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyOutSag(SagType.LEFT_OUT, posInWorld.x, FLY_OUT_POS_1);
        state.leftOut = true;
        return recordSag(sag);
    }

    function rightOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.rightOut) { // remove
            removeSag(ele, SagType.RIGHT_OUT);
            state.rightOut = false;
            return;
        }

        console.log("right out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxData().width,
            sag = composeFlyOutSag(SagType.RIGHT_OUT, posInWorld.x, endPos);

        state.rightOut = true;
        return recordSag(sag);
    }

    function bottomOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.bottomOut) { // remove
            removeSag(ele, SagType.BOTTOM_OUT);
            state.bottomOut = false;
            return;
        }

        console.log("bottom out");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, FLY_OUT_POS_1);
        state.bottomOut = true;
        return recordSag(sag);
    }

    function topOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.topOut) { // remove
            removeSag(ele, SagType.TOP_OUT);
            state.topOut = false;
            return;
        }

        console.log("top out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxData().height,
            sag = composeFlyOutSag(SagType.TOP_OUT, posInWorld.y, endPos);
        state.topOut = true;
        return recordSag(sag);
    }

    function scaleIn() {
        console.log("scale in");
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.scaleIn) { // remove
            removeSag(ele, SagType.SCALE_IN);
            state.scaleIn = false;
            return;
        }

        var endSx = ele.getScaleInWorld().sx,
            startSx = 0.1 * endSx,
            sag = composeFlyOutSag(SagType.SCALE_IN, startSx, endSx);
        state.scaleIn = true;
        return recordSag(sag);
    }

    function scaleOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.scaleOut) { // remove
            removeSag(ele, SagType.SCALE_OUT);
            state.scaleOut = false;
            return;
        }

        console.log("scale out");
        var startSx = ele.getScaleInWorld().sx,
            endSx = 0.1 * startSx,
            sag = composeFlyOutSag(SagType.SCALE_OUT, startSx, endSx);
        state.scaleOut = true;
        return recordSag(sag);
    }

    function fadeIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.fadeIn) { // remove
            removeSag(ele, SagType.FADE_IN);
            state.fadeIn = false;
            return;
        }

        console.log("fade in");
        var endValue = ele.getAlpha(),
            startValue = 0,
            sag = composeFlyInSag(SagType.FADE_IN, startValue, endValue);
        state.fadeIn = true;
        return recordSag(sag);
    }

    function fadeOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (state.fadeOut) { // remove
            removeSag(ele, SagType.FADE_OUT);
            state.fadeOut = false;
            return;
        }

        console.log("fade out");
        var endValue = 0,
            startValue = ele.getAlpha(),
            sag = composeFlyOutSag(SagType.FADE_OUT, startValue, endValue);
        state.fadeOut = true;
        return recordSag(sag);
    }

    // private functions:
    function composeFlyInSag(typeId, startPos, destinationPos) {
        var MIN_MOVE_TIME = 0.1;
        var speed = getSpeed(typeId),
            delay = state.delay,// fps,
            duration = state.duration, // fps
            t1 = delay / TQ.FrameCounter.defaultFPS,
            dampingDuration = TQ.SpringEffect.defaultConfig.dampingDuration, // seconds
            t2 = t1 + (duration / TQ.FrameCounter.defaultFPS),
            velocity,
            dt = t2 - t1 - dampingDuration;
        if (dt < MIN_MOVE_TIME) {
            t1 = t2 - dampingDuration - MIN_MOVE_TIME;
            dt = t2 - t1 - dampingDuration;
        }

        velocity = (destinationPos - startPos) / dt;
        return {
            /// for editor only begin
            delay: delay,
            duration: duration,
            /// for editor only end
            destinationPos: destinationPos, // exactly stop at this point
            categoryID: SagCategory.IN,
            typeID: typeId,
            speed: speed.normSpeed, //1-5 规范化的速度
            actualSpeed: velocity,
            value0: startPos,
            t1: t1, // start time
            t2: t2
        }
    }

    function composeFlyOutSag(typeId, startPos, destinationPos) {
        var speed = getSpeed(typeId),
            dt = Math.abs((destinationPos - startPos) / speed.actualSpeed),
            t1 = TQ.FrameCounter.t(), // end time
            t2 = t1 + dt,
            velocity = speed.actualSpeed * ((destinationPos - startPos) > 0 ? 1 : -1);
        return {
            categoryID: SagCategory.OUT,
            typeID: typeId,
            speed: speed.normSpeed, // degree/second
            actualSpeed: velocity,
            value0: startPos,
            t1: t1, // start time
            t2: t2
        };
    }

    function getSpeed(typeId) {
        var norm,
            actual,
            speedFactor = TQ.Config.speedFactor;
        switch (typeId) {
            case SagType.FADE_IN:
                norm = speeds.fadeIn;
                actual = norm * speedFactor.fadeIn;
                break;

            case SagType.FADE_OUT:
                norm = speeds.fadeOut;
                actual = norm * speedFactor.fadeOut;
                break;

            case SagType.SCALE_IN:
                norm = speeds.scaleOut;
                actual = norm * speedFactor.scaleIn;
                break;

            case SagType.SCALE_OUT:
                norm = speeds.scaleIn;
                actual = norm * speedFactor.scaleOut;
                break;

            case SagType.ROTATE:
                norm = speeds.rotate;
                actual = norm * speedFactor.rotate;
                break;

            case SagType.LEFT_IN:
                norm = speeds.leftIn;
                actual = norm * speedFactor.flyIn;
                break;

            case SagType.LEFT_OUT:
                norm = speeds.leftOut;
                actual = norm * speedFactor.flyOut;
                break;

            case SagType.RIGHT_IN:
                norm = speeds.rightIn;
                actual = norm * speedFactor.flyIn;
                break;

            case SagType.RIGHT_OUT:
                norm = speeds.rightOut;
                actual = norm * speedFactor.flyOut;
                break;

            case SagType.TOP_IN:
                norm = speeds.topIn;
                actual = norm * speedFactor.flyIn;
                break;

            case SagType.TOP_OUT:
                norm = speeds.topOut;
                actual = norm * speedFactor.flyOut;
                break;

            case SagType.BOTTOM_IN:
                norm = speeds.bottomIn;
                actual = norm * speedFactor.flyIn;
                break;

            case SagType.BOTTOM_OUT:
                norm = speeds.bottomOut;
                actual = norm * speedFactor.flyOut;
                break;

            case SagType.TWINKLE:
                norm = speeds.twinkle;
                actual = norm * speedFactor.twinkle;
                break;

            default:
                TQ.AssertExt.invalidLogic(false, "unknown case");
                break;
        }

        return {normSpeed: norm, actualSpeed: actual};
    }

    function type2fn(typeId) {
        switch (typeId) {
            case SagType.FADE_IN:
                return 'fadeIn';

            case SagType.FADE_OUT:
                return 'fadeOut';

            case SagType.SCALE_IN:
                return 'scaleOut';

            case SagType.SCALE_OUT:
                return 'scaleIn';

            case SagType.ROTATE:
                return 'rotate';

            case SagType.LEFT_IN:
                return 'leftIn';

            case SagType.LEFT_OUT:
                return 'leftOut';

            case SagType.RIGHT_IN:
                return 'rightIn';

            case SagType.RIGHT_OUT:
                return 'rightOut';

            case SagType.TOP_IN:
                return 'topIn';

            case SagType.TOP_OUT:
                return 'topOut';

            case SagType.BOTTOM_IN:
                return 'bottomIn';

            case SagType.BOTTOM_OUT:
                return 'bottomOut';

            case SagType.TWINKLE:
                return 'twinkle';

            default:
                TQ.AssertExt.invalidLogic(false, "unknown case");
                break;
        }
    }

    function checkSag(ele, type) {
        var sag = getSag(ele, type),
            fn = type2fn(type);
        state[fn] = !!sag;
        speeds[fn] = (sag) ? sag.speed : 2.5;
        if (sag) {
            state.delay = sag.delay || DEFAULT_DELAY;
            state.duration = sag.duration || DEFAULT_DURATION;
            return 1;
        }

        return 0;
    }

    function save() {
        for (var prop in SagType) {
            var fn = type2fn(SagType[prop]);
            if (state[fn]) {
                var bak = state[fn];
                state[fn] = null;
                instance[fn].apply();
                state[fn] = bak;
            }
        }
    }

    function removeAllSags() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }
        animationList.forEach(function(name) {
            state[name] = null;
        });

        TQ.TrackRecorder.removeAllSags(ele);
    }
})();
