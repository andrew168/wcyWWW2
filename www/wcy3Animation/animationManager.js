/**
 * Created by Andrewz on 3/28/2017.
 * 简单动画生成器SAG--Simple Animation Generator
 *  用于出场和离场动画。
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
        var ele = TQ.SelectSet.peekLatestEditableEle(),
            sagId;

        if (ele) {
            console.log("rotate");

            var sag = {
                typeID: SagType.ROTATE,
                speed: 60, // degree/second
                value0: 0,
                t1: TQ.FrameCounter.t(), // start time
                t2: UNLIMIT // end time
            };

            sagId = TQ.TrackRecorder.recordSag(ele, sag);
        }
        return sagId;
    }

    function flyInFromLeft() {
        console.log("flyInFromLeft");
    }

    TQ.AnimationManager = AnimationManager;
})();
