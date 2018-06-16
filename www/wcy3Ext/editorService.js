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
        isSharingToFB = false,
        domEle = null,
        lastCmd = CMD_UNKNOWN,
        currCmd = CMD_UNKNOWN;

    var canvas;

    var state = TQ.State,
        levelThumbs = WCY.levelThumbs;
    state.hasUndo = TQ.CommandMgr.hasUndo; // function
    state.hasRedo = TQ.CommandMgr.hasUndo; // function

    return {
        state: state,
        canvasStyle: TQ.Graphics.getCanvasStyle(),
        updateControllers: updateControllers,
        forceToRenderSlider: forceToRenderSlider,

        banMat: NetService.banMat,

        // play & preview
        preview: preview,
        previewCurrentLevel: previewCurrentLevel,
        play: play,
        stop: stop,
        replay: replay,
        startRecord: startRecord,
        stopRecord: stopRecord,
        toggleSpeed: TQ.FrameCounter.toggleSpeed,
        // pause: doPause,

        // opus ==> WCY
        cloneIt: WCY.cloneIt,
        forkIt: forkIt,

        // level
        addLevel: addLevel,
        addLevelAt: addLevelAt,
        duplicateCurrentLevel: duplicateCurrentLevel,
        deleteLevel: deleteLevel,
        deleteCurrentLevel: deleteCurrentLevel,
        gotoPreviousLevel: gotoPreviousLevel,
        gotoNextLevel: gotoNextLevel,
        gotoLevel: gotoLevel,

        // level and element
        onDelete: onDelete,

        // element modification (text, sound, image...)
        changeSkin: changeSkin,
        getFontSize: getFontSize,
        setSize: setSize,
        setFontLevel: setFontLevel,
        setTextProperty: setTextProperty,
        decreaseFontLevel: decreaseFontLevel,
        increaseFontLevel: increaseFontLevel,
        setColor: setColor,
        eraseAnimeTrack: TQ.SelectSet.eraseAnimeTrack,
        turnOnTrim: turnOnTrim,
        turnOffTrim: turnOffTrim,
        trim: trim,
        increaseTimeline: increaseTimeline,
        decreaseTimeline: decreaseTimeline,

        // UI操作部分， 更改了元素的state， 所有，必须 调用 updateMode()，以更新UI
        hideOrShow: hideOrShow,
        pinIt: pinIt,
        attachTextBubble: attachTextBubble,
        detachTextBubble: detachTextBubble,
        moveCtrl: TQ.MoveCtrl,
        // element insert (text, sound, image...)
        mCopyToggle: mCopyToggle,
        insertMat: insertMat,
        loadLocalImage: loadLocalImage,
        loadLocalSound: loadLocalSound,
        insertPeopleImage: insertPeopleImage, // i.e. FromUrl:
        insertPropImage: insertPropImage,
        insertBkImage: insertBkImage,
        insertText: insertText,
        insertRectangle: insertRectangle,
        insertSound: insertSound,
        insertSnow: TQ.ParticleMgr.insertSnow,
        insertRain: TQ.ParticleMgr.insertRain,
        insertMoney: TQ.ParticleMgr.insertMoney,
        selectLocalFile: selectLocalFile,

        // select set
        emptySelectSet: emptySelectSet,

        // editor
        initialize: initialize,
        forceToRefreshUI: forceToRefreshUI,
        setAddMode: setAddMode,
        toAddMode: toAddMode,
        setModifyMode: setModifyMode,
        getTextCursor: getTextCursor,
        setColorPanel: setColorPanel,
        reset: reset,
        setWorkingRegion: setWorkingRegion,
        setBackgroundColor: setBackgroundColor,
        onEventByToolbar: onEventByToolbar,

        // particle Effect
        ParticleMgr: TQ.ParticleMgr,  // start, stop, change(option)

        // share
        shareFbWeb: shareFbWeb,
        saveScreenShot: saveScreenShot
    };

    function addItem(desc, matType) {
        if (isProxyMat(desc.src)) {
            NetService.uploadOne(desc.src, matType).then(function (res) {
                TQ.Log.alertInfo("uploaded " + desc.src + " to " + res.url);
                desc.src = res.url;
                TQ.SceneEditor.addItem(desc);
            }, function (err) {
                TQ.Log.error(err);
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
        state.showTimer = false;
        state.showTrimTimeline = false; //false;

        // editor's mode
        if (currScene && currScene.isEmpty()) {
            setAddMode();
        } else {
            setPreviewMode();
        }
        state.isRecording = false; // must be in AddMode
        state.isPreviewMenuOn = false;
        state.isPlayMode = null;
        TQ.State.isPlaying = false;
        state.isMCopying = false;
        TQ.FrameCounter.toggleSpeed(TQ.Const.TOGGLE_RESET, state);
    }

    function initialize() {
        TQ.TextElementWxAdapter.detectFontSizeFactor();
        reset();
        $rootScope.$on(TQ.Scene.EVENT_READY, onSceneReady);
        $rootScope.$on(TQ.EVENT.REFRESH_UI, forceToRefreshUI);
    }

    function forceToRenderSlider() {
        $timeout(function () { // 初始化slider模块
            $rootScope.$broadcast('rzSliderForceRender');
        });
    }

    function onSelectSetChange() {
        updateMode();
    }

    function onSceneReady() {
        reset();
        TQ.PreviewMenu.initialize(state, onPreviewMenuOn, onPreviewMenuOff);
        onResize();
        if (!_sceneReady) { // 新建WCY， 不属于此
            TQ.AssertExt.invalidLogic(!_sceneReady, "不能反复调用");
            _sceneReady = true;
            window.addEventListener("resize", onResize);
            window.addEventListener('orientationchange', function () {
                $timeout(onResize); // ！！ 必须用timeout 之后， 否则ipad上不起作用。
            });

            document.addEventListener(TQ.SelectSet.SELECTION_NEW_EVENT, onSelectSetChange);
            document.addEventListener(TQ.SelectSet.SELECTION_EMPTY_EVENT, onSelectSetChange);
            updateMode();
            updateColorPanel();
            if (TQ.Config.statServiceEnabled) {
                // 此服务无法lazyLoading，因为是ng模块， 暂时停止使用
                StatService.startToShow();
            }

            if (TQ.Config.hasFacebook) {
                TQ.LazyLoading.loadOne("/wcy3Social/fb.js");
            }

            // TQ.TouchManager.addHandler('swipeleft', gotoPreviousLevel);
            // TQ.TouchManager.addHandler('swiperight', gotoNextLevel);
        }

        updateControllers();

        if (TQ.Config.AutoPlay && currScene && !currScene.isEmpty()) {
            if (TQUtility.isIOS()) {
                TQ.SoundMgr.stop();
                TQ.MessageBox.prompt(TQ.Locale.getStr('Click OK to start play'), function () {
                    TQ.SoundMgr.iosForceToResumeAll();
                    preview();
                });
            } else {
                TQ.MessageBox.hide();
                preview();
            }
        }

        if (currScene && !currScene.isPlayOnly) {
            WCY.startAutoSave();
        }
    }

    function updateControllers() { // 在login和fork之后， 都需要使用
        if (!TQ.TouchManager.hasInitialized() && !TQ.WCY.isPlayOnly) {
            TQ.TouchManager.initialize();
        }

        if (!TQ.TouchManager.hasStarted() && !TQ.WCY.isPlayOnly) {
            TQ.TouchManager.start();
        }

        if (TQ.TouchManager.hasStarted() && TQ.WCY.isPlayOnly) {
            TQ.TouchManager.stop();
        }

    }

    function onResize() {
        AppService.configCanvas();
        forceToRedraw(); // 迫使IOS系统重新绘制canvas上的图像
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
            $timeout(forceToRenderSlider, 200);
        });
    }

    function onPreviewMenuOff() {
        $timeout(function () {
            state.isPreviewMenuOn = false;
        });
    }

    function loadLocalSound(matType, useDevice, callback) {
        if (WxService.isReady()) {
            // alert("请在浏览器中打开，以便于使用所有功能");
            // return doInsertMatFromLocalWx(matType);
        }

        if (useDevice && (matType === TQ.MatType.SOUND)) {
            if (TQ.AudioRecorder.isRecording) {
                return TQ.AudioRecorder.stop();
            } else {
                return TQ.AudioRecorder.start(function (data) {
                    TQ.SceneEditor.addItemByFile(data, matType, callback);
                }, forceToRefreshUI);
            }
        }
    }

    function loadLocalImage(matType, useDevice, callback) {
        return selectLocalFile(matType, useDevice).then(function (filesOrImage64) {
            var files = (filesOrImage64 instanceof FileList) ? filesOrImage64 : [filesOrImage64],
                n = files.length,
                i,
                mat;
            for (i = 0; i < n; i++) {
                mat = files[i];
                if (TQ.Utility.isImageFile(mat) || TQ.Utility.isImage64(mat)) {
                    TQ.SceneEditor.preprocessLocalImage(mat, matType, callback);
                }
            }
        }, errorReport);
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
            TQ.Log.debugInfo('changed');
            var files = domEle.files;
            if ((files.length > 0)) {
                q.resolve(files);
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

        TQ.MessageBox.showWaiting(TQ.Locale.getStr('processing...'));
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
                    if (!TQUtility.isSoundFile(aFile)) {
                        var str = TQ.Locale.getStr('found audio format unsupported, please use wav or map3') + ': ' + aFile.type;
                        TQ.MessageBox.show(str);
                        q.reject({error:1, msg: str});
                        break;
                    }
                    TQ.Assert.isTrue(TQUtility.isSoundFile(aFile));
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
        if (TQ.SelectSet.isEmpty() && !state.isMCopying) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }

        state.isMCopying = !state.isMCopying;
        currCmd = (state.isMCopying) ? CMD_MCOPYING_BEGIN : CMD_MCOPYING_END;
        TQ.TouchManager.updateOps(state);

    }
    function insertMat(data) {
        return uploadMat(data).
            then(addItemByData, function (err) {
                TQ.Log.error(err);
            })
            .finally(TQ.MessageBox.hide);
    }

    // private functions:
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
            TQ.Log.error(err);
        });
    }

    function isProxyMat(url) {
        var mainDomain = TQUtility.urlParser(url).origin;
        return (url && (TQ.Config.whiteListMatHosts.indexOf(mainDomain) < 0));
    }

    function insertImage(filename, x, y, matType) {
        if (!matType) {
            matType = TQ.MatType.PROP;
        }
        var desc = {src: filename, type: "Bitmap", eType: TQ.MatType.toEType(matType),
            autoFit: TQ.Element.FitFlag.WITHIN_FRAME, x: x, y: y};
        addItem(desc, matType);
    }

    function insertPeopleImage(filename, x, y) {
        insertImage(filename, x, y, TQ.MatType.PEOPLE);
    }

    function insertPropImage(filename, x, y) {
        insertImage(filename, x, y, TQ.MatType.PROP);
    }

    function insertBkImage(filename, x, y) {
        var desc = {src: filename, type: "Bitmap", eType: TQ.Element.ETYPE_BACKGROUND,
            autoFit: TQ.Element.FitFlag.FULL_SCREEN, x: x, y: y,
            zIndex:0, isBackground: true};
        addItem(desc, TQ.MatType.BKG);
    }

    function insertText(message, x, y) {
        if (!message) {
            return TQ.Log.info("空字符串， 不必添加到画布");
        }
        if (!state.fontFace) {
            state.fontFace = TQ.Config.fontFace;
        }

        var desc = {
            src: null,
            text: message,
            type: "Text",
            eType: TQ.Element.ETYPE_TEXT,
            autoFit: TQ.Element.FitFlag.KEEP_SIZE,
            x: x,
            y: y,
            fontSize: getFontSize(), // 必须是像素坐标，在designated坐标系
            fontFace: state.fontFace,
            color: state.color
        };

        TQ.SceneEditor.addItem(desc);
        // TQ.TextEditor.initialize();
        // TQ.TextEditor.addText(TQ.Dictionary.defaultText);
    }

    function insertRectangle(x, y, w, h) {
        var desc = {
            src: null,
            type: TQ.ElementType.RECTANGLE,
            autoFit: TQ.Element.FitFlag.NO,
            x: x,
            y: y,
            width: w,
            height: h,
            fontSize: getFontSize(), // 必须是像素坐标，在designated坐标系
            color: state.color
        };

        TQ.SceneEditor.addItem(desc);
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
        return parseFloat(state.fontLevel) * TQ.Config.FONT_LEVEL_UNIT;
    }

    function fontSize2Level(size) {
        return '' + (parseFloat(size) / TQ.Config.FONT_LEVEL_UNIT);
    }

    /*
     直接跳转到第id个场景 (id >=0)
     */
    function gotoLevel(id) {
        TQ.Log.debugInfo("gotoLevel " + id);
        if (state.isAddMode || state.isModifyMode) {
            if (currScene && currScene.currentLevelId >= 0) {
                TQ.ScreenShot.saveThumbnail(levelThumbs, currScene.currentLevelId);
            }

            document.addEventListener(TQ.Level.EVENT_START_SHOWING, makeThumbnail);
            function makeThumbnail() {
                document.removeEventListener(TQ.Level.EVENT_START_SHOWING, makeThumbnail);
                if (!levelThumbs[currScene.currentLevelId]) {
                    TQ.ScreenShot.saveThumbnail(levelThumbs, currScene.currentLevelId);
                    forceToRefreshUI();
                }
            }
        }
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
        levelThumbs.splice(currScene.currentLevelId+1, 0, {src:null, timestamp:Date.now()});
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

    function duplicateCurrentLevel() {
        assertNotNull(TQ.Dictionary.FoundNull, currScene); // 必须在微创意显示之后使用
        if (!currScene) return;
        var nextLevel = currScene.currentLevelId + 1;
        currScene.duplicateCurrentLevel();
        $timeout(function() {
            gotoLevel(nextLevel);
        });
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
            doDeleteLevelAndThumbs(id);
        }
    }

    function doDeleteLevelAndThumbs(id) {
        currScene.deleteLevel(id);
        levelThumbs.splice(id, 1);
    }

    function deleteCurrentLevel() {
        if (currScene.levelNum() === 1) {
            // addLevel();
            // $timeout(function() {
            //     deleteLevel(0);
            // });
            return TQ.MessageBox.prompt('至少要有一个场景!');
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
        $timeout(function () {
            deleteLevel(id);
        });
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
        TQ.State.isPlaying = false;
        $timeout(function () { // 用timeout迫使angularjs 刷新UI,
            // 只是stop，不涉及修改canvas
        });
    }

    function preview (options) {
        TQ.SelectSet.empty(); // 清楚选中的元素， 和highlight
        setPreviewMode();
        replay(options);
    }

    function previewCurrentLevel() {
        preview({thisLevelOnly: true});
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
        TQ.State.isPlaying = true;
        $timeout(function () { // 用timeout跳过本次touch的end或mouse的up引起的事件
            AppService.configCanvas();
        }, 100);
        TQ.IdleCounter.start(TQ.PreviewMenu.hide);
        TQ.PreviewMenu.startWatch();
    }

    function replay(option) {
       TQ.Scene.doReplay(option);
       _onPlay();
    }

    function startRecord() {TQ.FrameCounter.startRecord(); TQ.SceneEditor.setPlayMode(); }
    function stopRecord() {TQ.FrameCounter.stopRecord(); TQ.SceneEditor.setEditMode(); }
    function emptyScene() {TQ.SceneEditor.emptyScene(); }

    function doPlayStop() {
        if (TQ.FrameCounter.isPlaying()) {
            stop();
        } else {
            play();
        }
    }

    // 进入/退出 全屏模式
    function fullscreenPlay (width, height){ // 屏幕分辨率的大小
        canvas = TQ.Graphics.getCanvas();
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        TQ.Config.zoomX = width / TQ.Config.workingRegionWidth;
        TQ.Config.zoomY = height / TQ.Config.workingRegionHeight;
        TQ.Config.workingRegionWidth = width;
        TQ.Config.workingRegionHeight = height;
        play();
    }

    function eixtFullscreen() {
        TQ.Graphics.setCanvas();
        TQ.Config.zoomX = TQ.Config.zoomY = 1;
    }

    function setWorkingRegion(w, h,  asDefault) {
        if (currScene) {
            currScene.setDesignatedSize({w: w, h: h});
        }

        if (asDefault) {
            state.designatedWidth = w;
            state.designatedHeight = h;
        }

        $timeout(onResize);
    }

    function setBackgroundColor(bkgColor, asDefault) {
        if (currScene) {
            currScene.backgroundColor = bkgColor;
        }

        if (asDefault) {
            state.backgroundColor = bkgColor;
        }

        $timeout(onResize);
    }

    //------------- 以下的函数用于配置系统参数 -------------------------
    // 设置零件标志的大小， 默认是10：
    function setMarkerSize(radius) {
        TQ.Marker.RADIUS = radius;
    }

    function setFontLevel(level) {
        var selectedElement = TQ.SelectSet.peek();
        if (selectedElement && selectedElement.isText()) {
            state.fontLevel = level;
            TQ.CommandMgr.directDo(new TQ.SetSizeCommand(selectedElement, getFontSize()));
        }
    }

    function setTextProperty(ele, option) {
        TQ.CommandMgr.directDo(TQ.CommandMgr.setTextProperty(ele, option));
    }

    function increaseFontLevel() {
        var selectedElement = TQ.SelectSet.peek();
        if (selectedElement && selectedElement.isText()) {
            state.fontLevel = fontSize2Level(selectedElement.getFontSize());
            state.fontLevel++;
            setFontLevel(state.fontLevel);
        }
    }

    function decreaseFontLevel() {
        var selectedElement = TQ.SelectSet.peek();
        if (selectedElement && selectedElement.isText()) {
            state.fontLevel = fontSize2Level(selectedElement.getFontSize());
            if (state.fontLevel >=1) {
                state.fontLevel--;
                setFontLevel(state.fontLevel);
            }
        }
    }

    function turnOnTrim() {
        state.showTrimTimeline = true;
        TQ.TimerUI.rangeSlider.maxValue = TQ.TimerUI.rangeSlider.minValue;
        forceToRenderSlider();
        $timeout(forceToRenderSlider, 100);
    }

    function trim() {
        if (!TQ.Utility.preventDither()) {
            return;
        }
        console.warn("TRIM command: ...", tObj1, tObj2);
        var selectedElement = TQ.SelectSet.peek(),
            tObj1 = TQ.TimerUI.getTObject1(),
            tObj2 = TQ.TimerUI.getTObject2(),
            tTemp;

        if ((tObj1.levelId > tObj2.levelId) ||
            ((tObj1.levelId === tObj2.levelId) && (tObj1.t > tObj2.t))) {
            tTemp = tObj1;
            tObj1 = tObj2;
            tObj2 = tTemp;
        }

        TQ.MessageBox.prompt("This operation is not revertable, Are you sure? <br/>Apply to all objects", function () {
            $timeout(onOK);
        }, turnOffTrim);

        function onOK() {
            console.warn("TRIM: onOK...", tObj1, tObj2);
            //if (selectedElement && (tObj1.levelId === tObj2.levelId)) {
            //    selectedElement.trim(tObj1.t, tObj2.t);
            //} else

            if (currScene && currScene.currentLevel) {
                doTrim(tObj1, tObj2);
            }
            turnOffTrim();
        }
    }

    function turnOffTrim() {
        state.showTrimTimeline = false;
        TQ.TimerUI.rangeSlider.maxValue = TQ.TimerUI.rangeSlider.minValue;
        forceToRenderSlider();
        $timeout(forceToRenderSlider, 100);
    }
    function doTrim(tObj1, tObj2) {
        console.warn("TRIM: ...", tObj1, tObj2);
        var MAX_LENGTH = 99999.0;
        var leftLevel, rightLevel;
        if (tObj1.levelId == tObj2.levelId) {
            leftLevel = currScene.getLevel(tObj1.levelId);
            leftLevel.trim(tObj1.t, tObj2.t);
        } else {
            rightLevel = currScene.getLevel(tObj2.levelId);
            rightLevel.trim(0, tObj2.t);
            TQ.DirtyFlag.setLevel(rightLevel);
            rightLevel.calculateLastFrame();
            rightLevel.calculateRealLastFrame();
            var levelId = tObj2.levelId - 1;
            while (levelId > tObj1.levelId) {
                doDeleteLevelAndThumbs(levelId);
                levelId --;
            }
            leftLevel = currScene.getLevel(levelId);
            leftLevel.trim(tObj1.t, MAX_LENGTH);
        }

        TQ.TimerUI.onTrimCompleted();
        TQ.FrameCounter.trim(tObj1, tObj2);
        TQ.DirtyFlag.setLevel(leftLevel);
        leftLevel.calculateLastFrame();
        leftLevel.calculateRealLastFrame();
        if (rightLevel) {
            TQ.DirtyFlag.setLevel(rightLevel);
            rightLevel.calculateLastFrame();
            rightLevel.calculateRealLastFrame();
        }
        currScene.currentLevel.setTime(TQ.FrameCounter.maxTime(), true);
    }

    function increaseTimeline() {
        var level = currScene.currentLevel;
        level.increaseTime();
        level.calculateLastFrame();
        level.calculateRealLastFrame();
        $timeout(forceToRenderSlider, 100);
    }

    function decreaseTimeline() {
        var level = currScene.currentLevel;
        level.decreaseTime();
        level.calculateLastFrame();
        level.calculateRealLastFrame();
        $timeout(forceToRenderSlider, 100);
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
        if ((typeof colorPicker === 'string') && colorPicker[0]==='#') {
            state.color = colorPicker;
        } else {
            state.color = '#' + colorPicker.toString();
        }
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

    function attachTextBubble() {
        TQ.TextBubble.attachTo();
        updateMode();
    }

    function detachTextBubble() {
        TQ.TextBubble.detachFrom();
        updateMode();
    }

    function hideOrShow () {
        TQ.SelectSet.show(false);
        updateMode();
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
        TQ.Scene.restoreState();
        $timeout(function () {
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
            TQ.State.isPlaying = false;
            AppService.configCanvas();
            forceToRefreshUI();
            $timeout(function () { //在UI（top bar等）更新之后，必须重新计算canvas大小，
                AppService.configCanvas();
                forceToRefreshUI();
                if (currScene.levelNum() > levelThumbs.length) {
                    $timeout(syncLevelThumbs);
                }
            });
        }, 100);
    }

    function syncLevelThumbs() {
        TQ.State.allowPageTransition = false;
        // quick fill, to void undefined element in ng repeat;
        var nowTimestamp = Date.now();
        for (var i = 0; i < currScene.levelNum(); i++) {
            if (!levelThumbs[i]) {
                levelThumbs[i] = {src:null, timestamp:i + nowTimestamp};
            }
        }

        function makeCheckOne(i) {
            return function () {
                var j;
                for (; i >= 0; i--) {
                    if (!levelThumbs[i] || !levelThumbs[i].src) {
                        gotoLevel(i);
                        break;
                    }
                }
                j = i - 1;
                if (j >= 0 && (j < currScene.levelNum())) {
                    document.addEventListener(TQ.Level.EVENT_START_SHOWING, handleNextLevel);
                    function handleNextLevel() {
                        document.removeEventListener(TQ.Level.EVENT_START_SHOWING, handleNextLevel);
                        makeCheckOne(j)();
                    }
                } else {
                    $timeout(function () {
                        gotoLevel(0);
                        $timeout(function () {
                            gotoLevel(0);
                            TQ.State.allowPageTransition = true;
                        }, 500);
                    }, 500);
                }
            };
        }

        if (TQ.PageTransitionEffect.isBusy()) { // 防止再次进入
            setTimeout(function () {
                makeCheckOne(currScene.levelNum() - 1)();
            }, 1000);
        } else {
            makeCheckOne(currScene.levelNum() - 1)();
        }
    }

    function setPreviewMode() {
        state.isPreviewMode = true;
        state.isAddMode = false;
        state.isModifyMode = false;
    }

    function forkIt() {
        WCY.forkIt().
            then(toAddMode);
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
            setPreviewMode();
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
            $timeout(doUpdate, 300);
        }

        function doUpdate() {
            if (TQ.State.isPlaying !== TQ.FrameCounter.isPlaying()) {
                TQ.State.isPlaying = TQ.FrameCounter.isPlaying();
                AppService.configCanvas();
            }
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
                if (!TQ.Utility.equalWithin2(state.fontLevel, level)) {
                    state.fontLevel = level;
                    hasChanged = true;
                }

                if (!state.isFont) {
                    state.isFont = true;
                    hasChanged = true;
                }
                if (state.isFont) {
                    if (state.hasBubble !== ele.hasBubble()) {
                        state.hasBubble = ele.hasBubble();
                        hasChanged = true;
                    }
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
        if (currScene) {
            currScene.isDirty = true; // 迫使IPad系统重新绘制canvas上的图像， 否则，屏幕上是空白
        }
        forceToRefreshUI();
    }

    function onDelete(evt) {
        if (TQ.SelectSet.isEmpty()) {
            // TQ.MessageBox.show(TQ.Locale.getStr('are you sure to delete it?'), deleteCurrentLevel);
            deleteCurrentLevel();
        } else {
            // 删除当前选中的元素
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.SelectSet.delete();
        }
    }

    function changeSkin(newSkinUrl) {
        if (TQ.SelectSet.isEmpty()) {
            return TQ.MessageBox.show(TQ.Locale.getStr('select the element to be changed!'));
        }

        var ele = TQ.SelectSet.peekLatestEditableEle();
        if (ele.isPinned()) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('the object is locked', function() {
                ele.pinIt();
                changeSkin(newSkinUrl);
            }))
        }

        if (ele.isBitmap()) {
            ele.changeSkin(newSkinUrl);
        }
    }

    var screenShotIsDither = false;
    function saveScreenShot () { // 奇怪：截屏按钮点击一次，会触发两次这个函数，
        if (screenShotIsDither) {
            return;
        }
        screenShotIsDither = true;
        setTimeout(function() {
            screenShotIsDither = false;
        }, 1000);

        var timestamp = new Date(),
            prefix = timestamp.getTime() +
                '-' + (timestamp.getMonth() + 1) + timestamp.getDate() +
                ', ' + timestamp.getHours() +
                '-' + timestamp.getMinutes() +
                '-' + timestamp.getSeconds();

        var screenshotName = TQ.Config.SCREENSHOT_CORE_PATH + prefix + ".png";
        TQ.Log.debugInfo("name = " + screenshotName);
        TQ.Tool.saveImage(screenshotName);
    }

    function shareFbWeb() {
        if (isSharingToFB) {
            console.error("系统正在忙。。。。");
            return;
        }

        if (!WCY.getShareCode()) {
            isSharingToFB = true;
            if (WCY.hasSsPath()) {
                return WCY.save().then(doIt);
            }
            return WCY.uploadScreenshot().then(doItAndSave);
        }

        function doItAndSave() {
            WCY.save();
            doIt();
        }

        function doIt() {
            isSharingToFB = false;
            shareFbWeb();
        }

        var spaUrl = TQUtility.urlConcat(TQ.Config.OPUS_HOST_FB, "?opus=" + WCY.getShareCode()),
            staticUrl = TQUtility.urlConcat(TQ.Config.OPUS_HOST_FB_STATIC, "/opus/" + WCY.getShareCode() + ".html"),
            screenshotUrl =  WCY.getScreenshotUrl(),
            redirectUrlParams = '',
            linkParams = '';  //'?play=true'

        //ToDo: （需要去掉page中的tag吗？）
        // "share" 需要page中的tag支持，
        // "feed", 不需要
        WCY.createHtmlPage(screenshotUrl).then(doFbShare);
        function doFbShare() {
            FB.ui(
                {
                    app_id : "273410813018932",
                    method: 'feed',
                    name: 'A Picture is Worth a Thousand Words -- idiom',
                    redirect_uri: staticUrl + redirectUrlParams,
                    link: staticUrl + linkParams,
                    message: "" // not supported by FB?
                    // picture, description, captions 等废弃了，--- Jul 17, 2017
                });
        }
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
