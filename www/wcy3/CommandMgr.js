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

    function MoveCommand(ele, pos) {
        this.receiver = ele;
        this.oldValue = {x: ele.jsonObj.x, y:ele.jsonObj.y};
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
        var oldPos = {x: Math.truncate6(ele.jsonObj.x), y:Math.truncate6(ele.jsonObj.y)};
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

    /**
     * 命令的管理者类， 包括：
     *   1. 命令的Queue，优先Queue（不需要undo），
     *   2. 命令的undo堆栈， redo堆栈
     *   3. 添加命令到Que， do，undo和redo函数
     *
     * @type {Object}
     */

    var CommandMgr = {};

    CommandMgr.queue = [];
    CommandMgr.preferredQueue = [];
    CommandMgr.MAX_UNDO_STEP = 100;
    CommandMgr.lastCmd = null;
    CommandMgr.undoStack = [];
    CommandMgr.redoStack = [];
    CommandMgr.preferredQueue = [];
    CommandMgr.isWorking = false;
    CommandMgr._timerID = -1;
    CommandMgr._cmdGroupID = 0;
    CommandMgr._lastCmdGroupID = 0;
    CommandMgr.invoke = function () {
        CommandMgr._timerID = setTimeout(function() { CommandMgr._runOnce(); }, 0);
    };

    CommandMgr.stop = function() {
        if (CommandMgr._timerID >=0 ) clearTimeout(CommandMgr._timerID);
        CommandMgr._timerID = -1;
    };

    CommandMgr.addCommand = function(cmd, topPriority) {
        if (topPriority) {
            CommandMgr.preferredQueue.push(cmd);
        } else {
            CommandMgr.queue.push(cmd);
        }

        if (!CommandMgr.isWorking) {
            CommandMgr.invoke();
        }
    };

    CommandMgr._getCommand = function() {
        // 1) 每一次获取任务的时候, 都先检查高优先级的任务.
        // ToDo: 实现跳帧, 在绘制时间长的情况下, 只移动time, 不update和Render,直接绘制最新的帧.
        var cmd = CommandMgr.preferredQueue.shift();
        if (cmd == null) {
            return CommandMgr.queue.shift();
        }

        return cmd;
    };

    CommandMgr.addToUndoStack = function(cmd) {
        while (CommandMgr.undoStack.length > CommandMgr.MAX_UNDO_STEP) {
            CommandMgr.undoStack.shift();
        }

        var mergedCmd;
        if ((mergedCmd = CommandMgr.mergeCommand(CommandMgr.lastCmd, cmd)) != null ) {
            CommandMgr.undoStack.pop();
            cmd = mergedCmd;
        }

        CommandMgr.undoStack.push(cmd);
        CommandMgr.lastCmd = cmd;
        CommandMgr._lastCmdGroupID = CommandMgr._cmdGroupID;
    };

    CommandMgr.mergeCommand = function(last, cmd) {
        if ((last != null) &&
            (CommandMgr._lastCmdGroupID == CommandMgr._cmdGroupID) &&
            (last.constructor.name == cmd.constructor.name)) {
            if ((last.constructor.name == "DeleteEleCommand") ||
                (last.constructor.name == "CompositeCommand")) {
                return null;
            } else if (JSON.stringify(last.newValue) == JSON.stringify(cmd.oldValue)) {
                cmd.oldValue = last.oldValue;
                return cmd;
            }
        }

        return null;
    };

    CommandMgr.addToRedoStack = function(cmd) {
        while (CommandMgr.redoStack.length > CommandMgr.MAX_UNDO_STEP) {
            CommandMgr.redoStack.shift();
        }

        CommandMgr.redoStack.push(cmd);
    };

    CommandMgr.directDo = function(cmd) {
        cmd.do();
        if (cmd.constructor.name == "CompositeCommand") {
            assertTrue(TQ.Dictionary.INVALID_LOGIC,cmd.commands.length > 0);
        }
        if (!CommandMgr.__openedComposite) {
            CommandMgr.addToUndoStack(cmd);
        } else {
            CommandMgr.__openedComposite.addCommand(cmd);
        }
    };

    CommandMgr._runOnce = function () {
        CommandMgr.isWorking = true;

        for (var cmd = CommandMgr._getCommand(); cmd != null;  cmd = CommandMgr._getCommand()) {
            CommandMgr.directDo(cmd);
        }

        CommandMgr.isWorking = false;
    };

    CommandMgr.undo = function() {
        if (CommandMgr.undoStack.length >= 1) {
            var cmd = CommandMgr.undoStack.pop();
            var result = cmd.undo();
            CommandMgr.addToRedoStack(cmd);
            return result;
        }
        return null;
    };

    CommandMgr.redo = function() {
        if (CommandMgr.redoStack.length >= 1) {
            var cmd = CommandMgr.redoStack.pop();
            var result = cmd.redo();
            CommandMgr.addToUndoStack(cmd);
            return result;
        }

        return null;
    };

    CommandMgr.clear = function() {
        CommandMgr.stop();
        CommandMgr.undoStack.splice(0);
        CommandMgr.redoStack.splice(0);
        CommandMgr.queue.splice(0);
        CommandMgr.preferredQueue.splice(0);
        CommandMgr.isWorking = false;
        CommandMgr._cmdGroupID = 0;
    };

    CommandMgr.initialize = function() {
        CommandMgr.clear();
        $(document).mousedown(function() {
            CommandMgr._cmdGroupID ++; // 开始一组新命令， 与前一组不能合并同类命令
        });

        TQ.InputMap.registerAction(TQ.InputMap.Z|TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.undo);
        TQ.InputMap.registerAction(TQ.InputMap.Y|TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.redo);
    };

    TQ.CommandMgr = CommandMgr;
    TQ.AbstractCommand = AbstractCommand;
    TQ.CompositeCommand = CompositeCommand;
    TQ.MoveCommand = MoveCommand;
    TQ.MovePivotCommand = MovePivotCommand;
    TQ.RotateCommand = RotateCommand;
    TQ.SetTimeCommand = SetTimeCommand;
    TQ.DeleteEleCommand = DeleteEleCommand;
}());