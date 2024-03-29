/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function() {
  var DEFAULT_T_MAX_FRAME = 3; // seconds
  function Level(description) {
    TQ.AssertExt.isTrue(!description || (typeof description === "object"), "必须是object, 不能是json字串");
    this.background = null;
    this.latestElement = null; // 最新生成的复合物体
    this.tMaxFrame = 0; // 用户指定的时长， 缺省是0
    this.tMaxFrameMixed = DEFAULT_T_MAX_FRAME;
    this.tGlobalLastFrame = 0; // 他对作品最大时长的最低要求
    this.t0 = 0;
    this.updateCompletedHandlers = [];
    this.initialize(description);
  }

  Level.EVENT_START_SHOWING = "level start showing";

  Level.isCurrent = function(id) {
    return (currScene && (currScene.currentLevelId === id));
  };

  var p = Level.prototype;
  p.isDirty = false; //  变量赋值应该放在最前面, 确保在使用之前已经赋值. 小函数放在最后, 很少看.
  p.isPreloading = false;

  p.requestToUpdateAll = function() {
    this.isDirty = true;
    this.elements.forEach(function(ele) {
      ele.isDirty = true;
    });
  };

  p.initialize = function(description) {
    // initialize with defaults
    // 防止没有数据
    description = (!description) ? {} : description;
    description.elements = (!description.elements) ? [] : description.elements;
    this.elements = description.elements;
    TQ.AssertExt.isNotNull(this.elements);
    this.FPS = (!description.FPS) ? TQ.FrameCounter.defaultFPS : description.FPS;
    this.tMaxFrame = (!description.tMaxFrame) ? this.tMaxFrame : description.tMaxFrame;
    this._t = 0; // _t是临时变量， 每次播放都不同，没必要fixedUp 起止
    assertNotNull(TQ.Dictionary.FoundNull, description.name);
    this.name = description.name;
    this.itemCounter = 0;
    this.resourceReady = false; // img资源加载成功，尚未加入stage canvas
    this.dataReady = false; // 加入到stage canvas了，
    this.state = TQBase.LevelState.NOT_INIT;
    this.isWaitingForShow = false;
    this.isDirtyZ = false;
    this.isDirty = true;
  };

  p.onSelected = function() {
    if (this.dataReady) {
      this.setupTimer2();
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
    for (var i = 0; i < this.elements.length; i++) {
      assertNotNull(TQ.Dictionary.FoundNull, this.elements[i]);
      sum += this.elements[i].atomNum();
    }
    return sum;
  };

  p.joint = function(elements) {
    assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode); // jointIt 必须运行在零件模式下!!!
    if (elements.length < 2) return null;
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
    for (var i = 0; i < elements.length; i++) {
      // 先切断与 parent的联系（只有第一个元素有）， 再切断与孩子的联系
      var ele = elements[i];
      if (!ele) { // 有元素为null？？
        continue;
      }

      // 优先去除外层的附件，每次1层
      const attachmentID = ele.findAttachment();
      if (attachmentID >= 0) {
        const attachment = ele.children[attachmentID];
        ele.removeChild(attachment);
        this.addElementDirect(attachment);
        continue;
      }

      // 最后拆卸关节
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

  p.uniqueBone = function(elements) {
    // 最多只能有1个Bone，保留首个，剔除多余的
    let i = 0;
    const num = elements.length;
    let resultID = -1;
    for (i = num - 1; i >= 0; i--) {
      const x = elements[i];
      if (x.isJoint() || x.isRoot()) {
        if (resultID > -1) {
          elements.splice(resultID, 1);
        }
        resultID = i;
      }
    }
    return resultID;
  };

  p.doAttach = function(boneID, elements) {
    const host = elements[boneID];
    assertTrue("host must joint, not root", !!host && host.isJoint() && !host.isRoot());
    elements.splice(boneID, 1);
    assertTrue("empty elememts for group?", elements.length > 0);
    var aGroup = TQ.GroupElement.create(this, elements);
    host.addChild(aGroup);
    TQ.DirtyFlag.setLevel(this);
    return aGroup;
  };

  p.groupIt = function(elements) {
    TQ.SelectSet.turnOff();
    elements.forEach(function(ele) {
      if (ele && ele.hasBBox()) {
        ele.detachDecoration();
      }
    });

    const boneID = this.uniqueBone(elements);
    let host = null;
    if (boneID > -1) {
      host = elements[boneID];
      // case： 1个关节链， 转化为元件，
      if (host.isJoint() && !host.isRoot()) {
        return this.doAttach(boneID, elements);
      }
    }

    var aGroup = TQ.GroupElement.create(this, elements);
    this.addElementDirect(aGroup);
    this.latestElement = aGroup;
    TQ.DirtyFlag.setLevel(this);
    return aGroup;
  };

  p.unGroup = function(elements) {
    for (var i = 0; i < elements.length; i++) {
      var ele = elements[i];
      // if (ele.isJoint() || ele.isRoot()) {
      //   continue;
      // }
      if (!ele.isVirtualObject() && !!ele.parent) {
        ele = ele.parent;
      }
      if (ele == null) continue;
      if (ele.isGroup() || ele.children.length > 0) {
        const needDelete = (!!ele.isGroup());
        var parts = ele.explode();
        var j;
        for (j = 0; j < parts.length; j++) {
          this.addElementDirect(parts[j]);
        }
        if (needDelete) {
          this.deleteElement(ele);
        }
      }
    }

    TQ.DirtyFlag.setLevel(this);
    this.isDirtyZ = true;
  };

  p.cloneElement = function(elements) {
    var results = [];
    for (var i = 0; i < elements.length; i++) {
      // var marker = elements[i].detachDecoration();
      elements[i].persist(); // 记录zIndex, 就在此层次clone, 把原来的物体抬高1个层次.
      var desc = JSON.parse(JSON.stringify(elements[i]));
      elements[i].afterToJSON();
      Level.removeMarker(desc);
      var newEle;
      if (elements[i].parent == null) {
        newEle = this.addElementDirect(TQ.Element.build(this, desc));
      } else {
        newEle = elements[i].parent.addChild(desc);
      }
      results.push(newEle);
    }
    TQ.DirtyFlag.setLevel(this, true);
    return results;
  };

  Level.removeMarker = function(desc) {
    if (!desc.children) return;
    for (var i = 0; i < desc.children.length; i++) { // 去除Marker部分
      if (desc.children[i].type === "JointMarker") {
        desc.children.splice(i, 1);
        break;
      }
    }
    TQ.DirtyFlag.setLevel(this);
  };

  p.skinning = function(hostElement, skinElement) {
    TQ.AssertExt.depreciated(false, "ToDo: 是不是被changeSkin代替了？");
    assertNotNull(TQ.Dictionary.FoundNull, hostElement);
    assertNotNull(TQ.Dictionary.FoundNull, skinElement);
    hostElement.skinning(skinElement);
    TQ.DirtyFlag.setLevel(this);
  };

  // 在整体模式下, 找到根物体； 在零件模式下， 返回子物体本身
  p.findAtom = function(displayObj) {
    // atom: 包括 元素element, 和 子元素subelement
    var result = null;
    for (var i = 0; i < this.elements.length; i++) {
      // 是结构性的虚拟物体, 例如Group的节点
      if ((this.elements[i].displayObj != null) &&
        (this.elements[i].displayObj.id !== undefined) &&
        (this.elements[i].displayObj.id === displayObj.id)) {
        return (result = this.elements[i]);
      } else {
        result = this.elements[i].findChild(displayObj);
        if (result != null) {
          if ((!TQ.InputCtrl.inSubobjectMode) && (!result.isJoint())) result = this.elements[i];
          break;
        }
      }
    }
    return result;
  };

  p.findAllDub = function() {
    // 临时限制：一个场景中只能有1个配音，元件中的配音不能消除
    // ToDo: 将来允许多个配音， 可以选择是否消除元件中的配音，
    var result = [];
    for (var i = 0; i < this.elements.length; i++) {
      var ele = this.elements[i];
      if (ele.isSound() && ele.isDub()) {
        result.push(ele);
      }
    }
    return result;
  };

  p.pickOffChild = function(ele) {
    assertNotNull(TQ.Dictionary.PleaseSelectOne, ele);
    var id = this.elements.indexOf(ele);
    if (id >= 0) {
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

  p.addElement = function(desc) {
    var newItem = TQ.Element.build(this, desc);
    return this.addElementDirect(newItem);
  };

  p.addElementDirect = function(ele) {
    assertNotNull(TQ.Dictionary.FoundNull, ele);
    // 记录新创建的元素到elements
    this.elements.push(ele);
    if (TQ.Element.isBackground(ele.jsonObj)) {
      // TQ.AssertExt.invalidLogic(!this.background, "应该只有1个背景");
      this.background = ele;
    }
    TQ.DirtyFlag.setLevel(this);
    this.isDirtyZ = true;
    // ToDo: 暂时关闭， 还需要多调试
    // if (! (ele.isSound() || ele.isGroupFile() || ele.isButton()) ) {
    //    TQ.SelectSet.add(ele);
    // }
    return ele;
  };

  p.getElements = function() {
    return this.elements;
  };

  /* 区别 delete 和 remove：
		 remove: 只是移动， 从一个地方， 移到另外一个地方，比如： 在打包的时候， 从level下移到 复合体的下面。
		 delete：包括了remove， 但是， 移到了 垃圾箱trash之中, 当undelete的时候， 可以恢复
	*/
  p.deleteElementAt = function(i) {
    var ele = this.removeElementAt(i);
    if (ele) {
      this.deleteElementFromStage(ele);
    }
  };

  p.deleteElementFromStage = function(ele) {
    if (this.background === ele) {
      this.background = null;
    }

    if (ele != null) {
      ele.removeFromStage();
      TQ.GarbageCollector.add(ele);
    }
    TQ.DirtyFlag.setElement(this);
    this.isDirtyZ = true;
    return ele;
  };

  p.removeElementAt = function(i) {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, (i >= 0) && (i < this.elements.length)); // 数组超界
    TQ.DirtyFlag.setElement(this);
    return (this.elements.splice(i, 1))[0];
  };

  p.getBackground = function() {
    return this.background;
  };

  p.getElement = function(id) {
    if (this.elements.length <= 0) {
      assertFalse(TQ.Dictionary.INVALID_LOGIC, false);
      return null;
    }

    assertTrue("id < (this.elements.length)", id < (this.elements.length));
    id = (id < 0) ? 0 : id;
    id = (id >= (this.elements.length - 1)) ? (this.elements.length - 1) : id;
    return this.elements[id];
  };

  p.getText = function(id) {
    var j = 0;
    var n = this.elements.length;
    for (var i = 0; i < n; i++) {
      if (this.elements[i].isText()) {
        if (j === id) {
          return this.elements[i].getText();
        }
        j++;
      }
    }
    return null;
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

  p.setDisplaceX = function() {
    assertNotHere(TQ.Dictionary.isDepreciated); // "xxx0 已经被取代, 该函数将被取消"
  };

  p.onLoaded = function() {
    this.resourceReady = true; // 适应于新建立的level， 他们没有元素，直接ready
    this.state = TQBase.LevelState.LOADED;
    this.build(); // 从Resource 到 canvas
    if (this.isActive() && !this.isOverlay()) {
      this.setupTimer2();
    }

    TQ.Log.checkPoint("onLoaded level:  " + this.name);
    if (this.isWaitingForShow) {
      this.isWaitingForShow = false;
      this.doShow();
    }
    TQ.DirtyFlag.setLevel(this);
  };

  p.doShow = function() {
    TQ.Log.checkPoint("doShow level: " + this.name);
    if (this.dataReady) {
      TQ.Log.info("data ready");
      this.onLevelCreated();
    } else {
      TQ.AssertExt.invalidLogic(true, "应该先调用show");
    }
    TQ.DirtyFlag.setLevel(this);
  };

  p.show = function() {
    TQ.Log.checkPoint("ask to show level: " + this.name);
    if (this.dataReady) {
      this.doShow();
    } else {
      TQ.Log.info("data ready: NO");
      this.isWaitingForShow = true;
    }
    TQ.DirtyFlag.setLevel(this);
  };

  p.build = function() {
    // 避免重复进入：
    if (this.dataReady) {
      return;
    }

    this.itemCounter = 0;
    var jsonElements = this.elements;
    this.elements = [];
    this.state = TQBase.LevelState.INITING;
    TQ.StageBuffer.open();
    for (var i = 0; i < ((jsonElements != null) && (jsonElements.length)); i++) {
      var desc = jsonElements[i];
      if (desc && TQ.Element.isValidDesc(desc)) {
        desc.src = TQUtility.unifyFormat(desc.type, desc.src);
        this.addElementDirect(TQ.Element.build(this, jsonElements[i]));
      }
    }
    TQ.StageBuffer.close();
    // ToDo: 是否应该分多个level, 来启动?
    TQ.SoundMgr.start();
    TQ.VideoMgr.start();
    jsonElements = null;
    this.dataReady = true;
    TQ.DirtyFlag.setLevel(this);
    this.calculateLastFrame();
  };

  p.fixupButtons = function() {
    for (var i = 0; i < (this.elements.length); i++) {
      var ele = this.elements[i];
      if ((ele.isButton !== undefined) && ele.isButton()) {
        ele.buildLinks();
      }
    }
    TQ.DirtyFlag.setLevel(this);
  };

  p.findByDescId = function(descId) {
    for (var i = 0; i < (this.elements.length); i++) {
      var ele = this.elements[i];
      if (ele.jsonObj.id === descId) return ele;
    }

    return null;
  };

  p.setupPreloader = function() {
    // send to RM
    // 避免重复进入：
    if (!this.hasSentToRM) {
      this.hasSentToRM = true;
    } else {
      return;
    }

    if (this.elements) {
      TQ.RM.addElementDescList(this.elements);
    }
  };

  p.addAllItems = function() {
    // add到stage， === 显示，show
    TQ.StageBuffer.open();
    var num = this.elements.length;
    for (var i = 0; i < num; i++) {
      this.elements[i].addItemToStage();
    }
    TQ.StageBuffer.close();
    this.state = TQ.SceneEditor.getMode();
    TQ.DirtyFlag.setLevel(this);
  };

  p.addLastItems = function() {
    // add到stage， === 显示，show
    assertDepreciated(TQ.Dictionary.isDepreciated);
    assertTrue(TQ.Dictionary.isDepreciated, false); // "应该只在临时添加的时候, 才调用"
    TQ.DirtyFlag.setLevel(this);
  };

  p.hitTest = function() {
    TQ.assertNotHere("not implemented: test if mouse hits element");
    var n = this.elements.length;
    for (let i = 0; i < n; i++) {
      var displayObj = this.elements[i].displayObj;
      if (displayObj.hitTest(stage.mouseX, stage.mouseY)) {
        displayObj.alpha = 0.5; // 加框子
        stage.update();
      }
    }
  };

  p.onLevelRunning = null;
  p.onLevelCreated = function() {
    if ((this.state === TQBase.LevelState.INITING) ||
      (this.state === TQBase.LevelState.LOADED) ||
      (this.state === TQBase.LevelState.EDITING) ||
      (this.state === TQBase.LevelState.EXIT)) {
      // 后续场景loaded是通过RM完成的， 所以可能还是INITING状态
      if (!this.isOverlay()) {
        this.setupTimer();
      }

      if (this.isActive() && !this.inStage) {
        // add all item to stage
        if (stageContainer.children.length > 0) {
          this._removeAllItemsFromStage();
        }
        this.addAllItems();
      }
      this.update(this._t);
      stage.update();
      this.watchRestart();
      this.state = TQ.SceneEditor.getMode();
      if (this.onLevelRunning != null) this.onLevelRunning();
      TQ.DirtyFlag.setLevel(this);
      if (this.isActive() && !this.inStage) {
        this.readyToShow = true;
      }
    } else {
      if ((this.state !== TQBase.LevelState.EDITING) && (this.state !== TQBase.LevelState.RUNNING)) {
        assertNotHere(TQ.Dictionary.CurrentState + this.state);
      }
    }
  };

  p.watchRestart = function() {
    // draw all elements to the canvas:
    stage.update();
  };

  p.removeNullElements = function() {
    for (var i = 0; i < this.elements.length; ++i) {
      if (!this.elements[i]) {
        this.elements.splice(i, 1);
        i--;
      }
    }
  };

  p.update = function(t) {
    this.updateState();
    this.removeNullElements();
    if (!this.dataReady) return;

    if (!(this.isDirtyZ || this.isDirty || TQ.FrameCounter.isPlaying())) {
      return;
    }

    if (TQ.State.isAddMode || TQ.State.isModifyMode) {
      this._t = t; // 临时存储,供保留现场, 不对外
    }
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
      this.calculateLastFrame();
      if (this.isActive() && !TQ.Utility.equalWithin2(TQ.FrameCounter.maxTime(), this.getTime())) {
        TQ.FrameCounter.setTMax(this.getTime());
        setTimeout(function() {
          TQ.DirtyFlag.setCurrentLevel();
        });
      }
      stage.update();
    }
    if (this.isDirtyZ) {
      this.persist();
    }
    this.isDirtyZ = false;
    this.isDirty = false;
    if (this.updateCompletedHandlers.length > 0) {
      for (const func of this.updateCompletedHandlers) {
        func();
      }
      this.updateCompletedHandlers.splice(0);
    }
  };

  p.updateState = function() {
    // TQ.Log.info("update state");
    if (this.state <= TQBase.LevelState.INITING) {
      if (this.resourceReady) {
        this.onLoaded();
      }
    }
  };

  p.updateRenderFlag = function() {
    if (!this.inStage && this.readyToShow) {
      this.inStage = true;
      var levelId = currScene.currentLevelId;
      setTimeout(function() {
        TQ.Base.Utility.triggerEvent(document, Level.EVENT_START_SHOWING, { levelId: levelId });
      });
    }
  };

  p.empty = function() {
    if (this.isActive()) {
      this.cleanStage();
    }
    this.elements.splice(0);
    this.latestElement = null;
    this.background = null;
    this.state = TQBase.LevelState.INITING;
    TQ.DirtyFlag.setLevel(this);
  };

  p.cleanStage = function() {
    TQ.DirtyFlag.setLevel(this);
    if (this.dataReady) {
      for (var i = 0; i < this.elements.length; i++) {
        this.elements[i].resetStageFlag();
      }
    }

    TQ.SceneEditor.cleanStage();
  };

  p._removeAllItemsFromStage = function() {
    TQ.DirtyFlag.setLevel(this);
    // remove 从stage， 只是不显示， 数据还在
    if (this.elements && (this.elements.length > 0) && (this.elements[0].removeFromStage)) {
      for (var i = 0; i < this.elements.length; i++) {
        this.elements[i].removeFromStage();
      }
    }
  };

  p.delete = function() {
    TQ.AssertExt.depreciated("是否已经被 cleanStage代替了？-2018.07.07");
    // 如果是EXIT， 则已经被exit()函数处理过了，
    TQ.DirtyFlag.setLevel(this);
    if (this.isElementInStage()) {
      this._removeAllItemsFromStage();
    }
  };

  p.deleteElement = function(ele) {
    // 删除level的时候，其中pin的元素也应该被删除
    // if (ele.isPinned()) {
    //  return;
    // }

    // 删除数据， 真删除
    var found = false;
    TQ.DirtyFlag.setLevel(this);
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i] === ele) {
        this.deleteElementAt(i);
        found = true;
        break;
      }

      // 检查是否子物体
      if (this.elements[i].deleteChild(ele) === true) {
        found = true;
        break;
      }
    }
    if (found) {
      this.isDirty = true;
      return true;
    } else {
      this.deleteElementFromStage(ele);
      TQ.AssertExt.invalidLogic(false, "在level上未找到此元素，但是显示在stage中，已经被删除了？");
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
    }

    return false;
  };

  /*
	stop sound, video, animations, etc.
	 */
  p.stop = function() {
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i].stop) {
        this.elements[i].stop();
      }
    }
  };

  p.play = function() {
    TQ.DirtyFlag.setLevel(this);
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].play();
    }
  };

  p.exit = function() {
    TQ.SelectSet.empty();
    if (this.isEditMode()) {
      this.calculateLastFrame();
    }
    if (this.isElementInStage()) {
      if (this.isEditMode()) {
        this.sort(); // 退出本层之前, 必须保存 Z可见性顺序.
      }
      this.cleanStage();
    } else {
      // is loading
      TQ.Log.debugInfo("is loading, or not loaded!");
    }
    TQ.SoundMgr.removeAll();
    TQ.VideoMgr.removeAll();
    TQ.ParticleMgr.removeAll();
    if (TQ.State.isAddMode) {
      TQ.SelectSet.clear();
      TQ.AnimationManager.clear();
      TQ.SoundMgr.reset();
    }
    this._removeAllItemsFromStage();
    this.state = TQBase.LevelState.EXIT;
    this.inStage = false;
  };

  p.prepareForJSONOut = function() {
    TQ.AssertExt.invalidLogic(this.dataReady, "数据没有加载完成， 不能调用");
    this.persist(); // 固化z-Index值
  };

  p.afterToJSON = function() {
    if (this.dataReady) { // 只对load的 level做这个操作
      for (var i = 0; i < this.elements.length; i++) {
        this.elements[i].afterToJSON();
      }
    }
  };

  p.persist = function() {
    if (!this.isActive()) {
      return;
    }
    for (var i = 0; i < this.elements.length; i++) { // 持久化zIndex, 只在退出时, 而不是每一个Cycle, 以节约时间
      this.elements[i].persist();
    }
  };

  p.sort = function() {
    // 按照当前物体在显示列表中的顺序, 重新排列elements的数据.
    TQ.DirtyFlag.setLevel(this);
    assertNotNull(this.elements);
    this.persist();
    this.elements.sort(TQ.Element.compare);
    for (var i = 0; i < this.elements.length; i++) {
      this.elements[i].sort();
    }
  };

  p.trim = function(t1, t2) {
    if (t1 < 0) {
      t1 = 0;
    }

    if (t1 >= t2) {
      return;
    }

    this.elements.forEach(function(ele) {
      if (ele) {
        ele.trim(t1, t2);
      }
    });
  };

  p.onItemLoaded = function(item) {
    TQ.DirtyFlag.setLevel(this);
    this.itemCounter++;
    if (this.isStageReady()) {
      // assertTrue("应该只在临时添加的时候, 才调用", !TQ.StageBuffer.isBatchMode);
      item.addItemToStage();
    } else {
      // 正在 loading, 或者fixup, 由update来控制状态
    }
  };

  p.setupTimer = function() {
    if (TQ.FrameCounter.isPlaying()) { // play mode
      this._t = 0;
      TQ.FrameCounter.gotoBeginning();
    } else { // edit mode
      TQ.FrameCounter.goto(this._t);
    }
  };

  p.setupTimer2 = function() {
    TQ.FrameCounter.initialize(this._t, this.FPS, this);
    if (!TQBase.LevelState.isOperatingTimerUI()) {
      TQ.TimerUI.initialize();
    } else {
      this._t = TQ.FrameCounter.t();
    }
  };

  p.resetTimer = function() {
    // 强制本level的_t为0, 避免在play返回之后，收到play之timer的影响
    this._t = 0;
  };

  // 自动拓展微动漫的时间
  p.calculateRealLastFrame = function() {
    if (!this.dataReady) return this.tMaxFrame;
    // 在退出本level的时候才调用，以更新时间，
    //  ToDo: ?? 在编辑本Level的时候， 这个值基本上是没有用的
    var tLastFrame = 0;
    var tGlobalLastFrame = 0;
    var ele;
    for (var i = 0; i < this.elements.length; i++) {
      ele = this.elements[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (!ele.calculateLastFrame) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      } else {
        if (ele.isCrossLevel) {
          tGlobalLastFrame = Math.max(tGlobalLastFrame, ele.calculateLastFrame());
        } else {
          tLastFrame = Math.max(tLastFrame, ele.calculateLastFrame());
        }
      }
    }
    this.tGlobalLastFrame = tGlobalLastFrame;
    return tLastFrame;
  };

  p.calculateLastFrame = function() {
    var tMaxFrameCalculated = this.calculateRealLastFrame();
    if (tMaxFrameCalculated > TQ.Config.MAX_LEVEL_LENGTH) {
      tMaxFrameCalculated = TQ.Config.MAX_LEVEL_LENGTH;
    }
    if (tMaxFrameCalculated < DEFAULT_T_MAX_FRAME) { // 没有设置时长， 也没有长时间的sound, video
      tMaxFrameCalculated = DEFAULT_T_MAX_FRAME;
    }
    this.tMaxFrameMixed = Math.max(this.tMaxFrame, tMaxFrameCalculated);
    return tMaxFrameCalculated;
  };

  function isStaticImage(tLastFrame) {
    return (tLastFrame < 0.1);
  }

  var stepSeries = [1, 2, 5, 10, 20, 50, 100, 500, 1000, 5000];

  function findStep(delta) {
    var ideaStep = 1;
    stepSeries.some(function(step) {
      if (delta > step) {
        ideaStep = step;
      }
      return (delta < step);
    });

    return ideaStep;
  }

  p.increaseTime = function() {
    var oldMax = this.getTime();
    var newMax = oldMax + findStep(oldMax * 0.2);
    if (newMax < 1) {
      newMax = 1;
    }
    this.setCapacity(newMax);
    TQ.DirtyFlag.setLevel(this);
  };

  p.decreaseTime = function() {
    var oldMax = this.getTime();
    var newMax = oldMax - findStep(oldMax * (1 - 1 / 1.2));
    if (newMax === oldMax) {
      if ((newMax > 2)) {
        newMax--;
      } else {
        newMax = newMax / 2;
      }
    }
    this.setCapacity(newMax);
    TQ.DirtyFlag.setLevel(this);
  };

  p.setTime = function(t) { // 用户指定时长
    if (t > TQ.Config.MAX_LEVEL_LENGTH) {
      t = TQ.Config.MAX_LEVEL_LENGTH;
    }
    this.tMaxFrame = t;
    this.calculateLastFrame(); // update mixed
    if (this.isActive()) {
      TQ.FrameCounter.setTMax(this.getTime());
    }
    TQ.DirtyFlag.setLevel(this);
  };

  p.setCapacity = function(t) {
    if (t >= this.getTime()) {
      if (this.isActive()) {
        TQ.FrameCounter.setTMax(t);
      }
    }
  };

  p.getTime = function() {
    return this.tMaxFrameMixed;
  };

  p.getGlobalTime = function() {
    return this.tGlobalLastFrame;
  };

  p.setT0 = function(t0) {
    this.t0 = t0;
  };
  p.getT0 = function() {
    return this.t0;
  };

  p.isEmpty = function() {
    return (!this.elements || (this.elements.length <= 0));
  };

  p.isStageReady = function() {
    return ((this.state === TQBase.LevelState.INITING) ||
      (this.isElementInStage()));
  };

  p.isElementInStage = function() {
    return ((this.state === TQBase.LevelState.EDITING) ||
      (this.state === TQBase.LevelState.RUNNING));
  };

  p.isActive = function() {
    return (currScene && (currScene.currentLevel === this) || (this.isWaitingForShow));
  };

  p.isShowing = function() {
    return this.inStage;
  };

  p.isOverlay = function() {
    return false;
  };

  p.isEditMode = function() {
    return ((this.state === TQBase.LevelState.EDITING) &&
      (TQ.State.editorMode === TQ.SceneEditor.MODE.EDIT));
  };

  p.hasAnimation = function() {
    return !isStaticImage(this.tMaxFrame);
  };

  p.hasGraph = function() {
    var result = false;
    this.elements.some(function(ele) {
      if (ele.hasGraph()) {
        result = true;
        return true;
      }
      return false;
    });
    return result;
  };

  // upgrade:
  Level.upgradeEachElement = function(levelDesc, upgradeElement) {
    var elements;

    if (!levelDesc || !(elements = levelDesc.elements)) {
      return;
    }

    for (var i = 0; i < (elements.length); i++) {
      upgradeElement(elements[i]);
    }
  };

  Level.upgrade3_4ToVer3_6 = function(levelDesc) {
    var elements,
      eleDesc;

    if (!levelDesc || !(elements = levelDesc.elements)) {
      return;
    }

    for (var i = 0; i < (elements.length); i++) {
      eleDesc = elements[i];
      if (eleDesc.eType === TQ.Element.ETYPE_AUDIO) {
        if (eleDesc.isMultiScene !== undefined) {
          eleDesc.isCrossLevel = eleDesc.isMultiScene;
        }
      }
    }
  };

  Level.upgrade3_3ToVer3_4 = function(levelDesc) {
    var foundBackground = false;
    var elements;
    var eleDesc;

    if (!levelDesc || !(elements = levelDesc.elements)) {
      return;
    }

    for (var i = 0; i < (elements.length); i++) {
      eleDesc = elements[i];
      if (eleDesc.eType === TQ.Element.ETYPE_BACKGROUND) {
        if (!foundBackground) {
          foundBackground = true;
        } else {
          eleDesc.eType = TQ.Element.ETYPE_PROP;
        }
      }
    }
  };

  p.registerHandler = function(func) {
    this.updateCompletedHandlers.push(func);
  };

  TQ.Level = Level;
}());
