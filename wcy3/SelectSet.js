/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};
(function() {
  var SelectSet = {};
  var isOn = true; // 允许暂时关闭
  // 需要多重选择的命令， 先开始，连续选择，再点1次，执行并结束
  // 需要连续选择的， 先开始， 然后选1个，执行1个，再点1次则结束
  // 需要单一选择的命令，先选择， 再执行。
  // 同时只能有1个命令在执行（不论是多选，连续选，还是单选） 互斥的操作， 避免同时嵌套使用
  var state = {
    multiCmdStarted: false,
    cmd: null
  };

  var btnEffect = {
    group: null,
    joint: null,
    limitJoint: null
  };
  var latestElement = null;
  var lastSolidElement = null; // 非null的， 可编辑的 element， 不是marker
  var selectedMarkers = []; // 选中的dec元素的集合(转轴点和夹点都是marker)(一个物体上只能选中一个)

  SelectSet.SELECTION_NEW_EVENT = "selected new element";
  SelectSet.SELECTION_EMPTY_EVENT = "selection empty";
  SelectSet.members = [];
  SelectSet.multiCmdGroupIt = multiCmdGroupIt;
  SelectSet.multiCmdJointIt = multiCmdJointIt;
  SelectSet.multiCmdLimitJoint = multiCmdLimitJoint;
  SelectSet.explode = explode;
  SelectSet.btnEffect = btnEffect;

  SelectSet.initialize = function() {
    TQ.Marker.init();
    TQ.AnchorMarker.init();
    SelectSet.members.splice(0);
    state.multiCmdStarted = false;
    state.cmd = null;
    latestElement = null;
    lastSolidElement = null;
    btnEffect.group = null;
    btnEffect.joint = null;
    btnEffect.limitJoint = null;
    TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY, function() {
      if ((!TQ.TextEditor.visible) && (!TQ.FileDialog.visible)) {
        TQ.SelectSet.delete();
      }
    });
    TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY | TQ.InputMap.LEFT_ALT_FLAG, TQ.SelectSet.eraseAnimeTrack);
    TQ.InputMap.registerAction(TQ.InputMap.EMPTY_SELECTOR, TQ.SelectSet.clear);

    var keyActionPair = {
      1: "idle",
      2: "work",
      3: "run",
      4: "smile",
      5: "stand"
    };
    TQ.InputMap.registerAction(TQ.InputMap.D1, function() { SelectSet.playAnimation(keyActionPair[1]); });
    TQ.InputMap.registerAction(TQ.InputMap.D2, function() { SelectSet.playAnimation(keyActionPair[2]); });
    TQ.InputMap.registerAction(TQ.InputMap.D3, function() { SelectSet.playAnimation(keyActionPair[3]); });
    TQ.InputMap.registerAction(TQ.InputMap.D4, function() { SelectSet.playAnimation(keyActionPair[4]); });
    TQ.InputMap.registerAction(TQ.InputMap.D5, function() { SelectSet.playAnimation(keyActionPair[5]); });
  };

  SelectSet.playAnimation = function(actionName) {
    var ele = SelectSet.peek();
    if (ele != null) {
      ele.playAction(actionName);
    }
  };

  SelectSet.turnOn = function() {
    isOn = true;
  };
  SelectSet.turnOff = function() {
    isOn = false;
  };

  SelectSet.add = function(element) {
    if (!isOn) {
      return;
    }
    assertNotNull(TQ.Dictionary.PleaseSelectOne, element);
    if ((element == null)) return;

    if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_SHIFT]) {
      while (element.isMarker()) { //  Decoration 不能记入选择集
        element = element.host;
      }
      if (SelectSet.members.indexOf(element) >= 0) {
        return SelectSet.remove(element);
      } else {
        return;
      }
    }

    latestElement = element;
    if (element.isMarker()) { //  Decoration 不能记入选择集
      selectedMarkers.splice(0); // 最多只能同时选中、操作1个marker
      selectedMarkers.push(element);
      return;
    }

    selectedMarkers.splice(0); // 换了物体， Decoration就可能不被选中了。
    if (!(TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyCtrl)) {
      if (!((SelectSet.members.length === 1) && (SelectSet.members.indexOf(element) === 0))) {
        SelectSet.clear();
      }
    }
    if (SelectSet.members.indexOf(element) < 0) {
      SelectSet.members.push(element);
    }

    if (!element.isHighlighting()) {
      element.highlight(true);
      SelectSet.attachDecoration(element);

      // 对于关节物体上的子关节，在整体模式下，情况复杂一些：
      //    如果是“移动关节”： 则选中的是子关节
      //    如果是floatToolbar上的操作，缩放、旋转，等， 则是整体
      if (!TQ.InputCtrl.inSubobjectMode && element.isJoint()) {
        TQ.FloatToolbar.selectedElement = element;
      } else {
        TQ.FloatToolbar.selectedElement = element;
      }
    }

    TQ.Base.Utility.triggerEvent(document, SelectSet.SELECTION_NEW_EVENT, { element: element });
    latestElement = element;
    if (element && !element.isMarker()) {
      lastSolidElement = element;
    }
  };

  SelectSet.addElements = function(elements) {
    var nLen = elements.length;
    if (nLen === 0) return;
    SelectSet.members.splice(0);
    for (var i = 0; i < nLen; i++) {
      var element = elements[i];

      latestElement = element;
      selectedMarkers.splice(0); // 最多只能同时选中、操作1个marker
      selectedMarkers.push(element);
      SelectSet.members.push(element);

      element.highlight(true);
      SelectSet.attachDecoration(element);

      if (!TQ.InputCtrl.inSubobjectMode && element.isJoint()) {
        TQ.FloatToolbar.selectedElement = element;
      } else {
        TQ.FloatToolbar.selectedElement = element;
      }
      TQ.Base.Utility.triggerEvent(document, SelectSet.SELECTION_NEW_EVENT, { element: element });
    }
  };

  /*
     删除当前选中的所有元素
     */
  SelectSet.delete = function() {
    SelectSet.clear(true, true);
  };

  SelectSet.clear = function(withDelete, withEvent) {
    var cmd;
    if (withDelete) {
      cmd = new TQ.CompositeCommand();
    }

    for (var i = 0; i < SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (ele.isValid()) ele.highlight(false); // 可能已经被前面的父物体一起删除了
      ele.detachDecoration();
      if (withDelete && ele.isValid()) {
        cmd.addCommand(new TQ.DeleteEleCommand(currScene, ele));
      }
    }
    if (withDelete && (cmd.commands.length > 0)) {
      TQ.CommandMgr.directDo(cmd);
    }

    SelectSet.members.splice(0); // 删除全部选中的物体;
    selectedMarkers.splice(0);
    latestElement = null;
    if (withDelete || withEvent) {
      TQ.DirtyFlag.setScene();
    }

    if (withEvent) {
      TQ.Base.Utility.triggerEvent(document, SelectSet.SELECTION_EMPTY_EVENT, { element: null });
    }
  };

  SelectSet.remove = function(ele) {
    assertNotNull(TQ.Dictionary.FoundNull, ele);
    for (var i = 0; i < SelectSet.members.length; i++) {
      if (ele.id === SelectSet.members[i].id) {
        if (ele.isValid()) { // 可能已经被前面的父物体一起删除了
          ele.highlight(false);
          ele.detachDecoration();
          SelectSet.members.splice(i, 1);
          latestElement = SelectSet.peekEnd();
          break;
        }
      }
    }
  };

  function groupIt() {
    var isUnGroup = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyUngroup;
    if (isUnGroup || (SelectSet.members.length >= 2)) {
      TQ.CommandMgr.directDo(new TQ.GroupCommand(SelectSet.members, isUnGroup));
      SelectSet.clear(false, true);
      return true;
    }

    return false;
  }

  function ungroup() {
    var ungroupFlag = true;
    TQ.CommandMgr.directDo(new TQ.GroupCommand(SelectSet.members, ungroupFlag));
    SelectSet.clear();
  }

  function multiCmd(cmd, options) { // 先开始， 再结束， 必须配对、紧邻，
    if (state.multiCmdStarted) {
      if (state.cmd === cmd) {
        state.multiCmdStarted = false;
        TQ.InputCtrl.clearSubjectModeAndMultiSelect();
        cmd();
        if (state.cmdAfter) {
          state.cmdAfter();
        }
      } else {
        return TQ.MessageBox.prompt(TQ.Locale.getStr("please complete the current operation"));
      }
      return;
    }

    state.multiCmdStarted = true;
    if (options && options.cmdBefore) {
      options.cmdBefore();
    }
    state.cmd = cmd;
    state.cmdAfter = (options && options.cmdAfter) ? options.cmdAfter : null;

    SelectSet.clear();
    TQ.InputCtrl.setMultiSelect();
  }

  function multiCmdGroupIt() {
    return multiCmd(groupIt, {
      cmdBefore: function() {
        // TQ.SelectSet.turnOff();
        btnEffect.group = "effect-working";
      },
      cmdAfter: function() {
        btnEffect.group = null;
        TQ.SelectSet.turnOn();
      }
    });
  }

  var oldStatue = {};
  function multiCmdJointIt() {
    return multiCmd(jointIt, {
      cmdBefore: function() {
        oldStatue.inSubobjectMode = TQ.InputCtrl.inSubobjectMode;
        oldStatue.useMarkerOn = TQ.Config.useMarkerOn;
        TQ.Config.useMarkerOn = true;
        TQ.InputCtrl.inSubobjectMode = true;
        btnEffect.joint = "effect-working";
      },
      cmdAfter: function() {
        TQ.InputCtrl.inSubobjectMode = oldStatue.inSubobjectMode;
        TQ.Config.useMarkerOn = oldStatue.useMarkerOn;
        btnEffect.joint = null;
      }
    });
  }

  function limitJoint() {
    // 虽然是空函数，但是必须有
    // 因为函数使用用来判断是否同一个命令，必须唯一
  }

  function multiCmdLimitJoint() {
    let rotation0;
    let rotation1;
    let ee;
    let isValid = false;
    let parentIsPinned = false;
    return multiCmd(limitJoint, {
      cmdBefore: function() {
        // 确保Parent 是固定的
        ee = SelectSet.peek();
        if (!!ee || ee.isJoint()) {
          rotation0 = ee.getRotation();
          ee.removeLimitation();
          isValid = true;
          if (ee.parent && ee.parent.isPinned()) {
            parentIsPinned = true;
          } else {
            ee.parent.pinIt();
          }
          btnEffect.limitJoint = "effect-working";
        } else {
          TQ.MessageBox.prompt(TQ.Locale.getStr("Please choose a joint, before click the command"));
        }
      },
      cmdAfter: function() {
        if (isValid) {
          rotation1 = ee.getRotation();
          // 确保rotation1 is 最大角
          if (rotation1 < rotation0) {
            rotation1 = [rotation0, rotation0 = rotation1][0];
          }

          TQ.IKCtrl.setLimitation(0, rotation0);
          TQ.IKCtrl.setLimitation(1, rotation1);
          // 确保Parent 是固定的
          if (!parentIsPinned) {
            ee.parent.pinIt();
          }
          btnEffect.limitJoint = null;
        }
      }
    });
  }

  function jointIt() {
    // var hasUnjointFlag = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyUnjoint;
    var hasUnjointFlag = false;
    TQ.InputCtrl.setSubobjectMode();
    TQ.CommandMgr.directDo(new TQ.JointCommand(SelectSet.members, hasUnjointFlag));
    SelectSet.clear(false, true);
  }

  function unjoint() {
    var unJointFlag = true;
    TQ.CommandMgr.directDo(new TQ.JointCommand(SelectSet.members, unJointFlag));
    SelectSet.clear(false, true);
  }

  function explode() {
    if (SelectSet.isEmpty()) {
      return;
    }

    SelectSet.members.forEach(function(ele) {
      if (ele.hasBBox()) {
        TQ.BBox.detachFrom(ele);
      }
    });

    var firstEle = SelectSet.members[0];
    if (firstEle.isBone()) {
      unjoint();
    } else {
      ungroup();
    }
  }

  SelectSet.pinIt = function() {
    for (var i = 0; i < SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (ele.isValid()) {
        TQ.CommandMgr.pinIt(ele);
      }
    }
  };

  SelectSet.show = function(visible) {
    var allowIndividual = TQ.InputCtrl.inSubobjectMode || TQ.InputMap.isPresseds[TQ.InputMap.LEFT_ALT];
    TQ.CommandMgr.directDo(new TQ.HideCommand(SelectSet.members, allowIndividual));
  };

  SelectSet.doShow = function(eles, allowIndividual) {
    var isVisible = false;
    var target = null;

    for (var i = 0; i < eles.length; i++) {
      var ele = eles[i];
      if (!allowIndividual) {
        while (ele.isJoint() && (ele.parent != null)) { // find root for joints
          ele = ele.parent;
        }
      }
      isVisible = ele.isVisible();
      ele.toggleVisibility();
      target = ele;
    }
  };

  SelectSet.eraseAnimeTrack = function() {
    for (var i = 0; i < SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (ele.isValid()) {
        ele.eraseAnimeTrack(true);
        ele.updateRecord2(0);
      }
    }
  };

  SelectSet.getElementUnderMouse = function() {
    TQ.Assert.isTrue(!!stage, "没有初始化stage！");
    var target = stage.selectedItem;
    var element = (target == null) ? null : currScene.findAtom(target); // 包括点击菜单, 此函数也会响应
    if (element != null) {
      element = SelectSet.getEditableEle(element);
    }

    return element;
  };

  SelectSet.getSelectedElement = function() {
    var element = SelectSet.getElementUnderMouse();
    if (element != null) {
      SelectSet.add(element);
    } else {
      if (!TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL]) {
        SelectSet.clear();
      }
    }

    return TQ.SelectSet.peek();
  };

  SelectSet.getEditableEle = function(ele) { // 获取Group物体在整体操作模式下的可操作对象
    // Jointed 物体： 获取当前的joint
    // Group的物体: 而且没有打散, 则操作其根
    // 3D打包的物体：操作其根
    if (TQ.InputCtrl.showMarkerOnly) { // 在创作复合物体的时候， 如果不在零件模式，也可以只要求显示Marker。
      // assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode);
    }

    // BBox 总是不可编辑的
    if (ele.isBBox()) {
      if (ele.parent != null) return TQ.SelectSet.getEditableEle(ele.parent);
    }
    // marker仅仅在 移动pivot点的时候，是可以编辑的
    if (!ele.isJoint() && !ele.isMarker() && isPart(ele)) {
      if ((!TQ.InputCtrl.inSubobjectMode) || TQ.InputCtrl.showMarkerOnly) {
        if (ele.parent != null) return TQ.SelectSet.getEditableEle(ele.parent);
      }
    }
    return ele;
  };

  function isPart(ele) {
    // part 替代原来的 subobject概念
    // marker 和 joint也都是 part， 所以，在editable中要特别处理
    return (ele.isGrouped() || ele.parent);
  }

  SelectSet.isSelected = function(ele) {
    return ((SelectSet.members.indexOf(ele) >= 0) ||
      (selectedMarkers.indexOf(ele) >= 0));
  };

  SelectSet.empty = function() {
    if (SelectSet.members.length > 0) {
      SelectSet.clear(false, true);
    }
    TQ.AssertExt.invalidLogic(selectedMarkers.length === 0);
  };

  SelectSet.unHighlight = function() {
    if (SelectSet.members.length > 0) {
      for (var i = 0; i < SelectSet.members.length; i++) {
        var ele = SelectSet.members[i];
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (ele.isValid()) ele.highlight(false); // 可能已经被前面的父物体一起删除了
        ele.detachDecoration();
      }

      // SelectSet.members.splice(0); // 删除全部选中的物体;
      selectedMarkers.splice(0);
      TQ.Base.Utility.triggerEvent(document, SelectSet.SELECTION_EMPTY_EVENT, { element: null });
    }
  };

  SelectSet.isEmpty = function() {
    return (SelectSet.members.length === 0);
  };

  SelectSet.isInMultiCmd = function() {
    return state.multiCmdStarted;
  };

  /*
    返回第一个元素，并且，从选择集中删除它
     */
  SelectSet.pop = function() {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, SelectSet.members.length > 0); // 非空集合
    var ele = SelectSet.members.pop();
    ele.detachDecoration();
    return (ele);
  };

  /*
     返回 第一个选中的元素， 但是，仍然保留它在选择集中， 不删除
     */
  SelectSet.peek = function() {
    if (SelectSet.members.length <= 0) {
      return null;
    }
    return (SelectSet.members[0]);
  };

  // 返回最后加入的元素
  SelectSet.peekEnd = function() {
    if (SelectSet.members.length <= 0) {
      return null;
    }
    return (SelectSet.members[SelectSet.members.length - 1]);
  };

  SelectSet.textSelected = function() {
    return ((SelectSet.members.length > 0) &&
      SelectSet.members[0].isText());
  };

  function peekLatest() {
    var n = SelectSet.members.length;
    if (n <= 0) {
      return null;
    }
    // 在扣除模式下，lastElement是null
    return !latestElement ? SelectSet.peekEnd() : latestElement;
  }

  SelectSet.peekEditableEle = function() {
    return peekMarker() || SelectSet.peek();
  };

  SelectSet.peekLatestEditableEle = function() {
    var ele = peekMarker() || peekLatest();
    while (ele && !ele.isEditable()) {
      ele = ele.host;
    }
    return ele;
  };

  SelectSet.getLastSolidElement = function() {
    return lastSolidElement;
  };

  SelectSet.switchToRootElement = function() {
    var rootElement = lastSolidElement;
    SelectSet.empty();
    while (rootElement && !!rootElement.parent) {
      rootElement = rootElement.parent;
    }
    SelectSet.add(rootElement);
    return rootElement;
  };

  SelectSet.updateByGesture = function(evt) {
    var selectedNothing = true;
    var touches = TQ.Utility.getTouches(evt);
    if (touches.length <= 0) {
      TQ.AssertExt.invalidLogic(touches.length <= 0, "应该有接触点");
    }
    var touchPoint = touches[0];
    var rect = TQ.SceneEditor.stage._getElementRect(TQ.SceneEditor.stage.canvas);
    var pageX = touchPoint.pageX - rect.left;
    var pageY = touchPoint.pageY - rect.top;
    var displayObjects = TQ.SceneEditor.stageContainer.getObjectsUnderPoint(pageX, pageY);

    if ((!!displayObjects) && (displayObjects.length > 0)) {
      var ele2 = selectTopOnly(displayObjects);
      if (ele2) {
        TQ.SelectSet.add(ele2);
        selectedNothing = false;
        return;
      }
    }

    if (selectedNothing) {
      SelectSet.empty();
    }
  };

  function selectTopOnly(objs) {
    var result;
    for (var i = 0; i < objs.length; i++) {
      if (!objs[i].ele) {
        continue;
      }
      if (!result) {
        result = objs[i].ele;
      } else {
        if (objs[i].ele.getZ() > result.getZ()) {
          result = objs[i].ele;
        }
      }
    }

    if (result) {
      result = TQ.SelectSet.getEditableEle(result);
    }

    return result;
  }

  function peekMarker() {
    if (selectedMarkers.length <= 0) {
      return null;
    }
    return (selectedMarkers[0]);
  }

  SelectSet.attachDecoration = function(ele) {
    if (!ele.decorations) {
      if (ele.isEditable()) {
        if (TQ.Config.useMarkerOn) {
          ele.attachMarker();
        }
        TQ.BBox.attachTo(ele);
      }
    }
  };

  // 命令：
  function GroupCommand(elements, hasUngroupFlag) {
    this.receiver = [];
    for (var i = 0; i < elements.length; i++) { // 需要复制元素， 防止原来的集合被clear清空
      this.receiver.push(elements[i]);
    }
    this.oldValue = !hasUngroupFlag;
    this.newValue = hasUngroupFlag;
  }

  TQ.inherit(GroupCommand, TQ.AbstractCommand);

  GroupCommand.prototype.do = function() {
    currScene.groupIt(this.receiver, this.newValue);
    return (this.constructor.name2 + this.receiver);
  };

  GroupCommand.prototype.undo = function() {
    if (this.oldValue) { // ungroup 需要这些元素的根（Group元素）， 而不需要这些元素本身
      assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.receiver.length > 0);
      currScene.groupIt([this.receiver[0].parent], this.oldValue);
    }
    return (this.constructor.name2 + this.receiver);
  };

  GroupCommand.prototype.redo = GroupCommand.prototype.do;

  function JointCommand(elements, hasUnjointFlag) {
    this.receiver = [];
    for (var i = 0; i < elements.length; i++) {
      this.receiver.push(elements[i]);
    }
    this.oldValue = !hasUnjointFlag;
    this.newValue = hasUnjointFlag;
  }

  TQ.inherit(JointCommand, TQ.AbstractCommand);

  JointCommand.prototype.do = function() {
    currScene.joint(this.receiver, this.newValue);
    return (this.constructor.name2 + this.receiver);
  };

  JointCommand.prototype.undo = function() {
    currScene.joint(this.receiver, this.oldValue);
    return (this.constructor.name2 + this.receiver);
  };

  JointCommand.prototype.redo = JointCommand.prototype.do;

  // 命令：
  function HideCommand(elements, allowIndividual) {
    this.receiver = [];
    for (var i = 0; i < elements.length; i++) { // 需要复制元素， 防止原来的集合被clear清空
      this.receiver.push(elements[i]);
    }
    this.oldValue = allowIndividual;
    this.newValue = allowIndividual;
  }

  TQ.inherit(HideCommand, TQ.AbstractCommand);

  HideCommand.prototype.do = function() {
    SelectSet.doShow(this.receiver, this.newValue);
    return (this.constructor.name2 + this.receiver);
  };

  HideCommand.prototype.undo = function() {
    SelectSet.doShow(this.receiver, this.oldValue);
    return (this.constructor.name2 + this.receiver);
  };

  HideCommand.prototype.redo = HideCommand.prototype.do;

  GroupCommand.name2 = "GroupCommand";
  JointCommand.name2 = "JointCommand";
  HideCommand.name2 = "HideCommand";

  TQ.GroupCommand = GroupCommand;
  TQ.JointCommand = JointCommand;
  TQ.HideCommand = HideCommand;
  TQ.SelectSet = SelectSet;
}());
