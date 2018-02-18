TQ = TQ || {};
(function () {

    var self;
    function Scene() {
        self = this;
        this.levels = [];
        this.onsceneload = null;     // 不能使用系统 的函数名称，比如： onload， 这样会是混淆
        this.version = Scene.VER_LATEST;
        this.filename = null; // filename是文件名， 仅仅只是机器自动生成的唯一编号
        this.setDesignatedSize(Scene.getDesignatedRegionDefault());
        this.isDirty = true;
        this.tMax = 0;
    }
    Scene.EVENT_READY = "sceneReady";
    Scene.EVENT_SAVED = "sceneSaved";
    Scene.EVENT_END_OF_PLAY = "end_of_Play";
    Scene.VER1 = "V1";
    Scene.VER2 = "V2";
    Scene.VER3 = "V3"; // 采用归一化的坐标，记录保存wcy，以适应各种屏幕。
    Scene.VER3_1 = 3.1; // 采用指定分辨率的世界坐标系(以像素为单位)， 替代归一化世界坐标系
    Scene.VER3_3 = 3.3; // designated区域 大于1*1
    Scene.VER_LATEST = Scene.VER3_3;
    var stateStack= [];
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
    Scene.doReplay = doReplay;
    Scene.removeEmptyLevel = removeEmptyLevel;
    Scene.getEmptySceneJSON = getEmptySceneJSON;
    Scene.localT2Global = localT2Global;
    Scene.globalT2local = globalT2local;
    Scene.getTMax = getTMax;

    Scene.saveState = saveState;
    Scene.restoreState = restoreState;

    function saveState() {
        stateStack.push({tT:Scene.localT2Global(TQ.FrameCounter.t()), levelId: currScene.currentLevelId});
    }

    function restoreState() {
        var state;

        do {
            state = stateStack.pop();
        } while (stateStack.length > 0);

        if (state) {
            TQ.TimerUI.setGlobalTime(state.tT);
        } else {
            TQ.Log.error("state is null");
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

    p.start = function() {
        requestAnimationFrame(function () {
            if (isStarted) {
                self.onTick();
                self.start();
            }
        });
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
        this.updateLevelRange();
        // 谁都可以 要求Update， 不只是Player
        if (this.currentLevel != null) {
            this.currentLevel.update(t);
            if (this.version >= Scene.VER2) { // ToDo: 只在录制状态下才更新， 或者，初次运行的时候的时候才更新
                // this.updateTimeTable();
            }
            if (TQ.FrameCounter.finished() && TQ.FrameCounter.isPlaying()) {
                if (this.isLastLevel()) {
                    if (!TQ.FrameCounter.isAutoRewind()) {
                        this.stop();
                        TQ.Base.Utility.triggerEvent(document.body, Scene.EVENT_END_OF_PLAY);
                    } else if (!TQ.FrameCounter.isInverse()) {
                        this.doReplay();
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
        var t = 0;
        for (var i = 0; i < this.levels.length; i++) {
            this.levels[i].setT0(t);
            t += this.levels[i].getTime();
        }
    };

    function doReplay(options) {
        if (!currScene) {
            return;
        }
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
        TQ.MessageBox.hide();
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.currentLevelId < this.levelNum()); //level ID 超界
        this.currentLevelId = (this.currentLevelId < this.levelNum()) ? this.currentLevelId : 0;
        TQ.Log.debugInfo("entering level " + this.currentLevelId);
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
            if (thisScene.state === TQBase.LevelState.RUNNING) {
                return;
            }
            thisScene.state = TQBase.LevelState.RUNNING;
            thisScene.handleEvent(Scene.EVENT_READY);
            thisScene.updateLevelRange();
            TQ.Base.Utility.triggerEvent(document.body, Scene.EVENT_READY);
            this.isDirty = true;
        }
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

        var ele;
        if (desc.isBackground && (ele = level.getBackground())) {
            ele.changeSkin(desc.src);
        } else {
            ele = TQ.Element.build(level, desc);
            assertTrue(TQ.INVALID_LOGIC, ele.level == level);
            ele.level = level;
            var thisScene = this;
            TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.ADD_ITEM,
                thisScene, ele, ele));
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

    p.isEmpty = function() {
        return (this.levelNum() <= 2 && this.currentLevel && this.currentLevel.isEmpty());
    };

    p.isLastLevel = function () {
        return ((this.currentLevelId + 1) >= this.levelNum());
    };

    p.hasAnimation = function () {
        return ((this.levels.length === 1) && this.levels[0].hasAnimation());
    };

    p.gotoLevel = function (id) {
        this.isDirty = true;
        id = (id >= this.levelNum()) ? (this.levelNum() - 1) : id;
        id = (id < 0) ? 0 : id;
        if (this.currentLevel != null) {
            var level = self.levels[id];
            if (level.resourceReady) {
                self.doTransition(id);
            } else {
                level.onResourceReady = function() {
                    self.doTransition(id);
                }
            }
        }
    };

    p.doTransition = function(id) {
        TQ.FloatToolbar.close();
        if (this.currentLevelId !== id) {
            if (TQ.PageTransition && (this.currentLevelId >= 0)) {
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
        p.isPlayOnly = (fileInfo.isPlayOnly === undefined)? false : fileInfo.isPlayOnly;
        TQ.MessageBox.showWaiting(TQ.Locale.getStr('prepare to open...'));
        this.reset();
        this.setFilename(fileInfo.filename);
        this.screenshotName = fileInfo.screenshotName;
        this.title = null;
        // 删除 旧的Levels。
        function onOpened() {
            self.showLevel();
            TQ.MessageBox.hide();
            setTimeout(function() {
                if (!isStarted) {
                    self.start();
                    isStarted = true;
                }
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

    p.setDesignatedSize = function(region) {
        this.designatedWidth = region.w;
        this.designatedHeight = region.h;
        TQ.Config.snapDX = this.designatedWidth / 20;
        TQ.Config.snapDY = this.designatedHeight / 20;
        TQ.Config.FONT_LEVEL_UNIT = Math.min(this.designatedWidth, this.designatedHeight) / 30;
    };

    p.getDesignatedWidth = function() {
        return this.designatedWidth;
    };

    p.getDesignatedHeight = function () {
        return this.designatedHeight;
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
        TQ.MessageBox.showWaiting(TQ.Locale.getStr('is loading...'));
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
        TQUtility.shadowCopyWithoutObject(this, objJson);
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
        this.tMax = (objJson.tMax === undefined)? this.tMax : objJson.tMax;

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
            var levelToPreload = 0;
            pt.startPreloader(pt, levelToPreload, num);

            // 设置each Level的resourceReady标志, and start show
            if (!TQ.RM.isEmpty) {
                TQ.RM.onCompleteOnce(onResourceReady);
            } else {
                onResourceReady();
            }

            function onResourceReady() {
                var level = pt.levels[levelToPreload];
                level.resourceReady = true;
                TQ.Log.debugInfo("All asset loaded!");
                pt.isDirty = true;
                setTimeout(function() {
                    levelToPreload++;
                    if (levelToPreload < num) {
                        TQ.RM.onCompleteOnce(onResourceReady);
                        pt.startPreloader(pt, levelToPreload, num);
                    }
                });

                if (levelToPreload === 0) {
                    if ((pt.onsceneload != undefined) && (pt.onsceneload != null)) {
                        pt.onsceneload();
                    }
                } else {
                    if (level.onResourceReady) {
                        level.onResourceReady();
                    }
                }
            }
        })(this);
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

    p.startPreloader = function (pt, i, num) {
        if (i < num) {
            pt.levels[i].setupPreloader();
        }
    };

    p.save_TBD_by_WCY_save = function (title, keywords) {
        // 必须预处理， 切断反向的link，以避免出现Circle，无法生成JSON字串
        this.stop();
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
        //必须忽略这些临时的变量，否则， 在open的时候，他们就会覆盖currScene中的值
        delete(scene2.currentLevel);
        delete(scene2.isUpdating);
        delete(scene2.isSaved);
        delete(scene2.onsceneload);
        delete(scene2.isPlayOnly);
        delete(scene2.state);
        return scene2;
    };

    p.getData = function () {
        for (var i = 0; i < this.levelNum(); i++) {
            this.levels[i].prepareForJSONOut();
        }
        this.updateShareData();
        var data = JSON.stringify(this);
        this.afterToJSON();

        if (data.length > TQ.Config.MAX_FILE_SIZE) {
            TQ.MessageBox.toast(TQ.Locale.getStr('file is too long, please save your work ASAP'));
        }
        return data;
    };

    p.updateShareData = function() {
        var level1 = (this.levelNum() > 0) ? this.levels[0] : null;
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
                TQ.SoundMgr.close();
                // TQ.TextEditor.onNo();
                this.currentLevel.exit();
                this.currentLevel.delete();
                this.currentLevel = null;
            }
            this.levels = [];  // 释放原来的数据
            this.currentLevel = null;
            this.currentLevelId = 0;
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
            level = null;

        // for recording
        if (this.currentLevel && (this.currentLevel.getTime() < TQ.FrameCounter.maxTime())) {
            this.currentLevel.setTime(TQ.FrameCounter.maxTime());
        }

        if (_levelTe.length > this.levels.length ) {
            _levelTe.splice(this.levels.length);
            _levelTs.splice(this.levels.length);
        }

        var wholeSceneReady = true;
        for (i = 0; i < this.levels.length; i++) {
            level = this.levels[i];
            if (!level.resourceReady) {
                wholeSceneReady = false;
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
        }

        if (Math.abs(this.tMax - te) > 0.1) {
            this.tMax = (wholeSceneReady) ? te : Math.max(this.tMax, te);
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

    TQ.Scene = Scene;
}());
