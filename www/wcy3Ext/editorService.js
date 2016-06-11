/**
 * Created by Andrewz on 1/17/2016.
 * EditorExt service 是 SceneEditor的扩展，
 * * 可以调用更多的模块（比editor）， 比如图片上传模块
 * *
 */

angular.module('starter').factory('EditorService', EditorService);
EditorService.$injection = ['NetService', 'WxService'];
function EditorService(NetService, WxService) {
    var _initialized = false,
        fileElement = null,
        _isBkMat = false,
        domEle = null;

    var state = { // editor 的各种当前值， 用户选择的
        fontLevel: '' + (parseInt(TQ.Config.fontSize) / TQ.Config.FONT_LEVEL_UNIT),
        color: TQ.Config.color
    }

    function insertBkMatFromLocal() {
        _isBkMat = true;
        return insertMatFromLocal(_isBkMat);
    }

    function insertMatFromLocal(isBkMat) {
        _isBkMat = !!isBkMat;
        if (WxService.isReady()) {
            alert("请在浏览器中打开，以便于使用所有功能");
            // return insertLocalMatWx();
        }

        return insertLocalMatWeb();
    }

    function insertLocalMatWeb() {
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
    }

    function onSelectOne() {
        console.log('changed');
        var files = domEle.files;
        if (files.length > 0) {
            processOneMat(files[0]);
        }
    }

    function processOneMat(aFile) {
        var wxAbility = {
            FileAPI: !!window.FileAPI,
            FileReader: !!window.FileReader,
            URL: !!window.URL,
            XMLHttpRequest: !!window.XMLHttpRequest,
            Blob: !!window.Blob,
            ArrayBuffer: !!window.ArrayBuffer,
            webkitURL: !!window.webkitURL,
            atob: !!window.atob
        }

        TQ.Log.alertInfo("before uploadOne:" + JSON.stringify(wxAbility));

        function uploadData(buffer) {
            uploadOneFile(buffer).
                then(function (data) {
                    TQ.Log.alertInfo("after uploadOneFIle: " + JSON.stringify(data));
                    addMatFromData(aFile, data, _isBkMat);
                    // fileElement.unbind('change'); // remove old handler
                }, function (err) {
                    console.log(err);
                });
        }

        if (isSound(aFile)) {
            uploadData(aFile);
        } else {
            var options = {}
            var processor = new TQ.ImageProcess();
            processor.start(aFile, options, uploadData);
        }
    }

    // private functions:
    function isSound(file) {
        if (!file.type) {  // for Wx
            return false;
        }

        return (file.type.indexOf('audio') >= 0);
    }

    function insertLocalMatWx() {
        WxService.chooseImage().then(function (filePath) {
            var aFile = {
                path: filePath,
                type: NetService.TYPE_IMAGE,
                isWx: true
            }

            TQ.Log.alertInfo("微信InsertLocal：" + JSON.stringify(aFile));
            processOneMat(aFile);
        }, function (err) {
            console.log(err);
        });

    }

    function uploadOneFile(file) {
        return NetService.uploadOne(file);
    }

    function insertImage(filename, x, y) {
        var desc = {src: filename, type: "Bitmap", autoFit: TQ.Element.FitFlag.KEEP_SIZE, x: x, y: y}
        TQ.SceneEditor.addItem(desc);
    }

    function insertBkImage(filename, x, y) {
        var desc = {src: filename, type: "Bitmap", autoFit: TQ.Element.FitFlag.FULL_SCREEN, x: x, y: y}
        TQ.SceneEditor.addItem(desc);
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
        }

        TQ.SceneEditor.addItem(desc);
        // TQ.TextEditor.initialize();
        // TQ.TextEditor.addText(TQ.Dictionary.defaultText);
    }

    function insertSound(filename) {
        var desc = {src: filename, type: "SOUND"}
        TQ.SceneEditor.addItem(desc);
     }

    function addMatFromData(aFile, data, isBkMat) {
        var matType = isSound(aFile) ? TQ.ElementType.SOUND : TQ.ElementType.BITMAP;
        var fitFlag = (isBkMat && matType === TQ.ElementType.BITMAP) ?
            TQ.Element.FitFlag.FULL_SCREEN : TQ.Element.FitFlag.KEEP_SIZE;
        var desc = {src: data.url, type: matType, autoFit: fitFlag}
        TQ.SceneEditor.addItem(desc);
    }

    function getFontSize() {
        return parseInt(state.fontLevel) * TQ.Config.FONT_LEVEL_UNIT;
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

        currScene.deleteLevel(currScene.currentLevelId);
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

    var isPlayOnly = false;
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
        }
    }
    function play() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, currScene != null);
        if (currScene != null) {
            currScene.play();
        }
    }

    function replay() {
       TQ.Scene.doReplay();
    }

    function startRecord() {TQ.SceneEditor.setEditMode(); }
    function stopRecord() {TQ.SceneEditor.setPlayMode(); }
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

    var canvas;
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

    function deleteElement(ele) {
        currScene.deleteElement(ele);
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

    return {
        state: state,
        play: play,
        stop: stop,
        replay: replay,
        startRecord: startRecord,
        stopRecord: stopRecord,
        // pause: doPause,
        addLevel: addLevel,
        addLevelAt: addLevelAt,
        deleteLevel: deleteLevel,
        deleteCurrentLevel: deleteCurrentLevel,
        gotoPreviousLevel: gotoPreviousLevel,
        gotoNextLevel: gotoNextLevel,
        gotoLevel: gotoLevel,
        getFontSize: getFontSize,
        insertImageFromLocal: insertMatFromLocal,
        insertBkImageFromLocal: insertBkMatFromLocal,
        insertImage: insertImage,  // i.e. FromUrl:
        insertBkImage: insertBkImage,
        insertText: insertText,
        insertSound: insertSound
    }
}
