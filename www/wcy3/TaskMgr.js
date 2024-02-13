/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};
(function() {
  /** 内部类,记录和执行一条命令
     **/
  function Command(f, params, path) {
    this.f = f;
    this.params = params;
    this.path = path === null ? true : path;
  }

  Command.prototype.exec = function(scope) { this.f.apply(scope, this.params); };

  var TaskMgr = {};
  TaskMgr.queue = [];
  TaskMgr.preferredQueue = [];
  TaskMgr.isWorking = false;
  TaskMgr._timerId = -1;
  TaskMgr.initialize = function() {
    TaskMgr.queue = [];
    TaskMgr.preferredQueue = [];
  };

  TaskMgr.invoke = function() {
    TaskMgr._timerId = setTimeout(function() { TaskMgr._runOnce(); }, 0);
  };

  TaskMgr.stop = function() {
    if (TaskMgr._timerId >= 0) clearTimeout(TaskMgr._timerId);
    TaskMgr._timerId = -1;
  };

  TaskMgr.addTask = function(func, params, topPriority) {
    if (topPriority) {
      TaskMgr.preferredQueue.push(new Command(func, params, null));
    } else {
      TaskMgr.queue.push(new Command(func, params, null));
    }

    if (!TaskMgr.isWorking) {
      TaskMgr.invoke();
    }
  };

  TaskMgr._getTask = function() {
    // 1) 每一次获取任务的时候, 都先检查高优先级的任务.
    // ToDo: 实现跳帧, 在绘制时间长的情况下, 只移动time, 不update和Render,直接绘制最新的帧.
    var task = TaskMgr.preferredQueue.shift();
    if (task === null) {
      return TaskMgr.queue.shift();
    }

    return task;
  };

  TaskMgr._runOnce = function() {
    TaskMgr.isWorking = true;

    for (var task = TaskMgr._getTask(); task !== null; task = TaskMgr._getTask()) {
      task.exec(TaskMgr);
    }

    TaskMgr.isWorking = false;
  };

  TQ.TaskMgr = TaskMgr;
}());
