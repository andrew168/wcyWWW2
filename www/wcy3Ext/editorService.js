/**
 * Created by Andrewz on 1/17/2016.
 * EditorExt service 是 SceneEditor的扩展，
 * * 可以调用更多的模块（比editor）， 比如图片上传模块
 */

angular.module('starter').factory('EditorService', EditorService);
EditorService.$inject = ['$q', '$rootScope', '$timeout', 'NetService', 'WxService', 'WCY', 'AppService'];
function EditorService($q, $rootScope, $timeout, NetService, WxService, WCY, AppService) {
    var CMD_UNKNOWN = "unknown",
        CMD_MCOPYING_BEGIN = 'mcopying begin',
        CMD_MCOPYING_END = 'mcopying end';

    var _initialized = false,
        _sceneReady = false,
        _colorPanel = null,
        _lastSelected = null,
        fileElement = null,
        _tryToSave = false,
        domEle = null,
        lastCmd = CMD_UNKNOWN,
        currCmd = CMD_UNKNOWN;

    var isPlayOnly = false;
    var canvas;

    var state = {            // undo/redo
        hasUndo: TQ.CommandMgr.hasUndo, // function
        hasRedo: TQ.CommandMgr.hasUndo // function
    };

    initialize();

    return {
        state: state,

        banMat: NetService.banMat,

        // play & preview
        forceToRedraw: forceToRedraw,
        preview: preview,
        play: play,
        stop: stop,
        replay: replay,
        startRecord: startRecord,
        stopRecord: stopRecord,
        toggleSpeed: TQ.FrameCounter.toggleSpeed,
        // pause: doPause,

        // opus ==> WCY

        // level
        addLevel: addLevel,
        addLevelAt: addLevelAt,
        deleteLevel: deleteLevel,
        deleteCurrentLevel: deleteCurrentLevel,
        gotoPreviousLevel: gotoPreviousLevel,
        gotoNextLevel: gotoNextLevel,
        gotoLevel: gotoLevel,

        // level and element
        onDelete: onDelete,

        // element modification (text, sound, image...)
        getFontSize: getFontSize,
        setSize: setSize,
        setColor: setColor,
        eraseAnimeTrack:eraseAnimeTrack,
        hideOrShow :hideOrShow ,
        pinIt:pinIt,
        attachTextBubble: TQ.TextBubble.attach,
        detachTextBubble: TQ.TextBubble.detach,

        // element insert (text, sound, image...)
        mCopyToggle: mCopyToggle,
        insertMat: insertMat,
        insertBkImageFromLocal: insertBkMatFromLocal, // upload
        insertPeopleFromLocal: insertPeopleFromLocal,
        insertPropFromLocal: insertPropFromLocal,
        insertSoundFromLocal: insertSoundFromLocal,
        insertPeopleImage: insertPeopleImage, // i.e. FromUrl:
        insertPropImage: insertPropImage,
        insertBkImage: insertBkImage,
        insertText: insertText,
        insertSound: insertSound,
        insertSnow: TQ.ParticleMgr.insertSnow,
        insertRain: TQ.ParticleMgr.insertRain,
        insertMoney: TQ.ParticleMgr.insertMoney,
        selectLocalFile: selectLocalFile,
        uploadMatFromLocal: uploadMatFromLocal,

        // select set
        emptySelectSet:emptySelectSet,

        // editor
        setAddMode: setAddMode,
        setModifyMode: setModifyMode,
        getTextCursor: getTextCursor,
        setColorPanel: setColorPanel,
        toAddMode: toAddMode,
        reset: reset,
        onEventByToolbar : onEventByToolbar,

        // particle Effect
        ParticleMgr: TQ.ParticleMgr,  // start, stop, change(option)

        // share
        shareFbWeb: shareFbWeb,
        saveScreenShot: saveScreenShot
    };

    function addItem(desc, matType) {
        if (isProxyMat(desc.src)) {
            NetService.uploadOne(desc.src, matType).
                then(function (res) {
                    TQ.Log.alertInfo("uploaded " + desc.src + " to " + res.url);
                    desc.src = res.url;
                    TQ.SceneEditor.addItem(desc);
                }, function (err) {
                    console.log(err);
                })
                .finally(TQ.MessageBox.hide);
        } else {
            TQ.SceneEditor.addItem(desc);
        }
    }

    function reset() {
        // editor 的各种当前值， 用户选择的
        // element's state
        state.x = 0.1; // in NDC space
        state.y = 0.9;
        state.fontLevel = fontSize2Level(TQ.Config.fontSize);
        state.color = TQ.Config.color;
        state.isVisible = true;
        state.isLocked = false;
        state.isFont = false;

        // editor's mode
        state.isAddMode = true;
        state.isRecording = false; // must be in AddMode
        state.isModifyMode = null;
        state.isPreviewMode = null;
        state.isPreviewMenuOn = false;
        state.isPlayMode = null;
        state.isPlaying = false;
        state.isMCopying = false;
        TQ.FrameCounter.toggleSpeed(TQ.Const.TOGGLE_RESET, state);
        TQ.PreviewMenu.initialize(state, onPreviewMenuOn, onPreviewMenuOff);
    }

    function initialize() {
        reset();
        $rootScope.$on(TQ.Scene.EVENT_READY, onSceneReady);
        $rootScope.$on(TQ.EVENT.REFRESH_UI, forceToRefreshUI);
    }

    function onSelectSetChange() {
        updateMode();
    }

    function onSceneReady() {
        reset();
        if (!_sceneReady) {
            TQ.AssertExt.invalidLogic(!_sceneReady, "不能反复调用");
            _sceneReady = true;
            window.addEventListener("resize", AppService.configCanvas);
            document.addEventListener(TQ.SelectSet.SELECTION_NEW_EVENT, onSelectSetChange);
            document.addEventListener(TQ.SelectSet.SELECTION_EMPTY_EVENT, onSelectSetChange);
            updateMode();
            updateColorPanel();
            if (TQ.Config.statServiceEnabled) {
                // 此服务无法lazyLoading，因为是ng模块， 暂时停止使用
                StatService.startToShow();
            }
            TQ.LazyLoading.start();

            // TQ.TouchManager.addHandler('swipeleft', gotoPreviousLevel);
            // TQ.TouchManager.addHandler('swiperight', gotoNextLevel);

            if (TQ.Config.AutoPlay && currScene && !currScene.isEmpty()) {
                // TQ.MessageBox.showOk("请使用竖屏以获得好效果", preview);
                preview();
            }
        }

        if (currScene && !currScene.isPlayOnly) {
            WCY.startAutoSave();
        }
    }

    var hasTouch = false,
        hasMouse = false;

    function isSelectedEvent(e) {
        if (hasTouch) {
            if (e.type === 'click') {
                return false;
            }
        }

        if (hasMouse) {
            if (e.type === 'touchstart') {
                return false;
            }
        }

        if (e.type === 'touchstart') {
            hasTouch = true;
        } else if (e.type === 'click') {
            hasMouse = false;
        } else {
            console.error('wrong events: ' + e.type);
        }

        return true;
    }

    function onPreviewMenuOn() {
        $timeout(function () {
            TQ.IdleCounter.remove(TQ.PreviewMenu.hide);
            stop();
            TQ.TouchManager.start();
        });
    }

    function onPreviewMenuOff() {
        $timeout(function () {
            state.isPreviewMenuOn = false;
        });
    }

    function insertBkMatFromLocal(useDevice) {
        return insertMatFromLocal(TQ.MatType.BKG, useDevice);
    }

    function insertPeopleFromLocal(useDevice) {
        return insertMatFromLocal(TQ.MatType.PEOPLE, useDevice);
    }

    function insertPropFromLocal(useDevice) {
        return insertMatFromLocal(TQ.MatType.PROP, useDevice);
    }

    function insertSoundFromLocal(useDevice) {
        return insertMatFromLocal(TQ.MatType.SOUND, useDevice);
    }

    function insertMatFromLocal(matType, useDevice) {
        if (WxService.isReady()) {
            alert("请在浏览器中打开，以便于使用所有功能");
            // return doInsertMatFromLocalWx(matType);
        }

        return doInsertMatFromLocal(matType, useDevice);
    }

    function doInsertMatFromLocal(matType, useDevice) {
        return uploadMatFromLocal(matType, useDevice).
            then(addItemByData, errorReport).
            finally(TQ.MessageBox.hide);
    }

    function uploadMatFromLocal(matType, useDevice) {
        return selectLocalFile(matType, useDevice).
            then(processOneMat).
            then(uploadMat);
    }

    function selectLocalFile(matType, useDevice) {
        var camera = {
                // 后缀方法， 和 MIME type方法都要有， 以增强兼容性
                formats: "image/*", // ;capture=camera",
                device: "camera"
            },

            imageFile = {
                formats: ".bmp, .gif, .jpeg, .png, image/bmp, image/gif, image/jpeg, image/jpg, image/png, image/*;capture=camera",
                device: ""
            },

            audio = {
                formats: "audio/*",
                device: "audio"
            },

            audioFile = {
                formats: "audio/*",
                // formats: ".wav, .mp3, audio/mpeg, audio/mp3, application/zip, audio/wav, audio/wave, audio/x-wav ",
                device: ""
            },

            validFormat = (matType === TQ.MatType.SOUND) ?
                ((useDevice) ? audio: audioFile) :
                ((useDevice) ? camera: imageFile);

    // <input type="file" accept="image/*" capture="camera">
    // Capture can take values like camera, camcorder and audio.

        if (!_initialized) {
            _initialized = true;
            domEle = document.createElement('input');
            domEle.setAttribute('id', '---input-file-test');
            domEle.setAttribute('type', 'file');
            setOptions();
            document.body.appendChild(domEle);
            fileElement = $(domEle);
        } else {
            setOptions();
//            domEle.setAttribute("accept", validFormat.formats);
            // domEle.setAttribute("accept", ".jpg, .bmp");
            // domEle.setAttribute("accept", ".wav, .mp3");
            // domEle.setAttribute("accept", ".png, .jpeg, image/png, image/jpeg");

            // capture：指明用设备， 或已有的文件
  //          if (useDevice) {
  //              domEle.setAttribute("capture", validFormat.device);
  //          }
        }

        function setOptions() {
            // accept: 指明可接受的media类别
            // domEle.setAttribute("accept", "image/*");
            domEle.setAttribute("accept", validFormat.formats);
            // domEle.setAttribute("accept", ".jpg, .bmp");
            // domEle.setAttribute("accept", ".wav, .mp3");
            // domEle.setAttribute("accept", ".png, .jpeg, image/png, image/jpeg");

            // capture：指明用设备， 或已有的文件
            if (useDevice) {
                domEle.setAttribute("capture", validFormat.device);
                domEle.removeAttribute('multiple');
                // domEle.setAttribute('multiple', false);
            } else {
                domEle.removeAttribute("capture"); // 在IOS上， capture值被忽略，

                //选择已有的文件（而不是从device拍照），可以采用多参照！！！
                domEle.setAttribute('multiple', true); // "multiple" （不论true/false, Safari 都直接打开相册）
            }
        }

        fileElement.unbind('change'); // remove old handler
        fileElement[0].value = null;  // remove old selections
        fileElement.change(onSelectOne);
        fileElement.click();

        var q = $q.defer();
        function onSelectOne() {
            console.log('changed');
            var files = domEle.files;
            if ((files.length > 0)) {
                q.resolve({aFile:files[0], matType: matType, useDevice: useDevice});
            } else {
                q.reject({error:1, msg: "未选中文件！"});
            }
            fileElement.unbind('change'); // remove old handler
            fileElement.change(null);
        }

        return q.promise;
    }

    function processOneMat(data) {
        var aFile = data.aFile,
            matType = data.matType;

        var wxAbility = {
            FileAPI: !!window.FileAPI,
            FileReader: !!window.FileReader,
            URL: !!window.URL,
            XMLHttpRequest: !!window.XMLHttpRequest,
            Blob: !!window.Blob,
            ArrayBuffer: !!window.ArrayBuffer,
            webkitURL: !!window.webkitURL,
            atob: !!window.atob
        };

        TQ.MessageBox.showWaiting("预处理文件....");
        TQ.Log.alertInfo("before uploadOne:" + JSON.stringify(wxAbility));

        var q = $q.defer();

        //ToDo: 检查合法的文件类别
        switch (matType) {
            case TQ.MatType.BKG:
                var options = {crossOrigin: "Anonymous"};  // "Use-Credentials";
                TQ.ImageProcess.start(aFile, options,
                    function(buffer) {
                        data.fileOrBuffer = buffer;
                        q.resolve(data);
                    });
                break;
            default:
                if (matType === TQ.MatType.SOUND) {
                    if (!isSound(aFile)) {
                        TQ.MessageBox.show("发现不支持的声音格式：" + aFile.type + ". 请选用mp3或wav格式");
                        q.reject({error:1, msg: "发现不支持的声音格式：" + aFile.type + ". 请选用mp3或wav格式"});
                        break;
                    }
                    TQ.Assert.isTrue(isSound(aFile));
                }
                data.fileOrBuffer = aFile;
                q.resolve(data);
        }

        return q.promise;
    }

    function uploadMat(data) {
        var fileOrBuffer = data.fileOrBuffer,
            matType = data.matType,
            q = $q.defer();

        NetService.uploadOne(fileOrBuffer, matType).
        then(function(res) {
                data.url = res.url;
                q.resolve(data);
            });

        return q.promise;
    }

    function addItemByData(data) {
        TQ.Log.debugInfo("mat url: " + data.url);
        addItemByUrl(data.url, data.matType, data.option);
    }

    function mCopyToggle() {
        state.isMCopying = !state.isMCopying;
        currCmd = (state.isMCopying) ? CMD_MCOPYING_BEGIN : CMD_MCOPYING_END;
        TQ.TouchManager.updateOps(state);

    }
    function insertMat(data) {
        return uploadMat(data).
            then(addItemByData, function (err) {
                console.log(err);
            })
            .finally(TQ.MessageBox.hide);
    }

    // private functions:
    function isSound(file) {
        if (!file.type) {  // for Wx
            return false;
        }

        return (file.type.indexOf('audio') >= 0);
    }

    function doInsertMatFromLocalWx(matType) {
        WxService.chooseImage().then(function (filePath) {
            var aFile = {
                path: filePath,
                type: matType,
                isWx: true
            };

            TQ.Log.alertInfo("微信InsertLocal：" + JSON.stringify(aFile));
            processOneMat(aFile, matType);
        }, function (err) {
            console.log(err);
        });
    }

    function isProxyMat(url) {
        return (url && (url.indexOf(TQ.Config.MAT_HOST) < 0));
    }

    function insertImage(filename, x, y, matType) {
        if (!matType) {
            matType = TQ.MatType.PROP;
        }
        var desc = {src: filename, type: "Bitmap", autoFit: TQ.Element.FitFlag.WITHIN_FRAME, x: x, y: y};
        addItem(desc, matType);
    }

    function insertPeopleImage(filename, x, y) {
        insertImage(filename, x, y, TQ.MatType.PEOPLE);
    }

    function insertPropImage(filename, x, y) {
        insertImage(filename, x, y, TQ.MatType.PROP);
    }

    function insertBkImage(filename, x, y) {
        var desc = {src: filename, type: "Bitmap", autoFit: TQ.Element.FitFlag.FULL_SCREEN, x: x, y: y};
        addItem(desc, TQ.MatType.BKG);
    }

    function insertText(message, x, y) {
        var desc = {
            src: null,
            text: message,
            type: "Text",
            autoFit: TQ.Element.FitFlag.KEEP_SIZE,
            x: x,
            y: y,
            fontSize: getFontSize(), // 必须是像素坐标，在designated坐标系
            color: state.color
        };

        TQ.SceneEditor.addItem(desc);
        // TQ.TextEditor.initialize();
        // TQ.TextEditor.addText(TQ.Dictionary.defaultText);
    }

    function insertSound(filename) {
        var desc = {src: filename, type: "SOUND"};
        addItem(desc, TQ.MatType.SOUND);
     }

    function addItemByUrl(url, matType, option) {
        var eleType = (matType === TQ.MatType.SOUND) ? TQ.ElementType.SOUND : TQ.ElementType.BITMAP,
            autoFitRule = (matType === TQ.MatType.BKG) ?
                TQ.Element.FitFlag.FULL_SCREEN : TQ.Element.FitFlag.WITHIN_FRAME,
            desc = option || {};
        desc.src = url;
        desc.type = eleType;
        if (!desc.hasOwnProperty('autoFit')) {
            desc.autoFit = autoFitRule;
        }
        TQ.SceneEditor.addItem(desc);
    }

    function getFontSize() {
        return parseInt(state.fontLevel) * TQ.Config.FONT_LEVEL_UNIT;
    }

    function fontSize2Level(size) {
        return '' + (parseInt(size) / TQ.Config.FONT_LEVEL_UNIT);
    }

    /*
     直接跳转到第id个场景 (id >=0)
     */
    function gotoLevel(id) {
        if (typeof id  === 'string') {
            id = Number(id);
        }
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;
        currScene.gotoLevel(id);
    }

    function gotoPreviousLevel() {
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;

        if (currScene && currScene.currentLevelId > 0) {
            gotoLevel(currScene.currentLevelId - 1);
        }
    }

    function gotoNextLevel() {
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;

        if (currScene && (currScene.currentLevelId != undefined) && (currScene.currentLevelId < (currScene.levelNum() - 1))) {
            gotoLevel(currScene.currentLevelId + 1);
        }
    }

    /*
     插入第id(id >=0）个场景， 如果该位置已经有场景， 把原来的场景向后顺延。
     如果id < 0, 则令id =0;.
     如果id 超出上边界， 则自动在末尾添加一个场景）
     */
    function addLevelAt(id) {
        id = Number(id);
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;

        currScene.addLevel(id);
        gotoLevel(id);
    }

    /*
     紧跟当前场景的后面，插入1个新场景。
     */
    function addLevel() {
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;
        return addLevelAt(currScene.currentLevelId + 1);
    }

    /*
     删除第id(id >=0）个场景， 并且把此后的场景前移。
     如果id超出边界（id < 0)，则忽略
     */
    function deleteLevel(id) {
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        assertNotNull(id, currScene); // 必须在微创意显示之后使用
        id = Number(id);
        if (!currScene) return;

        if (id === currScene.currentLevelId) {
            deleteCurrentLevel();
        } else {
            currScene.deleteLevel(id);
        }
    }

    function deleteCurrentLevel() {
        if (currScene.levelNum() === 1) {
            addLevel();
            $timeout(function() {
                deleteLevel(0);
            });
            return ;
        }

        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene || (currScene.currentLevelId === undefined)) return;

        var id = currScene.currentLevelId;
        var nextLevel = id + 1;
        if (nextLevel >= currScene.levelNum()) {
            nextLevel = id - 1;
        }
        if (nextLevel < 0) {
            nextLevel = 0;
            id = 1;
            addLevelAt(0);
        }
        currScene.gotoLevel(nextLevel);
        currScene.deleteLevel(id);
    }

    /*
     移动序号为srcId的场景，并插入到序号dstId的场景之前，
     注意：srcId和dstId都是在执行此函数之前， 按照场景的顺序来编号的。
     用户不需要关心
     */
    function moveTo(srcId, dstId) {
        srcId = Number(srcId);
        dstId = Number(dstId);
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;

        currScene.moveTo(srcId, dstId);
    }

    /*
     复制序号为srcId的场景的内容，并插入到序号dstId的场景之前，
     */
    function copyTo(srcId, dstId) {
        srcId = Number(srcId);
        dstId = Number(dstId);
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;

        currScene.copyTo(srcId, dstId);
    }

    /*
     获取当前微创意的场景（Level）数量
     */
    function getLevelNum() {
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return 0;
        return currScene.levelNum();
    }

    function stop() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, currScene != null);
        if (currScene != null) {
            currScene.stop();
            updateMode();
        }

        $timeout(function () { // 用timeout迫使angularjs 刷新UI
            state.isPlaying = false;
        }, 100);
    }

    function preview () {
        state.isPreviewMode = true;
        replay();
    }

    function play() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, currScene != null);
        if (currScene != null) {
            currScene.play();
        }
        _onPlay();
    }

    function _onPlay() {
        updateMode();
        forceToRefreshUI();
        TQ.TouchManager.stop();
        $timeout(function () { // 用timeout跳过本次touch的end或mouse的up引起的事件
            state.isPlaying = true;
        }, 100);
        TQ.IdleCounter.start(TQ.PreviewMenu.hide);
        TQ.PreviewMenu.startWatch();
    }

    function replay() {
       TQ.Scene.doReplay();
       _onPlay();
    }

    function startRecord() {TQ.FrameCounter.startRecord(); TQ.SceneEditor.setPlayMode(); }
    function stopRecord() {TQ.FrameCounter.stopRecord(); TQ.SceneEditor.setEditMode(); }
    function emptyScene() {TQ.SceneEditor.emptyScene(); }

    function doPlayStop() {
        if (isPlayOnly) {
            if (TQ.FrameCounter.isPlaying()) {
                stop();
            } else {
                play();
            }
        } else {
            if (TQ.FrameCounter.isPlaying()) {
                $("#stop").click();
            } else {
                $("#play").click();
            }
        }
    }

    // 进入/退出 全屏模式
    function fullscreenPlay (width, height){ // 屏幕分辨率的大小
        canvas = document.getElementById("testCanvas");
        canvas.width = width;
        canvas.height = height;

        TQ.Config.zoomX = width / TQ.Config.workingRegionWidth;
        TQ.Config.zoomY = height / TQ.Config.workingRegionHeight;
        TQ.Config.workingRegionWidth = width;
        TQ.Config.workingRegionHeight = height;
        play();
    }

    function eixtFullscreen() {
        canvas.width = TQ.Config.workingRegionWidth;
        canvas.height = TQ.Config.workingRegionHeight;
        TQ.Config.zoomX = TQ.Config.zoomY = 1;
    }

    //只用于插入录音，
    //    在开始录音的时候，先记录当时场景的id和当时时间t0，以供本函数使用。
    // 在指定的场景levelID，指定的时间t0，插入所制的声音资源,
    // 如果不指定levelID和t0，则在当前场景的当前时刻插入
    function addResToStageCenter(res, levelID, t0) {
        return addResToStageCenter(res, levelID, t0);
    }

    // type: 烟火的种类，默认1,      系统保留扩展其它取值）
    function firework(type) {
        console.log(type);
    }

    //------------- 以下的函数用于配置系统参数 -------------------------
    // 设置零件标志的大小， 默认是10：
    function setMarkerSize(radius) {
        TQ.Marker.RADIUS = radius;
    }

    function setSize() {
        var selectedElement = TQ.SelectSet.peek();
        if (selectedElement  && selectedElement.isText()) {
            TQ.CommandMgr.directDo(new TQ.SetSizeCommand(selectedElement, getFontSize()));
        }
    }

    function updateColorPanel() {
        if (_colorPanel) {
            _colorPanel.style.color = state.color;
        }
    }

    function setColor(colorPicker) {
        state.color = '#' + colorPicker.toString();
        updateColorPanel();
        var selectedElement = TQ.SelectSet.peek();
        if (selectedElement && selectedElement.isText()) {
            TQ.CommandMgr.directDo(new TQ.SetColorCommand(selectedElement, state.color));
        }
    }

    function pinIt() {
        TQ.SelectSet.pinIt();
        updateMode();
    }

    function hideOrShow () {
        TQ.SelectSet.show(false);
        updateMode();
    }

    function eraseAnimeTrack() {
        TQ.SelectSet.eraseAnimeTrack();
    }

    // for bottom bar;
    function emptySelectSet () {
        TQ.SelectSet.empty();
        TQ.DirtyFlag.setScene();
        updateMode();
    }

    // private
    function initialized() {
        return  (currScene && currScene.currentLevel !== undefined);
    }

    function isEditMode() {
        return (initialized() && TQ.SceneEditor.isEditMode());
    }

    function toAddMode() {
        TQ.SceneEditor.setMode(TQBase.LevelState.EDITING);
        TQ.SelectSet.empty();
        if (state.isPreviewMode) {
            state.isPreviewMode = false;
            TQ.IdleCounter.remove(onPreviewMenuOff);
            TQ.TouchManager.start();
            onPreviewMenuOff();
            TQ.PreviewMenu.stopWatch();
        }
        updateMode(true);
    }

    function setColorPanel(panel){
        _colorPanel = panel;
    }

    function setAddMode() {
        state.isModifyMode = false;
        state.isAddMode = true;
        state.isPreviewMode = false;
        forceToRefreshUI();
    }

    function setModifyMode() {
        state.isModifyMode = true;
        state.isAddMode = false;
        state.isPreviewMode = false;
        forceToRefreshUI();
    }
    function updateMode(hasChanged) {
        var value = null;

        if (state.isRecording) {
            return;
        }

        if (!state.isPreviewMode) {
            if (state.isAddMode != (value = (isEditMode() && TQ.SelectSet.isEmpty()))) {
                state.isAddMode = value;
                hasChanged = true;
            }

            if (state.isModifyMode !=( value = (isEditMode() && !TQ.SelectSet.isEmpty()))) {
                state.isModifyMode= value;
                hasChanged = true;
            }

            if (state.isPlayMode != (value = (initialized() && TQ.SceneEditor.isPlayMode()))) {
                state.isPlayMode = value;
                hasChanged = true;
                updatePlayingState();
            }
        } else {
            state.isAddMode = false;
            state.isModifyMode = false;
            state.isPlayMode = false;
            updatePlayingState();
            hasChanged = true;
        }

        // 对sceneReady 事件， SelectSet是空
        if (!TQ.SelectSet.isEmpty()) {
            hasChanged = updateElementState() || hasChanged;
        }

        //  force angular to update UI
        if (hasChanged) {
            forceToRefreshUI();
        }
    }

    function updatePlayingState() {
        // 不能用$timeout, 因为DOM的SCENE_READY调用时候， $timeout可能为undefined
        if (!$timeout) {
            setTimeout(doUpdate, 300);
        } else {
            setTimeout(doUpdate, 300);
        }

        function doUpdate() {
            state.isPlaying = TQ.FrameCounter.isPlaying();
        }
    }

    function updatePosition(ele) {
        if ((ele !== _lastSelected) || (_lastSelected === null)) {
            if (_lastSelected && !!_lastSelected.hookInMove) {
                _lastSelected.hookInMove = null;
            }
            _lastSelected = ele;
            if (_lastSelected){
                _lastSelected.hookInMove = updatePosition;
            }
        }

        if (ele) {
            var pos = ele.getPositionInWorld();
            state.x = pos.x;
            state.y = pos.y;
        }
    }

    function getTextCursor() {
        var x = TQ.MathExt.range(state.x, 0, 0.9);
        var y = state.y,
            fontHeight = getFontSize() / TQ.Config.workingRegionHeight;

        if (_lastSelected && _lastSelected.isText()) {
            y -= fontHeight;
        }

        if (y < (2 * fontHeight)) {
            y = 1;  // go to top again;
        }

        return {x: x, y: y};
    }

    function updateElementState() {
        var hasChanged = false,
            ele = TQ.SelectSet.peek();
        TQ.AssertExt.isNotNull(ele);
        updatePosition(ele);
        if (ele && state.isModifyMode) {
            if (state.isLocked !== ele.isPinned()) {
                state.isLocked = ele.isPinned();
                hasChanged = true;
            }

            if (state.isVisible !== ele.isVisible()) {
                state.isVisible = ele.isVisible();
                hasChanged = true;
            }

            if (state.color !== ele.getColor()) {
                state.color = ele.getColor();
                updateColorPanel(state.color);
                hasChanged = true;
            }

            if (ele.getType() === TQ.ElementType.TEXT) {
                var level = fontSize2Level(ele.getFontSize());
                if (state.fontLevel !== level) {
                    state.fontLevel = level;
                    hasChanged = true;
                }

                if (!state.isFont) {
                    state.isFont = true;
                    hasChanged = true;
                }
            } else {
                if (state.isFont) {
                    state.isFont = false;
                    hasChanged = true;
                }
            }
        }

        return hasChanged;
    }

    function forceToRefreshUI()
    {
        if (!$timeout) {
            setTimeout(null);
        } else {
            $timeout(null);
        }
    }

    function forceToRedraw() {
        currScene.isDirty = true; // 迫使IPad系统重新绘制canvas上的图像， 否则，屏幕上是空白
        forceToRefreshUI();
    }

    function onDelete(evt) {
        if (TQ.SelectSet.isEmpty()) {
            // TQ.MessageBox.show("确认要删除这个场景？", deleteCurrentLevel);
            deleteCurrentLevel();
        } else {
            // 删除当前选中的元素
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.SelectSet.delete();
        }
    }

    function saveScreenShot () {
        var timestamp = new Date(),
            prefix = timestamp.getTime() +
                '-' + (timestamp.getMonth() + 1) + timestamp.getDate() +
                ', ' + timestamp.getHours() +
                '-' + timestamp.getMinutes() +
                '-' + timestamp.getSeconds();

        var screenshotName = TQ.Config.SCREENSHOT_CORE_PATH + prefix + ".png";
        TQ.Tool.saveImage(screenshotName);
    }

    function shareFbWeb() {
        if (_tryToSave) {
            console.error("系统正在忙。。。。");
            return;
        }

        if (!WCY.getShareCode()) {
            if (!_tryToSave) {
                _tryToSave = true;
                if (WCY.hasSsPath()) {
                    return WCY.save().then(doIt);
                } else {
                    return WCY.uploadScreenshot().then(doItAndSave);
                }
            } else {
                return TQ.MessageBox.show("需要先保存");
            }
        }

        function doItAndSave() {
            WCY.save();
            doIt();
        }

        function doIt() {
            _tryToSave = false;
            shareFbWeb();
        }

        var url = TQUtility.urlConcat(TQ.Config.OPUS_HOST, "?opus=" + WCY.getShareCode()),
            screenshotUrl =  WCY.getScreenshotUrl();

        //ToDo: （需要去掉page中的tag吗？）
        // "share" 需要page中的tag支持，
        // "feed", 不需要

        if (!screenshotUrl) {
            screenshotUrl = "http://res.cloudinary.com/eplan/image/upload/v1462412871/c161.jpg"
        }

        FB.ui(
            {
                method: 'feed',
                name: 'A Picture is Worth a Thousand Words -- idiom',
                link: url,
                picture: screenshotUrl,
                // picture: "http://res.cloudinary.com/eplan/image/upload/v1462418136/c162.png",
                description: "If a picture is worth a thousand words...an animation is worth a Million.",
                caption: "U do I do, it's better and better.   -- UDOIDO",
                message: "" // not supported by FB?
            });
    }

    function errorReport(pkg) {
        if (pkg && pkg.error && pkg.msg) {
            TQ.MessageBox.show(pkg.msg);
        }
    }

    function onEventByToolbar(evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        //结束批命令:
        if (state.isMCopying) {
            if ((lastCmd === CMD_MCOPYING_BEGIN) && (currCmd !== CMD_MCOPYING_END)) {
                mCopyToggle();
            }
        }

        lastCmd = currCmd;
        currCmd = CMD_UNKNOWN;

        //ToDo: 　Joint, group
    }
}
