/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};

(function () {
    /**
     * 抽象命令类， 定义命令的接口
     * @constructor
     */
    function AbstractCommand() {
    }

    //定义一个变量p代表该类的原型，以方便为其添加函数。
    var p = AbstractCommand.prototype;
    p.do = function() {};
    p.undo = function() {};
    p.redo = function() {};
    //以下内容支持 复合命令
    p.addCommand = function(cmd) {return cmd;};
    p.removeCommand = function(cmd) {return cmd;};
    p.getCommand = function(id) {return id;};

    /**
     * 复合命令
     * @constructor
     */
    function CompositeCommand() {
        this.commands = [];
    }

    inherit(CompositeCommand, AbstractCommand);
    CompositeCommand.prototype.do = function() {
        for (var i=0; i < this.commands.length; i++) {
            this.commands[i].do();
        }
    };

    CompositeCommand.prototype.redo = function() {
        for (var i=0; i < this.commands.length; i++) {
            this.commands[i].redo();
        }
    };

    CompositeCommand.prototype.undo = function() {
        for (var i=this.commands.length-1; i >= 0; i--) {
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
        return (null != this.commands.splice(i,1));
    };

    CompositeCommand.prototype.getCommand = function(id) {
        if (this.commands.length == 0) {
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
        if (!CommandMgr.__openedComposite) {
            CommandMgr.__openedComposite = new CompositeCommand();
            $(document).mouseup(CompositeCommand.close);
        }
    };

    CompositeCommand.close = function() {
        if (!CommandMgr.__openedComposite) {
            return;
        }
        CommandMgr.addToUndoStack(CommandMgr.__openedComposite);
        CommandMgr.__openedComposite = null;
    };

    function RotateCommand(ele, angle) {
        this.receiver = ele;
        this.newValue = Math.truncate6(angle);
        this.oldValue = Math.truncate6(ele.jsonObj.rotation);
    }

    inherit(RotateCommand, AbstractCommand);

    RotateCommand.prototype.do = function() {
        this.receiver.rotateTo(this.newValue);
        return("rotate" + this.receiver);
    };

    RotateCommand.prototype.undo = function() {
        this.receiver.rotateTo(this.oldValue);
        return("undo rotate" + this.receiver);
    };

    RotateCommand.prototype.redo = function() {
        this.receiver.rotateTo(this.newValue);
        return("redo rotate" + this.receiver);
    };

    /* scale */
    function ScaleCommand(ele, scale) {
        this.receiver = ele;
        this.newValue = scale;
        this.oldValue = ele.getScale(); // {sx:ele.jsonObj.sx, sy: ele.jsonObj.sy};
    }

    inherit(ScaleCommand, AbstractCommand);

    ScaleCommand.prototype.do = function() {
        this.receiver.scaleTo(this.newValue);
        return("scale" + this.receiver);
    };

    ScaleCommand.prototype.undo = function() {
        this.receiver.scaleTo(this.oldValue);
        return("undo scale" + this.receiver);
    };

    ScaleCommand.prototype.redo = function() {
        this.receiver.scaleTo(this.newValue);
        return("redo scale" + this.receiver);
    };

    /* font, setSize */
    function SetSizeCommand(ele, scale) {
        this.receiver = ele;
        this.newValue = scale;
        this.oldValue = ele.getFontSize();
    }

    inherit(SetSizeCommand, AbstractCommand);

    SetSizeCommand.prototype.do = function() {
        this.receiver.setSize(this.newValue);
        return("setSize" + this.receiver);
    };

    SetSizeCommand.prototype.undo = function() {
        this.receiver.setSize(this.oldValue);
        return("undo setSize" + this.receiver);
    };

    SetSizeCommand.prototype.redo = function() {
        this.receiver.setSize(this.newValue);
        return("redo setSize" + this.receiver);
    };

    /* font, setColor */
    function SetColorCommand(ele, scale) {
        this.receiver = ele;
        this.newValue = scale;
        this.oldValue = ele.getColor();
    }

    inherit(SetColorCommand, AbstractCommand);

    SetColorCommand.prototype.do = function() {
        this.receiver.setColor(this.newValue);
        return("setColor" + this.receiver);
    };

    SetColorCommand.prototype.undo = function() {
        this.receiver.setColor(this.oldValue);
        return("undo setColor" + this.receiver);
    };

    SetColorCommand.prototype.redo = function() {
        this.receiver.setColor(this.newValue);
        return("redo setColor" + this.receiver);
    };

    // Move
    function MoveCommand(ele, pos) {
        this.receiver = ele;
        this.oldValue = ele.getPosition();
        this.newValue = pos;
    }

    inherit(MoveCommand, AbstractCommand);

    MoveCommand.prototype.do = function() {
        this.receiver.moveTo(this.newValue);
        return("move" + this.receiver);
    };

    MoveCommand.prototype.undo = function() {
        this.receiver.moveTo(this.oldValue);
        return("undo move" + this.receiver);
    };

    MoveCommand.prototype.redo = function() {
        this.receiver.moveTo(this.newValue);
        return("redo move" + this.receiver);
    };

    function MovePivotCommand(ele, pivot, pos, marker) {
        this.receiver = ele;
        this.receiver2 = marker;
        var oldPivot = {pivotX: Math.truncate6(ele.jsonObj.pivotX), pivotY:Math.truncate6(ele.jsonObj.pivotY)};
        var oldPos = ele.getPosition();
        oldPos.x = Math.truncate6(oldPos.x);
        oldPos.y = Math.truncate6(oldPos.y);
        this.oldValue = {pivot: oldPivot, pos:oldPos};
        pivot.pivotX = Math.truncate6(pivot.pivotX);
        pivot.pivotY = Math.truncate6(pivot.pivotY);
        pos.x = Math.truncate6(pos.x);
        pos.y = Math.truncate6(pos.y);
        this.newValue = {pivot:pivot, pos:pos};
    }

    inherit(MovePivotCommand, AbstractCommand);

    MovePivotCommand.prototype.do = function() {
        this.receiver.movePivot(this.newValue.pivot, this.newValue.pos, this.receiver2);
        return(this.name + this.receiver);
    };

    MovePivotCommand.prototype.undo = function() {
        this.receiver.movePivot(this.oldValue.pivot, this.oldValue.pos, this.receiver2);
        return("undo move" + this.receiver);
    };

    MovePivotCommand.prototype.redo = MovePivotCommand.prototype.do;

    function SetTimeCommand(v) {
        this.receiver = TQ.FrameCounter;
        this.oldValue = TQ.FrameCounter.v;
        this.newValue = v;
    }

    inherit(SetTimeCommand, AbstractCommand);

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

    inherit(DeleteEleCommand, AbstractCommand);

    DeleteEleCommand.prototype.do = function() {
        this.receiver.deleteElement(this.newValue);
    };

    DeleteEleCommand.prototype.undo = function() {
        if (this.receiver2 != null)  {
            this.receiver2.undeleteChild(this.oldValue);
        } else {
            this.receiver.undeleteElement(this.oldValue);
        }
    };

    DeleteEleCommand.prototype.redo = DeleteEleCommand.prototype.do;

    TQ.AbstractCommand = AbstractCommand;
    TQ.CompositeCommand = CompositeCommand;
    TQ.MoveCommand = MoveCommand;
    TQ.MovePivotCommand = MovePivotCommand;
    TQ.ScaleCommand = ScaleCommand;
    TQ.SetColorCommand = SetColorCommand;
    TQ.SetSizeCommand = SetSizeCommand;
    TQ.RotateCommand = RotateCommand;
    TQ.SetTimeCommand = SetTimeCommand;
    TQ.DeleteEleCommand = DeleteEleCommand;
}());
