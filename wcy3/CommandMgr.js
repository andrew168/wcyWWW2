/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};

(function() {
  /**
     * 抽象命令类， 定义命令的接口
     * @constructor
     */
  function AbstractCommand() {
  }

  // 定义一个变量p代表该类的原型，以方便为其添加函数。
  var p = AbstractCommand.prototype;
  p.do = function() {};
  p.undo = function() {};
  p.redo = function() {};
  // 以下内容支持 复合命令
  p.addCommand = function(cmd) { return cmd; };
  p.removeCommand = function(cmd) { return cmd; };
  p.getCommand = function(id) { return id; };

  /**
     * 复合命令
     * @constructor
     */
  function CompositeCommand() {
    this.commands = [];
  }

  var __openedComposite = false;
  CompositeCommand.isOpen = function() {
    return __openedComposite;
  };

  CompositeCommand.addCommand = function(cmd) {
    if (!__openedComposite) {
      return TQ.Assert(!__openedComposite, "没有opened的compositeCommand");
    }

    return __openedComposite.addCommand(cmd);
  };

  TQ.inherit(CompositeCommand, AbstractCommand);
  CompositeCommand.prototype.do = function() {
    for (var i = 0; i < this.commands.length; i++) {
      this.commands[i].do();
    }
  };

  CompositeCommand.prototype.redo = function() {
    for (var i = 0; i < this.commands.length; i++) {
      this.commands[i].redo();
    }
  };

  CompositeCommand.prototype.undo = function() {
    for (var i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  };

  CompositeCommand.prototype.addCommand = function(cmd) {
    this.commands.push(cmd);
  };

  CompositeCommand.prototype.removeCommand = function(cmd) {
    var i = this.commands.indexOf(cmd);
    if (i < 0) {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      return false;
    }
    return (this.commands.splice(i, 1) != null);
  };

  CompositeCommand.prototype.getCommand = function(id) {
    if (this.commands.length === 0) {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
      return null;
    }

    if (id < this.commands.length) {
      assertTrue(TQ.Dictionary.INVALID_PARAMETER, false);
      id = 0;
    }
    return this.commands[id];
  };

  // 以下open和close是为了让 Joint的移动可以快速undo
  CompositeCommand.open = function() {
    if (!__openedComposite) {
      __openedComposite = new CompositeCommand();
      document.addEventListener("mouseup", CompositeCommand.close);
    }
  };

  CompositeCommand.close = function() {
    if (!__openedComposite) {
      return;
    }
    document.removeEventListener("mouseup", CompositeCommand.close);
    TQ.CommandMgr.addToUndoStack(__openedComposite);
    __openedComposite = null;
  };

  function RotateCommand(ele, angle) {
    this.receiver = ele;
    this.newValue = Math.truncate6(angle);
    this.oldValue = Math.truncate6(ele.jsonObj.rotation);
  }

  TQ.inherit(RotateCommand, AbstractCommand);

  RotateCommand.prototype.do = function() {
    this.receiver.rotateTo(this.newValue);
    return ("rotate" + this.receiver);
  };

  RotateCommand.prototype.undo = function() {
    this.receiver.rotateTo(this.oldValue);
    return ("undo rotate" + this.receiver);
  };

  RotateCommand.prototype.redo = function() {
    this.receiver.rotateTo(this.newValue);
    return ("redo rotate" + this.receiver);
  };

  /* scale */
  function ScaleCommand(ele, scale) {
    this.receiver = ele;
    this.newValue = scale;
    this.oldValue = ele.getScaleInWorld(); // {sx:ele.jsonObj.sx, sy: ele.jsonObj.sy};
  }

  TQ.inherit(ScaleCommand, AbstractCommand);

  ScaleCommand.prototype.do = function() {
    this.receiver.scaleTo(this.newValue);
    return ("scale" + this.receiver);
  };

  ScaleCommand.prototype.undo = function() {
    this.receiver.scaleTo(this.oldValue);
    return ("undo scale" + this.receiver);
  };

  ScaleCommand.prototype.redo = function() {
    this.receiver.scaleTo(this.newValue);
    return ("redo scale" + this.receiver);
  };

  /* font, setSize */
  function SetSizeCommand(ele, scale) {
    this.receiver = ele;
    this.newValue = scale;
    this.oldValue = ele.getFontSize();
  }

  TQ.inherit(SetSizeCommand, AbstractCommand);

  SetSizeCommand.prototype.do = function() {
    this.receiver.setSize(this.newValue);
    return ("setSize" + this.receiver);
  };

  SetSizeCommand.prototype.undo = function() {
    this.receiver.setSize(this.oldValue);
    return ("undo setSize" + this.receiver);
  };

  SetSizeCommand.prototype.redo = function() {
    this.receiver.setSize(this.newValue);
    return ("redo setSize" + this.receiver);
  };

  /* font, setColor */
  function SetColorCommand(ele, scale) {
    this.receiver = ele;
    this.newValue = scale;
    this.oldValue = ele.getColor();
  }

  TQ.inherit(SetColorCommand, AbstractCommand);

  SetColorCommand.prototype.do = function() {
    this.receiver.setColor(this.newValue);
    return ("setColor" + this.receiver);
  };

  SetColorCommand.prototype.undo = function() {
    this.receiver.setColor(this.oldValue);
    return ("undo setColor" + this.receiver);
  };

  SetColorCommand.prototype.redo = function() {
    this.receiver.setColor(this.newValue);
    return ("redo setColor" + this.receiver);
  };

  // Move
  function MoveCommand(ele, pos) {
    this.receiver = ele;
    this.oldValue = ele.getPositionInWorld();
    this.newValue = pos;
  }

  TQ.inherit(MoveCommand, AbstractCommand);

  MoveCommand.prototype.do = function() {
    this.receiver.moveTo(this.newValue);
    return ("move" + this.receiver);
  };

  MoveCommand.prototype.undo = function() {
    this.receiver.moveTo(this.oldValue);
    return ("undo move" + this.receiver);
  };

  MoveCommand.prototype.redo = function() {
    this.receiver.moveTo(this.newValue);
    return ("redo move" + this.receiver);
  };

  // move pivot
  function MovePivotCommand(ele, pivot, pos, marker) {
    this.receiver = ele;
    this.receiver2 = marker;
    var oldPivot = { pivotX: Math.truncate6(ele.jsonObj.pivotX), pivotY: Math.truncate6(ele.jsonObj.pivotY) };
    var oldPos = ele.getPositionInWorld();
    oldPos.x = Math.truncate6(oldPos.x);
    oldPos.y = Math.truncate6(oldPos.y);
    this.oldValue = { pivot: oldPivot, pos: oldPos };
    pivot.pivotX = Math.truncate6(pivot.pivotX);
    pivot.pivotY = Math.truncate6(pivot.pivotY);
    pos.x = Math.truncate6(pos.x);
    pos.y = Math.truncate6(pos.y);
    this.newValue = { pivot: pivot, pos: pos };
  }

  TQ.inherit(MovePivotCommand, AbstractCommand);

  MovePivotCommand.prototype.do = function() {
    this.receiver.movePivot(this.newValue.pivot, this.newValue.pos, this.receiver2);
    return (this.name + this.receiver);
  };

  MovePivotCommand.prototype.undo = function() {
    this.receiver.movePivot(this.oldValue.pivot, this.oldValue.pos, this.receiver2);
    return ("undo move" + this.receiver);
  };

  MovePivotCommand.prototype.redo = MovePivotCommand.prototype.do;

  // Move anchor
  function MoveAnchorCommand(ele, pos) {
    this.receiver = ele;
    this.oldValue = ele.anchorMarker.getPositionInWorld();
    this.newValue = pos;
  }

  TQ.inherit(MoveAnchorCommand, AbstractCommand);

  MoveAnchorCommand.prototype.do = function() {
    this.receiver.moveAnchorTo(this.newValue);
    return ("move" + this.receiver);
  };

  MoveAnchorCommand.prototype.undo = function() {
    this.receiver.moveAnchorTo(this.oldValue);
    return ("undo move" + this.receiver);
  };

  MoveAnchorCommand.prototype.redo = MoveAnchorCommand.prototype.do;

  function SetTimeCommand(v) {
    this.receiver = TQ.FrameCounter;
    this.oldValue = TQ.FrameCounter.v;
    this.newValue = v;
  }

  TQ.inherit(SetTimeCommand, AbstractCommand);

  SetTimeCommand.prototype.do = function() {
    this.receiver.gotoFrame(this.newValue);
  };

  SetTimeCommand.prototype.undo = function() {
    this.receiver.gotoFrame(this.oldValue);
  };

  SetTimeCommand.prototype.redo = SetTimeCommand.prototype.do;

  function DeleteEleCommand(scene, ele) {
    this.receiver = scene;
    if (ele.parent != null) {
      this.receiver2 = ele.parent;
    } else {
      this.receiver2 = null;
    }
    this.oldValue = ele;
    this.newValue = ele;
  }

  TQ.inherit(DeleteEleCommand, AbstractCommand);

  DeleteEleCommand.prototype.do = function() {
    this.receiver.deleteElement(this.newValue);
  };

  DeleteEleCommand.prototype.undo = function() {
    if (this.receiver2 != null) {
      this.receiver2.undeleteChild(this.oldValue);
    } else {
      this.receiver.undeleteElement(this.oldValue);
    }
  };

  DeleteEleCommand.prototype.redo = DeleteEleCommand.prototype.do;

  AbstractCommand.name2 = "AbstractCommand";
  CompositeCommand.name2 = "CompositeCommand";
  MoveCommand.name2 = "MoveCommand";
  MoveAnchorCommand.name2 = "MoveAnchorCommand";
  MovePivotCommand.name2 = "MovePivotCommand";
  ScaleCommand.name2 = "ScaleCommand";
  SetColorCommand.name2 = "SetColorCommand";
  SetSizeCommand.name2 = "SetSizeCommand";
  RotateCommand.name2 = "RotateCommand";
  SetTimeCommand.name2 = "SetTimeCommand";
  DeleteEleCommand.name2 = "DeleteEleCommand";

  TQ.AbstractCommand = AbstractCommand;
  TQ.CompositeCommand = CompositeCommand;
  TQ.MoveCommand = MoveCommand;
  TQ.MoveAnchorCommand = MoveAnchorCommand;
  TQ.MovePivotCommand = MovePivotCommand;
  TQ.ScaleCommand = ScaleCommand;
  TQ.SetColorCommand = SetColorCommand;
  TQ.SetSizeCommand = SetSizeCommand;
  TQ.RotateCommand = RotateCommand;
  TQ.SetTimeCommand = SetTimeCommand;
  TQ.DeleteEleCommand = DeleteEleCommand;

  TQ.CommandMgr.scale = function(ele, newScale) {
    var oldValue = { sx: ele.jsonObj.sx, sy: ele.jsonObj.sy };
    TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.SCALE, ele, newScale, oldValue));
  };

  TQ.CommandMgr.pinIt = function(ele) {
    TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.PINIT, ele, null, null));
  };
}());
