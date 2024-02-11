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

(function() {
  var CommandMgr = {};

  var _queue = [];
  var _lastCmd = null;
  var _undoStack = [];
  var _redoStack = [];
  var _preferredQueue = [];
  var _isWorking = false;
  var _timerId = -1;
  var _cmdGroupId = 0;
  var _lastCmdGroupId = 0;

  CommandMgr.hasUndo = function() {
    return _undoStack.length > 0;
  };

  CommandMgr.hasRedo = function() {
    return _redoStack.length > 0;
  };

  CommandMgr.invoke = function() {
    _timerId = setTimeout(function() {
      CommandMgr._runOnce();
    }, 0);
  };

  CommandMgr.stop = function() {
    if (_timerId >= 0) clearTimeout(_timerId);
    _timerId = -1;
  };

  CommandMgr.startNewOperation = function() {
    _lastCmd = null; // 每一次start新操作的时候， 设置此值， 以阻止合并。
  };

  CommandMgr.addCommand = function(cmd, topPriority) {
    if (topPriority) {
      _preferredQueue.push(cmd);
    } else {
      _queue.push(cmd);
    }

    if (!_isWorking) {
      CommandMgr.invoke();
    }
  };

  CommandMgr._getCommand = function() {
    // 1) 每一次获取任务的时候, 都先检查高优先级的任务.
    // ToDo: 实现跳帧, 在绘制时间长的情况下, 只移动time, 不update和Render,直接绘制最新的帧.
    var cmd = _preferredQueue.shift();
    if (cmd == null) {
      return _queue.shift();
    }

    return cmd;
  };

  CommandMgr.addToUndoStack = function(cmd, fromRedo) {
    if (!fromRedo && (_redoStack.length > 0)) {
      _redoStack.splice(0);
    }
    while (_undoStack.length > TQ.Config.MAX_UNDO_STEP) {
      _undoStack.shift();
    }

    var mergedCmd;
    if ((mergedCmd = mergeCommand(_lastCmd, cmd)) != null) {
      _undoStack.pop();
      cmd = mergedCmd;
    }

    _undoStack.push(cmd);
    _lastCmd = cmd;
    _lastCmdGroupId = _cmdGroupId;
  };

  function mergeCommand(last, cmd) {
    if ((!!last) && (!!last.receiver) && // CompositeCommand没有receiver
            (_lastCmdGroupId === _cmdGroupId) &&
            (last.constructor.name2 === cmd.constructor.name2) &&
            (last.receiver.id === cmd.receiver.id)) {
      if ((last.constructor.name2 == "DeleteEleCommand") ||
                (last.constructor.name2 == "CompositeCommand")) {
        return null;
      } else {
        switch (cmd.constructor.name2) {
          case "MoveCommand":
          case "RotateCommand":
            cmd.oldValue = last.oldValue;
            break;
          case "GenCommand":
            switch (cmd.type2) {
              case TQ.GenCommand.SCALE: // 可以合并的命令种类
              case TQ.GenCommand.SCALE_AND_ROTATE:
              case TQ.GenCommand.CHANGE_LAYER:
                break;

              default:// 其余的种类，不能合并， 比如：GenCommand.ADD_ITEM, .PINIT, etc
                return null;
            }
            if (cmd.type2 === last.type2) {
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
  }

  function addToRedoStack(cmd) {
    while (_redoStack.length > TQ.Config.MAX_UNDO_STEP) {
      _redoStack.shift();
    }

    _redoStack.push(cmd);
  }

  CommandMgr.directDo = function(cmd) {
    cmd.do();
    if (cmd.constructor.name2 == "CompositeCommand") {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, cmd.commands.length > 0);
    }
    if (!TQ.CompositeCommand.isOpen()) {
      CommandMgr.addToUndoStack(cmd);
    } else {
      TQ.CompositeCommand.addCommand(cmd);
    }
  };

  CommandMgr._runOnce = function() {
    _isWorking = true;

    for (var cmd = CommandMgr._getCommand(); cmd != null; cmd = CommandMgr._getCommand()) {
      CommandMgr.directDo(cmd);
    }

    _isWorking = false;
  };

  CommandMgr.undo = function() {
    if (_undoStack.length >= 1) {
      var cmd = _undoStack.pop();
      var result = cmd.undo();
      addToRedoStack(cmd);
      return result;
    }
    return null;
  };

  CommandMgr.redo = function() {
    if (_redoStack.length >= 1) {
      var cmd = _redoStack.pop();
      var result = cmd.redo();
      CommandMgr.addToUndoStack(cmd, true);
      return result;
    }

    return null;
  };

  CommandMgr.reset = function() {
    CommandMgr.stop();
    _undoStack.splice(0);
    _redoStack.splice(0);
    _queue.splice(0);
    _preferredQueue.splice(0);
    _isWorking = false;
    _cmdGroupId = 0;
  };

  CommandMgr.initialize = function() {
    CommandMgr.reset();
    $(document).mousedown(function() {
      _cmdGroupId++; // 开始一组新命令， 与前一组不能合并同类命令
    });

    TQ.InputMap.registerAction(TQ.InputMap.Z | TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.undo);
    TQ.InputMap.registerAction(TQ.InputMap.Y | TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.redo);
  };

  TQ.CommandMgr = CommandMgr;
}());
