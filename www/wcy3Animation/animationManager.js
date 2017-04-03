/**
 * Created by Andrewz on 3/28/2017.
 */
var TQ = TQ || {};
TQ.AnimationManager = (function() {
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

    return {
        SagType: SagType,
        initialize: initialize,
        reset: reset,
        rotate: rotate,
        twinkle: twinkle,
        scaleIn: scaleIn,
        scaleOut: scaleOut,

        leftIn: leftIn,
        rightIn: rightIn,
        topIn: topIn,
        bottomIn: bottomIn,

        leftOut: leftOut,
        rightOut: rightOut,
        topOut: topOut,
        bottomOut: bottomOut
    };

    function initialize() {

    }

    function reset() {

    }

    function rotate() {
        console.log("rotate");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            endAngle = ele.getRotation(),
            startAngle = endAngle - 360;
        var sag = composeFlyInSag(SagType.ROTATE, startAngle, endAngle);
        return recordSag(sag);
    }

    function twinkle() {
        console.log("twinkle");
        var sag = {
            typeID: SagType.TWINKLE,
            showT: 1,
            hideT: 1,
            t1: 0,
            t2: UNLIMIT // end time
        };

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
        console.log("left in");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld();
        var sag = composeFlyInSag(SagType.LEFT_IN, FLY_IN_POS_0, posInWorld.x);
        return recordSag(sag);
    }

    function rightIn() {
        console.log("right in");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxData().width;
        var sag = composeFlyInSag(SagType.RIGHT_IN, startPos, posInWorld.x);
        return recordSag(sag);
    }

    function bottomIn() {
        console.log("bottom in");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld();
        var sag = composeFlyInSag(SagType.BOTTOM_IN, FLY_IN_POS_0, posInWorld.y);
        return recordSag(sag);
    }

    function topIn() {
        console.log("top in");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld(),
            startPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxData().height;
        var sag = composeFlyInSag(SagType.BOTTOM_IN, startPos, posInWorld.y);
        return recordSag(sag);
    }

    function leftOut() {
        console.log("left out");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld();
        var sag = composeFlyOutSag(SagType.LEFT_OUT, posInWorld.x, FLY_OUT_POS_1);
        return recordSag(sag);
    }

    function rightOut() {
        console.log("right out");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxData().width;
        var sag = composeFlyOutSag(SagType.RIGHT_OUT, posInWorld.x, endPos);
        return recordSag(sag);
    }

    function bottomOut() {
        console.log("bottom out");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld();
        var sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, FLY_OUT_POS_1);
        return recordSag(sag);
    }

    function topOut() {
        console.log("top out");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld(),
            endPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxData().height;
        var sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, endPos);
        return recordSag(sag);
    }

    function scaleIn() {
        console.log("scale in");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            endSx = ele.getScaleInWorld().sx,
            startSx = 0.1 * endSx;
        var sag = composeFlyOutSag(SagType.SCALE_IN, startSx, endSx);
        return recordSag(sag);
    }

    function scaleOut() {
        console.log("scale out");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            startSx = ele.getScaleInWorld().sx,
            endSx = 0.1 * startSx;
        var sag = composeFlyOutSag(SagType.SCALE_OUT, startSx, endSx);
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
