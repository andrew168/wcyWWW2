angular.module('starter').controller('DashCtrl', DashCtrl);
DashCtrl.$injection = ['$scope', '$state', '$timeout', 'WCY', '$cordovaImagePicker',
        '$cordovaProgress', '$cordovaSocialSharing',
        'FileService', 'NetService', 'DeviceService', 'Setup', 'WxService', '$http', 'EditorService',
        'AppService'];

function DashCtrl(
            $scope, $state, $timeout, WCY, $cordovaImagePicker,
            $cordovaProgress, $cordovaSocialSharing,
            FileService, NetService, DeviceService, Setup, WxService, $http, EditorService,
            AppService) {
    $scope.localImage1 = null;
    $scope.localImage2 = null;
    $scope.data = {};
    $scope.state = EditorService.state;
    // 12853, 12585; // Bear，  14961;  // 比例变换测试， 15089; // 投票
    $scope.data.sceneID = 14959; // straw berry

    // AppService.onAppStarting(onAppStaring);
    // AppService.onAppStarted(onAppStarted);
    if (!DeviceService.isReady()) {
        // $cordovaProgress.showSimple(true);
        ionic.Platform.ready(AppService.init);
    } else {
        AppService.init();
    }

    if (TQ.Config.TECH_TEST1_LOCAL_CACHE_ON) {
        $(document).ready(function () {
            $('#clear_cache').click(function (e) {
                e.preventDefault();
                ImgCache.clearCache();
                TQ.DownloadManager.clearCache();
            });
            $('#cache_folder').click(function (e) {
                e.preventDefault();
                window.open(DeviceService.getRootFolder());
            });
        });
    }

    // WCY.test();
    $scope.params = 0;
    $scope.getTextMsg = function () {
        var msg = (( !currScene) || (!currScene.currentLevel) || (!currScene.currentLevel.name)) ?
            "" : currScene.currentLevel.name;

        return msg + ": " + TQ.FrameCounter.t();
    };

    $scope.testCreateLevel = function () {
        var id = currScene.currentLevelId;
        currScene.addLevel(id);
        currScene.gotoLevel(id);
    };

    $scope.gotoPreLevel = function () {
        currScene.preLevel();
    };

    $scope.gotoNextLevel = function () {
        currScene.nextLevel();
    };

    $scope.isPlaying = TQ.FrameCounter.isPlaying();
    $scope.onChange = function () {
        $scope.isPlaying = !$scope.isPlaying;
        if ($scope.isPlaying) {
            TQ.FrameCounter.play();
        } else {
            TQ.FrameCounter.stop();
        }
    };

    var x = 300,
        y = 300;
    $scope.testInsert = function () {
        x = 0.2; // += 50;
        y = 0.5; // += 50;
        // EditorService.insertImage("mcImages/p10324.png", x, y);
        // EditorService.insertSound("mcSounds/p8574.wav", x, y);
        // TQ.TextInputMgr.start();


        // EditorService.insertText("国hello", x, y);
        EditorService.insertSound("v1465523220/c0.mp3");
        // EditorService.insertImage('v1462412871/c961.jpg');
    };

    $scope.addLevel = function() {
        EditorService.addLevel();
    }
    $scope.addLevel = function() {
        EditorService.addLevel();
    };

    $scope.addLevel = function() {
        EditorService.addLevel();
    };

    $scope.deleteLevel = function(id) {
        EditorService.deleteLevel(id);
    };

    $scope.deleteCurrentLevel = function() {
        EditorService.deleteCurrentLevel();
    };

    $scope.gotoPreviousLevel = function() {
        EditorService.gotoPreviousLevel();
    };

    $scope.gotoNextLevel = function() {
        EditorService.gotoNextLevel();
    };

    $scope.play = function() {
        EditorService.play();
    };

    $scope.stop = function() {
        EditorService.stop();
    };

    $scope.setBigFont = function () {
        var ele = TQ.SelectSet.peek();
        if (ele && ele.isText()) {
            var fontLevel = '7';
            EditorService.state.fontLevel = fontLevel;
            ele.setSize(EditorService.state.getFontSize());
        }
    };

    $scope.setColor = function (colorPicker) {
        var ele = TQ.SelectSet.peek();
        if (ele && ele.isText()) {
            var color = '#' + colorPicker.toString();
            EditorService.state.fontColor = color;
            ele.setColor(color);
        }
    };

    window.tqSetFontColor = $scope.setColor;

    $scope.insertFromCamera = function () {
        TQ.CameraService.insertFromCamera();
    };

    $scope.insertImageFromLocal = function () {
        var path = "p12504.png";

        var server1File = "http://bone.udoido.cn/mcImages/" + path;
        var server2File = "http://www.udoido.com/mcImages/" + path;
        if (TQ.Config.cloundaryEnabled) {
            path = 'v1453179217/51.png';
            server1File = 'http://res.cloudinary.com/eplan/image/upload/' + path;
        }
        var albumFile = "";
        var cachedFile = DeviceService.getFullPath(TQ.Config.IMAGES_CORE_PATH + path);
        var localFile = "mcImages/" + path;

        // EditorService.insertImage(cachedFile, x+=50, y+=50);
        // EditorService.insertImage(localFile, x+=50, y+=50);
        EditorService.insertImage(server1File, x += 50, y += 50);
        // EditorService.insertImage(server2File, x+=50, y+=50);
        // EditorService.insertImage(albumFile, x+=50, y+=50);
    };

    $scope.onEndInputText = function () {
        x += 50;
        y += 50;
        TQ.TextEditor.onOK();
        var message = TQ.TextEditor.inputBox.val();
        EditorService.insertText(message, x, y);
    };

    $scope.insertAlbum = function () {
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
                    EditorService.insertImage(results[i], x, y);
                }
            }, function (error) {
                // error getting photos
            });

    };

    $scope.deleteElement = function () {
        TQ.SelectSet.delete();
    };

    $scope.testDownloadBulk = function () {
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
            {name: "人物", path: 'mcImages/p15357.png'},
            {name: "人物", path: 'mcImages/p15343.png'}
        ];
        TQ.DownloadManager.downloadBulk(people_local);

        $scope.localImage1 = DeviceService.getRootFolder() + 'mcImages/p12504.png';
        $scope.localImage2 = DeviceService.getRootFolder() + 'mcImages/p10324.png';
    };

    $scope.testDownload = function () {
        var path = "p12504.png";
        var server1File = "http://bone.udoido.cn/mcImages/" + path;
        NetService.get(server1File);
    };

    $scope.testShowWCY = function () {
        // WCY.createScene();
        WCY.test($scope.data.sceneID);
    };

    $scope.createWcy = function () {
        WCY.create();
    };

    $scope.testClearAll = function () {
        TQ.SceneEditor.emptyScene();
    };

    var screenshotCounter = 0;
    var screenshotName;
    $scope.saveScreenShot = function (_onSuccess) {
        if (!_onSuccess) {
            _onSuccess = onSuccess;
        }
        screenshotName = TQ.Config.SCREENSHOT_CORE_PATH + "nn" + screenshotCounter + ".png";
        FileService.saveImage64(screenshotName, TQ.ScreenShot.getData(), onSuccess, onError);
        screenshotCounter++;
    };

    $scope.uploadScreenShot = function (_onSuccess) {
        if (!_onSuccess) {
            _onSuccess = onSuccess;
        }
        var data = TQ.ScreenShot.getData();
        NetService.uploadOne(data).then(
            onSuccess,
            onError);
    };

    $scope.uploadMat = function (_onSuccess) {
        if (!_onSuccess) {
            _onSuccess = onSuccess;
        }

        var files = document.getElementById('file_input').files;
        NetService.uploadImages(files, _onSuccess);
    };

    $scope.insertImageFromLocal2 = function () {
        EditorService.insertImageFromLocal();
    };

    $scope.insertBkImageFromLocal = function () {
        EditorService.insertBkImageFromLocal();
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
        WCY.save();
    };

    $scope.getWcy = function () {
        WCY.getWcy("100_12345678_123_1234567890");
    };

    var message = "人人动画";
    var image = "http://bone.udoido.cn/mcImages/" + "p12504.png";
    var link = "http://bone.udoido.cn";
    var subject = "title etc";
    var file = "this is file";

    $scope.share = function () {
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

    $scope.shareFB = function () {
        $cordovaSocialSharing
            .shareViaFacebook(message, image, link)
            .then(function (result) {
                console.log('fb success!');
                console.log(result);
            }, function (err) {
                console.log('fb error!');
                console.log(err);
            });
    };

    $scope.shareWx = function () {
        WxService.shareMessage();
    };

    $scope.wxInit = function () {
        WxService.init();
    };

    $scope.getLocale = function (id) {
        return TQ.Lang[id];
    }
}
