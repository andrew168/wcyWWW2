var howlerPlayer;

angular.module("starter").controller("DashCtrl", DashCtrl);
DashCtrl.$inject = ["$scope", "WCY",
  "$cordovaSocialSharing",
  "FileService", "NetService", "DeviceService", "WxService", "EditorService",
  "AppService", "MatLibService", "UserService", "DataService"];

function DashCtrl($scope, WCY,
  $cordovaSocialSharing,
  FileService, NetService, DeviceService, WxService, EditorService,
  AppService, MatLibService, UserService, DataService) {
  var vm = this;
  $scope.font = {
    selectedValue: null,
    selectedSingle: "Samantha",
    selectedSingleKey: "5"
  };

  $scope.timelineSlider = TQ.TimerUI.rangeSlider;
  $scope.fontSizes = [
    { value: 1, size: "1" },
    { value: 2, size: "2" },
    { value: 3, size: "3" },
    { value: 4, size: "4" },
    { value: 5, size: "5" },
    { value: 6, size: "6" },
    { value: 7, size: "7" }];

  $scope.localImage1 = null;
  $scope.localImage2 = null;
  $scope.data = {};
  $scope.state = EditorService.state;
  // 12853, 12585; // Bear，  14961;  // 比例变换测试， 15089; // 投票
  $scope.data.sceneId = 14959; // straw berry

  $scope.testShowMsg = testShowMsg;
  $scope.testPrompt = testPrompt;
  $scope.testDataService = testDataService;

  // implementation, abc order
  function testShowMsg() {
    TQ.MessageBox.showWaiting(TQ.Locale.getStr("loading..."));
  }

  function testPrompt() {
    TQ.MessageBox.prompt(TQ.Locale.getStr("Are you sure?"));
  }

  // AppService.onAppStarting(onAppStaring);
  AppService.onAppStarted(onAppStarted);

  function onAppStarted() {
    // TQ.Log.setLevel(TQ.Log.INFO_LEVEL);
    TQ.Log.checkPoint("App Started");
    var opus = TQ.QueryParams.shareCode;
    EditorService.initialize();
    if (opus) {
      WCY.getWcy(opus);
    } else {
      WCY.start();
    }
  }

  if (TQ.Config.TECH_TEST1_LOCAL_CACHE_ON) {
    $(document).ready(function() {
      $("#clear_cache").click(function(e) {
        e.preventDefault();
        ImgCache.clearCache();
        TQ.DownloadManager.clearCache();
      });
      $("#cache_folder").click(function(e) {
        e.preventDefault();
        window.open(DeviceService.getRootFolder());
      });
    });
  }

  // WCY.test();
  $scope.params = 0;
  $scope.getTextMsg = function() {
    var msg = ((!currScene) || (!currScene.currentLevel) || (!currScene.currentLevel.name))
      ? "" : currScene.currentLevel.name;

    return msg + ": " + TQ.FrameCounter.t();
  };

  $scope.testCreateLevel = function() {
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
    TQ.AssertExt.InvalidLog(TQ.userProfile.name !== "toronto1111"); // 必须登陆为User "toronto1111";

    // 设置User 1为Admin， 在之前、之后分别list全部user， 查看其权限，比较变化
    var userId = 1;
    UserService.getUserList();
    UserService.setAdmin(userId).then(function() {
      var list = UserService.getUserList();
      console.log(list.toString());
    });
  };

  $scope.batchUnitTest = function() {
    WCY.saveOpusAndScreenshot();
  };

  $scope.testSignUp = function() {
    var name = "toronto1111";
    UserService.signUp({
      email: name,
      password: "toronto1111",
      displayName: "toronto1111",
      userType: 4, // creative teacher
      groupId: "1111"
    }).then(function(data) {
      console.log("signUp successfully!" + data);
    });
  };

  /* $scope.testSignUp = function () {
    var email = '8' + (++testUserId) + "@samplexyz.com";
    UserService.signUp({
      email: email,
      password: "pswwwwww" + testUserId,
      displayName: "display" + testUserId,
      userType: 1,
      groupId: "1111"
    }).then(function(data) {
      console.log("signUp successfully!" + data);
    });
  };
  */

  $scope.testUserManagement = function() {
    // change user 2222 to type 4:
    UserService.getUserList();
    UserService.setAdmin(7);
    UserService.getUserList();
  };

  $scope.testLogin = function(id) {
    UserService.login("toronto" + id, "toronto" + id)
      .then(function() {
        if (TQ.userProfile.loggedIn) {
          DataService.reload();
        }
      });
  };

  $scope.testWxLogin = function(id) {
    var wxBoneToken = "code123456ABC#%^*()"; var displayName = "大写小写特殊码";
    UserService.loginFromWx(wxBoneToken, displayName).then(function() {
      if (TQ.userProfile.loggedIn) {
        DataService.reload();
        console.log("OOOOOOOOOK!");
      }
    });
  };

  $scope.testAuthenticate = function(authName) {
    UserService.authenticate(authName);
  };

  $scope.testLogout = function() {
    UserService.logout()
      .then(function() {
        TQ.Log.debugInfo("logout successfully!");
      });
  };
  $scope.refineOpus = function() {
    EditorService.refineOpus({ wcyId: 2167 });
  };
  $scope.banOpus = function() {
    EditorService.banOpus({ wcyId: 2167 });
  };
  $scope.addSprite = function() {
    EditorService.addSprite({
      public_id: "c344",
      matType: TQ.MatType.SOUND,
      extra: {
        spriteMap: [
          "smile",
          "cry",
          "afraid"
        ],
        sprite: {
          "smile": [0, 1500],
          "cry": [2000, 800],
          "afraid": [3000, 1500]
        }
      }
    });
  };

  $scope.deleteLevel = function(id) {
    EditorService.deleteLevel(id);
  };

  $scope.deleteCurrentLevel = function() {
    EditorService.deleteCurrentLevel();
  };

  $scope.gotoPreLevel = function() {
    EditorService.gotoPreviousLevel();
  };

  $scope.gotoNextLevel = function() {
    EditorService.gotoNextLevel();
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

  var x = 300;
  var y = 300;
  $scope.testInsert = function() {
    x = currScene.getDesignatedWidth() / 2;
    y = currScene.getDesignatedHeight() / 2;
    EditorService.insertText("国hello", x, y);
  };

  $scope.insertProp = function() {
    // var prop = "https://res.cloudinary.com/eplan/image/upload/v1509928224/c67.png";
    var prop = "https://res.cloudinary.com/eplan/image/upload/v1524949173/c2292.png";
    EditorService.insertPropImage(prop, 300, 300);
  };

  $scope.insertPeople = function() {
    EditorService.insertPeopleImage("https://res.cloudinary.com/eplan/image/upload/v1501348053/c29.png",
      200, 300, TQ.Element.FitFlag.NO);
  };

  $scope.insertIComponent = function() {
    var iComponentId = 4698;
    // var iComponentId = 4725;
    // var iComponentId = 4727;
    // var iComponentId = 4729;

    EditorService.insertIComponent("https://" + TQ.Config.ENT_HOST + "/wcy/0_" + iComponentId + "_0_0",
      200, 300, TQ.Element.FitFlag.NO);
  };

  $scope.insertBkImage = function() {
    EditorService.insertBkImage("https://res.cloudinary.com/eplan/image/upload/v1484036387/c1.png",
      300, 300);
    // EditorService.gotoNextLevel();
  };

  $scope.insertSound = function() {
    EditorService.insertSound("https://res.cloudinary.com/eplan/video/upload/v1528257405/c48.mp3");
    // EditorService.gotoNextLevel();
  };

  $scope.insertCircle = function() {
    EditorService.insertCircle(0, 0, 10);
    EditorService.insertCircle(100, 0, 10);
    EditorService.insertCircle(200, 0, 10);
    EditorService.insertCircle(0, 100, 10);
    EditorService.insertCircle(100, 100, 10);
    EditorService.insertCircle(200, 100, 10);
    EditorService.insertCircle(0, 200, 10);
    EditorService.insertCircle(100, 200, 10);
    EditorService.insertCircle(200, 200, 10);
    EditorService.insertCircle(0, 300, 10);
    EditorService.insertCircle(100, 300, 10);
    EditorService.insertCircle(200, 300, 10);
  };

  $scope.insertRectangle = function() {
    EditorService.insertRectangle(0, 0, 100, 100);
    EditorService.insertRectangle(100, 0, 100, 100);
    EditorService.insertRectangle(200, 0, 100, 100);
    EditorService.insertRectangle(0, 100, 100, 100);
    EditorService.insertRectangle(100, 100, 100, 100);
    EditorService.insertRectangle(200, 100, 100, 100);
    EditorService.insertRectangle(0, 200, 100, 100);
    EditorService.insertRectangle(100, 200, 100, 100);
    EditorService.insertRectangle(200, 200, 100, 100);
    EditorService.insertRectangle(100, 300, 100, 100);
  };

  $scope.startRecord = function() {
    EditorService.startRecord();
  };

  $scope.stopRecord = function() {
    EditorService.stopRecord();
  };

  $scope.setBigFont = function() {
    var ele = TQ.SelectSet.peek();
    if (ele && ele.isText()) {
      var fontLevel = "7";
      EditorService.state.fontLevel = fontLevel;
      ele.setSize(EditorService.state.getFontSize());
    }
  };

  $scope.setColor = function(colorPicker) {
    var ele = TQ.SelectSet.peek();
    if (ele && ele.isText()) {
      var color = "#" + colorPicker.toString();
      EditorService.state.fontColor = color;
      ele.setColor(color);
    }
  };

  $scope.insertFromCamera = function() {
    TQ.CameraService.insertFromCamera();
  };

  function insertPropFromLocal(evt) {
    var matType = TQ.MatType.PROP;
    var useDevice = false;
    console.log(evt);
    const files = TQ.Utility.getFilesFromEvent(evt);
    if (files) {
      EditorService.loadLocalImage(matType, useDevice, evt.target.files, onLocalImageLoaded);
    }
  }

  var _currentMusic = null;
  function insertSoundFromLocal(evt) {
    console.log(evt);
    var matType = TQ.MatType.SOUND;
    const useDevice = false;
    const files = TQ.Utility.getFilesFromEvent(evt);
    if (files) {
      EditorService.loadLocalSound(matType, useDevice, files, onLocalSoundLoaded);
    }
  }

  $scope.insertSoundFromRecorder = function(evt) {
    const useDevice = true;
    var matType = TQ.MatType.SOUND;
    EditorService.loadLocalSound(matType, useDevice, null, onLocalSoundLoaded);
  };

  setTimeout(function() {
    document.getElementById("id-input-image").addEventListener("change", insertPropFromLocal);
    document.getElementById("id-input-sound").addEventListener("change", insertSoundFromLocal);
  });

  function onLocalSoundLoaded(desc, fileOrBlob, matType) {
    desc.isCrossLevel = (!!TQUtility.isSoundFile(fileOrBlob)); // 假设：本地文件是背景音， 录音是本场景的
    if (TQUtility.isSoundFile(fileOrBlob)) {
      doAddLocalSound(desc, fileOrBlob);
    } else { // 实时录音
      const lastVoiceRecording = {
        desc: desc,
        fileOrBlob: fileOrBlob
      };
      onTryMusic({ path: desc.src });
    }
  }

  function doAddLocalSound(desc, fileOrBlob) {
    $scope.onStopTryMusic();
    var ele = TQ.SceneEditor.addItem(desc);
    TQ.SceneEditor.lastSoundElement = ele;
    TQ.ResourceSync.local2Cloud(ele, fileOrBlob, TQ.MatType.SOUND);
  }

  $scope.stopAudioRecording = function() {
    if (TQ.AudioRecorder.isRecording) {
      return TQ.AudioRecorder.stop();
    }
  };

  function onTryMusic(prop) {
    if (prop && prop.path) {
      if (_currentMusic && prop.path === _currentMusic.path) {
        $scope.onStopTryMusic();
      } else {
        TQ.SoundMgr.play(prop.path);
        _currentMusic = prop;
      }
    }
  }

  $scope.onStopTryMusic = function() {
    if (_currentMusic && _currentMusic.path) {
      TQ.SoundMgr.stopAllDirectSound();
      _currentMusic = null;
    }
  };

  $scope.playHowlerAudio = function() {
    if (!howlerPlayer) {
      var spriteMap = [
        "smile",
        "cry",
        "afraid"
      ];
      var sprite = {
        "smile": [0, 1500],
        "cry": [2000, 800],
        "afraid": [3000, 1500]
      };
      // howlerPlayer = new TQ.HowlerPlayer('v1528257405/c48.mp3', sprite, spriteMap);
      howlerPlayer = EditorService.insertSound({
        src: "https://res.cloudinary.com/eplan/video/upload/v1528257405/c48.mp3",
        sprite: sprite,
        spriteMap: spriteMap
      });
    }
    // howlerPlayer.play(false, 'smile');
    howlerPlayer.playNextSound();
  };
  $scope.pauseHowlerAudio = function() {
    howlerPlayer.pause();
  };

  $scope.deleteElement = function() {
    TQ.SelectSet.delete();
  };

  $scope.undo = function() {
    TQ.CommandMgr.undo();
  };

  $scope.redo = function() {
    TQ.CommandMgr.redo();
  };

  $scope.testDownloadBulk = function() {
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
      { name: "人物", path: "mcImages/p15357.png" },
      { name: "人物", path: "mcImages/p15343.png" }
    ];
    TQ.DownloadManager.downloadBulk(people_local);

    $scope.localImage1 = DeviceService.getRootFolder() + "mcImages/p12504.png";
    $scope.localImage2 = DeviceService.getRootFolder() + "mcImages/p10324.png";
  };

  $scope.testDownload = function() {
    var path = "p12504.png";
    var server1File = TQ.Config.BONE_HOST + "/mcImages/" + path;
    NetService.get(server1File);
  };

  $scope.createWcy = function() {
    WCY.create();
  };

  $scope.testClearAll = function() {
    TQ.SceneEditor.emptyScene();
  };

  $scope.uploadScreenshot = function() {
    WCY.uploadScreenshot();
  };

  $scope.insertBkImageFromLocal = function() {
    var matType = TQ.MatType.BKG;
    var useDevice = true;

    EditorService.loadLocalImage(matType, useDevice, onLocalImageLoaded);
  };

  function onLocalImageLoaded(desc, image64Data, matType) {
    var ele = TQ.SceneEditor.addItem(desc);
    if (ele) {
      TQ.ResourceSync.local2Cloud(ele, image64Data, matType);
    }
  }

  $scope.saveWorks = function() {
    WCY.save();
  };

  $scope.getWcy = function() {
    WCY.getWcy("100_12345678_123_1234567890");
  };

  var message = "人人动画";
  var image = TQ.Config.BONE_HOST + "/mcImages/" + "p12504.png";
  var link = TQ.Config.BONE_HOST;
  var subject = "title etc";
  var file = "this is file";

  $scope.share = function() {
    $cordovaSocialSharing
      .share(message, subject, file, link) // Share via native share sheet
      .then(function(result) {
        TQ.Log.debugInfo("fb success!");
        TQ.Log.debugInfo(result);
      }, function(err) {
        TQ.Log.debugInfo("fb error!");
        TQ.Log.error(err);
      });
  };

  $scope.shareFB = function() {
    EditorService.shareFbWeb();
  };

  $scope.shareFbApp = function() {
    $cordovaSocialSharing
      .shareViaFacebook(message, image, link)
      .then(function(result) {
        TQ.Log.debugInfo("fb success!");
        TQ.Log.debugInfo(result);
      }, function(err) {
        TQ.Log.debugInfo("fb error!");
        TQ.Log.error(err);
      });
  };

  $scope.shareWx = function() {
    WxService.shareMessage();
  };

  $scope.getLocale = function(id) {
    TQ.Log.depreciated("已经被替代LocaleManager和zh.json代替");
    return {};
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

  $scope.setLang = function(lang) {
    return TQ.Locale.setLang(lang);
  };

  $scope.$on(TQ.Scene.EVENT_END_OF_PLAY, function() {
    // EditorService.toAddMode()
  });

  function testDataService() {
    DataService.initialize();
    DataService.getProps(10);
  }

  $scope.addTopic = function() {
    var topic = {
      title: "小马过河",
      // questionOpusId: Number,
      // ssPath: Number,
      // statTime: {type: Date},
      // endTime: {type: Date},
      // lastModified: {type: Date, default: Date.now},
      // authorId: Number,
      authorName: "张三",
      authorSchool: "图强"
    };

    EditorService.addTopic(topic);
  };

  $scope.updateTopic = function() {
    var topic = {
      _id: 7,
      title: "小马2"
    };
    EditorService.updateTopic(topic);
  };

  $scope.getTopics = function() {
    DataService.getTopics();
  };

  $scope.attachTopic = function() {
    // EditorService.attachTopic(10, "218", 7);
    // EditorService.attachTopic(10, "196", 7);
    // EditorService.attachTopic(20, "271", 7);
    // EditorService.attachTopic(20, "269", 7);
    EditorService.attachTopic(10, "281", 7);
    EditorService.attachTopic(20, "281", 7);
    EditorService.attachTopic(20, "272", 2);
    EditorService.attachTopic(20, "97", 7);
  };

  $scope.detachTopic = function() {
    EditorService.detachTopic(30, "29", 7);
  };

  $scope.getOutro = function() {
    currScene.attachOutro(currScene.levels);
  };

  $scope.$on(TQ.Scene.EVENT_READY, function() {
    if (!TQ.State.isPlayOnly) {
      EditorService.toAddMode();
    }
  });

  function initialize() {
    TQ.QueryParams = TQ.Utility.parseUrl();
    var lastOpus = null;
    $scope.$on("$locationChangeStart", function(evt) {
      console.log(evt);
      TQ.QueryParams = TQ.Utility.parseUrl();
      var opus = TQ.QueryParams.shareCode || TQ.QueryParamsConverted.shareCode;
      TQ.QueryParamsConverted = null;
      if (opus !== lastOpus) {
        lastOpus = opus;
        if (opus) {
          WCY.getWcy(opus);
        } else {
          WCY.start();
        }
      }
    });
  }

  initialize();
  // var howlerPlayer22 = new TQ.HowlerPlayer('v1528257405/c48.mp3');
  // howlerPlayer22.howl.once('load', function () {
  //   howlerPlayer22.play();
  // })
}
