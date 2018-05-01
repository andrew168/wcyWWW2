angular.module('starter').controller('DashCtrl', DashCtrl);
DashCtrl.$inject = ['$scope', '$stateParams', 'WCY', '$cordovaImagePicker',
        '$cordovaSocialSharing',
        'FileService', 'NetService', 'DeviceService', 'WxService', 'EditorService',
        'AppService', 'MatLibService', 'UserService', 'DataService'];

function DashCtrl($scope, $stateParams, WCY, $cordovaImagePicker,
            $cordovaSocialSharing,
            FileService, NetService, DeviceService, WxService, EditorService,
            AppService, MatLibService, UserService, DataService) {

    var vm = this;
    $scope.font = {
        selectedValue: null,
        selectedSingle: 'Samantha',
        selectedSingleKey: '5'
    };

    $scope.timelineSlider = TQ.TimerUI.rangeSlider;
    $scope.fontSizes = [
        {value: 1, size: '1'},
        {value: 2, size: '2'},
        {value: 3, size: '3'},
        {value: 4, size: '4'},
        {value: 5, size: '5'},
        {value: 6, size: '6'},
        {value: 7, size: '7'}];

    $scope.localImage1 = null;
    $scope.localImage2 = null;
    $scope.data = {};
    $scope.state = EditorService.state;
    // 12853, 12585; // Bear，  14961;  // 比例变换测试， 15089; // 投票
    $scope.data.sceneID = 14959; // straw berry

    $scope.testShowMsg = testShowMsg;
    $scope.testPrompt = testPrompt;
    $scope.testDataService = testDataService;


    // implementation, abc order
    function testShowMsg() {
        TQ.MessageBox.showWaiting(TQ.Locale.getStr('loading...'));
    }

    function testPrompt() {
        TQ.MessageBox.prompt(TQ.Locale.getStr('Are you sure?'));
    }

    // AppService.onAppStarting(onAppStaring);
    AppService.onAppStarted(onAppStarted);

    function onAppStarted() {
        //TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
        TQ.Log.checkPoint("App Started");
        var opus = $stateParams.shareCode || TQ.Utility.getUrlParam('opus');
        EditorService.initialize();
        if (opus) {
            WCY.getWcy(opus);
        } else {
            WCY.start();
        }
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

    $scope.EditorService = EditorService;
    $scope.es = EditorService;
    $scope.am = TQ.AnimationManager;
    $scope.pteState = TQ.PageTransitionEffect.state;
    $scope.SelectSet = TQ.SelectSet;
    $scope.addLevel = function() {
        EditorService.addLevel();
    };

    var testUserId = Date.now(); // // "TestAuth100007",
    $scope.setAdmin = function() {
        // UserService.setAdmin('1759');
        UserService.getUserList();
    };

    $scope.testSignUp = function () {
        testUserId++;
        email = 'T' + testUserId + "@samplexyz.com";
        UserService.signUp(email, 'pswwwwww' + testUserId, 'display' + testUserId).
            then(function (data) {
                console.log("signUp successfully!" + data);
            });
    };

    $scope.testLogin = function (id) {
        UserService.login('toronto' + id, 'toronto' + id).
        then(function() {
                if (TQ.userProfile.loggedIn) {
                    DataService.reload();
                }
            });
    };

    $scope.testAuthenticate = function(authName) {
        UserService.authenticate(authName);
    };

    $scope.testLogout = function() {
        UserService.logout().
        then(function() {
                TQ.Log.debugInfo('logout successfully!');
            });
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
        x = currScene.getDesignatedWidth() / 2;
        y = currScene.getDesignatedHeight() / 2;
        EditorService.insertText("国hello", x, y);
    };

    $scope.insertProp = function() {
        // var prop = "https://res.cloudinary.com/eplan/image/upload/v1509928224/c67.png";
        var prop = "https://res.cloudinary.com/eplan/image/upload/v1524949173/c2292.png";
        EditorService.insertPropImage(prop, 300, 300);
    };

    $scope.insertPeople = function () {
        EditorService.insertPeopleImage("https://res.cloudinary.com/eplan/image/upload/v1501348053/c29.png",
            300, 300);
    };

    $scope.insertBkImage = function () {
        EditorService.insertBkImage("https://res.cloudinary.com/eplan/image/upload/v1484036387/c1.png",
            300, 300);
    };

    $scope.insertRectangle = function () {
        // EditorService.insertRectangle(200, 400, 300, 300);
        // EditorService.insertRectangle(200, 400, 200, 200);
        //EditorService.insertRectangle(200, 400, 150, 150);
        EditorService.insertRectangle(200, 400, 100, 100);
        // EditorService.insertRectangle(200, 400, 50, 50);
        // EditorService.insertRectangle(200, 400, 10, 10);
        // EditorService.insertRectangle(200, 400, 5, 5);
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
                    TQ.Log.debugInfo('Image URI: ' + results[i]);
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
        var server1File = TQ.Config.BONE_HOST + "/mcImages/" + path;
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

    $scope.uploadScreenshot = function () {
        WCY.uploadScreenshot();
    };

    $scope.insertBkImageFromLocal = function () {
        EditorService.insertBkImageFromLocal();
    };

    $scope.saveWorks = function () {
        WCY.save();
    };

    $scope.getWcy = function () {
        WCY.getWcy("100_12345678_123_1234567890");
    };

    var message = "人人动画";
    var image = TQ.Config.BONE_HOST + "/mcImages/" + "p12504.png";
    var link = TQ.Config.BONE_HOST;
    var subject = "title etc";
    var file = "this is file";

    $scope.share = function () {
        $cordovaSocialSharing
            .share(message, subject, file, link) // Share via native share sheet
            .then(function (result) {
                TQ.Log.debugInfo('fb success!');
                TQ.Log.debugInfo(result);
            }, function (err) {
                TQ.Log.debugInfo('fb error!');
                TQ.Log.error(err);
            });
    };

    $scope.shareFB = function () {
        EditorService.shareFbWeb();
    };

    $scope.shareFbApp = function () {
        $cordovaSocialSharing
            .shareViaFacebook(message, image, link)
            .then(function (result) {
                TQ.Log.debugInfo('fb success!');
                TQ.Log.debugInfo(result);
            }, function (err) {
                TQ.Log.debugInfo('fb error!');
                TQ.Log.error(err);
            });
    };

    $scope.shareWx = function () {
        WxService.shareMessage();
    };

    $scope.getLocale = function (id) {
        return TQ.Lang[id];
    };

    $scope.reloadN = function() {
        WCY.getWcyById(144);
    };

    $scope.makeOrder = function() {
        TQ.Pay.showButton();
    };

    $scope.getStr = function(tag) {
        return TQ.Locale.getStr(tag);
    };

    $scope.setLang = function (lang) {
        return TQ.Locale.setLang(lang);
    };

    $scope.$on(TQ.Scene.EVENT_END_OF_PLAY, function () {
        EditorService.toAddMode()
    });

    function testDataService() {
        DataService.initialize();
        DataService.getProps(10);
    }
}
