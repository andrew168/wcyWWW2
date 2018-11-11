TQ = TQ || {};
(function () {

    var self;

    function Scene() {
        self = this;
        this.levels = [];
        this.outro = null;
        this.topic = TQ.State.topic;
        this.onsceneload = null;     // 不能使用系统 的函数名称，比如： onload， 这样会是混淆
        this.version = Scene.VER_LATEST;
        this.filename = null; // filename是文件名， 仅仅只是机器自动生成的唯一编号
        this.setDesignatedSize(Scene.getDesignatedRegionDefault());
        this.isDirty = true;
        this.tMax = 0;
    }

    var allResourceReady = false,
        allDataReady = false;
    Scene.EVENT_READY = "sceneReady";
    Scene.EVENT_SAVED = "sceneSaved";
    Scene.EVENT_END_OF_PLAY = "end_of_Play";
    Scene.VER1 = "V1";
    Scene.VER2 = "V2";
    Scene.VER3 = "V3"; // 采用归一化的坐标，记录保存wcy，以适应各种屏幕。
    Scene.VER3_1 = 3.1; // 采用指定分辨率的世界坐标系(以像素为单位)， 替代归一化世界坐标系
    Scene.VER3_3 = 3.3; // designated区域 大于1*1
    Scene.VER3_4 = 3.4; // 背景唯一： 每一个场景中，只能有1个背景，在最底层
    Scene.VER3_5 = 3.5; // 采用lZ压缩
    Scene.VER3_6 = 3.6; // 修改music的跨场景标志为： isCrossLevel
    Scene.VER_LATEST = Scene.VER3_6;
    var stateStack = [];
    var p = Scene.prototype;
    var _levelTs = [],
        _levelTe = [];

    TQ.EventHandler.initialize(p); // 为它添加事件处理能力
    p.title = null;  // title是微创意的标题，
    p.description = null; // 内容描述，摘要， 用于微信分享，FB分享的简介文字
    p.ssPath = null;
    p.isPreloading = false;
    p.currentLevelId = 0;
    p.currentLevel = null;
    p.overlay = null;
    p.stage = null;
    p.isSaved = false; // 用于提醒是否保存修改的内容，在close之前。
    p.hasSavedToCache = false;
    p.state = TQBase.LevelState.NOT_INIT;

    // static APIs:
    Scene.decompress = decompress;
    Scene.doReplay = doReplay;
    Scene.removeEmptyLevel = removeEmptyLevel;
    Scene.getEmptySceneJSON = getEmptySceneJSON;
    Scene.localT2Global = localT2Global;
    Scene.globalT2local = globalT2local;
    Scene.getTMax = getTMax;
    Scene.saveState = saveState;
    Scene.restoreState = restoreState;
    Scene.getDefaultTitle = getDefaultTitle;

    function saveState() {
        stateStack.push({tT: Scene.localT2Global(TQ.FrameCounter.t()), levelId: currScene.currentLevelId});
    }

    function restoreState() {
        var state;

        do {
            state = stateStack.pop();
        } while (stateStack.length > 0);

        if (state) {
            TQ.TimerUI.setGlobalTime(state.tT);
        } else {
            // TQ.Log.error("state is null"); // 首次进入toAddMode，state就是空的
        }
    }

    p.getDesignatedRegion = function () {
        return {
            w: this.getDesignatedWidth(),
            h: this.getDesignatedHeight()
        }
    };

    Scene.getDesignatedRegionDefault = function () {
        var designated;
        if (TQUtility.isMobile()) {
            designated = {
                w: TQ.State.innerWidth,
                h: TQ.State.innerHeight
            }
        } else {
            if (!TQ.State.designatedWidth || !TQ.State.designatedHeight) {
                TQ.State.designatedWidth = TQ.Config.designatedWidth;
                TQ.State.designatedHeight = TQ.Config.designatedHeight;
            }
            designated = {
                w: TQ.State.designatedWidth,
                h: TQ.State.designatedHeight
            }
        }
        return designated;
    };

    // dynamic APIs
    p.shooting = function () {
        this.state = TQBase.LevelState.SHOOTING;
    };

    p.isUpdating = false;
    // 这是scene的主控程序
    var isStarted = false;

    p.start = function () {
        if (!isStarted) {
            isStarted = true;
            self.mainLoop();
        }
    };

    p.mainLoop = function () {
        requestAnimationFrame(function () {
            if (isStarted) {
                self.onTick();
                self.mainLoop();
            }
        });
    };

    p.onTick = function () {
        if (this.state <= TQBase.LevelState.INITING) {
            this.update(0); // 只更新状态,
        }

        if ((this.state < TQBase.LevelState.RUNNING) || // Running 之前, 包括:init, loading等等, 不适合update
            (this.isUpdating)  ||  // 避免重复进入
            (TQ.State.editorMode <= TQ.SceneEditor.MODE.FIRST)) { // UI：在欢迎页面，首页， 不update
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
        this.updateLevelRange();
        // 谁都可以 要求Update， 不只是Player
        if (this.currentLevel != null) {
            this.currentLevel.update(t);
            if (this.version >= Scene.VER2) { // ToDo: 只在录制状态下才更新， 或者，初次运行的时候的时候才更新
                // this.updateTimeTable();
            }
            if (TQ.FrameCounter.finished() && TQ.FrameCounter.isPlaying()) {
                if (this.isLastLevel()) {
                    // 声音是否播完
                    if (this.hasMusicCompleted()) {
                        if (!TQ.FrameCounter.isAutoRewind()) {
                            // this.stop();
                            TQ.Log.checkPoint('Scene.EVENT_END_OF_PLAY');
                            TQ.Base.Utility.triggerEvent(document.body, Scene.EVENT_END_OF_PLAY);
                            this.stop();
                        } else if (!TQ.FrameCounter.isInverse()) {
                            this.doReplay();
                        }
                    }
                } else {
                    this.nextLevel();
                }
            }
        }
    };

    p.updateTimeTable = function () {
        // update 当前level的时间
        if (!TQ.SceneEditor.isEditMode()) {  //录制的时候， 自动延长 本场景的时间长度
            TQ.FrameCounter.setTMax(this.currentLevel.getTime());
        }
        // update 其它level的 相对时间点
        this.updateT0();
    };

    p.updateT0 = function () {
        var t = 0;
        for (var i = 0; i < this.levelNum(); i++) {
            var level = this.getLevel(i);
            level.setT0(t);
            t += level.getTime();
        }
    };

    function doReplay(options) {
        if (!currScene) {
            return;
        }

        TQ.SoundMgr.reset();
        if (TQ.FrameCounter.isPlaying()) {
            currScene.stop();
        } else {
            saveState();
        }

        if (currScene.currentLevel && currScene.currentLevel.isEditMode()) {
            currScene.currentLevel.calculateLastFrame();
        }

        if (!options) {
            if (currScene.currentLevelId !== 0) {
                currScene.gotoLevel(0);
            } else {
                currScene.currentLevelId = -1;
                currScene.gotoLevel(0);
            }
            TQ.FrameCounter.gotoBeginning();
        } else if (options.thisLevelOnly) {
            TQ.FrameCounter.gotoBeginning();
        } else {
            TQ.FrameCounter.setABOptions(options);
            TQ.FrameCounter.goto(options.tStart);
        }

        currScene.play();
    }

    p.render = function () {
        TQ.Assert.isNotNull(stage);
        stage.update();
    };

    p.showLevel = function () {
        TQ.MessageBox.reset();
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.currentLevelId < this.levelNumWithOutro()); //level ID 超界
        if (this.currentLevelId < 0) {
            TQ.AssertExt.isTrue(this.currentLevelId >= 0, "为什么会是负的？");
            this.currentLevelId = 0;
        }
        this.currentLevelId = (this.currentLevelId < this.levelNumWithOutro()) ? this.currentLevelId : 0;
        TQ.Log.checkPoint("entering level " + this.currentLevelId);
        TQ.FrameCounter.gotoBeginning();
        this.selectLevel(this.currentLevelId);
        this.currentLevel.show();
        this.isDirty = true;
    };

    p.selectLevel = function (id) {
        this.currentLevelId = id;
        this.currentLevel = this.getLevel(this.currentLevelId);
        assertNotNull(TQ.Dictionary.INVALID_LOGIC, this.currentLevel);
        var thisScene = this;
        this.currentLevel.onLevelRunning = function () {
            if ((thisScene.state === TQBase.LevelState.RUNNING) ||
                (thisScene.state === TQBase.LevelState.EDITING)) {
                return;
            }
            thisScene.state = TQBase.LevelState.RUNNING;
            thisScene.handleEvent(Scene.EVENT_READY);
            thisScene.updateLevelRange();
            TQ.Base.Utility.triggerEvent(document.body, Scene.EVENT_READY);
            this.isDirty = true;
        }
        this.currentLevel.onSelected();
    };

    p.joint = function (elements, hasUnJointFlag) {
        if (hasUnJointFlag) {
            this.currentLevel.unJoint(elements);
        } else {
            if (!TQ.InputCtrl.inSubobjectMode) { // 必须在零件模式下, 才能让录制系统更新子物体的坐标为相对坐标.
                TQ.InputCtrl.setSubobjectMode();
            }
            this.currentLevel.joint(elements);
            TQ.InputCtrl.clearSubjectModeAndMultiSelect()
        }

        this.isSaved = false;
    };

    p.groupIt = function (elements, hasUnGroupFlag) {
        if (hasUnGroupFlag) {
            this.currentLevel.unGroup(elements);
        } else {
            this.currentLevel.groupIt(elements);
            TQ.InputCtrl.clearSubjectModeAndMultiSelect();
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
        var level = desc.dstLevel;
        delete(desc.dstLevel);
        if ((desc.toOverlay == undefined) || (desc.toOverlay == null)) {
            if (desc.levelId != undefined) {
                level = this.getLevel(desc.levelId);
            }
        } else {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER + ": " + desc.toOverlay, (desc.toOverlay == 1)); //overlay参数有误
            assertTrue("is empty? ", this.overlay);
            if (this.overlay) {
                level = this.overlay;
            }
        }

        var ele;
        if (TQ.Element.isBackground(desc) && (ele = level.getBackground())) {
            ele.changeSkin(desc.src || desc.data);
        } else {
            ele = TQ.Element.build(level, desc);
            assertTrue(TQ.INVALID_LOGIC, ele.level == level);
            ele.level = level;
            if (level.isActive()) {
                var thisScene = this;
                TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.ADD_ITEM,
                    thisScene, ele, ele));
            } else { // level都退出了Stage了，undo stack肯定也reset了，所有不能在加了
                this.addElementDirect(ele);
            }
        }
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
        if (ele.hasFlag(TQ.Element.LOADED) && !ele.hasFlag(TQ.Element.IN_STAGE)) {
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


    p.isEmpty = function () {
        for (var i =0;  i< this.levelNum(); i++) {
            if (!this.getLevel(i).isEmpty()) {
                return false;
            }
        }

        return true;
    };

    p.isCurrentLevelEmpty = function() {
        return ((this.levelNum() == 0) ||
            !this.currentLevel ||
            this.currentLevel.isEmpty());
    };

    p.isAllResourceReady = function () {
        return allResourceReady;
    };

    p.isAllDataReady = function () {
        return allDataReady;
    };

    p.isLastLevel = function () {
        return ((this.currentLevelId + 1) >= this.levelNumWithOutro());
    };

    p.isOutro = function(levelId) {
        return (levelId >= this.levelNum());
    };

    p.hasMusicCompleted = function () {
        return (this.tMax < this.toGlobalTime(TQ.FrameCounter.t()));
    };

    p.hasAnimation = function () {
        return ((this.levelNum() === 1) && this.getLevel(0).hasAnimation());
    };

    p.gotoLevel = function (id) {
        this.isDirty = true;
        id = (id >= this.levelNumWithOutro()) ? (this.levelNumWithOutro() - 1) : id;
        id = (id < 0) ? 0 : id;
        if (this.currentLevel != null) {
            var level = self.getLevel(id);
            if (level.resourceReady) {
                self.doTransition(id);
            } else {
                level.onResourceReady = function () {
                    setTimeout(function () { // 避免直接调用
                        self.doTransition(id);
                    });
                }
            }
        }
    };

    p.doTransition = function (id) {
        TQ.FloatToolbar.close();
        if (this.currentLevelId !== id) {
            if (TQ.State.allowPageTransition && TQ.PageTransition && (this.currentLevelId >= 0)) {
                TQ.PageTransition.start(self.currentLevelId, id, function () {
                    self.doGotoLevel(id);
                })
            } else {
                self.doGotoLevel(id);
            }
        } else {
            TQ.Log.debugInfo("已经在本level，不变切换");
        }
    };

    p.doGotoLevel = function (id) {
        this.currentLevel.exit();
        this.currentLevelId = id;
        this.showLevel();
    };

    p.open = function (fileInfo) {
        p.isPlayOnly = (fileInfo.isPlayOnly === undefined) ? false : fileInfo.isPlayOnly;
        // TQ.MessageBox.showWaiting(TQ.Locale.getStr('prepare to open...'));
        this.reset();
        this.setFilename(fileInfo.filename);
        this.screenshotName = fileInfo.screenshotName;
        this.title = null;
        // 删除 旧的Levels。
        function onOpened() {
            TQ.Log.checkPoint('scene opened, 1st level: ' + self.currentLevelId);
            self.showLevel();
            TQ.MessageBox.reset();
            setTimeout(function () {
                self.start();
            });
        }

        this.onsceneload = onOpened;

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

    p.reset = function () { // 在打开文件，或者创建新文件的时候， 重新设置环境
        //   $('#stop').trigger('click');
        this.setEditor();
        this.tMax = 0;
        _levelTe.splice(0);
        _levelTs.splice(0);
        this.isSaved = true;  //只是打开旧的文件， 没有尚未修改
        this.title = "";  // 必须reset, 因为currScene在New新作品的时候， reuse了
        this.filename = null;
        this.description = null;
        this.ssPath = null; // 初始化， 没有此值
        this.isDirty = true;
        this.hasSavedToCache = false;
        this.setDesignatedSize(Scene.getDesignatedRegionDefault());
        this.outroInitialized = false;
        this.outro = null;
        this.topic = (TQ.State && TQ.State.topic)? TQ.State.topic : null;
        this.topicId = TQ.Utility.getTopicId();;
        //ToDo:@UI   initMenu(); // 重新设置菜单

        // close current if  has one;
        if (!((this.currentLevel == undefined) || (this.currentLevel == null))) {
            this.stop();
            this.close();
        }

        if (TQ.SceneEditor.isEditMode()) {
            TQ.FrameCounter.gotoBeginning();
            if (TQ.FrameCounter.isAutoRewind()) {
                $("#rewind").click();
            }
            if (TQ.TrackRecorder.style == TQ.Channel.JUMP_INTERPOLATION) {
                $("#linearMode").click();
            }
        }
    };

    p.setDesignatedSize = function (region) {
        this.designatedWidth = region.w;
        this.designatedHeight = region.h;
        TQ.Config.snapDX = this.designatedWidth / 20;
        TQ.Config.snapDY = this.designatedHeight / 20;
        TQ.Config.FONT_LEVEL_UNIT = Math.min(this.designatedWidth, this.designatedHeight) / 30;
    };

    p.getDesignatedWidth = function () {
        return this.designatedWidth;
    };

    p.getDesignatedHeight = function () {
        return this.designatedHeight;
    };

    p.getLevel = function (id) {
        if (id < this.levelNum()) {
            return this.levels[id];
        } else {
            id = id - this.levelNum();
            if (id < this.outroLevelNum()) {
                return this.outro[id];
            }
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

    p.levelNumWithOutro = function () {
        return this.levelNum() + this.outroLevelNum();
    };

    p.outroLevelNum = function () {
        return (!this.outro) ? 0: this.outro.length;
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
            levelContent.onLoaded(); // 新建立的，没有任何元素， 所以,直接调用onLoaded, 以设置dataReady等标志
        }
        this.levels.splice(id, 0, levelContent);
        return this.levelNum() - 1;
    };

    /*
     删除第id(id >=0）个场景， 并且把此后的场景前移。
     如果id超出边界（id < 0)，则忽略
     */
    p.deleteLevel = function (id) {
        return this.cutLevel(id);
    };

    p.cutLevel = function (id) {
        if ((id < 0) || (id >= this.levelNum())) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, false);
            return;
        }
        this.isDirty = true;
        var deleted = this.levels.splice(id, 1);

        if (this.currentLevelId > id) {
            this.currentLevelId--;
        }
        return deleted;
    };

    /*
     移动序号为srcId的场景，并插入到序号dstId的场景之前，
     注意：srcId和dstId都是在执行此函数之前， 按照场景的顺序来编号的。
     用户不需要关心
     */
    p.moveTo = function (srcId, dstId) {
        var content = this.cutLevel(srcId);
        if (srcId < dstId) {
            dstId--;
        }
        this.addLevel(dstId, content);
    };

    /*
     复制序号为srcId的场景的内容，并插入到序号dstId的场景之前，
     */
    p.copyTo = function (srcId, dstId) {
        var srcLevel = this.getLevel(srcId),
            jsonData,
            newLevel;
        srcLevel.prepareForJSONOut();
        jsonData = JSON.stringify(srcLevel);
        srcLevel.afterToJSON();
        newLevel = new TQ.Level(JSON.parse(jsonData));
        return this.addLevel(dstId, newLevel);
    };

    p.duplicateCurrentLevel = function () {
        // 新增的level, 紧随currentLevel之后，id+1， 并且，设置为新的currentLevel
        var newLevelId = this.currentLevelId + 1,
            newLevel;
        this.copyTo(this.currentLevelId, newLevelId);
        TQ.RM.onCompleteOnce(function () {
            newLevel.onLoaded();
        });
        newLevel = this.getLevel(newLevelId);
        this.startPreloader(newLevel);
    };

    // !!! can not recover, be careful!
    // empty the current scene
    p.empty = function () {
        var level;
        if (!this.isEmpty()) {
            this.stop();
            this.close(true);  // discard
            while (this.levelNum() > 1) {
                var levelId = this.levelNum() - 1;
                this.deleteLevel(levelId);
            }
            if (level = this.getLevel(0)) {
                level.empty();
            }
            this.selectLevel(0);
            this.currentLevel.state = TQBase.LevelState.INITING;
            this.currentLevel.show();
        } else {
            this.currentLevel.empty();// 主要是设置各种flag
        }
        this.title = TQ.Config.UNNAMED_SCENE;
        this.state = TQBase.LevelState.INITING;
        this.topic = TQ.State.topic;
        this.backgroundColor = TQ.Config.BACKGROUND_COLOR;
        this.isSaved = true; //ToDo: check it is false???
        this.isDirty = true;
    };

    // JQuery Ajax version
    p.loadFromJson = function (filename, alias) {
        // TQ.MessageBox.showWaiting(TQ.Locale.getStr('is loading...'));
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
            objJson = getEmptySceneJSON();
        }
        objJson.alias = (alias == null) ? 'none' : alias;
        objJson.remote = true;
        if (p.isPlayOnly) {// 播放， 总是从第1场景的第t0=0时刻开始
            objJson.currentLevelId = 0;
            objJson.levels[0].t0 = 0.0;
        }

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
        // 删除临时办理，（升级用，防止，旧文件中带有这些参数）
        delete(objJson.isPlayOnly);

        if (objJson.currentLevelId >= objJson.levels.length) {
            objJson.currentLevelId = 0;
        }

        // copy non-object properties
        TQUtility.extendWithoutObject(this, objJson);
        this.topic = objJson.topic;
        objJson.topic = null;
        this.state = TQBase.LevelState.NOT_INIT;
        if (!objJson.version) {
            this.version = Scene.VER1;  // 升级旧版的作品， 添加其版本号
        }

        if (objJson.version !== Scene.VER_LATEST) {
            TQ.Scene.upgradeToLatest(objJson);
            this.version = objJson.version;
        }

        var designated;
        if (!objJson.designatedWidth || !objJson.designatedHeight) {
            designated = Scene.getDesignatedRegionDefault();
        } else {
            designated = {
                w: objJson.designatedWidth,
                h: objJson.designatedHeight
            }
        }

        this.setDesignatedSize(designated);
        //initialize with defaults
        objJson.currentLevelId = (objJson.currentLevelId == undefined) ? 0 : objJson.currentLevelId;
        this.currentLevelId = objJson.currentLevelId;
        this.currentLevelId = 0; //ToDo: 迫使系统总是打开第一个场景
        this.title = (!objJson.title) ? null : objJson.title;
        this.topicId = objJson.topicId || 0;
        this.tMax = (objJson.tMax === undefined) ? this.tMax : objJson.tMax;

        if (this.title == null) {
            this.title = this.filename;
        }

        this.fixedUpLevels(this.levels, objJson);
        this.preload();
    };

    p.fixedUpLevels = function (levels, objJson) {
        // create levels
        var desc = null;
        var num = (!objJson ||  !objJson.levels)? 0:  objJson.levels.length;
        for (var i = 0; i < num; i++) {
            desc = objJson.levels[i];
            if (desc.name === null) {
                desc.name = "level-" + i.toString();
            }
            levels[i] = new TQ.Level(desc);
        }

        if (num === 0 && this.levelNum() ===0) { // 纠错
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            desc = null;
            levels[0] = new TQ.Level(desc);
        }
    };

    p.preload = function () {
        //start preloader
        var self = this,
            num = self.levelNumWithOutro(),
            levelToPreload = 0;

        // 设置each Level的resourceReady标志, and start show
        var level3;
        for (; levelToPreload < num; levelToPreload++) {
            level3 = (levelToPreload === num) ? self.overlay : self.getLevel(levelToPreload);
            if (!level3.resourceReady) {
                TQ.RM.onCompleteOnce(makeOnLevelLoaded(level3, levelToPreload));
                self.startPreloader(level3);
                break;
            }
        }

        function makeOnLevelLoaded(level, levelToPreload) {
            return function () {
                level.resourceReady = true;
                if (self.isOutro(levelToPreload)) {
                    level.updateState();
                }

                TQ.Log.checkPoint("level asset loaded: " + level.name);
                self.isDirty = true;
                setTimeout(function () {
                    levelToPreload++;
                    if (self.isOutro(levelToPreload)) {
                        level.updateState();
                    }
                    for (; levelToPreload < num; levelToPreload++) {
                        var level2 = (levelToPreload === num) ? self.overlay : self.getLevel(levelToPreload);
                        if (!level2.resourceReady) {
                            TQ.RM.onCompleteOnce(makeOnLevelLoaded(level2, levelToPreload));
                            self.startPreloader(level2);
                        }
                    }
                });

                if (levelToPreload === 0) {
                    if ((self.onsceneload !== undefined) && (self.onsceneload != null)) {
                        self.onsceneload();
                    }
                } else {
                    if (level.onResourceReady) {
                        level.onResourceReady();
                    }
                }
            }
        }

        displayInfo2(TQ.Dictionary.Load + "<" + this.title + ">.");
    };

    p.setEditor = function () {
        if (TQ.SceneEditor.isEditMode()) {
            // $('#playRecord').click();
        } else if (TQ.SceneEditor.isPlayMode()) {
            if (p.isPlayOnly) {
                // TQ.WCY.doStopRecord();
            } else {
                // $('#stopRecord').click();
            }
        } else {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
        }
        this.isDirty = true;
    };

    p.setSsPath = function (ssPath) {
        ssPath = TQ.RM.toRelative(ssPath);
        if ((!this.ssPath) || (this.ssPath !== ssPath)) {
            this.ssPath = ssPath;
            this.isDirty = true;
            this.isSaved = false;
        }
    };

    p.startPreloader = function (level) {
        if (level) {
            level.setupPreloader();
        }
        if (TQ.RM.isEmpty) {
            TQ.RM.onCompleted();
        }
    };

    p.afterToJSON = function () {
        for (var i = 0; i < this.levelNum(); i++) {
            this.getLevel(i).afterToJSON();
        }
    };

    p.toJSON = function () {
        var scene2 = TQ.Base.Utility.shadowCopy(this);
        //必须忽略这些临时的变量，否则， 在open的时候，他们就会覆盖currScene中的值
        delete(scene2.currentLevel);
        delete(scene2.isUpdating);
        delete(scene2.isSaved);
        delete(scene2.onsceneload);
        delete(scene2.isPlayOnly);
        delete(scene2.state);
        if (scene2.outro !== undefined) {
            delete(scene2.outro);
        }
        if (scene2.outroInitialized !== undefined) { // 不需要保存的临时状态， 放在一个变量里面
            delete(scene2.outroInitialized);
        }
        return scene2;
    };

    p.getData = function () {
        TQ.AssertExt.invalidLogic(allDataReady, '有level没有完全加载和build，不能调用');
        for (var i = 0; i < this.levelNum(); i++) {
            this.getLevel(i).prepareForJSONOut();
        }
        this.updateShareData();
        var data = JSON.stringify(this);
        this.afterToJSON();

        if (data.length > TQ.Config.MAX_FILE_SIZE) {
            TQ.MessageBox.toast(TQ.Locale.getStr('file is too long, please save your work ASAP'));
        }

        return compress(data, this.ssPath, this.title);
    };

    p.attachOutro = function(outroJson) {
        this.outroInitialized = true;
        var tempOutro = [];
        this.fixedUpLevels(tempOutro, outroJson);
        if (tempOutro.length > 0) {
            this.outro = tempOutro;
            this.preload();
        }
    };

    p.getOutroId = function () {
        if (this.topic && this.topic.outroId !== undefined && this.topic.outroId != 0) {
            return this.topic.outroId;
        }
        return null;
    };

    p.updateShareData = function() {
        var level1 = (this.levelNum() > 0) ? this.getLevel(0) : null;
        if (level1) {
            this.title = this.title || level1.getText(0);
            this.description = this.description || level1.getText(1);
            if (!this.description) {
                this.description = this.title;
            }
        }
    };

    /// close current scene
    p.close = function (discard) {
        if (this.isSaved || this.isEmpty() || !!discard) {
            if (this.currentLevel != null) {
                TQ.RM.reset(); // 必须先停止RM，否则其中的callback如果引用了Level对象就会出错
                TQ.SoundMgr.reset();
                // TQ.TextEditor.onNo();
                this.currentLevel.exit();
                this.currentLevel = null;
            }
            this.levels.splice(1, this.levelNum()-1);  // 释放原来的数据
            this.currentLevel = this.getLevel(0);
            this.currentLevelId = 0;
            this.currentLevel.empty();
            this.onsceneload = null;
            isStarted = false;
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
        TQ.ParticleMgr.pause();
    };

    p.play = function () {
        TQ.FloatToolbar.close();
        TQ.FrameCounter.play();
        TQ.SoundMgr.resume();
        if (this.currentLevel) {
            this.currentLevel.play();
        }
    };

    function getEmptySceneJSON() {
        // this equals to the WCY01.WDM
        // it is provided to prevent loading WCY01.WDM from server
        var empty = {
            version: Scene.VER_LATEST,
            topicId: TQ.Utility.getTopicId(),
            topic: TQ.State.topic, // 包括topicId, outroId
            title: getDefaultTitle(),
            "levels": [
                {
                    "jsonElements": null,
                    "FPS": 20,
                    "_t": 0,
                    "elements": null,
                    "name": "0",
                    "itemCounter": 8,
                    "dataReady": true,
                    "state": TQBase.LevelState.NOT_INIT,
                    "isWaitingForShow": false,
                    "isDirty": true,
                    "dirty": true
                }
            ], "overlay": null, "currentLevelId": 0, "currentLevel": null, "state": TQBase.LevelState.NOT_INIT, "isUpdating": false
        };

        return JSON.stringify(empty);
    }

    p.updateLevelRange = function() {
        var i = 0,
            ts = 0,
            te = 0,
            tGlobalLastFrame = 0,
            numOfLevel = (TQ.FrameCounter.isPlaying() ? this.levelNumWithOutro(): this.levelNum()),
            level = null;

        if (TQ.FrameCounter.isRecording) {
            if (this.currentLevel && (this.currentLevel.getTime() < TQ.FrameCounter.maxTime())) {
                this.currentLevel.setTime(TQ.FrameCounter.maxTime());
            }
        }

        if (_levelTe.length > numOfLevel ) {
            _levelTe.splice(numOfLevel);
            _levelTs.splice(numOfLevel);
        }

        var _allResourceReady = true,
            _allDataReady = true;
        for (i = 0; i < numOfLevel; i++) {
            level = this.getLevel(i);
            if (!level.resourceReady) {
                _allResourceReady = false;
                _allDataReady = false;
                continue;
            }

            if (!level.dataReady) {
                _allDataReady = false;
                continue;
            }

            if (level.tMaxFrame === undefined) {
                TQ.AssertExt.invalidLogic(false, "new use case?");
                continue;
            }

            ts = te;
            te = ts + level.getTime();

            if (i  < _levelTs.length) {
                _levelTs[i] = ts;
                _levelTe[i] = te;
            } else {
                _levelTs.push(ts);
                _levelTe.push(te);
            }

            tGlobalLastFrame = Math.max(tGlobalLastFrame, level.getGlobalTime());
        }

        allResourceReady = _allResourceReady;
        allDataReady = _allDataReady;
        te = Math.max(te, tGlobalLastFrame);
        if (Math.abs(this.tMax - te) > 0.1) {
            this.tMax = (_allResourceReady) ? te : Math.max(this.tMax, te);
            this.updateT0();
            TQUtility.triggerEvent(document, TQ.EVENT.SCENE_TIME_RANGE_CHANGED);
        }
    };

    p.setFilename = function (name) {
        return this.filename = name;
    };

    p.setFilenameById = function (wcyId) {
        return this.filename = wcyId;
    };

    p.hasFilename = function () {
        return (this.filename && (this.filename !== TQ.Config.UNNAMED_SCENE));
    };

    function localT2Global(t) {
        if (!_levelTs) {
            TQ.Log.debugWarn(t);
            return (t = 0);
        }

        if (_levelTs.length <= currScene.currentLevelId) {
            if (_levelTs.length > 0) {
                return _levelTs[_levelTs.length - 1];
            } else {
                if (t> 0) {
                    TQ.Log.debugWarn('not initialized' + t);
                }
                return t;
            }
        }

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

    function globalT2local(t, skipLevelChange) {
        var id = currScene.currentLevelId;
        if ((t < _levelTs[id]) || (t > _levelTe[id])) {
            id = findLevel(t);
            if (!skipLevelChange && (id != currScene.currentLevelId)) {
                currScene.gotoLevel(id);
            }
        }

        return {levelId: id, t: t - _levelTs[id], gt: t};
    }

    function getTMax() {
        return (!currScene) ? 0: currScene.tMax;
    }

    function compress(wcyData, ssPath, title) {
        if (TQ.Config.useLZCompress) {
            var compressed = LZString.compressToBase64(wcyData);
            return JSON.stringify({zip64: true, len: compressed.length,
                ssPath: ssPath, title: title, data: compressed});
        }
        return wcyData;
    }

    function decompress(wcyData) {
        var decompressed = wcyData;

        if (!!wcyData && (typeof wcyData === 'string')) {
            var obj = JSON.parse(wcyData);
            if (obj.zip64 || obj.zip) {
                if (obj.zip) {
                    decompressed = LZString.decompressFromUTF16(obj.data);
                } else {
                    decompressed = LZString.decompressFromBase64(obj.data);
                }

                if (!decompressed || decompressed.length < obj.length) {
                    TQ.AssertExt.invalidLogic(false, '解压后的长度小于压缩者，是不是结束符0出现了？');
                    decompressed = wcyData;
                }
            }
        }

        return decompressed;
    }

    // private
    function getDefaultTitle() {
        return (TQ.State && TQ.State.topic && TQ.State.topic.title) ?
            TQ.State.topic.title : TQ.Config.UNNAMED_SCENE;
    }

    TQ.Scene = Scene;
}());
