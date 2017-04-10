/**
 * Created by Andrewz on 3/28/2017.
 */
var TQ = TQ || {};
TQ.AnimationManager = (function () {
    'use strict';
    var UNLIMIT = 99999999,
        FLY_IN_DURATION = 1, // 1秒钟，飞入
        FLY_OUT_DURATION = 1,
        FLY_IN_POS_0 = -100, // 从屏幕外开始
        FLY_OUT_POS_1 = -100; // 到屏幕外结束

    var SagType = {
        // translate
        RIGHT_IN: 'sag left in',
        LEFT_IN: 'sag left in',
        BOTTOM_IN: 'bottom in',
        TOP_IN: 'top in',

        RIGHT_OUT: 'sag left in',
        LEFT_OUT: 'sag left in',
        BOTTOM_OUT: 'bottom in',
        TOP_OUT: 'top in',

        SCALE_IN: 'sag scale in',
        SCALE_OUT: 'sag scale out',

        ROTATE: 'sag rotate',
        TWINKLE: 'sag twinkle',

        // opacity change
        FADE_IN: 'sag fadein',
        FADE_OUT: 'sag fadein'
    };

    var removeSag = TQ.TrackRecorder.removeSag,
        getSag = TQ.TrackRecorder.getSag,
        state = {
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

        instance = {
            state: state,
            SagType: SagType,
            initialize: initialize,
            reset: reset,
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

    function reset() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return false;
        }

        var sag;
        sag = getSag(ele, SagType.LEFT_IN);
        state.leftIn = !!sag;
        speeds.leftIn = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.LEFT_OUT);
        state.leftOut = !!sag;
        speeds.leftOut = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.RIGHT_IN);
        state.rightIn = !!sag;
        speeds.rightIn = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.RIGHT_OUT);
        state.rightOut = !!sag;
        speeds.rightOut = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.TOP_IN);
        state.topIn = !!sag;
        speeds.topIn = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.TOP_OUT);
        state.topOut = !!sag;
        speeds.topOut = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.BOTTOM_IN);
        state.bottomIn = !!sag;
        speeds.bottomIn = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.BOTTOM_OUT);
        state.bottomOut = !!sag;
        speeds.bottomOut = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.SCALE_IN);
        state.sacleIn = !!sag;
        speeds.sacleIn = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.SCALE_OUT);
        state.sacleOut = !!sag;
        speeds.sacleOut = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.ROTATE);
        state.rotate = !!sag;
        speeds.rotate = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.FADE_IN);
        state.fadeIn = !!sag;
        speeds.fadeIn = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.FADE_OUT);
        state.fadeOut = !!sag;
        speeds.fadeOut = (sag) ? sag.speed : 2.5;
        sag = getSag(ele, SagType.TWINKLE);
        state.twinkle = !!sag;
        speeds.twinkle = (sag) ? sag.speed : 2.5;
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
        var sag = {
            typeID: SagType.TWINKLE,
            showT: 1,
            hideT: 1,
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
        return sagId;
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
            sag = composeFlyInSag(SagType.BOTTOM_IN, startPos, posInWorld.y);
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
            sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, endPos);
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
        var speed = getSpeed(typeId),
            dt = Math.abs((destinationPos - startPos) / speed.actual) ,
            t2 = Math.max(TQ.FrameCounter.t(), dt), // end time
            t1 = Math.max(0, t2 - dt);
        return {
            typeID: typeId,
            speed: speed.norm, //1-5 规范化的速度
            actualSpeed: speed.actual, //1-5 规范化的速度
            value0: startPos,
            t1: t1, // start time
            t2: t2
        }
    }

    function composeFlyOutSag(typeId, startPos, destinationPos) {
        var t1 = TQ.FrameCounter.t(), // end time
            t2 = t1 + FLY_OUT_DURATION,
            speed = (destinationPos - startPos) / (t2 - t1);
        return {
            typeID: typeId,
            speed: speed, // degree/second
            value0: startPos,
            t1: t1, // start time
            t2: t2
        };
    }

    function getSpeed(typeId) {
        var norm,
            actual;
        switch (typeId) {
            case SagType.FADE_IN:
                norm = speeds.fadeIn;
                actual = norm * 0.25;
                break;

            case SagType.FADE_OUT:
                norm = speeds.fadeOut;
                actual = norm * 0.25;
                break;

            case SagType.SCALE_IN:
                norm = speeds.scaleOut;
                actual = norm * 2;
                break;

            case SagType.SCALE_OUT:
                norm = speeds.scaleIn;
                actual = norm * 2;
                break;

            case SagType.ROTATE:
                norm = speeds.rotate;
                actual = norm * 140;
                break;

            case SagType.LEFT_IN:
                norm = speeds.leftIn;
                actual = norm * 100;
                break;

            case SagType.LEFT_OUT:
                norm = speeds.leftOut;
                actual = norm * 100;
                break;

            case SagType.RIGHT_IN:
                norm = speeds.rightIn;
                actual = norm * 100;
                break;

            case SagType.RIGHT_OUT:
                norm = speeds.rightOut;
                actual = norm * 100;
                break;

            case SagType.TOP_IN:
                norm = speeds.topIn;
                actual = norm * 100;
                break;

            case SagType.TOP_OUT:
                norm = speeds.topOut;
                actual = norm * 100;
                break;

            case SagType.BOTTOM_IN:
                norm = speeds.bottomIn;
                actual = norm * 100;
                break;

            case SagType.BOTTOM_OUT:
                norm = speeds.bottomOut;
                actual = norm * 100;
                break;

            case SagType.TWINKLE:
                norm = speeds.twinkle;
                actual = norm * 1;
                break;

            default:
                TQ.AssertExt.invalidLogic(false, "unknown case");
                break;
        }

        return {norm: norm, actual: actual};
    }
})();
