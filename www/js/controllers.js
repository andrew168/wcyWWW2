angular.module('starter')
    .controller('DashCtrl', ['$scope', '$state', '$timeout', 'GetWcy', '$cordovaImagePicker',
        '$cordovaProgress', '$cordovaSocialSharing',
        'FileService', 'NetService', 'DeviceService', 'Setup', 'TouchService', function(
        $scope, $state, $timeout, GetWcy, $cordovaImagePicker,
        $cordovaProgress, $cordovaSocialSharing,
        FileService, NetService, DeviceService, Setup, TouchService) {

        $scope.localImage1 = null;
        $scope.localImage2 = null;
        $scope.data = {};
        // $scope.data.sceneID = 12853
        // $scope.data.sceneID = 12585; // Bear
        $scope.data.sceneID = 14959; // straw berry
        // $scope.data.sceneID = 14961;  // 比例变换测试
        // $scope.data.sceneID = 15089; // 投票

        if (!DeviceService.isReady()) {
            // $cordovaProgress.showSimple(true);
        ionic.Platform.ready(_init);
        } else {
            _init();
        }

        $(document).ready(function () {
            $('#clear_cache').click(function(e) {
                e.preventDefault();
                ImgCache.clearCache();
                TQ.DownloadManager.clearCache();
            });
            $('#cache_folder').click(function(e) {
                e.preventDefault();
                window.open(DeviceService.getRootFolder());
            });
        });

        function _init() {
            document.addEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady, false);
            document.addEventListener(TQ.DownloadManager.DOWNLOAD_EVENT, onDownload, false);
            DeviceService.initialize();
        }

        // 三个阶段： DeveiceReady, DOM ready, ImageCacheReady, DirReady
        function onFileSystemReady() {
            document.addEventListener(TQ.EVENT.DIR_READY, onDirReady, false);
            document.removeEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady);
            Setup.initialize();
        }

        function onDirReady() {
            document.removeEventListener(TQ.EVENT.DIR_READY, onDirReady);
            assertTrue("device要先ready", DeviceService.isReady());
            TouchService.initGesture();
            // $scope.testDownload();
            GetWcy.testCreateScene();
            // GetWcy.test($scope.data.sceneID);
            // $timeout(function() { $scope.insertLocalImage();}, 100);
            // $cordovaProgress.hide();
        }

        // GetWcy.test();
            $scope.params = 0;
            $scope.getTextMsg = function () {
                var msg = (( !currScene) || (!currScene.currentLevel) || (!currScene.currentLevel.name)) ?
                    "": currScene.currentLevel.name;

                return msg + ": " + TQ.FrameCounter.t();
            };

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
            var path = "p12504.png";
            var server1File = "http://bone.udoido.cn/mcImages/" + path;
            var server2File = "http://www.udoido.com/mcImages/" + path;
            var albumFile ="";
            var cachedFile = DeviceService.getFullPath(TQ.Config.IMAGES_CORE_PATH + path);
            var localFile = "mcImages/" + path;

            // insertImage(cachedFile, x+=50, y+=50);
            insertImage(localFile, x+=50, y+=50);
            // insertImage(server1File, x+=50, y+=50);
            // insertImage(server2File, x+=50, y+=50);
            // insertImage(albumFile, x+=50, y+=50);
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
            TQ.RM.addItem(TQ.Config.IMAGES_CORE_PATH + "ppppp111.png");
            TQ.RM.addItem(TQ.Config.IMAGES_CORE_PATH + "p10324.png");
            TQ.RM.addItem(TQ.Config.IMAGES_CORE_PATH + "p12504.png");
            TQ.RM.addItem("/img/ionic.png");
            $scope.localImage1 = DeviceService.getRootFolder() + 'mcImages/p12504.png';
            $scope.localImage2 = DeviceService.getRootFolder() + 'mcImages/p10324.png';
        };

        function onDownload(evt) {
            var data = evt.data;
            function onSuccess() {
                TQ.DownloadManager.onCompleted(data.name, data.cacheName);
            }

            function onError(error) {
                TQ.DownloadManager.onError(error, data.name, data.cacheName);
            }

            if (evt.data) {
                NetService.get(evt.data.name, onSuccess, onError);
            }
        }

        $scope.testShowWCY = function() {
            GetWcy.test($scope.data.sceneID);
        };

        $scope.testClearAll = function() {
            TQ.SceneEditor.emptyScene();
        };

        var screenshotCounter = 0;
        var screenshotName;
        $scope.saveScreenShot = function () {
            var data = TQ.ScreenShot.getData();
            data = data.replace(/^data:image\/\w+;base64,/, "");
            data = new Blob([Base64Binary.decodeArrayBuffer(data)], {type: 'image/png', encoding: 'utf-8'});
            screenshotName = TQ.Config.SCREENSHOT_CORE_PATH + "nn" + screenshotCounter + ".png";
            FileService.saveFile(screenshotName, data, onSuccess, onError);
            screenshotCounter++;
        };

        function onSuccess() {
            $timeout(function () {
                $scope.localImage2 = DeviceService.getFullPath(screenshotName);
            });
        }

        function onError(e) {
            TQ.Log.error("截图保持出错了！");
            TQ.Log.error(e);
        }

        $scope.saveWorks = function () {
            var data = currScene.getData();
            data = new Blob([data], {type: 'text/plain'});
            var fileName = TQ.Config.WORKS_CORE_PATH + "nn.wcy";
            FileService.saveFile(fileName, data,
                function onSuccess(e) {
                    TQ.Log.info(fileName + " saved");
                    currScene.isSaved = true;
                },
                function onSuccess(e) {
                    TQ.Log.info(fileName + " saved");
            });
        };

        var message = "人人动画";
        var image = "http://bone.udoido.cn/mcImages/" + "p12504.png";
        var link = "http://bone.udoido.cn";
        var subject = "title etc";
        var file = "this is file";

        $scope.share = function() {
            $cordovaSocialSharing
                .share(message, subject, file, link) // Share via native share sheet
                .then(function (result) {
                    console.log('fb success!');
                    console.log(result);
                }, function (err) {
                    console.log('fb error!');
                    console.log(err);
                });
        };

        $scope.shareFB = function(){
            $cordovaSocialSharing
                .shareViaFacebook(message, image, link)
                .then(function(result) {
                    console.log('fb success!');
                    console.log(result);
                }, function(err) {
                    console.log('fb error!');
                    console.log(err);
                });
        }
    }]);
