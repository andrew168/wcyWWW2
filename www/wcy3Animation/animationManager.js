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
        getSagFlag = TQ.TrackRecorder.getSagStatus;

    var instance = {
        leftInFlag: false,
        leftOutFlag: false,
        rightInFlag: false,
        rightOutFlag: false,
        topInFlag: false,
        topOutFlag: false,
        bottomInFlag: false,
        bottomOutFlag: false,
        scaleInFlag: false,
        scaleOutFlag: false,
        rotateFlag: false,
        fadeInFlag: false,
        fadeOutFlag: false,
        twinkleFlag: false,

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

        instance.leftInFlag = getSagFlag(ele, SagType.LEFT_IN);
        instance.leftOutFlag = getSagFlag(ele, SagType.LEFT_OUT);
        instance.rightInFlag = getSagFlag(ele, SagType.RIGHT_IN);
        instance.rightOutFlag = getSagFlag(ele, SagType.RIGHT_OUT);
        instance.topInFlag = getSagFlag(ele, SagType.TOP_IN);
        instance.topOutFlag = getSagFlag(ele, SagType.TOP_OUT);
        instance.bottomInFlag = getSagFlag(ele, SagType.BOTTOM_IN);
        instance.bottomOutFlag = getSagFlag(ele, SagType.BOTTOM_OUT);
        instance.sacleInFlag = getSagFlag(ele, SagType.SCALE_IN);
        instance.sacleOutFlag = getSagFlag(ele, SagType.SCALE_OUT);
        instance.rotateFlag = getSagFlag(ele, SagType.ROTATE);
        instance.fadeInFlag = getSagFlag(ele, SagType.FADE_IN);
        instance.fadeOutFlag = getSagFlag(ele, SagType.FADE_OUT);
        instance.twinkleFlag = getSagFlag(ele, SagType.TWINKLE);

        return true;
    }

    function rotate() {
        console.log("rotate");
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.rotateFlag) {
            removeSag(ele, SagType.ROTATE);
            instance.rotateFlag = false;
            return;
        }

        var endAngle = ele.getRotation(),
            startAngle = endAngle - 360,
            sag = composeFlyInSag(SagType.ROTATE, startAngle, endAngle);
        instance.rotateFlag = true;
        return recordSag(sag);
    }

    function twinkle() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.twinkleFlag) { // remove
            removeSag(ele, SagType.TWINKLE);
            instance.twinkleFlag = false;
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

        instance.twinkleFlag = true;
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

        if (instance.leftInFlag) { // remove
            removeSag(ele, SagType.LEFT_IN);
            instance.leftInFlag = false;
            return;
        }

        console.log("left in");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyInSag(SagType.LEFT_IN, FLY_IN_POS_0, posInWorld.x);
        instance.leftInFlag = true;
        return recordSag(sag);
    }

    function rightIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.rightInFlag) { // remove
            removeSag(ele, SagType.RIGHT_IN);
            instance.rightInFlag = false;
            return;
        }

        console.log("right in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxData().width,
            sag = composeFlyInSag(SagType.RIGHT_IN, startPos, posInWorld.x);
        instance.rightInFlag = true;
        return recordSag(sag);
    }

    function bottomIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.bottomInFlag) { // remove
            removeSag(ele, SagType.BOTTOM_IN);
            instance.bottomInFlag = false;
            return;
        }

        console.log("bottom in");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyInSag(SagType.BOTTOM_IN, FLY_IN_POS_0, posInWorld.y);
        instance.bottomInFlag = true;
        return recordSag(sag);
    }

    function topIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.topInFlag) {
            removeSag(ele, SagType.TOP_IN);
            instance.topInFlag = false;
            return;
        }

        console.log("top in");
        var posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxData().height,
            sag = composeFlyInSag(SagType.BOTTOM_IN, startPos, posInWorld.y);
        instance.topInFlag = true;
        return recordSag(sag);
    }

    function leftOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.leftOutFlag) { // remove
            removeSag(ele, SagType.LEFT_OUT);
            instance.leftOutFlag = false;
            return;
        }

        console.log("left out");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyOutSag(SagType.LEFT_OUT, posInWorld.x, FLY_OUT_POS_1);
        instance.leftOutFlag = true;
        return recordSag(sag);
    }

    function rightOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.rightOutFlag) { // remove
            removeSag(ele, SagType.RIGHT_OUT);
            instance.rightOutFlag = false;
            return;
        }

        console.log("right out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxData().width,
            sag = composeFlyOutSag(SagType.RIGHT_OUT, posInWorld.x, endPos);

        instance.rightOutFlag = true;
        return recordSag(sag);
    }

    function bottomOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.bottomOutFlag) { // remove
            removeSag(ele, SagType.BOTTOM_OUT);
            instance.bottomOutFlag = false;
            return;
        }

        console.log("bottom out");
        var posInWorld = ele.getPositionInWorld(),
            sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, FLY_OUT_POS_1);
        instance.bottomOutFlag = true;
        return recordSag(sag);
    }

    function topOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.topOutFlag) { // remove
            removeSag(ele, SagType.TOP_OUT);
            instance.topOutFlag = false;
            return;
        }

        console.log("top out");
        var posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxData().height,
            sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, endPos);
        instance.topOutFlag = true;
        return recordSag(sag);
    }

    function scaleIn() {
        console.log("scale in");
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.scaleInFlag) { // remove
            removeSag(ele, SagType.SCALE_IN);
            instance.scaleInFlag = false;
            return;
        }

        var endSx = ele.getScaleInWorld().sx,
            startSx = 0.1 * endSx,
            sag = composeFlyOutSag(SagType.SCALE_IN, startSx, endSx);
        instance.scaleInFlag = true;
        return recordSag(sag);
    }

    function scaleOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.scaleOutFlag) { // remove
            removeSag(ele, SagType.SCALE_OUT);
            instance.scaleOutFlag = false;
            return;
        }

        console.log("scale out");
        var startSx = ele.getScaleInWorld().sx,
            endSx = 0.1 * startSx,
            sag = composeFlyOutSag(SagType.SCALE_OUT, startSx, endSx);
        instance.scaleOutFlag = true;
        return recordSag(sag);
    }

    function fadeIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.fadeInFlag) { // remove
            removeSag(ele, SagType.FADE_IN);
            instance.fadeInFlag = false;
            return;
        }

        console.log("fade in");
        var endValue = ele.getAlpha(),
            startValue = 0,
            sag = composeFlyInSag(SagType.FADE_IN, startValue, endValue);
        instance.fadeInFlag = true;
        return recordSag(sag);
    }

    function fadeOut() {
        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (!ele) {
            return;
        }

        if (instance.fadeOutFlag) { // remove
            removeSag(ele, SagType.FADE_OUT);
            instance.fadeOutFlag = false;
            return;
        }

        console.log("fade out");
        var endValue = 0,
            startValue = ele.getAlpha(),
            sag = composeFlyOutSag(SagType.FADE_OUT, startValue, endValue);
        instance.fadeOutFlag = true;
        return recordSag(sag);
    }

    // private functions:
    function composeFlyInSag(typeId, startPos, destinationPos) {
        var t2 = Math.max(TQ.FrameCounter.t(), FLY_IN_DURATION), // end time
            t1 = Math.max(0, t2 - FLY_IN_DURATION),
            speed = (destinationPos - startPos) / (t2 - t1);
        return {
            typeID: typeId,
            speed: speed, // degree/second
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
})();
