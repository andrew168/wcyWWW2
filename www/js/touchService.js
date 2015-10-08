angular.module('starter')
    .factory('TouchService', ['$timeout', function($timeout) {
        var isDithering = false;
        var ele = null;
        var ang = 0, scale = 1;
        var dAngle = 0, dScale = 1;
        var pos = {x:0, y:0};
        var isMultiTouching = false;

        function initGesture() {
            var canvas = document.getElementById("testCanvas");
            ionic.EventController.onGesture('touch', onStart, canvas);
            ionic.EventController.onGesture('touchend', onTouchEnd, canvas);
            ionic.EventController.onGesture('release', onRelease, canvas);
            ionic.EventController.onGesture('rotate', onRotate, canvas);
            function onShowToucInfo(e) {
                console.log(e.type);
            }

            // 'scale': not work
            //
            // ionic.EventController.onGesture('pinchin', onPinch, canvas);
            // ionic.EventController.onGesture('pinchout', onPinch, canvas);
            ionic.EventController.onGesture('pinch', onPinch, canvas);
            ionic.EventController.onGesture('drag', onMove, canvas);
        }

        function getSelectedElement() {
            var newEle = TQ.SelectSet.getSelectedElement();
            if (ele === newEle) {
                return;
            }

            console.log("element changed!");

            ele = newEle;
            if (!ele) {
                ele = currScene.currentLevel.elements[0];
            }

            if (!ele) {
                console.error("No Element selected");
                return;
            }

            ang = ele.getRotation();
            scale = ele.getScale().sx;
            pos = ele.getPosition();

            if (isNaN(scale)) {
                scale = 1;
            }
        }

        function onStart() {
            ele = null;
            getSelectedElement();
            console.log("start");
        }

        function ditherStart() {
            isDithering = true;
            $timeout(ditherEnd, 300);
        }

        function ditherEnd() {
            isDithering = false;
        }

        function onTouchEnd(e) {
            isMultiTouching = false;
            ditherStart();
        }

        function onRelease() {
            isMultiTouching = false;
            isDithering = false;
        }

        function onMove(e) {
            if (isMultiTouching || isDithering) {
                return;
            }
            getSelectedElement();

            if (!ele) {
                console.log("Move...");
            } else {
                // ele = currScene.currentLevel.elements[0];
                var deltaX = e.gesture.deltaX;
                var deltaY = - e.gesture.deltaY;
                ele.moveTo({x: deltaX + pos.x, y: deltaY + pos.y});
            }
        }

        function onRotate(e) {
            if (isDithering) {
                return;
            }

            getSelectedElement();

            if (!ele) {
                console.log("Rotete...");
            } else {
                // ele = currScene.currentLevel.elements[0];
                dAngle = e.gesture.rotation;
                ele.rotateTo(ang - dAngle);
                isMultiTouching = true;
            }
        }

        function onPinch(e) {
            if (isDithering) {
                return;
            }

            getSelectedElement();
            if (!ele) {
                console.log("pinch...");
            } else {
                // ele = currScene.currentLevel.elements[0];
                dScale = e.gesture.scale;
                var newScale = scale * dScale;
                if (!isNaN(newScale)) {
                    if (Math.abs(newScale) < 0.001) {
                        console.warn("Too small");
                    } else {
                        ele.scaleTo({sx:newScale, sy:newScale});
                        isMultiTouching = true;
                    }
                }
            }
        }

        return {
            initGesture: initGesture
        }
    }]);
