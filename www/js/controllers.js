angular.module('starter').controller('DashCtrl', DashCtrl);
DashCtrl.$injection = ['$scope', '$state', '$timeout', 'WCY', '$cordovaImagePicker',
        '$cordovaProgress', '$cordovaSocialSharing',
        'FileService', 'NetService', 'DeviceService', 'Setup', 'WxService', '$http', 'EditorService',
        'AppService', 'MatLibService'];

function DashCtrl(
            $scope, $state, $timeout, WCY, $cordovaImagePicker,
            $cordovaProgress, $cordovaSocialSharing,
            FileService, NetService, DeviceService, Setup, WxService, $http, EditorService,
            AppService, MatLibService) {
    var vm = this;
    $scope.localImage1 = null;
    $scope.localImage2 = null;
    $scope.data = {};
    $scope.state = EditorService.state;
    // 12853, 12585; // Bear，  14961;  // 比例变换测试， 15089; // 投票
    $scope.data.sceneID = 14959; // straw berry

    $scope.testShowMsg = testShowMsg;
    $scope.testPrompt = testPrompt;

    MatLibService.search("food");

    // implementation, abc order
    function testShowMsg() {
        TQ.MessageBox.showWaiting("loading...");
    }

    function testPrompt() {
        TQ.MessageBox.prompt("Are you sure?");
    }

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

    $scope.addLevel = function() {
        EditorService.addLevel();
    };

    $scope.deleteLevel = function(id) {
        EditorService.deleteLevel(id);
    };

    $scope.deleteCurrentLevel = function() {
        EditorService.deleteCurrentLevel();
    };

    $scope.gotoPreLevel = function () {
        EditorService.gotoPreviousLevel();
    };

    $scope.gotoNextLevel = function() {
        EditorService.gotoNextLevel();
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
        EditorService.insertText("国hello", x, y);
    };

    $scope.play = function() {
        EditorService.play();
    };

    $scope.stop = function() {
        EditorService.stop();
    };

    $scope.replay = function() {
        EditorService.replay();
    };

    $scope.startRecord = function() {
        EditorService.startRecord();
    };

    $scope.stopRecord = function() {
        EditorService.stopRecord();
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

    $scope.insertPropFromLocal = function () {
        EditorService.insertPropFromLocal();
    };

    $scope.insertSoundFromLocal = function () {
        EditorService.insertSoundFromLocal();
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
                    EditorService.insertBkImage(results[i], x, y);
                }
            }, function (error) {
                // error getting photos
            });

    };

    $scope.deleteElement = function () {
        TQ.SelectSet.delete();
    };


    $scope.undo = function() {
        TQ.CommandMgr.undo();
    };

    $scope.redo = function() {
        TQ.CommandMgr.redo();
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

    $scope.uploadScreenShot = function () {
        WCY.uploadScreenshot();
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
        EditorService.shareFbWeb();
    };

    $scope.shareFbApp = function () {
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

    $scope.getLocale = function (id) {
        return TQ.Lang[id];
    }
}
