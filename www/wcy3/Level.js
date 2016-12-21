/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    var DEFAULT_MAX_FRAME = 60;
    function Level(description) {
        this.latestElement = null; // 最新生成的复合物体
        this.tMaxFrame = DEFAULT_MAX_FRAME; // 该level的最后一帧动画的时间(单位是: 帧), 以该Level的头为0帧.
        this.t0 = 0;
        this.resourceReady = false;
        this.initialize(description);
    }

    var p = Level.prototype;
    p.isDirty = false;  //  变量赋值应该放在最前面, 确保在使用之前已经赋值. 小函数放在最后, 很少看.
    p.isPreloading = false;

    p.requestToUpdateAll = function () {
        this.isDirty = true;
        this.elements.forEach(function (ele) {
            ele.isDirty = true;
        });
    };

    p.initialize = function (description) {
        //initialize with defaults
        // 防止没有数据
        description = (!description) ? {} :description;
        description.elements = (!description.elements) ? [] : description.elements;
        this.elements = description.elements;
        this.FPS = (!description.FPS) ? TQ.FrameCounter.defaultFPS : description.FPS;
        this.tMaxFrame = (!description.tMaxFrame)? this.tMaxFrame : description.tMaxFrame;
        this._t = (!description._t) ? 0 : description._t;
        this.setupTimer();
        assertNotNull(TQ.Dictionary.FoundNull, description.name);
        this.name = description.name;
        this.itemCounter = 0;
        this.dataReady = false;
        this.state = TQBase.LevelState.NOT_INIT;
        this.isWaitingForShow = false;
        this.dirtyZ = false;
        this.isDirty = true;
    };

    p.onSelected = function()
    {
        TQ.FrameCounter.initialize(this._t, this.FPS, this);
        if (!TQBase.LevelState.isOperatingTimerUI()) {
            TQ.TimerUI.initialize();
        } else {
            this._t = TQ.FrameCounter.t();
        }
  //      this.state = TQBase.LevelState.NOT_INIT;
//        this.dataReady = false;
        TQ.DirtyFlag.setLevel(this);
    };

    p.itemNum = function() {
        assertDepreciated(TQ.Dictionary.isDepreciated);
        return this.elements.length;
    };

    p.atomNum = function() {
        var sum = 0;
        for (var i=0; i< this.elements.length; i ++ ) {
            assertNotNull(TQ.Dictionary.FoundNull, this.elements[i]);
            sum += this.elements[i].atomNum();
        }
        return sum;
    };

    p.joint = function(elements) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode); // jointIt 必须运行在零件模式下!!!
        if (elements.length < 2)  return null;
        var parent = elements[0];
        if (!parent.isJoint()) { // 对于已经是关键链的一部分的，不能设置为Root， 以避免多个Root
            parent.setFlag(TQ.Element.ROOT_JOINT); // 设置为关节链的根部
        }
        for (var i = 1; i < elements.length; i++) {
            this.pickOffChild(elements[i]);
            parent.addJoint(elements[i]);
            parent = elements[i];
        }
        TQ.DirtyFlag.setLevel(this);
    };

    /*
    打散本元件所在的关节链（整条链， 不是一个关节）
     */
    p.unJoint = function(elements) {
        for (var i=0; i < elements.length; i++) {
            // 先切断与 parent的联系（只有第一个元素有）， 再切断与孩子的联系
            var ele = elements[i];
            var parent = ele.parent;
            if (parent != null) {
                assertTrue(TQ.Dictionary.INVALID_PARAMETER, parent != null);
                parent.removeChild(ele);
                ele.clearFlag(TQ.Element.JOINTED);
                this.addElementDirect(ele);
            }
            var num = ele.children.length;
            for (var j = 0; j < num; j++) { //  动态地改变数组的尺寸， 所有num要先记录下来
                var child = ele.removeChild(ele.children[0]);
                this.addElementDirect(child);
                this.unJoint([child]);
            }
            ele.clearFlag(TQ.Element.JOINTED);
            ele.clearFlag(TQ.Element.ROOT_JOINT);
        }
        TQ.DirtyFlag.setLevel(this);
    };

    p.groupIt = function(elements) {
        TQ.Log.out("Group it");
        // 以第一个物体的参数, 为主, 建立Group元素.
        var desc = {x: elements[0].jsonObj.x, y: elements[0].jsonObj.y, type:"Group" };
        var ele = this.addElement(desc); //ToDo:
        ele.update(TQ.FrameCounter.t());
        for (var i = 0; i < elements.length; i++) {
            this.pickOffChild(elements[i]);
            ele.addChild(elements[i]);
        }

        this.latestElement = ele;
        TQ.DirtyFlag.setLevel(this);
    };

    p.unGroup = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var ele = elements[i];
            if (ele.isJoint() || ele.hasFlag(TQ.Element.ROOT_JOINT)) {
                continue;
            }
            if (!ele.isVirtualObject())  {
                ele = ele.parent;
            }
            if (ele == null) continue;
            if (ele.isVirtualObject()) {
                while (ele.children.length > 0) {
                    var child = ele.removeChild(ele.children[0]);
                    this.addElementDirect(child);
                }

                this.deleteElement(ele);
            }
        }

        TQ.DirtyFlag.setLevel(this);
        this.dirtyZ = true;
    };

    p.cloneElement = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            // var marker = elements[i].detachDecoration();
            elements[i].persist(); // 记录zIndex, 就在此层次clone, 把原来的物体抬高1个层次.
            var desc = JSON.parse(JSON.stringify(elements[i].jsonObj));
            Level.removeMarker(desc);
            if (elements[i].parent == null) {
                this.addElementDirect(TQ.Element.build(this, desc));
            } else {
                elements[i].parent.addChild(desc);
            }
        }
        TQ.DirtyFlag.setLevel(this);
        this.dirtyZ = true;
    };

    Level.removeMarker = function(desc) {
        if (!desc.children) return;
        for (var i= 0; i < desc.children.length; i++) { // 去除Marker部分
            if (desc.children[i].type == "JointMarker") {
                desc.children.splice(i,1);
                break;
            }
        }
        TQ.DirtyFlag.setLevel(this);
    };

    p.skinning = function (hostElement, skinElement) {
        assertNotNull(TQ.Dictionary.FoundNull, hostElement);
        assertNotNull(TQ.Dictionary.FoundNull, skinElement);
        hostElement.skinning(skinElement);
        TQ.DirtyFlag.setLevel(this);
    };

    // 在整体模式下, 找到根物体； 在零件模式下， 返回子物体本身
    p.findAtom = function (displayObj) {
        // atom: 包括 元素element, 和 子元素subelement
        var result = null;
        for (var i = 0; i < this.elements.length; i++) {
            // 是结构性的虚拟物体, 例如Group的节点
            if ( (this.elements[i].displayObj != null)
                && (this.elements[i].displayObj.id != undefined)
                && (this.elements[i].displayObj.id == displayObj.id)) {
                return (result = this.elements[i]);
            } else {
                result = this.elements[i].findChild(displayObj);
                if (result != null ) {
                    if ((!TQ.InputCtrl.inSubobjectMode) && (!result.isJoint())) result = this.elements[i];
                    break;
                }
            }
        }
        return result;
    };

    p.pickOffChild = function(ele) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, ele);
        var id = this.elements.indexOf(ele);
        if (id >=0) {
            this.removeElementAt(id);
        } else {
            var parent = ele.parent;
            assertTrue(TQ.Dictionary.FoundNull, parent != null); // 应该有父元素
            if (parent) {
                parent.removeChild(ele);
            }
        }
        TQ.DirtyFlag.setLevel(this);
        return ele;
    };

    p.addElement = function  (desc) {
        var newItem = TQ.Element.build(this, desc);
        TQ.DirtyFlag.setLevel(this);
        return this.addElementDirect(newItem);
    };

    p.addElementDirect = function(ele)
    {
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      // 记录新创建的元素到elements
      this.elements.push(ele);
      TQ.DirtyFlag.setLevel(this);
      // ToDo: 暂时关闭， 还需要多调试
      // if (! (ele.isSound() || ele.isGroupFile() || ele.isButton()) ) {
      //    TQ.SelectSet.add(ele);
      // }
      return ele;
    };

    /* 区别 delete 和 remove：
       remove: 只是移动， 从一个地方， 移到另外一个地方，比如： 在打包的时候， 从level下移到 复合体的下面。
       delete：包括了remove， 但是， 移到了 垃圾箱trash之中, 当undelete的时候， 可以恢复
    */
    p.deleteElementAt = function(i) {
        var ele = this.removeElementAt(i);
        if (ele != null) {
			ele.removeFromStage();
        	TQ.GarbageCollector.add(ele);
		}
        TQ.DirtyFlag.setElement(this);
        return ele;
    };

    p.removeElementAt = function(i) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, (i >=0) && (i < this.elements.length) ); // 数组超界
        TQ.DirtyFlag.setElement(this);
        return (this.elements.splice(i, 1))[0];
    };

    p.getElement = function (id) {
        if (this.elements.length <= 0) {
            assertFalse(TQ.Dictionary.INVALID_LOGIC, false);
            return null;
        }

        assertTrue("id < (this.elements.length)", id < (this.elements.length));
        id = (id < 0) ? 0: id;
        id = (id >= (this.elements.length -1)) ? (this.elements.length -1): id;
        return this.elements[id];
    };

    p.getSounds = function() {
        var result = [];
        if (this.resourceReady) {
            var num = this.elements.length;
            for (var i = 0; i < num; i++) {
                if (!this.elements[i].isSound) break;
                if (this.elements[i].isSound()) {
                    result.push(this.elements[i]);
                }
            }
        }

        return result;
    };

    p.setDisplaceX = function () {
        assertNotHere(TQ.Dictionary.isDepreciated); // "xxx0 已经被取代, 该函数将被取消"
    };

    p.onLoaded = function () {
        this.state = TQBase.LevelState.LOADED;
        this.build();  // 从Resource 到 canvas
        if (this.isWaitingForShow) {
          TQ.Log.info("onLoaded" + this.name);
          this.show();
        }
        TQ.DirtyFlag.setLevel(this);
    };

    p.show = function () {
        TQ.Log.info("show level, name = :" + this.name);
        if (this.dataReady) {
            TQ.Log.info("data ready");
            this.isWaitingForShow = false;
            this.onLevelCreated();
        } else {
            TQ.Log.info("data ready: NO");
            this.isWaitingForShow = true;
        }
        TQ.DirtyFlag.setLevel(this);
    };

    p.build = function () {
        // 避免重复进入：
        if (this.dataReady) {
            return;
        }

        this.itemCounter = 0;
        var jsonElements = this.elements;
        this.elements = [];
        this.state = TQBase.LevelState.INITING;
        for (var i = 0; i < ((jsonElements != null) && (jsonElements.length)); i++) {
            if (!!jsonElements[i]) {
                this.addElementDirect(TQ.Element.build(this, jsonElements[i]));
            }
        }
        // ToDo: 是否应该分多个level, 来启动?
        TQ.SoundMgr.start();
        jsonElements = null;
        this.dataReady = true;
    };

    p.fixupButtons = function() {
        for (var i = 0; i < (this.elements.length); i++) {
            var ele = this.elements[i];
            if ((ele.isButton != undefined) && ele.isButton()) {
                ele.buildLinks();
            }
        }
        TQ.DirtyFlag.setLevel(this);
    };

    p.findByDescID = function(descID) {
        for (var i = 0; i < (this.elements.length); i++) {
            var ele = this.elements[i];
            if (ele.jsonObj.id == descID) return ele;
        }

        return null;
    };

    p.setupPreloader = function () {
        // send to RM
        // 避免重复进入：
        if (!this.hasSentToRM) {
            this.hasSentToRM = true;
        } else {
            return;
        }

        var jsonElements = this.elements;
        if (!!jsonElements) {
            for (var i = 0; i < jsonElements.length; i++) {
                TQ.RM.addElementDesc(jsonElements[i]);
            }
        }
    };

    p.addAllItems = function () {
        // add到stage， == 显示，show
        TQ.StageBuffer.open();
        var num = this.elements.length;
        for (var i = 0; i < num; i++) {
            this.elements[i].addItemToStage();
        }
        TQ.StageBuffer.close();
        this.state = TQ.SceneEditor.getMode();
        TQ.DirtyFlag.setLevel(this);
    };

    p.addLastItems = function () {
        // add到stage， == 显示，show
        assertDepreciated(TQ.Dictionary.isDepreciated);
        assertTrue(TQ.Dictionary.isDepreciated, false); // "应该只在临时添加的时候, 才调用"
        TQ.DirtyFlag.setLevel(this);
    };

    p.hitTest = function () {

        return;

        for (var i = 0; i < this.itemNum(); i++) {
            var displayObj = this.elements[i].displayObj;
            if (displayObj.hitTest(stage.mouseX, stage.mouseY)) {
                displayObj.alpha = 0.5;  // 加框子
                stage.update();
            }
        }
    };

    p.onLevelRunning  = null;
    p.onLevelCreated = function () {
        if ((this.state == TQBase.LevelState.INITING) ||
            (this.state == TQBase.LevelState.LOADED) ||
            (this.state == TQBase.LevelState.EXIT)) {
			 //后续场景loaded是通过RM完成的， 所以可能还是INITING状态
            this.setupTimer();
            // add all item to stage
            this.addAllItems();
            this.update(this._t);
            stage.update();
            this.watchRestart();
            this.state = TQ.SceneEditor.getMode();
            if (this.onLevelRunning != null) this.onLevelRunning();
            TQ.DirtyFlag.setLevel(this);
        } else {
            assertNotHere(TQ.Dictionary.CurrentState + this.state);
        }
    };

    p.watchRestart = function () {
        // draw all elements to the canvas:
        stage.update();
    };

    p.update = function (t) {
        this.updateState();
        if (!this.dataReady) return;

        if (!(this.dirtyZ || this.isDirty || TQ.FrameCounter.isPlaying())) {
            return;
        }

        this._t = t; // 临时存储,供保留现场, 不对外
        // 如果是播放状态，
        for (var i = 0; i < this.elements.length; ++i) {
            if (!this.elements[i].TBD) {
                this.elements[i].update(t);
            } else {
                var thisEle = this.elements[i];
                this.elements[i].TBD = undefined;
                TQ.CommandMgr.directDo(new TQ.DeleteEleCommand(currScene, thisEle));
                i--;
            }
        }

        // 非播放状态
        if (this.isDirty) {
            stage.update();
        }
        if (this.dirtyZ) {
            this.persist();
        }
        this.dirtyZ = false;
        this.isDirty = false;
    };

    p.updateState = function () {
      // TQ.Log.info("update state");
      if (this.state <= TQBase.LevelState.INITING) {
        if (this.resourceReady || TQ.RM.isEmpty){
          this.onLoaded();
        }
      }
    };

    p.cleanStage = function () {
        TQ.DirtyFlag.setLevel(this);
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].resetStageFlag();
        }

        if (stageContainer) {
            stageContainer.children.splice(0);
        }
    };

    p._removeAllItems = function () {
        TQ.DirtyFlag.setLevel(this);
        // remove 从stage， 只是不显示， 数据还在
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].removeFromStage();
        }
    };

    p.delete = function () {
        // 如果是EXIT， 则已经被exit()函数处理过了，
        TQ.DirtyFlag.setLevel(this);
        if ((this.state === TQBase.LevelState.EDITING) ||
            (this.state === TQBase.LevelState.RUNNING)) {
            this._removeAllItems();
        }
    };

    p.deleteElement  = function (ele) {
        if (ele.isPinned()) {
            return;
        }

        // 删除数据， 真删除
        var found = false;
        TQ.DirtyFlag.setLevel(this);
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] == ele) {
                this.deleteElementAt(i);
                found = true;
                break;
            }

            // 检查是否子物体
            if  (this.elements[i].deleteChild(ele) == true) {
                found = true;
                break;
            }
        }
        if (found) {
            this.isDirty = true;
            return true;
        }
        assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
        return false;
    };

    /*
    stop sound, video, animations, etc.
     */
    p.stop = function() {
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].stop();
        }
    };

    p.play = function() {
        TQ.DirtyFlag.setLevel(this);
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].play();
        }
    };

    p.exit = function () {
        TQ.SelectSet.clear();
        if ((this.state === TQBase.LevelState.EDITING) ||
            (this.state === TQBase.LevelState.RUNNING)) {
            this.sort(); // 退出本层之前, 必须保存 Z可见性顺序.
            this.cleanStage();
        } else {
            // is loading
            console.log("is loading, or not loaded!");
        }
        TQ.SoundMgr.removeAll();
        this.state = TQBase.LevelState.EXIT;
    };

    p.prepareForJSONOut = function () { };

    p.afterToJSON = function () {
        if (this.dataReady) { // 只对load的 level做这个操作
          for (var i = 0; i < this.elements.length; i++) {
              this.elements[i].afterToJSON();
          }
        }
    };

    p.persist = function() {
        for (var i = 0; i < this.elements.length; i++) {  //持久化zIndex, 只在退出时, 而不是每一个Cycle, 以节约时间
            this.elements[i].persist();
        }
    };

    p.sort = function()
    {
        // 按照当前物体在显示列表中的顺序, 重新排列elements的数据.
        TQ.DirtyFlag.setLevel(this);
        assertNotNull(this.elements);
        this.persist();
        this.elements.sort(TQ.Element.compare);
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].sort();
        }
    };

    p.onItemLoaded = function (item) {
        TQ.DirtyFlag.setLevel(this);
        this.itemCounter++;
        if (this.isStageReady()) {
            assertTrue("应该只在临时添加的时候, 才调用", !TQ.StageBuffer.isBatchMode);
            item.addItemToStage();
        } else {
            // 正在 loading, 或者fixup, 由update来控制状态
        }
    };

    p.setupTimer = function () {
        if (TQ.FrameCounter.isPlaying()) {  // play mode
            this._t = 0;
            TQ.FrameCounter.gotoBeginning();
        } else {                            // edit mode
            TQ.FrameCounter.goto(this._t);
        }
    };

    // 自动拓展微动漫的时间
    p.calculateLastFrame = function() {
        if (!this.dataReady) return this.tMaxFrame;
        // 在退出本level的时候才调用，以更新时间，
        //  ToDo: ?? 在编辑本Level的时候， 这个值基本上是没有用的
        var lastFrame = 0;
        for (var i=0; i< this.elements.length; i ++ ) {
            assertNotNull(TQ.Dictionary.FoundNull, this.elements[i]);
            if (!this.elements[i].calculateLastFrame) {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            } else {
                lastFrame = Math.max(lastFrame, this.elements[i].calculateLastFrame());
            }
        }
        this.tMaxFrame = lastFrame * 20; // 每秒20帧
        return lastFrame;
    };

    p.setTime = function (t) { this.tMaxFrame = t;};
    p.getTime = function() { return this.tMaxFrame;};
    p.setT0 = function(t0) { this.t0 = t0;};
    p.getT0 = function(t0) { return this.t0;};

    p.isEmpty = function() {
        return (!this.elements || (this.elements.length <= 0));
    };

    p.isStageReady = function() {
        return ((this.state === TQBase.LevelState.INITING)||
        (this.state === TQBase.LevelState.EDITING) ||
        (this.state === TQBase.LevelState.RUNNING));
    };

    TQ.Level = Level;
}());
