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

    var SagType = AnimationManager.SagType;
    var UNLIMIT = 99999999;

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

    var FLY_IN_DURATION = 1; // 1秒钟，飞入
    function leftIn() {
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld();

        console.log("left in");
        var sag = {
            typeID: SagType.LEFT_IN,
            speed: 10, // degree/second
            value0: -100,
            t1: 0, // start time
            t2: TQ.FrameCounter.t() // end time
        };

        if (sag.t2 < FLY_IN_DURATION) {
            sag.t2 = FLY_IN_DURATION; // 时间差不能是 0
        }

        sag.t1 = Math.max(0, sag.t2 - FLY_IN_DURATION);
        sag.speed = (posInWorld.x - sag.value0) / (sag.t2 - sag.t1);
        return recordSag(sag);
    }

    function bottomIn() {
        console.log("bottom in");
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            posInWorld = ele.getPositionInWorld();
        var sag = {
            typeID: SagType.BOTTOM_IN,
            speed: 10, // degree/second
            value0: -100,
            t1: 0, // start time
            t2: TQ.FrameCounter.t() // end time
        };

        if (sag.t2 < FLY_IN_DURATION) {
            sag.t2 = FLY_IN_DURATION; // 时间差不能是 0
        }

        sag.t1 = Math.max(0, sag.t2 - FLY_IN_DURATION);

        sag.speed = (posInWorld.y - sag.value0) / (sag.t2 - sag.t1);
        return recordSag(sag);
    }

    function flyInFromLeft() {
        console.log("flyInFromLeft");
    }

    TQ.AnimationManager = AnimationManager;
})();
