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

    function initialize() {

    }

    function reset() {

    }

    function rotate() {
        console.log("rotate");
    }

    function flyInFromLeft() {
        console.log("flyInFromLeft");
    }

    TQ.AnimationManager = AnimationManager;
})();
