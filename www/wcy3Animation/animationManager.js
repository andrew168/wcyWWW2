/**
 * Created by Andrewz on 3/28/2017.
 */
var TQ = TQ || {};
(function () {
    'use strict';
    function AnimationManager() {
    }

    AnimationManager.initialize = initialize;
    AnimationManager.reset = reset;
    AnimationManager.flyInFromLeft = flyInFromLeft;
    AnimationManager.rotate = rotate;
    AnimationManager.leftIn = leftIn;
    AnimationManager.rightIn = rightIn;
    AnimationManager.topIn = topIn;
    AnimationManager.bottomIn = bottomIn;

    AnimationManager.SagType = {
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

    var UNLIMIT = 99999999,
        FLY_IN_DURATION = 1, // 1秒钟，飞入
        FLY_IN_POS_0 = -100; // 从屏幕外开始

    var SagType = AnimationManager.SagType;

    function initialize() {

    }

    function reset() {

    }

    function rotate() {
        console.log("rotate");
        var sag = {
            typeID: SagType.ROTATE,
            speed: 60, // degree/second
            value0: 0,
            t1: TQ.FrameCounter.t(), // start time
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

    function composeFlyInSag(typeId, startPos, destinationPos) {
        var t2 = Math.max(TQ.FrameCounter.t(), FLY_IN_DURATION), // end time
            t1 = Math.max(0, t2 - FLY_IN_DURATION),
            speed = (destinationPos - startPos) / (t2 - t1);
        return {
            typeID: typeId,
            speed: speed, // degree/second
            value0: FLY_IN_POS_0,
            t1: t1, // start time
            t2: t2
        };
    }

    TQ.AnimationManager = AnimationManager;
})();
