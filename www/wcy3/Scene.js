TQ = TQ || {};
(function () {

    function Scene() {
        this.levels = [];
        this.onsceneload = null;     // 不能使用系统 的函数名称，比如： onload， 这样会是混淆
        this.version = Scene.VER2;
        this.isDirty = true;
    }
    Scene.EVENT_READY = "sceneReady";
    Scene.VER1 = "V1";
    Scene.VER2 = "V2";
    Scene.VER3 = "V3"; // 采用归一化的坐标，记录保存wcy，以适应各种屏幕。
    var p = Scene.prototype;
    TQ.EventHandler.initialize(p); // 为它添加事件处理能力
    p.filename = null; // filename是文件名， 仅仅只是机器自动生成的唯一编号
    p.title = null;  // title是微创意的标题，
    p.isPreloading = false;
    p.currentLevelId = 0;
    p.currentLevel = null;
    p.overlay = null;
    p.stage = null;
    p.isSaved = false; // 用于提醒是否保存修改的内容，在close之前。
    p.hasSavedToCache = false;
    p.state = TQBase.LevelState.NOT_INIT;

    // static APIs:
    Scene.doReplay = doReplay;
    Scene.removeEmptyLevel = removeEmptyLevel;
    Scene.stopAux = stopAux;
    Scene.getEmptySceneJSON = getEmptySceneJSON;
    Scene.localT2Global = localT2Global;
    Scene.globalT2local = globalT2local;
    Scene.getTMax = getTMax;

    // dynamic APIs
    p.shooting = function () {
        this.state = TQBase.LevelState.SHOOTING;
    };

    p.isUpdating = false;
    // 这是scene的主控程序
    p.tick = function () {
        var _this = this;
        TQ.TaskMgr.addTask(function () {
            _this.onTick();
        }, null);
    };

    p.onTick = function () {
        if (this.state <= TQBase.LevelState.INITING) {
            this.update(0); // 只更新状态,
        }

        if (this.state < TQBase.LevelState.RUNNING) { // Running 之前, 包括:init, loading等等, 不适合update
            return;
        }

        if (this.isUpdating) {   // 避免重复进入
            return;
        }

        this.isUpdating = true;
        TQ.FrameCounter.update();  // 前进一帧, 只有play和播放的时候, 才移动Frame
        //ToDo:@UI  TQ.TimerUI.update();  // 必须先更新数据, 在更新UI
        if (this.isDirty || TQ.FrameCounter.isPlaying()) {
            this.update(TQ.FrameCounter.t());
            if (this.overlay) {
                this.overlay.update(TQ.FrameCounter.t());
            }

            this.render();
            if (this.isDirty) {
                this.isSaved = false;
                this.hasSavedToCache = false;
                this.isDirty = false;
            }
        }

        if (TQ.GifManager.isOpen) {
            TQ.GifManager.addFrame();
        }
        TQ.InputMap.restart(); // 必须是Game Cycle中最后一个, 因为JustPressed依赖于它
        TQ.FrameCounter.isNew = false;
        this.isUpdating = false;
    };

    p.update = function (t) {
        TQ.SceneEditor.updateMode();
        // 谁都可以 要求Update， 不只是Player
        if (this.currentLevel != null) {
            this.currentLevel.update(t);
            if (this.version >= Scene.VER2) { // ToDo: 只在录制状态下才更新， 或者，初次运行的时候的时候才更新
                // this.updateTimeTable();
            }
            if (TQ.FrameCounter.finished() && TQ.FrameCounter.isPlaying()) {
                if (this.isLastLevel()) {
                    if (!TQ.FrameCounter.isAutoRewind()) {
                        $("#stop").click();
                    } else if (!TQ.FrameCounter.isInverse()) {
                        Scene.doReplay();
                    }
                } else {
                    this.nextLevel();
                }
            }
        }

        this.updateLevelRange();
    };

    p.updateTimeTable = function () {
        // update 当前level的时间
        if (TQ.SceneEditor.isEditMode()) {  //录制的时候， 自动延长 本场景的时间长度
            var BLOCK_SIZE = 100;
            var LOWER_SIZE = 10;
            if ((TQ.FrameCounter.v + LOWER_SIZE) > TQ.FrameCounter.max) {
                TQ.FrameCounter.max += BLOCK_SIZE;
                this.currentLevel.setTime(TQ.FrameCounter.v);
                $('#maxTimeValue').text(TQ.FrameCounter.max);
                //ToDo:@UI  TQ.TimerUI.body.slider("option", "max", TQ.FrameCounter.max);
            } // 同时也要更新计时器的最大值
        } else {
            TQ.FrameCounter.max = this.currentLevel.getTime();
        }

        // update 其它level的 相对时间点
        var t = 0;
        for (var i = 0; i < this.levels.length; i++) {
            this.levels[i].setT0(t);
            t += TQ.FrameCounter.t2f(this.levels[i].getTime());
        }
    };

    function doReplay() {
        if (!currScene) {
            return;
        }
        currScene.stop();
        currScene.gotoLevel(0);
        TQ.FrameCounter.gotoBeginning();
        currScene.play();
    }

    p.render = function () {
        TQ.Assert.isNotNull(stage);
        stage.update();
    };

    p.showLevel = function () {
        TQ.MessageBox.hide();
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.currentLevelId < this.levelNum()); //level ID 超界
        this.currentLevelId = (this.currentLevelId < this.levelNum()) ? this.currentLevelId : 0;
        this.selectLevel(this.currentLevelId);
        this.currentLevel.show();
        this.isDirty = true;
    };

    p.selectLevel = function (id) {
        this.currentLevelId = id;
        this.currentLevel = this.getLevel(this.currentLevelId);
        assertNotNull(TQ.Dictionary.INVALID_LOGIC, this.currentLevel);
        this.currentLevel.onSelected();
        var thisScene = this;
        this.currentLevel.onLevelRunning = function () {
            thisScene.state = TQBase.LevelState.RUNNING;
            thisScene.handleEvent(Scene.EVENT_READY);
            TQ.Base.Utility.triggerEvent(document, Scene.EVENT_READY);
            TQ.MessageBox.hide();
            this.isDirty = true;
        }
    };

    p.joint = function (elements, hasUnJointFlag) {
        if (hasUnJointFlag) {
            this.currentLevel.unJoint(elements);
        } else {
            if (!TQ.InputCtrl.inSubobjectMode) { // 必须在零件模式下, 才能让录制系统更新子物体的坐标为相对坐标.
                $("#subElementMode").click();
            }
            this.currentLevel.joint(elements);
            clearSubjectModeAndMultiSelect()
        }

        this.isSaved = false;
    };

    p.groupIt = function (elements, hasUnGroupFlag) {
        if (hasUnGroupFlag) {
            this.currentLevel.unGroup(elements);
        } else {
            this.currentLevel.groupIt(elements);
            clearSubjectModeAndMultiSelect();
        }
        this.isSaved = false;
    };

    p.skinning = function (parent, child) {
        this.currentLevel.skinning(parent, child);
        this.isSaved = false;
    };

    // for both image and animation
    p.addItem = function (desc) {
        this.isDirty = true;
        var level = this.currentLevel;
        if ((desc.toOverlay == undefined) || (desc.toOverlay == null)) {
            if (desc.levelID != undefined) {
                level = this.getLevel(desc.levelID);
            }
        } else {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER + ": " + desc.toOverlay, (desc.toOverlay == 1)); //overlay参数有误
            assertTrue("is empty? ", this.overlay);
            if (this.overlay) {
                level = this.overlay;
            }
        }

        var ele = TQ.Element.build(level, desc);
        assertTrue(TQ.INVALID_LOGIC, ele.level == level);
        ele.level = level;
        var thisScene = this;
        TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.ADD_ITEM,
            thisScene, ele, ele));

        return ele;
    };

    p.undeleteElement = function (ele) {
        TQ.GarbageCollector.remove(ele);
        ele.level = this.currentLevel;
        this.addElementDirect(ele);
    };

    p.addElementDirect = function (ele) {
        var level = ele.level;
        this.isDirty = true;
        level.addElementDirect(ele);
        if (ele.hasFlag(TQ.Element.LOADED)) {
            ele.addItemToStage();
        }
    };

    p.addText = function (desc) {
        this.isDirty = true;
        return this.currentLevel.addElement(desc);
    };

    p.deleteElement = function (ele) {
        this.isDirty = true;
        assertNotNull(TQ.Dictionary.PleaseSelectOne, ele);
        if (ele != null) {
            this.currentLevel.deleteElement(ele);
            if (ele.isSound()) {
                TQ.SoundMgr.deleteItem(ele);
            }
        }
    };

    p.preLevel = function () {
        if (this.currentLevelId > 0) {
            this.gotoLevel(this.currentLevelId - 1);
        }
    };

    p.nextLevel = function () {
        if (!this.isLastLevel()) {
            this.gotoLevel(this.currentLevelId + 1);
        }
    };

    p.isLastLevel = function () {
        return ((this.currentLevelId + 1) >= this.levelNum());
    };

    p.gotoLevel = function (id) {
        this.isDirty = true;
        id = (id >= this.levelNum()) ? (this.levelNum() - 1) : id;
        id = (id < 0) ? 0 : id;
        if (this.currentLevel != null) {
            TQ.FloatToolbar.close();
            this.currentLevel.exit();
            this.currentLevelId = id;
        }

        this.showLevel();
    };

    p.open = function (fileInfo) {
        TQ.MessageBox.showWaiting("正在加载作品...");
        this.reset();
        this.filename = fileInfo.filename;
        this.screenshotName = fileInfo.screenshotName;
        this.title = null;
        // 删除 旧的Levels。
        this.onsceneload = this.showLevel;

        if (!fileInfo.content &&
            (fileInfo.name === TQ.Config.UNNAMED_SCENE)) {
            fileInfo.content = Scene.getEmptySceneJSON();
        }

        if (!fileInfo.content) {
            this.loadFromJson(fileInfo.name, 'gameScenes');
        } else {
            this._jsonStrToScene(this, fileInfo.content, 'gameScene');
        }
        if (null == this.overlay) {
            this.overlay = new TQ.Overlay({});
        }
        this.isDirty = true;
    };

    p.reset = function () { // 打开文件，或者创建新文件的时候， 重新设置环境
        //   $('#stop').trigger('click');
        this.setEditor();
        _tMax = 0;
        this.isSaved = true;  //只是打开旧的文件， 没有尚未修改
        this.ssPath = null; // 初始化， 没有此值
        this.isDirty = true;
        //ToDo:@UI   initMenu(); // 重新设置菜单

        // close current if  has one;
        if (!((this.currentLevel == undefined) || (this.currentLevel == null))) {
            Scene.stopAux();
            this.close();
        }

        if (TQ.SceneEditor.isEditMode()) {
            TQ.FrameCounter.gotoBeginning();
            if (TQ.FrameCounter.isAutoRewind()) {
                $("#rewind").click();
            }
            if (TQ.TrackRecorder.style == TQ.TrackDecoder.JUMP_INTERPOLATION) {
                $("#linearMode").click();
            }
        }
    };

    p.getLevel = function (id) {
        if (id < this.levels.length) {
            return this.levels[id];
        }
        return null;
    };

    p.getElement = function (id) {
        assertValid("this.currentLevel", this.currentLevel);
        return this.currentLevel.getElement(id);
    };

    p.getAllSounds = function () { // 只返回当前场景的声音， 不能跨场景操作其它场景里面的声音
        if (this.currentLevel) {
            var result = this.currentLevel.getSounds();
        } else {
            result = [];
        }
        return result;
    };

    p.findAtom = function (displayObj) {
        assertValid("this.currentLevel", this.currentLevel);
        return this.currentLevel.findAtom(displayObj);
    };

    p.getSelectedElement = function () {
        assertTrue(TQ.Dictionary.isDepreciated, false);
    };

    p.levelNum = function () {
        return this.levels.length;
    };

    /*
     插入第id(id >=0）个场景， 如果该位置已经有场景， 把原来的场景向后顺延。
     如果id超出下边界（id < 0), 则等价于id =0;.
     如果id 超出上边界， 则自动在末尾添加一个场景
     如果id没有定义，则自动在末尾添加一个场景
     返回值是最大level编号
     */
    p.addLevel = function (id, levelContent) {
        var levelNum = this.levelNum();
        if (id === undefined) {
            id = levelNum;
        }
        id = TQ.MathExt.range(id, 0, levelNum);
        this.isDirty = true;
        if (!levelContent) {
            var levelName = levelNum; // levelNum只是一个流水号， 暂时没有其它用途
            levelContent = new TQ.Level({name: levelName});
        }
        this.levels.splice(id, 0, levelContent);
        return this.levelNum() - 1;
    };

    /*
     删除第id(id >=0）个场景， 并且把此后的场景前移。
     如果id超出边界（id < 0)，则忽略
     */
    p.deleteLevel = function (id) {
        if ((id < 0) || (id >= this.levelNum())) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, false);
            return;
        }
        this.isDirty = true;
        var deleted = this.levels.splice(id, 1);

        if (this.currentLevelId > id) {
            this.currentLevelId --;
        }
        return deleted;
    };

    /*
     移动序号为srcId的场景，并插入到序号dstId的场景之前，
     注意：srcId和dstId都是在执行此函数之前， 按照场景的顺序来编号的。
     用户不需要关心
     */
    p.moveTo = function (srcId, dstId) {
        var content = this.deleteLevel(srcId);
        if (srcId < dstId) {
            dstId--;
        }
        this.addLevel(dstId, content);
    };

    /*
     复制序号为srcId的场景的内容，并插入到序号dstId的场景之前，
     */
    p.copyTo = function (srcId, dstId) {
        var content = this.levels[srcId];
        return this.addLevel(dstId, content);
    };

    // !!! can not recover, be careful!
    // empty the current scene
    p.forceToRemoveAll = function () {
        this.stop();
        this.close(true);  // discard
        while (this.levelNum() > 0) {
            this.deleteLevel(0);
        }
        this.addLevel(); // all one empty level
        this.selectLevel(0);
        this.currentLevel.state = TQBase.LevelState.INITING;
        this.currentLevel.show();
        this.title = TQ.Config.UNNAMED_SCENE;
        this.state = TQBase.LevelState.NOT_INIT;
        this.isSaved = true; //ToDo: check it is false???
        this.isDirty = true;
    };

    // JQuery Ajax version
    p.loadFromJson = function (filename, alias) {
        TQ.MessageBox.showWaiting("努力加载中 。。。");
        (function (pt) {
            netOpen(filename, function (jqResponse) {
                pt._jsonStrToScene(pt, jqResponse, alias);
            });
        })(this);
    };

    p._jsonStrToScene = function (pt, jsonStr, alias) {
        try {
            jsonStr = TQ.Element.upgrade(jsonStr);
            var objJson = JSON.parse(jsonStr);
        } catch (e) {
            displayInfo2(jsonStr);
            TQ.Log.error(jsonStr + ". " + e.toString());
            // 给一个空白文件， 确保可可持续进行
            objJson = TQ.Utility.getEmptyScene();
        }
        objJson.alias = (alias == null) ? 'none' : alias;
        objJson.remote = true;
        pt._fixedUp(objJson);
    };

    function removeEmptyLevel(jsonObj) {
        for (var i = jsonObj.levels.length - 1; i >= 0; i--) {
            var desc = jsonObj.levels[i];
            if ((desc.elements == null) || (desc.elements.length <= 0)) {
                if ((i != 0) || (jsonObj.levels.length > 1)) { //至少保留一个level, 不论空白与否。
                    this.isDirty = true;
                    jsonObj.levels.splice(i, 1);
                }
            }
        }
        this.isDirty = true;
    }

    p._fixedUp = function (objJson) {
        if (TQ.Config.REMOVE_EMPTY_LEVEL_ON) {
            Scene.removeEmptyLevel(objJson);
        }

        if (objJson.currentLevelId >= objJson.levels.length) {
            objJson.currentLevelId = 0;
        }

        // copy non-object properties
        TQUtility.shadowCopyWithoutObject(this, objJson);

        if (!objJson.version) {
            if (this.filename == TQ.Config.UNNAMED_SCENE) {
                this.version = Scene.VER2;  // 创建一个新版作品
            } else {
                this.version = Scene.VER1;  // 升级旧版的作品， 添加其版本号
            }
        } else {
            this.version = objJson.version;
        }

        //initialize with defaults
        objJson.currentLevelId = (objJson.currentLevelId == undefined) ? 0 : objJson.currentLevelId;
        this.currentLevelId = objJson.currentLevelId;
        this.currentLevelId = 0; //ToDo: 迫使系统总是打开第一个场景
        this.title = (!objJson.title) ? null : objJson.title;

        if (this.title == null) {
            this.title = this.filename;
        }

        // create levels
        var desc = null;
        var num = objJson.levels.length;
        for (var i = 0; i < num; i++) {
            desc = objJson.levels[i];
            if (desc.name === null) {
                desc.name = "level-" + i.toString();
            }
            this.levels[i] = new TQ.Level(desc);
        }

        if (num === 0) { // 纠错
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            desc = null;
            this.levels[0] = new TQ.Level(desc);
        }

        (function (pt) {
            //start preloader
            pt.startPreloader(pt, 0, num);

            // 设置each Level的resourceReady标志, and start show
            if (!TQ.RM.isEmpty) {
                TQ.RM.onCompleteOnce(onResourceReady);
            } else {
                onResourceReady();
            }

            function onResourceReady() {
                for (i=0; i< num; i++) {
                    pt.levels[i].resourceReady = true;
                }
                console.log("All asset loaded!");

                pt.isDirty = true;
                if ((pt.onsceneload != undefined) && (pt.onsceneload != null)) {
                    pt.onsceneload();
                }
            }

        })(this);
        displayInfo2(TQ.Dictionary.Load + "<" + this.title + ">.");
    };

    p.setEditor = function () {
        if (TQ.SceneEditor.isEditMode()) {
            // $('#playRecord').click();
        } else if (TQ.SceneEditor.isPlayMode()) {
            if (TQ.WCY.isPlayOnly) {
                TQ.WCY.doStopRecord();
            } else {
                // $('#stopRecord').click();
            }
        } else {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
        }
        this.isDirty = true;
    };

    p.setSsPath = function (ssPath) {
        if ((!this.ssPath) || (this.ssPath !== ssPath)) {
            this.ssPath = ssPath;
            this.isDirty = true;
            this.isSaved = false;
        }
    };

    p.startPreloader = function (pt, i, num) {
        for (; i < num; i++) {
            pt.levels[i].setupPreloader();
        }
    };

    p.save_TBD_by_WCY_save = function (title, keywords) {
        // 必须预处理， 切断反向的link，以避免出现Circle，无法生成JSON字串
        Scene.stopAux();
        this.currentLevel.exit();  // 先退出, 保存之后, 再次进入
        var bak_currentLevel = this.currentLevel;
        var bak_overlay = this.overlay;
        this.currentLevel = null;
        this.overlay = null;
        for (var i = 0; i < this.levelNum(); i++) {
            this.levels[i].prepareForJSONOut();
        }
        this.title = title;
        TQ.MessageBubble.counter = 0;
        netSave(this.title, this, keywords);
        TQ.ScreenShot.SaveScreen(this.title, keywords);

        this.currentLevel = bak_currentLevel;
        this.overlay = bak_overlay;
        this.afterToJSON();
        this.showLevel();
        this.isSaved = true;
    };

    p.afterToJSON = function () {
        for (var i = 0; i < this.levelNum(); i++) {
            this.levels[i].afterToJSON();
        }
    };

    p.toJSON = function () {
        var scene2 = TQ.Base.Utility.shadowCopy(this);
        delete(scene2.isUpdating);
        delete(scene2.isSaved);
        delete(scene2.onsceneload);
        delete(scene2.state);
        return scene2;
    };

    p.getData = function () {
        for (var i = 0; i < this.levelNum(); i++) {
            this.levels[i].prepareForJSONOut();
        }
        var data = JSON.stringify(this);
        this.afterToJSON();
        return data;
    };

    /// close current scene
    p.close = function (discard) {
        if (this.isSaved || !!discard) {
            if (this.currentLevel != null) {
                TQ.RM.reset(); // 必须先停止RM，否则其中的callback如果引用了Level对象就会出错
                TQ.SoundMgr.close();
                TQ.TextEditor.onNo();
                this.currentLevel.exit();
                this.currentLevel.delete();
                this.currentLevel = null;
            }
            this.levels = [];  // 释放原来的数据
            this.currentLevel = null;
            this.currentLevelId = 0;
            this.onsceneload = null;
            return true;
        }

        TQ.Log.warn("请先保存作品！");
        return false;
    };

    p.toGlobalTime = function (t) {
        if (!this.currentLevel) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return t;
        }
        return (t + this.currentLevel.getT0());
    };

    p.stop = function () {
        if (this.currentLevel) {
            this.currentLevel.stop();
        }
        TQ.FrameCounter.stop();
        TQ.SoundMgr.pause();
        TQ.SnowEffect.stop();
        TQ.RainEffect.stop();
    };

    p.play = function () {
        TQ.FloatToolbar.close();
        TQ.FrameCounter.play();
        TQ.SoundMgr.resume();
        if (this.currentLevel) {
            this.currentLevel.play();
        }
    };

    function stopAux() {
        if (TQ.FrameCounter.isPlaying()) {
            $("#stop").click();
        }
    }

    function getEmptySceneJSON() {
        // this equals to the WCY01.WDM
        // it is provided to prevent loading WCY01.WDM from server
        var empty = {
            "levels": [
                {
                    "jsonElements": null,
                    "FPS": 20,
                    "_t": 0,
                    "elements": null,
                    "name": "0",
                    "itemCounter": 8,
                    "dataReady": true,
                    "state": 6,
                    "isWaitingForShow": false,
                    "isDirty": true,
                    "dirty": true
                }
            ], "overlay": null, "currentLevelId": 0, "currentLevel": null, "state": 4, "isUpdating": false
        };

        return JSON.stringify(empty);
    }

    var _levelTs = [],
        _levelTe = [],
        _tMax = 200;
    p.updateLevelRange = function() {
        var i = 0,
            ts = 0,
            te = 0,
            level = null;

        // for recording
        if (this.currentLevel && (this.currentLevel.getTime() < TQ.FrameCounter.max)) {
            this.currentLevel.setTime(TQ.FrameCounter.max);
        }

        for (i = 0; i < this.levels.length; i++) {
            level = this.levels[i];
            ts = te;
            te = ts + level.tMaxFrame;

            if (i  < _levelTs.length) {
                _levelTs[i] = ts;
                _levelTe[i] = te;
            } else {
                _levelTs.push(ts);
                _levelTe.push(te);
            }
        }

        if (_levelTe.length > this.levels.length ) {
            _levelTe.splice(_levelTe.length);
            _levelTs.splice(_levelTe.length);
        }
        _tMax = te;
    };

    function localT2Global(t) {
        return  (t + _levelTs[currScene.currentLevelId]);
    }

    function findLevel(t) {
        if (t < _levelTs[0]) {
            return 0;
        }

        if (t > _levelTe[_levelTe.length - 1]) {
            return _levelTe.length - 1;
        }

        for (i = 0; i < _levelTe.length; i++ ) {
            if ((t >= _levelTs[i]) && (t <= _levelTe[i])) {
                return i;
            }
        }

        TQ.AssertExt.invalidLogic(i < _levelTe.length);
        return 0;
    }

    function globalT2local(t) {
        var id = currScene.currentLevelId;
        var i;
        if ((t < _levelTs[id]) || (t > _levelTe[id])) {
            id = findLevel(t);
            if (id != currScene.currentLevelId) {
                currScene.gotoLevel(id);
            }
        }

        return t - _levelTs[id];
    }

    function getTMax() {
        return _tMax;
    }

    TQ.Scene = Scene;
}());
