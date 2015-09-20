angular.module('starter')
    .controller('DashCtrl', function(
        $scope, $state, $timeout, GetWcy, $cordovaImagePicker,
        $cordovaProgress,
        FileService, NetService, DeviceService, Setup) {

        if (!DeviceService.isReady()) {
            // $cordovaProgress.showSimple(true);
            ionic.Platform.ready(_init);
        } else {
            _init();
        }


        var initChromeFileSystem = function() {
            // see console output for debug info
            document.addEventListener(ImgCache.READY_EVENT, onFileSystemReady, false);
            ImgCache.options.debug = true;
            ImgCache.options.usePersistentCache = true;
            ImgCache.init();
        };

        function onFileSystemReady() {
            ImgCache.createDir("mcImages");
            ImgCache.createDir("mcSounds");
            document.removeEventListener(ImgCache.READY_EVENT, onFileSystemReady);
        }

        if (typeof(cordova) !== 'undefined') {
            // cordova test
            console.log('cordova start');
            document.addEventListener('deviceready', initChromeFileSystem, false);
        } else {
            // normal browser test
            initChromeFileSystem();
        }

        function testChromeFile() {
            ImgCache.cacheFile('http://bone.udoido.cn/mcImages/p10324.png');
            ImgCache.cacheFile('http://bone.udoido.cn/mcImages/p1.png');
        }

        $(document).ready(function () {
            $('#clear_cache').click(function(e) {
                e.preventDefault();
                ImgCache.clearCache();
            });
            $('#cache_folder').click(function(e) {
                $(this).attr('href', ImgCache.getCacheFolderURI());
            });
        });

        function _init() {
            DeviceService.initialize();
            Setup.initialize();
            assertTrue("device要先ready", DeviceService.isReady());

            // GetWcy.testCreateScene();
            // GetWcy.test();
            // $cordovaProgress.hide();

            testChromeFile();
        }

        // GetWcy.test();
        var isDithering = false;
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
        $scope.getTextMsg = function () {
            var msg = (( !currScene) || (!currScene.currentLevel) || (!currScene.currentLevel.name)) ?
                "": currScene.currentLevel.name;

            return msg + ": " + TQ.FrameCounter.t();
        };

        function onStart() {
            ele = TQ.SelectSet.getSelectedElement();
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

            if (!ele) {
                console.log("pinch...");
            } else {
                // ele = currScene.currentLevel.elements[0];
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
            var id = currScene.currentLevelId;
            currScene.addLevel(id);
            currScene.gotoLevel(id);
        };

        $scope.gotoPreLevel = function() {
            currScene.preLevel();
        };

        $scope.gotoNextLevel = function() {
            currScene.nextLevel();
        };

        $scope.isPlaying = TQ.FrameCounter.isPlaying();
        $scope.onChange = function() {
            $scope.isPlaying = !$scope.isPlaying;
            if ($scope.isPlaying) {
               TQ.FrameCounter.play();
            } else {
                TQ.FrameCounter.stop();
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

        $scope.deleteElement = function() {
            TQ.SelectSet.delete();
        };

        $scope.testDownload = function() {
            NetService.get(TQ.Config.IMAGES_CORE_PATH + "p10324.png");
            NetService.get(TQ.Config.IMAGES_CORE_PATH + "p1.png");
            NetService.get(TQ.Config.SOUNDS_PATH + "p1.wav");
        };

        $scope.saveScreenShot = function () {
            var data = TQ.ScreenShot.getData();
            console.log(data);
            FileService.saveFile(TQ.Config.SCREENSHOT_CORE_PATH + "/nn.png", data);
        };

        $scope.saveWorks = function () {
            var data = currScene.getData();
            console.log(data);
            FileService.saveFile(TQ.Config.SCREENSHOT_CORE_PATH + "/nn.wcy", data);
        };
    });
