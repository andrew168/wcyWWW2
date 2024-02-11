/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function() {
  var MIN_DURATION = 0; // 10 frames, ==> 0.5s
  var isUserControlling = false;
  var isSagPanel = false;
  var initialized = false;
  var previousSync = null;
  var tPool = [];
  var tPoolMaxLength = 5;
  var unitSeries = [0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 500, 1000, 5000]; // * 20 frame per second
  var rangeSlider = {
    minValue: 0,
    maxValue: 0,
    options: {
      floor: 0,
      ceil: 100,
      step: 1,
      showTicks: true,
      ticksArray: [10, 20, 30],
      minRange: MIN_DURATION,
      // maxRange: MIN_DURATION,
      pushRange: true,
      translate: onTranslate,
      onStart: onMouseStart,
      onEnd: onMouseStop,
      onChange: onMouseAction // onChange,
    }
  };

  return {
    getTObject1: getTObject1,
    getTObject2: getTObject2,
    onTrimCompleted: onTrimCompleted,
    rangeSlider: rangeSlider,
    startSagPanel: startSagPanel,
    stopSagPanel: stopSagPanel,
    initialize: initialize,
    setGlobalTime: setGlobalTime
  };

  function initialize() {
    if (initialized) {
      setTimeout(onRangeChanged, 100);
      return;
    }

    for (var i = 0; i < unitSeries.length; i++) {
      unitSeries[i] *= TQ.FrameCounter.defaultFPS;
    }

    initialized = true;
    rangeSlider.minValue = TQ.FrameCounter.t2f(TQ.Scene.localT2Global(TQ.FrameCounter.t()));
    rangeSlider.options.floor = 0;
    rangeSlider.options.ceil = Math.ceil(TQ.FrameCounter.t2f(TQ.Scene.getTMax()));
    updateTicksArray();
    TQ.FrameCounter.addHook(update);
    // 迫使系统render slider
    document.addEventListener(TQ.EVENT.SCENE_TIME_RANGE_CHANGED, onRangeChanged, false);
    onRangeChanged();
  }

  function onMouseStart() {
    isUserControlling = true;
  }

  function onMouseStop(sliderId, modelValue, highValue, pointerType) {
    if (TQ.State.showTrimTimeline) {
      syncToCounter(highValue);
    } else {
      syncToCounter(modelValue);
    }
    isUserControlling = false;
  }

  /** 消除抖动和快速移动中的中间过渡：
     *   200ms, 消除中间位置；
     *   在同一个位置停留1000ms，则sync到此位置
     */
  function syncToCounter(v) {
    var t = TQ.FrameCounter.f2t(v);
    TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
    if (previousSync === null) {
      tPool.splice(0);
    } else {
      clearTimeout(previousSync);
      previousSync = null;
    }

    while (tPool.length >= tPoolMaxLength) {
      tPool.shift();
    }

    tPool.push(t);
    var status = calculateStatus();
    t = status.tAverage;

    if (status.hasStayOver1s) {
      tPool.splice(0);
      previousSync = null;
      doSync();
    } else {
      previousSync = setTimeout(doSync, 200);
    }

    function doSync() {
      var tObj = TQ.Scene.globalT2local(t);
      TQ.FrameCounter.cmdGotoFrame(TQ.FrameCounter.t2f(tObj.t));
      TQ.DirtyFlag.requestToUpdateAll();
      previousSync = null;
    }

    function calculateStatus() {
      var sum = 0;
      var diff = 0;
      var maxDiff = 0;
      var base = tPool[tPool.length - 1];
      for (i = 0; i < tPool.length; i++) {
        sum += tPool[i];
        diff = Math.abs(tPool[i] - base);
        if (diff > maxDiff) {
          maxDiff = diff;
        }
      }
      var totalLength = TQ.Scene.getTMax();
      return {
        tAverage: sum / tPool.length,
        hasStayOver1s: ((tPool.length >= tPoolMaxLength) && (maxDiff < totalLength * 0.05))
      };
    }
  }

  function setGlobalTime(globalT) {
    var globalV = TQ.FrameCounter.t2f(globalT);
    syncToCounter(globalV);
    update(true);
  }

  function onMouseAction(sliderId, modelValue, highValue, pointerType) {
    // TQ.Log.debugInfo("Mouse Action: t10 = " + t10);
    if (TQ.State.showTrimTimeline) {
      syncToCounter(highValue);
    } else {
      syncToCounter(modelValue);
    }
    // ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
  }

  function update(forceToUpdate) {
    if (forceToUpdate || !(isUserControlling || isSagPanel)) {
      if (forceToUpdate || TQ.FrameCounter.isNew) {
        rangeSlider.minValue = TQ.FrameCounter.t2f(TQ.Scene.localT2Global(TQ.FrameCounter.t()));
      }
    }
  }

  function startSagPanel() {
    isSagPanel = true;
  }

  function stopSagPanel() {
    isSagPanel = false;
  }

  function onRangeChanged() {
    rangeSlider.minValue = TQ.FrameCounter.t2f(TQ.Scene.localT2Global(TQ.FrameCounter.t()));
    rangeSlider.options.floor = 0;
    rangeSlider.options.ceil = Math.ceil(TQ.FrameCounter.t2f(TQ.Scene.getTMax()));
    updateTicksArray();

    var editorService = angular.element(document.body).injector().get("EditorService");
    if (editorService && editorService.forceToRenderSlider) {
      editorService.forceToRenderSlider();
    }

    update(true);
  }

  function onTrimCompleted() {
    rangeSlider.maxValue = rangeSlider.minValue;
    setGlobalTime(TQ.FrameCounter.f2t(rangeSlider.minValue));
  }

  function getTObject1() {
    return TQ.Scene.globalT2local(TQ.FrameCounter.f2t(rangeSlider.minValue), true);
  }

  function getTObject2() {
    return TQ.Scene.globalT2local(TQ.FrameCounter.f2t(rangeSlider.maxValue), true);
  }

  function onTranslate(value, id, which) {
    // TQ.Log.debugInfo(value + ',' + id + ',' + which);
    var t,
      result;
    t = TQ.FrameCounter.f2t(value);
    if ((which === "model") || (which === "high")) {
      result = t.toFixed(1);
    } else {
      if (which === "floor") {
        result = t.toFixed(0) + "";
      } else if (which === "ceil") {
        result = t.toFixed(0) + "s";
      }
    }
    return result;
  }

  function updateTicksArray() {
    if (rangeSlider.options.ceil <= 1) {
      return;
    }

    var totalLength = rangeSlider.options.ceil;
    var minUnit = totalLength / 20;
    var maxUnit = totalLength / 5;
    var ideaUnit = 1;
    var ticks = [];
    unitSeries.some(function(unit) {
      ideaUnit = unit;
      return ((minUnit <= unit) && (unit <= maxUnit));
    });

    for (var v = ideaUnit; v < totalLength; v += ideaUnit) {
      ticks.push(v);
    }

    if (ticks.length < 1) {
      return;
    }

    var oldTicksArray = rangeSlider.options.ticksArray;
    if ((oldTicksArray.length < 1) ||
            (oldTicksArray.length !== ticks.length) ||
            (oldTicksArray[oldTicksArray.length - 1] !== ticks[ticks.length - 1])) {
      rangeSlider.options.ticksArray = ticks;
    }
  }
}());
