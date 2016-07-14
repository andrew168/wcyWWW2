/**
 * Created by Andrewz on 1/17/2016.
 * EditorExt service 是 SceneEditor的扩展，
 * * 可以调用更多的模块（比editor）， 比如图片上传模块
 */

angular.module('starter').factory('EditorService', EditorService);
EditorService.$inject = ['$timeout', 'NetService', 'WxService', 'WCY'];
function EditorService($timeout, NetService, WxService, WCY) {
    var _initialized = false,
        _colorPanel = null,
        _lastSelected = null,
        fileElement = null,
        _tryToSave = false,
        domEle = null;
    var isPlayOnly = false;
    var canvas;

    var state = {            // undo/redo
        hasUndo: TQ.CommandMgr.hasUndo, // function
        hasRedo: TQ.CommandMgr.hasUndo // function
    };

    initialize();

    return {
        state: state,

        // play & preview
        preview: preview,
        play: play,
        stop: stop,
        replay: replay,
        startRecord: startRecord,
        stopRecord: stopRecord,
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
        deleteElement:deleteElement,
        hideOrShow :hideOrShow ,
        pinIt:pinIt,

        // element insert (text, sound, image...)
        insertBkImageFromLocal: insertBkMatFromLocal, // upload
        insertPeopleFromLocal: insertPeopleFromLocal,
        insertPropFromLocal: insertPropFromLocal,
        insertSoundFromLocal: insertSoundFromLocal,
        insertPeopleImage: insertPeopleImage, // i.e. FromUrl:
        insertPropImage: insertPropImage,
        insertBkImage: insertBkImage,
        insertText: insertText,
        insertSound: insertSound,

        // select set
        emptySelectSet:emptySelectSet,

        // editor
        setAddMode: setAddMode,
        setModifyMode: setModifyMode,
        getTextCursor: getTextCursor,
        setColorPanel: setColorPanel,
        toAddMode: toAddMode,
        reset: reset,

        // share
        shareFbWeb: shareFbWeb
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
        state.isAddMode = null;
        state.isRecording = false; // must be in AddMode
        state.isModifyMode = null;
        state.isPreviewMode = null;
        state.isPlayMode = null;
        state.isPlaying = false;
    }

    function initialize() {
        reset();
        document.addEventListener(TQ.Scene.EVENT_READY, onSceneReady);
    }

    function onSelectSetChange() {
        updateMode();
    }

    function onSceneReady() {
        document.addEventListener(TQ.SelectSet.SELECTION_NEW_EVENT, onSelectSetChange);
        document.addEventListener(TQ.SelectSet.SELECTION_EMPTY_EVENT, onSelectSetChange);
        updateMode();
        updateColorPanel();
        WxService.init();
        statService.startToShow();
        TQ.LazyLoading.start();

        // TQ.TouchManager.addHandler('swipeleft', gotoPreviousLevel);
        // TQ.TouchManager.addHandler('swiperight', gotoNextLevel);
    }

    function insertBkMatFromLocal() {
        return insertMatFromLocal(TQ.MatType.BKG);
    }

    function insertPeopleFromLocal() {
        return insertMatFromLocal(TQ.MatType.PEOPLE);
    }

    function insertPropFromLocal() {
        return insertMatFromLocal(TQ.MatType.PROP);
    }

    function insertSoundFromLocal() {
        return insertMatFromLocal(TQ.MatType.SOUND);
    }

    function insertMatFromLocal(matType) {
        if (WxService.isReady()) {
            alert("请在浏览器中打开，以便于使用所有功能");
            // return doInsertMatFromLocalWx(matType);
        }

        return doInsertMatFromLocal(matType);
    }

    function doInsertMatFromLocal(matType) {
        if (!_initialized) {
            _initialized = true;
            domEle = document.createElement('input');
            domEle.setAttribute('id', '---input-file-test');
            domEle.setAttribute('type', 'file');
            domEle.setAttribute('multiple', true);
            document.body.appendChild(domEle);
            fileElement = $(domEle);
        }

        fileElement.unbind('change'); // remove old handler
        fileElement[0].value = null;  // remove old selections
        fileElement.change(onSelectOne);
        fileElement.click();

        function onSelectOne() {
            console.log('changed');
            var files = domEle.files;
            if (files.length > 0) {
                processOneMat(files[0], matType);
            }
            fileElement.unbind('change'); // remove old handler
            fileElement.change(null);
        }
    }

    function processOneMat(aFile, matType) {
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

        //ToDo: 检查合法的文件类别
        switch (matType) {
            case TQ.MatType.BKG:
                var options = {crossOrigin: "Anonymous"};  // "Use-Credentials";
                var processor = new TQ.ImageProcess();
                processor.start(aFile, options, uploadData);
                break;
            default:
                if (matType === TQ.MatType.SOUND) {
                    TQ.Assert.isTrue(isSound(aFile));
                }
                uploadData(aFile);
        }

        function uploadData(buffer) {
            NetService.uploadOne(buffer, matType).
                then(function (res) {
                    TQ.Log.alertInfo("after uploadOne: " + JSON.stringify(res));
                    TQ.Log.debugInfo("mat url: " + res.url);
                    addItemByUrl(res.url, matType);
                }, function (err) {
                    console.log(err);
                })
                .finally(TQ.MessageBox.hide);
        }
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
        var desc = {src: filename, type: "Bitmap", autoFit: TQ.Element.FitFlag.KEEP_SIZE, x: x, y: y};
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
            fontSize: getFontSize(),
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

    function addItemByUrl(url, matType) {
        var eleType = (matType === TQ.MatType.SOUND) ? TQ.ElementType.SOUND : TQ.ElementType.BITMAP,
            fitFlag = (matType === TQ.MatType.BKG) ?
                TQ.Element.FitFlag.FULL_SCREEN : TQ.Element.FitFlag.KEEP_SIZE,
            desc = {src: url, type: eleType, autoFit: fitFlag};

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

        currScene.deleteLevel(id);
    }

    function deleteCurrentLevel() {
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

    ////////////////////

    function doStop() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, currScene != null);
        if (currScene != null) {
            currScene.stop();
        }
    }

    function doPlay() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, currScene != null);
        if (currScene != null) {
            currScene.play();
        }
    }

    function emptyScene() {TQ.SceneEditor.emptyScene(); }

    function getCurrentScene() {
        return currScene;
    }

    function getCurrentElement() {
        return TQ.SelectSet.peek();
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
    }

    function preview () {
        state.isPreviewMode = true;
        play();
        forceToRefreshUI();
    }

    function play() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, currScene != null);
        if (currScene != null) {
            currScene.play();
            updateMode();
        }
    }

    function replay() {
       TQ.Scene.doReplay();
        updateMode();
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

    function deleteElement () {
        TQ.SelectSet.delete(); // 通过undo系统调用了currScene.deleteElement()
    }

    //只用于插入录音，
    //    在开始录音的时候，先记录当时场景的id和当时时间t0，以供本函数使用。
    // 在指定的场景levelID，指定的时间t0，插入所制的声音资源,
    // 如果不指定levelID和t0，则在当前场景的当前时刻插入
    function addResToStageCenter(res, levelID, t0) {
        return addResToStageCenter(res, levelID, t0);
    }

    function getCurrentLevelID()
    {
        return currScene.currentLevelId;
    }

    function getCurrentTime()
    {
        return TQ.FrameCounter.t();
    }

    // size: 雪花大小，  默认1,  取值范围1-5.
    // direction:  落雪方向： 0：向下， 取值范围： -15度到15度，
    // density: 密度， 默认1（小雨）取值范围：1-10
    function snow(size, direction, density, res, snowFlowerImage) {
        TQ.SnowEffect.set(size, direction, density, res, snowFlowerImage);
    }

    function snowChange(size, direction, density) {
        TQ.SnowEffect.set(size, direction, density);
    }

    function snowStop() {
        TQ.SnowEffect.stop();
    }

    // size: 雨滴大小，  默认1,  取值范围1-5.
    // direction: 落雨方向： 0：向下， 取值范围： -15度到15度，
    // density: 密度， 默认1（小雨），取值范围：1-10
    function rain(size, direction, density, res, dropImage) {
        TQ.RainEffect.set(size, direction, density, res, dropImage);
    }

    function rainChange(size, direction, density) {
        TQ.RainEffect.set(size, direction, density);
    }

    function rainStop() {
        TQ.RainEffect.stop();
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
            selectedElement.setSize(getFontSize());
            // TQ.DirtyFlag.setElement(this); // called in setText
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
            selectedElement.setColor(state.color);
            // TQ.DirtyFlag.setElement(this); // called in setText
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
        state.isPreviewMode = false;
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
        $timeout(function() {
            state.isPlaying = TQ.FrameCounter.isPlaying();
        }, 300);
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
            var pos = ele.getPositionInNdc();
            state.x = pos.x;
            state.y = pos.y;
        }
    }

    function getTextCursor() {
        var x = TQ.MathExt.range(state.x, 0, 0.9);
        var y = state.y;
        if (_lastSelected && _lastSelected.isText()) {
            y -= (getFontSize() / TQ.Config.workingRegionHeight);
        }

        if (y < 0.1) {
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
        $timeout(null);
    }

    function onDelete(evt) {
        if (TQ.SelectSet.isEmpty()) {
            // TQ.MessageBox.show("确认要删除这个场景？", deleteCurrentLevel);
            deleteCurrentLevel();
        } else {
            TQ.FloatToolbar.onDelete(evt);  // 删除当前选中的元素
        }
    }

    function shareFbWeb() {
        if (!WCY.getShareCode()) {
            if (!_tryToSave) {
                _tryToSave = true;
                return WCY.save().then(shareFbWeb);
            } else {
                return TQ.MessageBox.show("需要先保存");
            }
        }

        _tryToSave = false;

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

}
