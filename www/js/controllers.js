angular.module('starter')
    .controller('DashCtrl', ['$scope', '$state', '$timeout', 'GetWcy', '$cordovaImagePicker',
        '$cordovaProgress', '$cordovaSocialSharing',
        'FileService', 'NetService', 'DeviceService', 'Setup', function(
        $scope, $state, $timeout, GetWcy, $cordovaImagePicker,
        $cordovaProgress, $cordovaSocialSharing,
        FileService, NetService, DeviceService, Setup) {

        $scope.localImage1 = null;
        $scope.localImage2 = null;
        $scope.data = {};
        // 12853, 12585; // Bear，  14961;  // 比例变换测试， 15089; // 投票
        $scope.data.sceneID = 14959; // straw berry
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
            DeviceService.initialize();
        }

        // 三个阶段： DeveiceReady, DOM ready, ImageCacheReady, DirReady
        function onFileSystemReady() {
            document.addEventListener(TQ.EVENT.DIR_READY, onDirReady, false);
            document.removeEventListener(TQ.EVENT.FILE_SYSTEM_READY, onFileSystemReady);
            Setup.initialize();
            NetService.initialize();
        }

        function onDirReady() {
            document.removeEventListener(TQ.EVENT.DIR_READY, onDirReady);
            assertTrue("device要先ready", DeviceService.isReady());
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
            TQ.SceneEditor.addItem(desc);
            // TQ.TextEditor.initialize();
            // TQ.TextEditor.addText(TQ.Dictionary.defaultText);
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
            // TQ.RM.addItem(TQ.Config.IMAGES_CORE_PATH + "ppppp111.png");
            // TQ.RM.addItem(TQ.Config.IMAGES_CORE_PATH + "p10324.png");
            // TQ.RM.addItem(TQ.Config.IMAGES_CORE_PATH + "p12504.png");
            // TQ.RM.addItem("img/ionic.png");

            var people_local = [
/*                {name:"人物", path:'mcImages/p15297.png'},
                {name:"人物", path:'mcImages/p15303.png'},
                {name:"人物", path:'mcImages/p15353.png'},
                {name:"人物", path:'mcImages/p15275.png'},
                {name:"人物", path:'mcImages/p15291.png'},
                {name:"人物", path:'mcImages/p15287.png'},
                {name:"人物", path:'mcImages/p15285.png'},
                {name:"人物", path:'mcImages/p15283.png'},
                {name:"人物", path:'mcImages/p15295.png'},
                {name:"人物", path:'mcImages/p15293.png'},
                {name:"人物", path:'mcImages/p15289.png'},
                {name:"人物", path:'mcImages/p15347.png'},
                {name:"人物", path:'mcImages/p15345.png'},
                {name:"人物", path:'mcImages/p15349.png'},
*/
                {name:"人物", path:'mcImages/p15357.png'},
                {name:"人物", path:'mcImages/p15343.png'}
            ];
            TQ.DownloadManager.downloadBulk(people_local);

            $scope.localImage1 = DeviceService.getRootFolder() + 'mcImages/p12504.png';
            $scope.localImage2 = DeviceService.getRootFolder() + 'mcImages/p10324.png';
        };

        $scope.testShowWCY = function() {
            // GetWcy.testCreateScene();
            GetWcy.test($scope.data.sceneID);
        };

        $scope.testClearAll = function() {
            TQ.SceneEditor.emptyScene();
        };

        var screenshotCounter = 0;
        var screenshotName;
        $scope.saveScreenShot = function (_onSuccess) {
            if (!_onSuccess) {
                _onSuccess = onSuccess;
            }
            var data = TQ.ScreenShot.getData();
            data = data.replace(/^data:image\/\w+;base64,/, "");
            data = new Blob([Base64Binary.decodeArrayBuffer(data)], {type: 'image/png', encoding: 'utf-8'});
            screenshotName = TQ.Config.SCREENSHOT_CORE_PATH + "nn" + screenshotCounter + ".png";
            FileService.saveFile(screenshotName, data, onSuccess, onError);
            screenshotCounter++;
        };

            $scope.uploadScreenShot = function (_onSuccess) {
                if (!_onSuccess) {
                    _onSuccess = onSuccess;
                }
                var data = TQ.ScreenShot.getData();
                NetService.uploadData(data, onSuccess, onError);
            };

        function onSuccess(data) {
            $timeout(function () {
                if (data.url) {
                    $scope.localImage2 = data.url;
                } else {
                    $scope.localImage2 = DeviceService.getFullPath(screenshotName);
                }
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
                function onError(e) {
                    TQ.Log.error("出错：无法保存文件: " + fileName + error);
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

