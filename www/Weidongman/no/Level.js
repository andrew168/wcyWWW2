/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function Level(description) {
        this.initialize(description);
    }

    var p = Level.prototype;
    p.isDirty = false;  //  变量赋值应该放在最前面, 确保在使用之前已经赋值. 小函数放在最后, 很少看.
    p.isPreloading = false;
    p.tMax = 200; // 该level的最后一帧动画的时间(单位是: 帧), 以该Level的头为0帧.

    p.initialize = function (description) {
        //initialize with defaults
        // 防止没有数据
        description = (!description) ? {} :description;
        description.elements = (!description.elements) ? [] : description.elements;
        this.elements = description.elements;
        this.FPS = (!description.FPS) ? TQ.FrameCounter.defaultFPS : description.FPS;
        this.tMax = (!description.tMax)? this.tMax : description.tMax;
        this._t = (!description._t) ? 0 : description._t;
        this.setupTimer();
        assertNotNull(TQ.Dictionary.FoundNull, description.name);
        this.name = description.name;
        this.itemCounter = 0;
        this.dataReady = false;
        this.state = TQBase.LevelState.NOT_INIT;
        this.isWaitingForShow = false;
    };

    p.onSelected = function()
    {
        TQ.FrameCounter.initialize(this._t, this.FPS, this);
        TQ.TimerUI.initialize();
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
        if (elements.length < 2)  return null;
        var parent = elements[0];
        for (var i = 1; i < elements.length; i++) {
            this.pickOffChild(elements[i]);
            parent.addJoint(elements[i]);
            parent = elements[i];
        }
    };

    p.unJoint = function(elements) {
        for (var i=0; i < elements.length; i++) {
            var child = elements[i];
            var parent = child.parent;
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, parent != null);
            parent.removeChild(child);
            child.clearFlag(Element.JOINTED);
            this.addElementDirect(child);
        }
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
    };

    p.unGroup = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var ele = elements[i];
            for (var j = 0; j < ele.children.length; j++) {
                var child = ele.removeChild(ele.children[j]);
                this.addElementDirect(child);
            }
        }
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
    };

    Level.removeMarker = function(desc) {
        if (!desc.children) return;
        for (var i= 0; i < desc.children.length; i++) { // 去除Marker部分
            if (desc.children[i].type == "JointMarker") {
                desc.children.splice(i,1);
                break;
            }
        }
    };

    p.skinning = function (host, skin) {
        var hostElement = this.findAtom(host);
        var skinElement = this.findAtom(skin);
        assertNotNull(TQ.Dictionary.FoundNull, hostElement);
        assertNotNull(TQ.Dictionary.FoundNull, skinElement);
        hostElement.skinning(skinElement);
    };

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
        return ele;
    };

    p.addElement = function  (desc) {
        var newItem = TQ.Element.build(this, desc);
        return this.addElementDirect(newItem);
    };

    p.addElementDirect = function(ele)
    {
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      // 记录新创建的元素到elements
      this.elements.push(ele);
      this.isDirty = true;
      return ele;
    };

    p.deleteElementAt = function(i) {
        var ele = this.removeElementAt(i);
        if (ele != null) ele.destroy();
    };

    p.removeElementAt = function(i) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, (i >=0) && (i < this.elements.length) ); // 数组超界
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

    p.setDisplaceX = function () {
        assertNotHere(TQ.Dictionary.isDepreciated); // "xxx0 已经被取代, 该函数将被取消"
    };

    p.onLoaded = function () {
        this.state = TQBase.LevelState.LOADED;
        this.dataReady = true;
        if (this.isWaitingForShow) {
          TQ.Log.info("onLoaded" + this.name);
          this.show();
        }
    };

    p.show = function () {
        TQ.Log.info("show level :" + this.name);
        if (this.dataReady) {
            TQ.Log.info("data ready");
            this.isWaitingForShow = false;
            this.onLevelCreated();
        } else {
            TQ.Log.info("data ready: NO");
            this.isWaitingForShow = true;
            this.preload();
        }
    };

    p.preload = function () {
        // 避免重复进入：
        if (this.dataReady) {
            return;
        }

        if (this.state == TQBase.LevelState.ISLOADING) {
            return;
        }

        this.state = TQBase.LevelState.ISLOADING;
        this.itemCounter = 0;
        var jsonElements = this.elements;
        this.elements = [];
        for (var i = 0; i < ((jsonElements != null) && (jsonElements.length)); i++) {
            this.addElementDirect(TQ.Element.build(this, jsonElements[i]));
        }
        this.state = TQBase.LevelState.INITING;
        // ToDo: 是否应该分多个level, 来启动?
        TQ.SoundMgr.start();
        jsonElements = null;
    };

    p.addAllItems = function () {
        // add到stage， == 显示，show
        TQ.StageBuffer.open();
        var num = this.elements.length;
        for (var i = 0; i < num; i++) {
            this.elements[i].addItemToStage();
        }
        TQ.StageBuffer.close();
        this.state = TQBase.LevelState.EDITING;
    };

    p.addLastItems = function () {
        // add到stage， == 显示，show
        assertDepreciated(TQ.Dictionary.isDepreciated);
        assertTrue(TQ.Dictionary.isDepreciated, false); // "应该只在临时添加的时候, 才调用"
    };

    p.hitTest = function () {
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
        if ((this.state == TQBase.LevelState.LOADED) ||
            (this.state == TQBase.LevelState.EXIT)) {
            this.setupTimer();
            // add all item to stage
            this.addAllItems();
            this.update(this._t);
            stage.update();
            this.watchRestart();
            this.state = TQBase.LevelState.RUNNING;
            if (this.onLevelRunning != null) this.onLevelRunning();
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

        this._t = t; // 临时存储,供保留现场, 不对外
        // 如果是播放状态，
        for (var i = 0; i < this.elements.length; ++i) {
            if (this.elements[i].TBD ==undefined) {
                this.elements[i].update(t);
            } else {
                this.deleteElementAt(i);
                i--;
            }
        }

        // 非播放状态
        if (this.isDirty) {
            stage.update();
        }

        this.isDirty = false;
    };

    p.updateState = function () {
      TQ.Log.info("update state");
      if (this.state == TQBase.LevelState.INITING) {
        if (this.itemCounter >= this.atomNum()) {
          this.onLoaded();
        }
      }
    };

    p._removeAllItems = function () {
        // remove 从stage， 只是不显示， 数据还在
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].removeFromStage();
        }
    };

    p.delete = function () {
        this._removeAllItems();
    };

    p.deleteElement  = function (ele) {
        // 删除数据， 真删除
        var found = false;
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

    p.exit = function () {
        this.state = TQBase.LevelState.EXIT;
        TQ.SelectSet.clear();
        this.sort(); // 退出本层之前, 必须保存 Z可见性顺序.
        this._removeAllItems();
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
        assertNotNull(this.elements);
        this.persist();
        this.elements.sort(TQ.Element.compare);
        for (i = 0; i < this.elements.length; i++) {
            this.elements[i].sort();
        }
    };

    p.onItemLoaded = function (item) {
        this.itemCounter++;
        if ((this.state == TQBase.LevelState.EDITING) ||
            (this.state == TQBase.LevelState.RUNNING)) {
            TQ.Log.out(TQ.Dictionary.isDepreciated); // level.onItemLoaded: 应该只在临时添加的时候, 才调用
            // assertTrue("应该只在临时添加的时候, 才调用", false);
            item.addItemToStage();
        } else {
            // 正在 loading, 或者fixup, 由update来控制状态
        }
    };

    p.setupTimer = function () {
        if (TQ.FrameCounter.isPlaying()) {
            this._t = 0;
            TQ.FrameCounter.gotoBeginning();
        }
    };

    p.setTime = function (t) { this.tMax = t;};
    p.getTime = function() { return this.tMax;};

    TQ.Level = Level;
}());
