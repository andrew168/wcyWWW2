/**
 * Created by Andrewz on 7/2/2016.
 */
/**
 * 命令的管理者类， 包括：
 *   1. 命令的Queue，优先Queue（不需要undo），
 *   2. 命令的undo堆栈， redo堆栈
 *   3. 添加命令到Que， do，undo和redo函数
 *
 * @type {Object}
 */
window.TQ = window.TQ || {};

(function () {
    var CommandMgr = {};

    var _queue = [],
        _MAX_UNDO_STEP = 100,
        _lastCmd = null,
        _undoStack = [],
        _redoStack = [],
        _preferredQueue = [],
        _isWorking = false,
        _timerID = -1,
        _cmdGroupID = 0,
        _lastCmdGroupID = 0;

    CommandMgr.hasUndo = function () {
        return _undoStack.length > 0;
    };

    CommandMgr.hasRedo = function () {
        return _redoStack.length > 0;
    };

    CommandMgr.invoke = function () {
        _timerID = setTimeout(function () {
            CommandMgr._runOnce();
        }, 0);
    };

    CommandMgr.stop = function () {
        if (_timerID >= 0) clearTimeout(_timerID);
        _timerID = -1;
    };

    CommandMgr.startNewOperation = function() {
        _lastCmd = null;  // 每一次start新操作的时候， 设置此值， 以阻止合并。
    };

    CommandMgr.addCommand = function (cmd, topPriority) {
        if (topPriority) {
            _preferredQueue.push(cmd);
        } else {
            _queue.push(cmd);
        }

        if (!_isWorking) {
            CommandMgr.invoke();
        }
    };

    CommandMgr._getCommand = function () {
        // 1) 每一次获取任务的时候, 都先检查高优先级的任务.
        // ToDo: 实现跳帧, 在绘制时间长的情况下, 只移动time, 不update和Render,直接绘制最新的帧.
        var cmd = _preferredQueue.shift();
        if (cmd == null) {
            return _queue.shift();
        }

        return cmd;
    };

    CommandMgr.addToUndoStack = function (cmd) {
        while (_undoStack.length > _MAX_UNDO_STEP) {
            _undoStack.shift();
        }

        var mergedCmd;
        if ((mergedCmd = CommandMgr.mergeCommand(_lastCmd, cmd)) != null) {
            _undoStack.pop();
            cmd = mergedCmd;
        }

        _undoStack.push(cmd);
        _lastCmd = cmd;
        _lastCmdGroupID = _cmdGroupID;
    };

    CommandMgr.mergeCommand = function (last, cmd) {
        if ((last != null) &&
            (_lastCmdGroupID === _cmdGroupID) &&
            (last.constructor.name === cmd.constructor.name) &&
            (last.receiver.id === cmd.receiver.id)) {
            if ((last.constructor.name == "DeleteEleCommand") ||
                (last.constructor.name == "CompositeCommand")) {
                return null;
            } else {
                switch (cmd.constructor.name) {
                    case 'MoveCommand':
                    case 'RotateCommand':
                        cmd.oldValue = last.oldValue;
                        break;
                    case 'GenCommand':
                        if (cmd.dofn === last.dofn) {
                            cmd.oldValue = last.oldValue;
                        } else {
                            return null;
                        }
                        break;
                    default:
                        return null;
                }
                return cmd;
            }
        }

        return null;
    };

    CommandMgr.addToRedoStack = function (cmd) {
        while (_redoStack.length > _MAX_UNDO_STEP) {
            _redoStack.shift();
        }

        _redoStack.push(cmd);
    };

    CommandMgr.directDo = function (cmd) {
        cmd.do();
        if (cmd.constructor.name == "CompositeCommand") {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, cmd.commands.length > 0);
        }
        if (!CommandMgr.__openedComposite) {
            CommandMgr.addToUndoStack(cmd);
        } else {
            CommandMgr.__openedComposite.addCommand(cmd);
        }
    };

    CommandMgr._runOnce = function () {
        _isWorking = true;

        for (var cmd = CommandMgr._getCommand(); cmd != null; cmd = CommandMgr._getCommand()) {
            CommandMgr.directDo(cmd);
        }

        _isWorking = false;
    };

    CommandMgr.undo = function () {
        if (_undoStack.length >= 1) {
            var cmd = _undoStack.pop();
            var result = cmd.undo();
            CommandMgr.addToRedoStack(cmd);
            return result;
        }
        return null;
    };

    CommandMgr.redo = function () {
        if (_redoStack.length >= 1) {
            var cmd = _redoStack.pop();
            var result = cmd.redo();
            CommandMgr.addToUndoStack(cmd);
            return result;
        }

        return null;
    };

    CommandMgr.clear = function () {
        CommandMgr.stop();
        _undoStack.splice(0);
        _redoStack.splice(0);
        _queue.splice(0);
        _preferredQueue.splice(0);
        _isWorking = false;
        _cmdGroupID = 0;
    };

    CommandMgr.initialize = function () {
        CommandMgr.clear();
        $(document).mousedown(function () {
            _cmdGroupID++; // 开始一组新命令， 与前一组不能合并同类命令
        });

        TQ.InputMap.registerAction(TQ.InputMap.Z | TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.undo);
        TQ.InputMap.registerAction(TQ.InputMap.Y | TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.redo);
    };

    TQ.CommandMgr = CommandMgr;
}());
