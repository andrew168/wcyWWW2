/**
 * Created by Andrewz on 8/7.
 * Resource synchronizer: 在背景中运行， 把 用到的本地资源sync到服务器，
 * ** 在同步过程中， 显示“系统忙”标识，
 * ** 在同步成功之后， 更新element中的src，从本地url改为云资源url， 并且在RM中更改， 以便于播放， 复制。
 * ** 退出：如果sync任务没有完成，则提示它，
 * ** 保存：如果sync任务没有完成，则提示它， （把保存cmd，放到Queue中）
 * ** 如果没有完成， 下次启动之后，
 */

this.TQ = this.TQ || {};

this.TQ.ResourceSync = (function() {
  var numActiveTasks = 0;
  var events = {
    _oncomplete: [] // event name: 'complete'
  };

  return {
    on: on,
    once: once,
    isBusy: isBusy,
    local2Cloud: local2Cloud
  };

  function isBusy() {
    return numActiveTasks > 0;
  }

  function once(event, fn) {
    on(event, fn, 1);
  }

  function on(event, fn, once) {
    var listeners = events["_on" + event];

    if (typeof fn === "function") {
      listeners.push(once ? { fn: fn, once: once } : { fn: fn });
    }
  }

  function local2Cloud(ele, fileOrBuffer, matType) {
    numActiveTasks++;
    var option = {
      useBackgroundMode: true
    };

    return angular.element(document.body).injector().get("NetService").uploadOne(fileOrBuffer, matType, option)
      .then(function(res) {
        TQ.Log.debugInfo(res.url);
        if (ele && ele.jsonObj) {
          ele.jsonObj.src = TQUtility.unifyFormat(ele.jsonObj.type, res.url);
        }
        numActiveTasks--;
        if (numActiveTasks <= 0) {
          tryShowCompleteInfo();
          var listeners = events._oncomplete;
          if (listeners) {
            var num = listeners.length;
            for (let i = 0; i < num; i++) {
              if (listeners[i].fn) {
                setTimeout(listeners[i].fn);
              }
              if (listeners[i].once) {
                listeners.splice(i, 1);
                num--;
              }
            }
          }
        }
      });
  }

  function tryShowCompleteInfo() {
    if (numActiveTasks <= 0) {
      TQ.Log.debugInfo("background sync completed!");
    }
  }
})();
