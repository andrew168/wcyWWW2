angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope, GetWcy) {
        // GetWcy.test();

        GetWcy.testCreateScene();
        var canvas = document.getElementById("testCanvas1122");
        ionic.EventController.onGesture('touch', onStart, canvas);
        ionic.EventController.onGesture('touchend', onShowToucInfo, canvas);
        ionic.EventController.onGesture('release', onShowToucInfo, canvas);
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
        var ele = null;
        var ang = 0, scale = 1;
        var dAngle = 0, dScale = 1;
        var pos = {x:0, y:0};

        $scope.params = 0;

        function onStart() {
            if (!ele) {
                ele = currScene.currentLevel.elements[0];
            }

            ang = ele.getRotation();
            scale = ele.getScale().sx;
            pos = ele.getPosition();

            if (isNaN(scale)) {
                scale = 1;
            }
            console.log("start");
        }

        function onMove(e) {
            if (!ele) {
                console.log("Move...");
            } else {
                ele = currScene.currentLevel.elements[0];
                var deltaX = e.gesture.deltaX;
                var deltaY = - e.gesture.deltaY;
                ele.moveTo({x: deltaX + pos.x, y: deltaY + pos.y});
            }
        }

        function onRotate(e) {
            if (!ele) {
                console.log("Rotete...");
            } else {
                ele = currScene.currentLevel.elements[0];
                dAngle = e.gesture.rotation;
                ele.rotateTo(ang - dAngle);
            }
        }

        function onPinch(e) {
            if (!ele) {
                console.log("pinch...");
            } else {
                ele = currScene.currentLevel.elements[0];
                dScale = e.gesture.scale;
                var newScale = scale * dScale;
                $scope.params = Math.round(newScale *100) / 100;
                if (!isNaN(newScale)) {
                    if (Math.abs(newScale) < 0.001) {
                        console.warn("Too small");
                    } else {
                        ele.scaleTo({sx:newScale, sy:newScale});
                    }
                }
            }
        }

        $scope.testCreateLevel = function() {
            if (currScene.levelNum() < 2) {
                currScene.addLevel();
                currScene.selectLevel(1);
                currScene.currentLevel.state = TQBase.LevelState.EDITING;
            }
        };

        var x = 300,
            y = 300;
        $scope.testInsert = function() {
            x += 50;
            y += 50;
            insertImage("mcImages/p10324.png", x, y);
            // insertSound("mcSounds/p8574.wav", x, y);
            // insertText("Hello Andrew", x, y);
        }

        function insertImage(filename, x, y) {
            var desc = {src: filename, type:"Bitmap", x:x, y:y};
            TQ.SceneEditor.addItem(desc);
        }

        function insertSound(filename, x, y) {
            var desc = {src: filename, type:"Sound", x:x, y:y};
            TQ.SceneEditor.addItem(desc);
        }

        function insertText(message, x, y) {
            var desc = {src: null, text: message, type:"Text", x:x, y:y};
            TQ.SceneEditor.addItem(desc);
        }

    });
