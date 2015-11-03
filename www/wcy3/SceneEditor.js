window.TQ = window.TQ || {};
var canvas;
var messageBoard;
var stage = null;
var stageContainer = null;

(function () {

    // 场景编辑器,
    function SceneEditor() {
    }

    SceneEditor._mode = TQBase.LevelState.EDITING; // 创作界面的缺省模式是编辑.

    SceneEditor.showWcy = function (fileInfo) {
        var playOnlyFlag = true;
        init(fileInfo, playOnlyFlag);
    };

    SceneEditor.openWcy = function (fileInfo) {
        var playOnlyFlag = false;
        init(fileInfo, playOnlyFlag);
    };

    SceneEditor.createScene = function () {
        var playOnlyFlag = false;
        var fileInfo = {filename: TQ.Config.UNNAMED_SCENE,
            content:TQ.Scene.getEmptySceneJSON()};
        init(fileInfo, playOnlyFlag);
    };

    SceneEditor.addItem = function(desc) {
        desc.version = TQ.Element.VER2;  // 新增加的元素都是2.0

        // "Groupfile" 暂时还没有纳入RM的管理范畴
        if (((desc.type == "SOUND") || (desc.type == "Bitmap") || (desc.type == "BUTTON"))
            && (!TQ.RM.hasElementDesc(desc))) {
            TQ.RM.addElementDesc(desc, function () {
                currScene.addItem(desc)
            });

            return null;
        }

        return currScene.addItem(desc);
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
        var uiStop = $('#stop');
        if (uiStop.length === 0) {
            TQ.FrameCounter.stop();
        } else {
            uiStop.click();
        }
        SceneEditor.setMode(TQBase.LevelState.EDITING);
    };

    SceneEditor.setPlayMode = function () {
        if (!currScene) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }
        $('#play').click();
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
        return (SceneEditor.getMode() == TQBase.LevelState.EDITING);
    };
    SceneEditor.isPlayMode = function () {
        return (SceneEditor.getMode() == TQBase.LevelState.RUNNING);
    };

    SceneEditor.stage = stage;
    SceneEditor.stageContainer = stageContainer;
    TQ.SceneEditor = SceneEditor;
}());

function init(fileInfo) {
    if ((typeof fileInfo) === "string") {
        fileInfo = {name: fileInfo, content: null};
    }
    canvas = document.getElementById("testCanvas");
    //ToDo:AZ
    // addHammer(canvas);
    // create a new stage and point it at our canvas:
    TQ.SceneEditor.stage = stage = new createjs.Stage(canvas);
    TQ.SceneEditor.stageContainer = stageContainer = new createjs.Container();
    stage.addChild(stageContainer);
    //stage.enableMouseOver();
    messageBoard = new TQ.MessageBox(canvas);
    TQ.SoundMgr.initialize();
    TQ.RM.initialize();
    TQ.SceneEditor.loadScene(fileInfo);
    initializeControllers();
    // messageBoard.show("Loading 。。。");
    createjs.Ticker.setFPS(20);

    // 让Scene来决定处理tick，它可以包括update和render。而stage的自动响应只包括render。
    // createjs.Ticker.addListener(stage, false);
    createjs.Ticker.addListener(currScene, false);

    createjs.Ticker.addListener(window);
}

var currScene = null;

function initializeControllers() {
    TQ.InputMap.initialize(TQ.WCY.isPlayOnly);
    TQ.TaskMgr.initialize();
    TQ.GarbageCollector.initialize();
    TQ.CommandMgr.initialize();
    TQ.InputCtrl.initialize(stageContainer);
    TQ.MoveCtrl.initialize(stageContainer);
    TQ.SkinningCtrl.initialize(stageContainer, currScene);
    TQ.IKCtrl.initialize(stageContainer, currScene);
    TQ.TrackRecorder.initialize();
    TQ.ActionRecorder.initialize();
    TQ.SelectSet.initialize();
    TQ.TouchMgr.initialize();  //ToDo: will remove
    TQ.TouchService.initialize();
}

function openScene(fileInfo) {
    if ((typeof fileInfo) === "string") {
        fileInfo = {name: fileInfo, content: null};
    }
    if ((!currScene) || (currScene.isSaved)) {
        messageBoard.hide();
        if (!currScene) {
            currScene = new TQ.Scene();
            TQ.WCY.currentScene = currScene;
        } else {
            currScene.close();
        }
        TQ.GarbageCollector.clear();
        currScene.open(fileInfo);
        localStorage.setItem("sceneName", fileInfo.name);
        TQ.FrameCounter.reset();
        TQ.CommandMgr.clear();
        TQ.SkinningCtrl.end();
        TQ.floatToolbar.show(false);
        TQ.WCY.currentScene = currScene;
    } else {
        TQ.Log.warn("请先保存作品！");
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

function addTextTest() {
    TQ.TextEditor.addText(TQ.Dictionary.defaultText);
}

function backToPreviousLevel() {
    currScene.preLevel();
}

function advanceToNextLevel() {
    currScene.nextLevel();
}

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
    clearSubjectModeAndMultiSelect();
}

function editActions() {
    var ele = TQ.SelectSet.peek();

    if (ele != null) {
        TQ.Animation.unitTest(ele);
    }
}
