angular.module('starter')
.controller('DashCtrl', function($scope, $timeout, GetWcy, $cordovaImagePicker,
                                 NetService, DeviceService) {
        // GetWcy.test();
        var isDithering = false;
        GetWcy.testCreateScene();
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
        var ele = null;
        var ang = 0, scale = 1;
        var dAngle = 0, dScale = 1;
        var pos = {x:0, y:0};
        var isMultiTouching = false;

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
            if (isDithering) {
                return;
            }

            if (!ele) {
                console.log("Rotete...");
            } else {
                ele = currScene.currentLevel.elements[0];
                dAngle = e.gesture.rotation;
                ele.rotateTo(ang - dAngle);
                isMultiTouching = true;
            }
        }

        function onPinch(e) {
            if (isDithering) {
                return;
            }

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
                        isMultiTouching = true;
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
            // insertImage("mcImages/p10324.png", x, y);
            // insertSound("mcSounds/p8574.wav", x, y);
            // TQ.TextInputMgr.start();
            insertText("Hello 世界！", x, y);
        };

        $scope.insertLocalImage = function() {
            var path = "p10324.png";
            path = DeviceService.getFullPath(TQ.Config.IMAGES_CORE_PATH + path);
            insertImage(path, x, y);
        };

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
            // TQ.SceneEditor.addItem(desc);
            TQ.TextEditor.initialize();
            TQ.TextEditor.addText(TQ.Dictionary.defaultText);
        }

        $scope.onEndInputText = function () {
            x += 50;
            y += 50;
            TQ.TextEditor.onOK();
            var message = TQ.TextEditor.inputBox.val();
            var desc = {src: null, text: message, type:"Text", x:x, y:y};
            TQ.SceneEditor.addItem(desc);
        };

        $scope.insertAlbum = function() {
            var options = {
                maximumImagesCount: 10,
                width: 800,
                height: 800,
                quality: 80
            };

            $cordovaImagePicker.getPictures(options)
                .then(function (results) {
                    for (var i = 0; i < results.length; i++) {
                        console.log('Image URI: ' + results[i]);
                        x += 50;
                        y += 50;
                        insertImage(results[i], x, y);
                    }
                }, function(error) {
                    // error getting photos
                });

        };

        $scope.testDownload = function() {
            NetService.get("p10324.png");
        };
    });
