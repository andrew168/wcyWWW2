/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};

(function () {
  var SelectSet = {};
  SelectSet.members = [];
  SelectSet.decorations = [];  //  decorations ready to use
  SelectSet.workingDecorations = []; // decorations is using.
  SelectSet.selectedMarkers = []; // 选中的dec元素的集合(转轴点和夹点都是marker)(一个物体上只能选中一个)
  SelectSet.initialize = function() {
    TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY, function(){
      if ( (!TQ.TextEditor.visible) && (!TQ.FileDialog.visible)) {
        TQ.SelectSet.delete();
      }
    });
    TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY | TQ.InputMap.LEFT_ALT_FLAG, TQ.SelectSet.eraseAnimeTrack);
    TQ.InputMap.registerAction(TQ.InputMap.EMPTY_SELECTOR, TQ.SelectSet.clear);
  };

  SelectSet.getDecoration = function () {
    var decs = SelectSet.decorations.pop();
    if (decs == null) {
      var ref = TQ.SelectSet.members[0];
      assertNotNull(TQ.Dictionary.PleaseSelectHost, ref);
      //ToDo: 生成所有的夹点, 和 轴心点 图案.
      var ele = TQ.Element.build(ref.level, {isVis: 0, type:"JointMarker"});
      decs = [ele];
    }
    SelectSet.workingDecorations.push(decs);
    return decs;
  };

  SelectSet.recycleDecoration = function(decoration) {
    var id = SelectSet.workingDecorations.indexOf(decoration);
    SelectSet.workingDecorations.splice(id, 1);
    SelectSet.decorations.push(decoration);
  };

  SelectSet.add = function(element) {
    assertNotNull(TQ.Dictionary.PleaseSelectOne, element);
    if ((element == null )) return;
    if (element.isMarker()) { //  Decoration 不能记入选择集
      SelectSet.selectedMarkers.push(element);
      return;
    }

    SelectSet.selectedMarkers.splice(0); // 换了物体， Decoration就可能不被选中了。
    if (!TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL]) {
      if (!((SelectSet.members.length == 1) && (SelectSet.members.indexOf(element) ==0))) {
        SelectSet.clear();
      }
    }
    if (SelectSet.members.indexOf(element) < 0) {
      SelectSet.members.push(element);
      element.highlight(true);
      if (TQ.InputCtrl.inSubobjectMode)  SelectSet.attachDecoration(element);
    }
  };

  SelectSet.delete = function() {
    SelectSet.clear(true);
  };

  SelectSet.clear = function(withDelete) {
    var cmd;
    if (withDelete) {
      cmd = new TQ.CompositeCommand();
    }

    for (var i = 0; i< SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (ele.isValid()) ele.highlight(false); // 可能已经被前面的父物体一起删除了
      SelectSet.detachDecoration(ele);
      if (withDelete && ele.isValid()) {
        cmd.addCommand(new TQ.DeleteEleCommand(currScene, ele));
      }
    }
    if (withDelete && (cmd.commands.length > 0)) {
      TQ.CommandMgr.directDo(cmd);
    }
    SelectSet.members.splice(0); // 删除全部选中的物体;
    SelectSet.selectedMarkers.splice(0);
  };

  SelectSet.updateDecorations = function(show) {
    for (var i = 0; i< SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      if (show) {
        SelectSet.attachDecoration(ele);
      } else {
        SelectSet.detachDecoration(ele);
      }
    }
  };

  SelectSet.groupIt = function() {
    var isUnGroup = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL];
    TQ.CommandMgr.directDo(new TQ.GroupCommand(SelectSet.members, isUnGroup));
    SelectSet.clear();
  };

  SelectSet.jointIt = function() {
    var hasUnjointFlag = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL];
    TQ.CommandMgr.directDo(new TQ.JointCommand(SelectSet.members, hasUnjointFlag));
    if ((!hasUnjointFlag) && (!TQ.InputCtrl.inSubobjectMode)) { // 必须在零件模式下, 才能让录制系统更新子物体的坐标为相对坐标.
      $("#subElementMode").click();
    }

    SelectSet.clear();
  };

  SelectSet.pinIt = function() {
    for (var i = 0; i< SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (ele.isValid()) ele.pinIt();
    }
  };

  SelectSet.show = function(visible) {
    var allowIndividual = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_ALT];
    for (var i=0; i< SelectSet.members.length; i++) {
      var ele = TQ.SelectSet.members[i];
      if (!allowIndividual) {
        while (ele.isJoint() && (ele.parent != null)) { // find root for joints
          ele = ele.parent;
        }
      }
      ele.show(visible);
    }
  };

  SelectSet.eraseAnimeTrack = function() {
    TQ.FrameCounter.gotoBeginning();
    for (var i = 0; i< SelectSet.members.length; i++) {
      var ele = SelectSet.members[i];
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      if (ele.isValid()) ele.eraseAnimeTrack();
    }
  };

  $(document).mousedown(function(e) {
    if ((e.target) && (e.target.id == "testCanvas")) {
      var element = currScene.getSelectedElement();  //包括点击菜单, 此函数也会响应
      if (element != null) {
        SelectSet.add(element);
      } else
      if (!TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL]) {
        SelectSet.clear();
      }
    } else if ((e.target) && (e.target.tagName == "BODY")) { // 页面的空白处
      SelectSet.clear();
    }
  });

  SelectSet.isSelected = function(ele) {
    return ((SelectSet.members.indexOf(ele) >= 0) ||
            (SelectSet.selectedMarkers.indexOf(ele) >= 0));
  };

  SelectSet.pop = function() {
    assertTrue(TQ.Dictionary.INVALID_PARAMETER, SelectSet.members.length > 0); //非空集合
    return (SelectSet.members.pop());
  };

  SelectSet.detachDecoration = function(ele) {
    if (ele.decorations != null) {
      var decoration = ele.detachDecoration();
      SelectSet.recycleDecoration(decoration);
    }
  };

  SelectSet.attachDecoration = function(ele){
    if (!ele.decorations) {
      ele.attachDecoration(SelectSet.getDecoration());
    }
  };

  // 命令：
  function GroupCommand(elements, hasUngroupFlag) {
    this.receiver = [];
    for (var i = 0; i < elements.length; i++) { //需要复制元素， 防止原来的集合被clear清空
      this.receiver.push(elements[i]);
    }
    this.oldValue = !hasUngroupFlag;
    this.newValue = hasUngroupFlag;
  }

  inherit(GroupCommand, TQ.AbstractCommand);

  GroupCommand.prototype.do = function() {
    currScene.groupIt(this.receiver, this.newValue);
    return(this.constructor.name + this.receiver);
  };

  GroupCommand.prototype.undo = function() {
    if (this.oldValue) {  // ungroup 需要这些元素的根（Group元素）， 而不需要这些元素本身
      assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.receiver.length > 0);
      currScene.groupIt([this.receiver[0].parent], this.oldValue);
    }
    return(this.constructor.name + this.receiver);
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

  inherit(JointCommand, TQ.AbstractCommand);

  JointCommand.prototype.do = function() {
    currScene.joint(this.receiver, this.newValue);
    return(this.constructor.name + this.receiver);
  };

  JointCommand.prototype.undo = function() {
    currScene.joint(this.receiver, this.oldValue);
    return(this.constructor.name + this.receiver);
  };

  JointCommand.prototype.redo = JointCommand.prototype.do;

  TQ.GroupCommand = GroupCommand;
  TQ.JointCommand = JointCommand;
  TQ.SelectSet = SelectSet;
}());