window.TQ = window.TQ || {};
var canvas;
var stage = null;
var stageContainer = null;
var currScene = null;

(function () {

  // 场景编辑器,
  function SceneEditor() {
  }

  SceneEditor.MODE = {
    NOT_INITIALIZED: 0,
    LOADING: 100, // 加载页
    WELCOME: 110,
    LOGIN: 115, // 首页 （没有canvas，1--1999）
    FIRST: 120, // 首页 （没有canvas，1--1999）

    // 以下是登录之后的
    MY_WORK: 210, // 个人作品也，

    // 以下>2000, 都属于EDIT和Play，都需要canvas
    EDIT_OR_PLAY: 2000, // 编辑,分享等 （有canvas，>=2000）
    EDIT: 2100, // 编辑
    // EDIT_IMAGE: 2200, // 尚未以他们代替 flag变量
    // RECORD_AUDIO: 2300,
    PREVIEW: 2400 // Play, Preview
  };

  TQ.State.editorMode = SceneEditor.NOT_INITIALIZED;
  var editorOn = false,
    _auxContainer;

  Object.defineProperty(SceneEditor, 'auxContainer', {
    get: function () {
      return _auxContainer;
    }
  });

  SceneEditor._mode = TQBase.LevelState.EDITING; // 创作界面的缺省模式是编辑.

  // 接口
  SceneEditor.turnOnEditor = turnOnEditor;
  SceneEditor.preprocessLocalImage = preprocessLocalImage;
  SceneEditor.lastSoundElement = null;

  SceneEditor.openScene = function (fileInfo) {
    if (fileInfo.isPlayOnly === undefined) {
      fileInfo.isPlayOnly = false;
    }
    init(fileInfo);
  };

  SceneEditor.createScene = function (option) {
    TQ.Assert.isNotNull(option);
    var fileInfo = {
      filename: option.filename || TQ.Config.UNNAMED_SCENE,
      screenshotName: option.screenshotName,
      content: TQ.Scene.getEmptySceneJSON()
    };
    TQ.State.isPlayOnly = false;
    SceneEditor.openScene(fileInfo);
  };

  function createStage() {
    canvas = TQ.Graphics.getCanvas();
    //ToDo:AZ
    // addHammer(canvas);
    // create a new stage and point it at our canvas:
    stage = new createjs.Stage(canvas);
    SceneEditor.stageContainer = stageContainer = new createjs.Container();
    _auxContainer = new createjs.Container();
    stage.addChild(stageContainer);
    stage.addChild(_auxContainer); // aux层，总是在上，存放BBox， marker等
    SceneEditor.stage = stage;
  }

  SceneEditor.cleanStage = function () {
    if (stageContainer) {
      stageContainer.children.splice(0);
    }

    if (_auxContainer) {
      _auxContainer.children.splice(0);
    }
  };

  SceneEditor.addItemByFile = function (dstLevel, data, matType, callback) {
    var aFile = data.aFile || data;

    if ((aFile instanceof File) && aFile.size > TQ.Config.MAT_MAX_FILE_SIZE) {
      return TQ.MessageBox.show("Resource file size should less than " + TQ.Config.MAT_MAX_FILE_SIZE_IN_M + 'M');
    }

    if (matType === TQ.MatType.SOUND) {
      if (!TQUtility.isSoundFile(aFile) && !TQUtility.isSoundBlob(aFile)) {
        var str = TQ.Locale.getStr('found audio format unsupported, please use wav or map3') + ': ' + aFile.type;
        TQ.MessageBox.show(str);
      } else {
        if (aFile.size > TQ.Config.MAT_MAX_FILE_SIZE) {
          return TQ.MessageBox.show("Resource file size should less than " + TQ.Config.MAT_MAX_FILE_SIZE_IN_M + 'M');
        }
        addItemBySoundFile(dstLevel, aFile, matType, callback);
      }
    }
  };

  function preprocessLocalImage(dstLevel, data, matType, callback, kouTuMain) {// reduce size,
    var aFile = data.aFile || data,
      options = {crossOrigin: "Anonymous"};  // "Use-Credentials";

    if ((aFile instanceof File) && aFile.size > TQ.Config.MAT_MAX_FILE_SIZE) {
      return TQ.MessageBox.show("Resource file size should less than " + TQ.Config.MAT_MAX_FILE_SIZE_IN_M + 'M');
    }

    if (TQUtility.isVideoFile(aFile)) {
      addVideoItem(dstLevel, aFile, matType, callback);
    } else if (TQ.ImageCliper) {
      TQ.ImageCliper.clipImage(aFile, function (imageData) {
        if (imageData) {
          addItemByImageData(dstLevel, imageData, matType, callback);
        }
      });
    } else {
      var stopReminder = true;
      TQ.ImageProcess.start(aFile, options,
        function (buffer) {
          if (!stopReminder && !!buffer.errorCode && buffer.errorCode !== 0) {
            TQ.MessageBox.prompt("For this design, the image file's width and height should be <= " +
              TQ.Config.designatedWidth + " by " + TQ.Config.designatedHeight + ", do you want to resize automatically?",
              nextProcess,
              function () {
              });
          } else {
            nextProcess();
          }

          function nextProcess() {
            if (kouTuMain) {
              koutuMain(buffer.data, matType, function (image64) {
                addItemByImageData(dstLevel, image64, matType, callback);
              });
            } else {
              addItemByImageData(dstLevel, buffer.data, matType, callback);
            }
          }
        });
    }
  }

  function addItemByImageData(dstLevel, image64Data, matType, callback) {
    var img = new Image();
    img.onload = doAdd;
    if (TQUtility.isLocalFile(image64Data)) {
      img.src = TQUtility.fileToUrl(image64Data, {});
    } else { // base64
      img.src = image64Data;
    }

    function doAdd() {
      var desc = {
        data: img,
        src: null, type: "Bitmap", autoFit: determineAutoFit(matType),
        dstLevel: dstLevel,
        eType: TQ.MatType.toEType(matType)
      };

      callback(desc, image64Data, matType);
    }
  }

  function addVideoItem(dstLevel, aFile, matType, callback) {
    var video = document.createElement('video');
    video.onloadeddata = doAdd;
    if (TQUtility.isLocalFile(aFile)) {
      video.src = TQUtility.fileToUrl(aFile, {});
    } else {
      TQ.AssertExt.invalidLogic(false, "video 应该是本地视频文件");
    }

    function doAdd(event) {
      console.log(event);
      var desc = {
        data: video,
        src: null,
        type: TQ.ElementType.VIDEO,
        autoFit: determineAutoFit(matType),
        dstLevel: dstLevel,
        eType: TQ.MatType.toEType(matType)
      };

      callback(desc, aFile, matType);
    }
  }

  function addItemBySoundFile(dstLevel, fileOrBlob, matType, callback) {
    TQ.RM.loadSoundFromFile(fileOrBlob, function (result) {
      var desc = {
        data: TQ.RM.getResource(result.item.id).res,
        src: result.item.id, type: TQ.ElementType.SOUND,
        dstLevel: dstLevel,
        eType: TQ.MatType.toEType(matType)
      };

      callback(desc, fileOrBlob, matType);
    });
  }

  SceneEditor.addItem = function (desc) {
    desc.version = TQ.Element.VER3;  // 新增加的元素都是2.0
    if (!desc.eType) {
      TQ.Log.error("未定义的eType");
    }

    if (!desc.dstLevel) {
      desc.dstLevel = currScene.currentLevel;
    }
    // "Groupfile" 暂时还没有纳入RM的管理范畴
    if (((desc.type === TQ.ElementType.SOUND) ||
        (desc.type === TQ.ElementType.BITMAP) ||
        (desc.type === TQ.ElementType.VIDEO) ||
        (desc.type === TQ.ElementType.BUTTON)) && !desc.data &&
      (!TQ.RM.hasElementDesc(desc))) {
      TQ.RM.addElementDesc(desc, doAdd);
      return null; // 无法立即添加并返回ele，因为资源不ready
    } else {
      return doAdd();
    }

    function doAdd() {
      var ele = currScene.addItem(desc);
      TQ.Assert.isTrue(!!desc.eType);
      if (ele.level && ele.level.isActive()) {
        ele.isNewlyAdded = true;
      }
      return ele;
    }
  };

  SceneEditor.emptyScene = function () { // empty the current scene
    TQ.AssertExt.isNotNull(currScene);
    if (!currScene) {
      return false;
    }

    currScene.empty();
  };

  SceneEditor.getMode = function () {
    if (TQ.State.isPlayOnly) {
      return TQBase.LevelState.RUNNING;
    }
    return SceneEditor._mode;
  };

  SceneEditor.setEditMode = function () {
    if (!currScene) {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      return false;
    }
    TQ.FrameCounter.stop();
    SceneEditor.setMode(TQBase.LevelState.EDITING);
  };

  SceneEditor.setPlayMode = function () {
    if (!currScene) {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      return false;
    }
    TQ.FrameCounter.play();
    SceneEditor.setMode(TQBase.LevelState.RUNNING);
  };

  SceneEditor.updateMode = function () {
    if (SceneEditor._requestMode == null) return;
    SceneEditor._mode = SceneEditor._requestMode;
    SceneEditor._requestMode = null;
  };

  SceneEditor.setMode = function (mode) {
    SceneEditor._requestMode = mode;
  };
  SceneEditor.isEditMode = function () {
    SceneEditor.updateMode();
    return (SceneEditor.getMode() == TQBase.LevelState.EDITING);
  };
  SceneEditor.isPlayMode = function () {
    SceneEditor.updateMode();
    return (SceneEditor.getMode() == TQBase.LevelState.RUNNING);
  };

  SceneEditor.stageContainer = stageContainer;
  TQ.SceneEditor = SceneEditor;

  function init(fileInfo) {
    if ((typeof fileInfo) === "string") {
      fileInfo = {name: fileInfo, content: null};
    }
    if (!TQ.SceneEditor.stage) {
      createStage();
    }
    //stage.enableMouseOver();
    TQBase.LevelState.reset();
    initializeCoreModules();
    loadScene(fileInfo);
    initializeControllers();
  }

  function initializeCoreModules() {
    // core module是在loadScene中需要用到的module， 必须在loadScene之前初始化
    TQ.SoundMgr.initialize();
    TQ.ParticleMgr.initialize();
    TQ.RM.initialize();
  }

  function initializeControllers() {
    TQ.InputMap.initialize(TQ.State.isPlayOnly);
    TQ.TaskMgr.initialize();
    TQ.GarbageCollector.initialize();
    if (!TQ.State.isPlayOnly) {
      turnOnEditor();
    }
  }

  function turnOnEditor() {
    if (editorOn) {
      return;
    }

    editorOn = true;
    if (!TQ.SceneEditor.stage) {
      createStage();
    }
    TQ.CommandMgr.initialize();
    TQ.InputCtrl.initialize(stageContainer);
    TQ.MoveCtrl.initialize(stageContainer);
    TQ.SkinningCtrl.initialize(stageContainer, currScene);
    TQ.IKCtrl.initialize(stageContainer, currScene);
    TQ.TrackRecorder.initialize();
    TQ.ActionRecorder.initialize();
    TQ.SelectSet.initialize();
    TQ.AnimationManager.initialize();

  }

  function loadScene(fileInfo) {
    if ((typeof fileInfo) === "string") {
      fileInfo = {name: fileInfo, content: null};
    }

    if (currScene) {
      currScene.reset();
    }

    TQ.MessageBox.reset();
    if (!currScene) {
      currScene = new TQ.Scene();
      TQ.WCY.currentScene = currScene;
    } else {
      currScene.close();
    }
    TQ.GarbageCollector.reset();
    currScene.open(fileInfo);
    localStorage.setItem("sceneName", fileInfo.name);
    TQ.FrameCounter.reset();
    TQ.CommandMgr.reset();
    TQ.AnimationManager.reset();
    TQ.SkinningCtrl.end();
    TQ.FloatToolbar.close();
    TQ.WCY.currentScene = currScene;
    return currScene;
  }

  function getDefaultTitle(givenName) {
    var defaultTitle = ((!currScene) || (!currScene.title)) ?
      givenName : currScene.title;
    if (!defaultTitle) {
      defaultTitle = TQ.Config.UNNAMED_SCENE;
    }

    var id = defaultTitle.lastIndexOf("\\");
    if (id <= 0) {
      id = defaultTitle.lastIndexOf("/");
    }

    var shortTitle = (id > 0) ? defaultTitle.substr(id + 1) : defaultTitle;
    return TQ.Utility.forceExt(shortTitle);
  }


  function deleteScene() {
    var title = currScene.title;
    if ((title.lastIndexOf(TQ.Config.DEMO_SCENE_NAME) < 0) // 不能覆盖系统的演示文件
      && (title != TQ.Config.UNNAMED_SCENE)) { // 不能每名称
      var filename = currScene.filename;
      TQ.TaskMgr.addTask(function () {
          netDelete(filename);
        },
        null);
    } else {
      displayInfo2("<" + title + ">:" + TQ.Dictionary.CanntDelete);
    }
  }

  function _doSave(filename, keywords) {
    TQ.TaskMgr.addTask(function () {
        currScene.save(filename, keywords);
      },

      null);
    TQ.InputMap.turnOn();
    localStorage.setItem("sceneName", filename);
  }

  function addImage(desc) {
    TQ.Log.depreciated("replaced by: SceneEditor.addItem");
  }

  function addAnimationTest() {
    currScene.addItem({src: TQ.Config.SCENES_CORE_PATH + "AnimationDesc.adm", type: "BitmapAnimation"});
  }

  function makeAnimationTest() {
    currScene.shooting();
  }

  function uploadImageWindow() {
    // 从JS调用PHP, 则PHP的URL 是相对于当前HTML或PHP文件的目录, 而不是JS文件的目录,
    createWindow("Weidongman/src/upload_image.php", 500, 400);
  }

  function createWindow(url, width, height) {
    // Add some pixels to the width and height:
    var borderWidth = 10;
    width = width + borderWidth;
    height = height + borderWidth;

    // If the window is already open,
    // resize it to the new dimensions:
    if (window.popup && !window.popup.closed) {
      window.popup.resizeTo(width, height);
    }

    // Set the window properties:
    var specs = "location=no, scrollbars=no, menubars=no, toolbars=no, resizable=yes, left=0, top=0, width=" + width + ", height=" + height;

    // Create the pop-up window:
    var popup = window.open(url, "ImageWindow", specs);
    popup.focus();

  } // End of function.

  function create3DElement() {
    if (TQ.SelectSet.groupIt()) { // 返回false肯定不成功, 不要做后续的
      var ele = currScene.currentLevel.latestElement;
      if (ele != null) {
        if (ele.viewCtrl == null) {
          var ctrl = new TQ.MultiView();
          TQ.CommandMgr.addCommand(new TQ.GenCommand(TQ.GenCommand.SET_3D_OBJ, ctrl, ele, ele));
        }
      }
    }
    TQ.InputCtrl.clearSubjectModeAndMultiSelect();
  }

  function editActions() {
    var ele = TQ.SelectSet.peek();

    if (ele != null) {
      TQ.Animation.unitTest(ele);
    }
  }

  function isBkg(matType) {
    return (matType === TQ.MatType.BKG);
  }

  SceneEditor.revokeLastSound = function () {
    if (SceneEditor.lastSoundElement) {
      SceneEditor.lastSoundElement.stop();
      currScene.deleteElement(SceneEditor.lastSoundElement);
      SceneEditor.lastSoundElement = null;
    }
  };

  function determineAutoFit(matType) {
    return isBkg(matType) ? TQ.Element.FitFlag.FULL_SCREEN : TQ.Element.FitFlag.WITHIN_FRAME;
  }
}());
