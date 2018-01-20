/**
 * Created by Andrewz on 3/28/2017.
 * SAG: Simple Animation Generator
 */
var TQ = TQ || {};
TQ.AnimationManager = (function () {
    'use strict';
    var UNLIMIT = 99999999,
        MIN_MOVE_TIME = 0.1,
        DEFAULT_DELAY = 0,
        DEFAULT_DURATION = 16; //frames

    var SagCategory = {
            IN: 1,
            IDLE: 2,
            OUT: 3
        },

        SagType = {
            NO: 'no animation',

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
        TQ.Log.debugInfo("rotate");
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }
        var endAngle = ele.getRotation(),
            startAngle = endAngle - 360,
            sag = composeFlyInSag(SagType.ROTATE, startAngle, endAngle);
                return recordSag(sag);
    }

    function twinkle() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("twinkle");
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

                return recordSag(sag);
    }

    function recordSag(sagOrsags) {
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            sags = (Array.isArray(sagOrsags) ? sagOrsags : [sagOrsags]),
            sagId;

        if (ele) {
            sagId = TQ.TrackRecorder.recordSag(ele, sags);
        }

        setTimeout(function () {
            TQ.Scene.doReplay(composePreviewOptions(sags[0]));
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
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("left in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = - ele.getBBoxRadiusInWorld(),
            sag = composeFlyInSag(SagType.LEFT_IN, startPos, posInWorld.x);
                return recordSag(sag);
    }

    function rightIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("right in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxRadiusInWorld(),
            sag = composeFlyInSag(SagType.RIGHT_IN, startPos, posInWorld.x);
        return recordSag(sag);
    }

    function bottomIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("bottom in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = -ele.getBBoxRadiusInWorld(),
            sag = composeFlyInSag(SagType.BOTTOM_IN, startPos, posInWorld.y);
        return recordSag(sag);
    }

    function topIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("top in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxRadiusInWorld(),
            sag = composeFlyInSag(SagType.TOP_IN, startPos, posInWorld.y);
        return recordSag(sag);
    }

    function leftOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("left out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = - ele.getBBoxRadiusInWorld(),
            sag = composeFlyOutSag(SagType.LEFT_OUT, posInWorld.x, endPos);
        return recordSag(sag);
    }

    function rightOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("right out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxRadiusInWorld(),
            sag = composeFlyOutSag(SagType.RIGHT_OUT, posInWorld.x, endPos);

        return recordSag(sag);
    }

    function bottomOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("bottom out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = -ele.getBBoxRadiusInWorld(),
            sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, endPos);
        return recordSag(sag);
    }

    function topOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("top out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxRadiusInWorld(),
            sag = composeFlyOutSag(SagType.TOP_OUT, posInWorld.y, endPos);
        return recordSag(sag);
    }

    function scaleIn() {
        TQ.Log.debugInfo("scale in");
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        var endSx = ele.getScaleInWorld().sx,
            startSx = 0.01 * endSx,
            endSy = ele.getScaleInWorld().sy,
            startSy = 0.01 * endSy,
            sagX = composeFlyInSag(SagType.SCALE_IN, startSx, endSx),
            sagY = composeFlyInSag(SagType.SCALE_IN, startSy, endSy);
        return recordSag([sagX, sagY]);
    }

    function scaleOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("scale out");
        var startSx = ele.getScaleInWorld().sx,
            endSx = 0.01 * startSx,
            startSy = ele.getScaleInWorld().sy,
            endSy = 0.01 * startSy,
            sagX = composeFlyOutSag(SagType.SCALE_OUT, startSx, endSx),
            sagY = composeFlyOutSag(SagType.SCALE_OUT, startSy, endSy);
        return recordSag([sagX, sagY]);
    }

    function fadeIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("fade in");
        var endValue = ele.getAlpha(),
            startValue = 0,
            sag = composeFlyInSag(SagType.FADE_IN, startValue, endValue);
        return recordSag(sag);
    }

    function fadeOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        TQ.Log.debugInfo("fade out");
        var endValue = 0,
            startValue = ele.getAlpha(),
            sag = composeFlyOutSag(SagType.FADE_OUT, startValue, endValue);
        return recordSag(sag);
    }

    // private functions:
    function composeFlyInSag(typeId, startPos, destinationPos) {
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
            // t1 = TQ.FrameCounter.t(), // end time
        var speed = getSpeed(typeId),
            vTime = TQ.FrameCounter.v,
            delay = vTime,
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
            categoryID: SagCategory.OUT,
            typeID: typeId,
            speed: speed.normSpeed,
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
        if (type !== SagType.NO) {
            var sag = getSag(ele, type),
                fn = type2fn(type);
            speeds[fn] = (sag) ? sag.speed : 2.5;
            if (sag) {
                state.delay = sag.delay || DEFAULT_DELAY;
                state.duration = sag.duration || DEFAULT_DURATION;
                return 1;
            }
        }

        return 0;
    }

    function save() {
        // ToDo:
    }

    function removeAllSags() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }
        TQ.TrackRecorder.removeAllSags(ele);
    }
})();
