window.TQ = window.TQ || {};
var canvas;
var stage = null;
var stageContainer = null;
var currScene = null;

(function () {

    // 场景编辑器,
    function SceneEditor() {
    }

    var editorOn = false;
    SceneEditor._mode = TQBase.LevelState.EDITING; // 创作界面的缺省模式是编辑.

    // 接口
    SceneEditor.turnOnEditor = turnOnEditor;
    SceneEditor.startTouchMgr = startTouchMgr;
    SceneEditor.stopTouchMgr = stopTouchMgr;
    SceneEditor.needToSave = needToSave;

    SceneEditor.showWcy = function (fileInfo) {
        if (fileInfo.isPlayOnly === undefined) {
            fileInfo.isPlayOnly = true;
        }

        init(fileInfo);
    };

    SceneEditor.openWcy = function (fileInfo) {
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
        fileInfo.isPlayOnly = false;
        TQ.WCY.isPlayOnly = false;
        init(fileInfo);
    };

    function createStage() {
        canvas = TQ.Graphics.getCanvas();
        //ToDo:AZ
        // addHammer(canvas);
        // create a new stage and point it at our canvas:
        SceneEditor.stage = stage = new createjs.Stage(canvas);
        SceneEditor.stageContainer = stageContainer = new createjs.Container();
        stage.addChild(stageContainer);
    }

    SceneEditor.addItemByFile = function (data, matType) {
        var aFile = data.aFile;
        var options = {crossOrigin: "Anonymous"};  // "Use-Credentials";
        var needToSave = true;

        if (matType === TQ.MatType.SOUND) {
            if (!TQUtility.isSoundFile(aFile)) {
                var str = TQ.Locale.getStr('found audio format unsupported, please use wav or map3') + ': ' + aFile.type;
                TQ.MessageBox.show(str);
            } else {
                addItemBySoundFile(aFile, matType, needToSave);
            }
        } else {
            TQ.ImageProcess.start(aFile, options,
                function (buffer) {
                    addItemByImageData(buffer.data, matType, needToSave);
                });
        }
    };

    function addItemByImageData(image64Data, matType, needToSave) {
        var img = new Image();
        img.onload = function() {
            var desc = {
                data: img,
                src: null, type: "Bitmap", autoFit: TQ.Element.FitFlag.FULL_SCREEN
            };

            var ele = SceneEditor.addItem(desc);
            if (needToSave) {
                TQ.ResourceSync.local2Cloud(ele, image64Data, matType);
            }
        };
        img.src = image64Data;
    }

    function addItemBySoundFile(aFile, matType, needToSave) {
        TQ.RM.loadSoundFromFile(aFile, function (result) {
            var desc = {
                data: TQ.RM.getResource(result.item.id).res,
                src: result.item.id, type: TQ.ElementType.SOUND
            };

            var ele = SceneEditor.addItem(desc);
            if (needToSave) {
                TQ.ResourceSync.local2Cloud(ele, aFile, matType);
            }
        });
    }

    SceneEditor.addItem = function (desc) {
        desc.version = TQ.Element.VER3;  // 新增加的元素都是2.0

        // "Groupfile" 暂时还没有纳入RM的管理范畴
        if (((desc.type === TQ.ElementType.SOUND) ||
            (desc.type === TQ.ElementType.BITMAP) ||
            (desc.type === TQ.ElementType.BUTTON)) && !desc.data &&
            (!TQ.RM.hasElementDesc(desc))) {
            TQ.RM.addElementDesc(desc, doAdd);
            return null; // 无法立即添加并返回ele，因为资源不ready
        } else {
            return doAdd();
        }

        function doAdd() {
            var ele = currScene.addItem(desc);
            setTimeout(function() { // 延时， 以确保元素建立好了，避免autoFit失效,
                if (!ele.isSound() && ele.isSelectable()) { //particle不能够纳入普通的选择集
                    TQ.SelectSet.add(ele);
                }
            }, 200);
            return ele;
        }
    };

    SceneEditor.loadScene = function (fileInfo) {
        // fileInfo.name = getDefaultTitle(fileInfo.name);
        openScene(fileInfo);
    };

    SceneEditor.emptyScene = function () { // empty the current scene
        if (!currScene) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }

        currScene.forceToRemoveAll();
    };

    SceneEditor.getMode = function () {
        if (TQ.WCY.isPlayOnly) {
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

    SceneEditor.stage = stage;
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
        TQ.SceneEditor.loadScene(fileInfo);
        initializeControllers();
        createjs.Ticker.setFPS(20);

        // 让Scene来决定处理tick，它可以包括update和render。而stage的自动响应只包括render。
        // createjs.Ticker.addListener(stage, false);
        createjs.Ticker.addListener(currScene, false);

        createjs.Ticker.addListener(window);
    }

    function initializeCoreModules() {
        // core module是在loadScene中需要用到的module， 必须在loadScene之前初始化
        TQ.SoundMgr.initialize();
        TQ.ParticleMgr.initialize();
        TQ.RM.initialize();
    }

    function initializeControllers() {
        TQ.InputMap.initialize(TQ.WCY.isPlayOnly);
        TQ.TaskMgr.initialize();
        TQ.GarbageCollector.initialize();
        if (!TQ.WCY.isPlayOnly) {
            turnOnEditor();
        }
    }

    function turnOnEditor() {
        if (editorOn) {
            return;
        }

        editorOn = true;
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

    function startTouchMgr() {
        TQ.TouchManager.start();
    }

    function stopTouchMgr() {
        TQ.TouchManager.stop();
    }

    function openScene(fileInfo) {
        if ((typeof fileInfo) === "string") {
            fileInfo = {name: fileInfo, content: null};
        }

        if (!TQ.userProfile.loggedIn && needToSave()) {
            currScene.reset();
        }

        if (!needToSave()) {
            TQ.MessageBox.hide();
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
        } else {
            TQ.AssertExt.invalidLogic("必须自动保存， 减少干扰用户！");
            TQ.MessageBox.show(TQ.Locale.getStr('please save it first!'));
        }
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

    function addLevelTest() {
        var levelId = currScene.addLevel();
        currScene.gotoLevel(levelId);
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

    function needToSave() {
        return (currScene && !currScene.isEmpty() && !currScene.isSaved);
    }
}());
