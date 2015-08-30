TQ = TQ || {};
(function () {

    function Scene() {
        this.levels = [];
        this.onsceneload = null;     // 不能使用系统 的函数名称，比如： onload， 这样会是混淆
    }

    var p = Scene.prototype;
    p.filename = null; // filename是文件名， 仅仅只是机器自动生成的唯一编号
    p.title = null;  // title是微创意的标题，
    p.isPreloading = false;
    p.currentLevelId = 0;
    p.currentLevel = null;
    p.overlay = null;
    p.stage = null;
    p.isSaved = false; // 用于提醒是否保存修改的内容，在close之前。
    p.state = TQBase.LevelState.NOT_INIT;
    p.shooting = function ()
    {
        this.state = TQBase.LevelState.SHOOTING;
    };

    p.isUpdating = false;
    // 这是scene的主控程序
    p.tick = function () {
        var _this = this;
        TQ.TaskMgr.addTask(function () {_this.onTick();}, null);
    };

    p.onTick = function() {
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
        TQ.TimerUI.update();  // 必须先更新数据, 在更新UI
        this.update(TQ.FrameCounter.t());
        if (this.overlay) {this.overlay.update(TQ.FrameCounter.t());}

        this.render();
        if (TQ.GifManager.isOpen) {
            TQ.GifManager.addFrame();
        }
        TQ.InputMap.restart(); // 必须是Game Cycle中最后一个, 因为JustPressed依赖于它
        TQ.FrameCounter.isNew = false;
        this.isUpdating = false;
    };

    p.update = function(t) {
        // 谁都可以 要求Update， 不只是Player
        if (this.currentLevel != null) {
            this.currentLevel.update(t);
            if (TQ.FrameCounter.finished() && TQ.FrameCounter.isPlaying()) {
                if  (this.isLastLevel() && !TQ.FrameCounter.isAutoRewind()) {
                    $("#play").click();
                } else {
                    this.nextLevel();
                }
            }
        }
    };

    p.render = function() {
        stage.update();
    };

    p.showLevel = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.currentLevelId < this.levelNum() ); //level ID 超界
        this.currentLevelId = (this.currentLevelId < this.levelNum()) ? this.currentLevelId : 0 ;
        this.selectLevel(this.currentLevelId);
        this.currentLevel.show();
    };

    p.selectLevel = function (id) {
        this.currentLevelId = id;
        this.currentLevel = this.getLevel(this.currentLevelId);
        this.currentLevel.onSelected();
        var thisScene = this;
        this.currentLevel.onLevelRunning = function () {
            thisScene.state = TQBase.LevelState.RUNNING;
        }
    };

    p.joint = function (elements, hasUnJointFlag) {
        if (hasUnJointFlag) {
            this.currentLevel.unJoint(elements);
        } else {
            this.currentLevel.joint(elements);
        }

        this.isSaved = false;
    };

    p.groupIt = function (elements, hasUnGroupFlag) {
        if (hasUnGroupFlag) {
            this.currentLevel.unGroup(elements);
        } else {
            this.currentLevel.groupIt(elements);
        }
        this.isSaved = false;
    };

    p.skinning = function (parent, child) {
        this.currentLevel.skinning(parent, child);
        this.isSaved = false;
    };

    // for both image and animation
    p.addItem = function(desc) {
        this.isSaved = false;
        if ((desc.toOverlay == undefined) || (desc.toOverlay == null))
        {
            return this.currentLevel.addElement(desc);
        } else if (desc.toOverlay == 1) {
            assertTrue("is empty? ", this.overlay);
            if (this.overlay) {
                return this.overlay.addElement(desc);
            }
        }
        assertTrue(TQ.Dictionary.INVALID_PARAMETER + ": " + desc.toOverlay, false); //overlay参数有误
        return null;
    };

    p.addText = function(desc) {
        this.isSaved = false;
        return this.currentLevel.addElement(desc);
    };

    p.deleteElement = function(ele)
    {
        this.isSaved = false;
        assertNotNull(TQ.Dictionary.PleaseSelectOne, ele);
        if (ele != null) {
            this.currentLevel.deleteElement(ele);
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
        return ((this.currentLevelId + 1)>= this.levelNum());
    };

    p.gotoLevel = function (id)
    {
        id = (id >= this.levelNum()) ? (this.levelNum() - 1) : id;
        id = (id < 0) ? 0: id;
        if (this.currentLevel != null)
        {
            this.currentLevel.exit();
            this.currentLevelId = id;
        }

        this.showLevel();
    };

    p.open = function(filename) {
        this.isSaved = true;  //只是打开旧的文件， 没有尚未修改
        // close current if  has one;
        if (!((this.currentLevel == undefined) || (this.currentLevel == null))) {
            Scene.stopAux();
            this.close();
        }
        this.filename = filename;
        this.title = null;
        // 删除 旧的Levels。
        this.onsceneload = this.showLevel;
        this.loadFromJson(filename, 'gameScenes');
        if (null == this.overlay) {
            this.overlay = new TQ.Overlay({});
        }
        if (filename == TQ.Config.UNNAMED_SCENE) {
          Scene.stopAux();
          TQ.FrameCounter.gotoBeginning();
        }
    };

    p.getLevel = function (id) {
        if (id < this.levels.length) {
            return this.levels[id];
        }
        return null;
    };

    p.getElement = function (id) {
        assertValid("this.currentLevel",this.currentLevel);
        return this.currentLevel.getElement(id);
    };

    p.findAtom = function(displayObj) {
        assertValid("this.currentLevel",this.currentLevel);
        return this.currentLevel.findAtom(displayObj);
    };

    p.getSelectedElement = function() {
        var target = stage.selectedItem;
        if (target == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return null;
        }
        return this.findAtom(target);
    };

    p.levelNum = function () {
        return this.levels.length;
    };

    // create in IDE
    p.addLevel = function () {
        this.isSaved = false;
        var levelName = this.levelNum();
        this.levels.push(new TQ.Level({name: levelName}));
        return this.levelNum() - 1;
    };

    p.deleteLevel = function (id) {
        this.isSaved = false;
        if (id >= this.levelNum()) {
            alert("error in level index");
            return;
        }

        this.levels.splice(id, 1);
    };

    // read from data file
    p.preloadAll = function () {
        if (this.isPreloading) {
            return;
        }

        for (var i = 0; i < this.levels.length; i++) {
            if (!this.levels[i].dataReady) {
                this.levels[i].preload();
            }
        }
    };

    // JQuery Ajax version
    p.loadFromJson = function (filename, alias) {
        (function (pt) {
        netOpen(filename, function (jqResponse) {
            pt._jsonStrToScene(pt, jqResponse, alias);
        });
        })(this);
    };

    p._jsonStrToScene = function(pt, jsonStr, alias)
    {
        try {
          jsonStr = TQ.Element.upgrade(jsonStr);
          var objJson = JSON.parse(jsonStr);
        } catch (e) {
          displayInfo2(jsonStr);
          TQ.Log.error(jsonStr + ". "+ e.toString());
          // 给一个空白文件， 确保可可持续进行
          objJson = TQ.Utility.getEmptyScene();
        }
        objJson.alias = (alias == null) ? 'none' : alias;
        objJson.remote = true;
        pt._fixedUp(objJson);
    };

    Scene.removeEmptyLevel = function(jsonObj) {
      for (var i = jsonObj.levels.length - 1; i >=0; i--) {
        var desc = jsonObj.levels[i];
        if ((desc.elements == null) || (desc.elements.length <=0)) {
          if ((i!=0) || (jsonObj.levels.length > 1)) { //至少保留一个level, 不论空白与否。
              this.isSaved = false;
              jsonObj.levels.splice(i,1);
          }
        }
      }
    };

    p._fixedUp = function (objJson) {
        if (TQ.Config.REMOVE_EMPTY_LEVEL_ON) {
          Scene.removeEmptyLevel(objJson);
        }

        if (objJson.currentLevelId >= objJson.levels.length) {
          objJson.currentLevelId = 0;
        }

        //initialize with defaults
        objJson.currentLevelId = (objJson.currentLevelId == undefined) ? 0: objJson.currentLevelId;
        this.currentLevelId = objJson.currentLevelId;
        this.title = (!objJson.title)? null : objJson.title;

        if (this.title == null) {
            this.title = this.filename;
        }

        // create levels
        for (var i = 0; i < objJson.levels.length; i++) {
            var desc = objJson.levels[i];
            if (desc.name == null) {
              desc.name = i.toString();
            }
            this.levels[i] = new TQ.Level(desc);
        }

        if (objJson.remote) {
            console.info(objJson.alias + ' has been added to the scene [Remote]');
        } else {
            console.info(objJson.alias + ' has been added to the scene [Local]');
        }

        if ((this.onsceneload != undefined) && (this.onsceneload != null)) {
            this.onsceneload(objJson);
        }

        displayInfo2(TQ.Dictionary.Load + "<" + this.title +">.");
    };


    p.save = function(title, keywords) {
        // 必须预处理， 切断反向的link，以避免出现Circle，无法生成JSON字串
        Scene.stopAux();
        this.currentLevel.exit();  // 先退出, 保存之后, 再次进入
        var bak_currentLevel = this.currentLevel;
        var bak_overlay = this.overlay;
        this.currentLevel = null;
        this.overlay = null;
        for (var i = 0; i < this.levelNum(); i++)
        {
            this.levels[i].prepareForJSONOut();
        }
        this.title = title;
        netSave(this.title, this,keywords);
        TQ.ScreenShot.SaveScreen(this.title, keywords);

        this.currentLevel = bak_currentLevel;
        this.overlay = bak_overlay;
        this.afterToJSON();
        this.showLevel();
        this.isSaved = true;
    };

    p.afterToJSON = function ()
    {
        for (var i = 0; i < this.levelNum(); i++)
        {
            this.levels[i].afterToJSON();
        }
    };

    /// close current scene
    p.close = function() {
        if (this.isSaved)  {
            if (this.currentLevel != null) {
                this.currentLevel.exit();
                this.currentLevel.delete();
                this.currentLevel = null;
                TQ.SoundMgr.close();
            }
            this.levels = [];  // 释放原来的数据
            this.currentLevel = null;
            this.currentLevelId = 0;
            this.onsceneload = null;
            return true;
        }

        return false;
    };

    Scene.stopAux = function() {
      if (TQ.FrameCounter.isPlaying()) {
          $("#play").click();
      }
    };

    TQ.Scene = Scene;
}());
