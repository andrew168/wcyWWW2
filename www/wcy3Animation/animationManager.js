/**
 * Created by Andrewz on 3/28/2017.
 * SAG: Simple Animation Generator
 */
var TQ = TQ || {};
TQ.AnimationManager = (function() {
  "use strict";
  var UNLIMIT = 99999999;
  var MIN_MOVE_TIME = 0.1;
  var DEFAULT_DELAY = 0;
  var DEFAULT_DURATION = Math.round(TQ.FrameCounter.f2t(16)); // frames

  var SagCategory = {
    IN: 1,
    IDLE: 2,
    OUT: 3
  };

  var SagType = {
    NO: "no animation",

    // translate
    RIGHT_IN: "sag right in",
    LEFT_IN: "sag left in",
    BOTTOM_IN: "sag bottom in",
    TOP_IN: "sag top in",

    RIGHT_OUT: "sag right out",
    LEFT_OUT: "sag left out",
    BOTTOM_OUT: "sag bottom out",
    TOP_OUT: "sag top out",

    SCALE_IN: "sag scale in",
    SCALE_OUT: "sag scale out",

    // idle
    FLOAT_X: "sag float x",
    ROTATE: "sag rotate",
    TWINKLE: "sag twinkle",

    // opacity change
    FADE_IN: "sag fade in",
    FADE_OUT: "sag fade out"
  };
  var sagLatest = null;

  var state = {
    delay: DEFAULT_DELAY,
    duration: DEFAULT_DURATION,
    leftIn: false,
    leftOut: false,
    rightIn: false,
    rightOut: false,
    topIn: false,
    topOut: false,
    bottomIn: false,
    bottomOut: false,
    scaleIn: false,
    scaleOut: false,
    rotate: false,
    fadeIn: false,
    fadeOut: false,
    twinkle: false
  };

  var speeds = {
    leftIn: 2.5, // 1--5,
    leftOut: 2.5,
    rightIn: 2.5,
    rightOut: 2.5,
    floatX: 2.5,
    topIn: 2.5,
    topOut: 2.5,
    bottomIn: 2.5,
    bottomOut: 2.5,
    scaleIn: 2.5,
    scaleOut: 2.5,
    rotate: 2.5,
    fadeIn: 2.5,
    fadeOut: 2.5,
    twinkle: 2.5
  };

  var animationList = [
    "rotate",
    "twinkle",
    "scaleIn",
    "scaleOut",
    "fadeIn",
    "fadeOut",

    "leftIn",
    "rightIn",
    "topIn",
    "bottomIn",

    "leftOut",
    "rightOut",
    "topOut",
    "bottomOut"
  ];

  var instance = {
    categoryId: SagCategory.IN,
    tDelay: DEFAULT_DELAY,
    tDuration: DEFAULT_DURATION, // seconds
    getCurrentTypeSag: getCurrentTypeSag,
    previewAndRemoveLatest: previewAndRemoveLatest,
    state: state,
    speeds: speeds,
    SagCategory: SagCategory,
    SagType: SagType,

    initialize: initialize,
    removeAllSags: removeAllSags,
    clear: clear,
    reset: reset,
    rotate: rotate,
    twinkle: twinkle,
    scaleIn: scaleIn,
    scaleOut: scaleOut,
    fadeIn: fadeIn,
    fadeOut: fadeOut,
    floatX: floatX,

    leftIn: leftIn,
    rightIn: rightIn,
    topIn: topIn,
    bottomIn: bottomIn,

    leftOut: leftOut,
    rightOut: rightOut,
    topOut: topOut,
    bottomOut: bottomOut
  };

  return instance;

  function initialize() {

  }

  function clear() {
    sagLatest = null;
    instance.tDelay = DEFAULT_DELAY;
    instance.tDuration = DEFAULT_DURATION;
  }

  function reset(ele) {
    if (!sagLatest || sagLatest.ele !== ele) {
      sagLatest = null;
    }
    if (!ele) {
      ele = TQ.SelectSet.getLastSolidElement();
      if (!ele) {
        state.hasSag = false;
        return false;
      }
    }

    state.hasSag = !!ele.getSags();
    var existSag = getCurrentTypeSag(ele);
    if (existSag && (instance.categoryId === existSag.categoryId)) {
      instance.tDuration = existSag.duration;
      instance.tDelay = existSag.delay;
    }

    return true;
  }

  function getCurrentTypeSag(ele) {
    var existSags = ele.getSags();
    var sag;
    var result = null;

    if (existSags) {
      existSags.some(function(channelSags) {
        if (channelSags && (sag = channelSags[instance.categoryId])) {
          if ((typeof sag.duration === "undefined") || (typeof sag.delay === "undefined")) {
            TQ.AssertExt.invalidLogic(false, "缺少duration和delay: " + sag.typeId);
            return false;
          }
          instance.tDuration = sag.duration;
          instance.tDelay = sag.delay;
          result = sag;
          return true;
        }
        return false;
      });
    }
    return result;
  }

  function rotate() {
    TQ.Log.debugInfo("rotate");
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }
    var endAngle = ele.getRotation();
    var startAngle = endAngle - 360;
    var sag = composeIdleSag(SagType.ROTATE, startAngle, endAngle);
    return recordSag(sag);
  }

  function twinkle() {
    var delay = TQ.FrameCounter.gridSnap(getTDelay().t);
    var t1 = delay;
    var duration = composeDuration(); // seconds

    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("twinkle");
    var speed = getSpeed(SagType.TWINKLE);
    var showT = 1 / speed.actualSpeed;
    var hideT = showT;
    var sag = {
      // / for editor only begin
      delay: delay,
      duration: duration,
      // / for editor only end
      categoryId: SagCategory.IDLE,
      typeId: SagType.TWINKLE,
      showT: showT,
      hideT: hideT,
      speed: speed.normSpeed, // only for UI // ToDo: 实际的speed
      t1: t1,
      t2: t1 + duration // UNLIMIT // end time
    };

    return recordSag(sag);
  }

  function recordSag(sagOrsags) {
    var ele = TQ.SelectSet.getLastSolidElement();
    var sags = (Array.isArray(sagOrsags) ? sagOrsags : [sagOrsags]);
    var sagId;

    if (ele) {
      sagId = TQ.TrackRecorder.recordSag(ele, sags);
      TQ.DirtyFlag.setElement(ele);
    }

    sagLatest = {
      sag: sags[0],
      ele: ele
    };

    return sagId;
  }

  function previewAndRemoveLatest() {
    setTimeout(function() {
      if (sagLatest && sagLatest.ele && sagLatest.sag) {
        document.addEventListener(TQ.FrameCounter.EVENT_AB_PREVIEW_STOPPED, onABPreviewStopped);
        TQ.Scene.doReplay(composePreviewOptions(sagLatest.sag));
      }
    });
  }

  function onABPreviewStopped() {
    document.removeEventListener(TQ.FrameCounter.EVENT_AB_PREVIEW_STOPPED, onABPreviewStopped);
    removePreviewedSag();
  }

  function composePreviewOptions(sag) {
    var t1; var t2;
    var currentTime = TQ.FrameCounter.t();
    switch (sag.typeId) {
      case SagType.TWINKLE:
        t1 = currentTime;
        t2 = t1 + 3 * (sag.hideT + sag.showT);
        break;
      case SagType.LEFT_IN:
      case SagType.RIGHT_IN:
      case SagType.BOTTOM_IN:
      case SagType.TOP_IN:
      case SagType.FADE_IN:
      case SagType.SCALE_IN:
      case SagType.FLOAT_X:
        t1 = sag.t1;
        t2 = sag.t2;
        break;

      case SagType.LEFT_OUT:
      case SagType.RIGHT_OUT:
      case SagType.BOTTOM_OUT:
      case SagType.TOP_OUT:
      case SagType.FADE_OUT:
      case SagType.SCALE_OUT:
        t1 = sag.t1;
        t2 = sag.t2;
        break;

      default:
        t1 = sag.t1;
        t2 = sag.t2;
        break;
    }

    var EPSILON = 0.1; /* 0.1s, 大约少1~2帧, 以免跨入下一个level */
    if (TQ.FrameCounter.maxTime() < t2) {
      TQ.FrameCounter.setTMax(t2);
    }
    t2 = Math.min(t2, TQ.FrameCounter.maxTime() - EPSILON);
    return { tStart: t1, tEnd: t2, stopAt: currentTime };
  }

  function leftIn() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("left in");
    var posInWorld = ele.getPositionInWorld();
    var startPos = -ele.getBBoxRadiusInWorld();
    var sag = composeFlyInSag(SagType.LEFT_IN, startPos, posInWorld.x);
    return recordSag(sag);
  }

  function rightIn() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("right in");
    var posInWorld = ele.getPositionInWorld();
    var startPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxRadiusInWorld();
    var sag = composeFlyInSag(SagType.RIGHT_IN, startPos, posInWorld.x);
    return recordSag(sag);
  }

  function floatX() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("float x");
    var MARGIN = 10;
    var posInWorld = ele.getPositionInWorld();
    var halfWidth = ele.getBBoxRadiusInWorld() / 2;
    var startPos = posInWorld.x;
    var fakeEndPos = startPos + TQ.Graphics.getCanvasWidth();
    var extraData = {
      xMin: 0 - halfWidth - MARGIN,
      xMax: TQ.Graphics.getCanvasWidth() + halfWidth + MARGIN
    };

    var sag = composeIdleSag(SagType.FLOAT_X, startPos, fakeEndPos, extraData);
    return recordSag(sag);
  }

  function bottomIn() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("bottom in");
    var posInWorld = ele.getPositionInWorld();
    var startPos = -ele.getBBoxRadiusInWorld();
    var sag = composeFlyInSag(SagType.BOTTOM_IN, startPos, posInWorld.y);
    return recordSag(sag);
  }

  function topIn() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("top in");
    var posInWorld = ele.getPositionInWorld();
    var startPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxRadiusInWorld();
    var sag = composeFlyInSag(SagType.TOP_IN, startPos, posInWorld.y);
    return recordSag(sag);
  }

  function leftOut() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("left out");
    var posInWorld = ele.getPositionInWorld();
    var endPos = -ele.getBBoxRadiusInWorld();
    var sag = composeFlyOutSag(SagType.LEFT_OUT, posInWorld.x, endPos);
    return recordSag(sag);
  }

  function rightOut() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("right out");
    var posInWorld = ele.getPositionInWorld();
    var endPos = TQ.Graphics.getCanvasWidth() + ele.getBBoxRadiusInWorld();
    var sag = composeFlyOutSag(SagType.RIGHT_OUT, posInWorld.x, endPos);

    return recordSag(sag);
  }

  function bottomOut() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("bottom out");
    var posInWorld = ele.getPositionInWorld();
    var endPos = -ele.getBBoxRadiusInWorld();
    var sag = composeFlyOutSag(SagType.BOTTOM_OUT, posInWorld.y, endPos);
    return recordSag(sag);
  }

  function topOut() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("top out");
    var posInWorld = ele.getPositionInWorld();
    var endPos = TQ.Graphics.getCanvasHeight() + ele.getBBoxRadiusInWorld();
    var sag = composeFlyOutSag(SagType.TOP_OUT, posInWorld.y, endPos);
    return recordSag(sag);
  }

  function scaleIn() {
    TQ.Log.debugInfo("scale in");
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    var endSx = ele.getScaleInWorld().sx;
    var startSx = 0.01 * endSx;
    var endSy = ele.getScaleInWorld().sy;
    var startSy = 0.01 * endSy;
    var sagX = composeFlyInSag(SagType.SCALE_IN, startSx, endSx);
    var sagY = composeFlyInSag(SagType.SCALE_IN, startSy, endSy);
    return recordSag([sagX, sagY]);
  }

  function scaleOut() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("scale out");
    var startSx = ele.getScaleInWorld().sx;
    var endSx = 0.01 * startSx;
    var startSy = ele.getScaleInWorld().sy;
    var endSy = 0.01 * startSy;
    var sagX = composeFlyOutSag(SagType.SCALE_OUT, startSx, endSx);
    var sagY = composeFlyOutSag(SagType.SCALE_OUT, startSy, endSy);
    return recordSag([sagX, sagY]);
  }

  function fadeIn() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("fade in");
    var endValue = ele.getAlpha();
    var startValue = 0;
    var sag = composeFlyInSag(SagType.FADE_IN, startValue, endValue);
    return recordSag(sag);
  }

  function fadeOut() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }

    TQ.Log.debugInfo("fade out");
    var endValue = 0;
    var startValue = ele.getAlpha();
    var sag = composeFlyOutSag(SagType.FADE_OUT, startValue, endValue);
    return recordSag(sag);
  }

  function getTDelay() {
    return { t: instance.tDelay };
  }

  function getTDuration() {
    return { t: instance.tDelay + instance.tDuration };
  }

  function composeDuration() {
    return TQ.FrameCounter.gridSnap((getTDuration().t - getTDelay().t));
  }

  // private functions:
  function composeIdleSag(typeId, startPos, destinationPos, extraData) {
    return composeSag(SagCategory.IDLE, typeId, startPos, destinationPos, extraData);
  }

  function composeFlyInSag(typeId, startPos, destinationPos) {
    return composeSag(SagCategory.IN, typeId, startPos, destinationPos);
  }

  function composeSag(categoryId, typeId, startPos, destinationPos, extraData) {
    var speed = getSpeed(typeId);
    var delay = TQ.FrameCounter.gridSnap(getTDelay().t); var // seconds
      duration = composeDuration(); // seconds
    var t1 = delay;
    var dampingDuration = TQ.FrameCounter.gridSnap(TQ.SpringEffect.defaultConfig.dampingDuration); // seconds
    var t2 = t1 + duration;
    var velocity;
    var dt = t2 - t1 - dampingDuration;
    if (dt < MIN_MOVE_TIME) {
      t1 = t2 - dampingDuration - MIN_MOVE_TIME;
      dt = t2 - t1 - dampingDuration;
    }

    velocity = (destinationPos - startPos) / dt;
    return {
      // / for editor only begin
      delay: delay,
      duration: duration,
      extraData: extraData,
      // / for editor only end
      destinationPos: destinationPos, // exactly stop at this point
      categoryId: categoryId,
      typeId: typeId,
      speed: speed.normSpeed, // 1-5 规范化的速度
      actualSpeed: velocity,
      value0: startPos,
      t1: t1, // start time
      t2: t2
    };
  }

  function composeFlyOutSag(typeId, startPos, destinationPos) {
    var speed = getSpeed(typeId);
    var delay = TQ.FrameCounter.gridSnap(getTDelay().t);
    var duration = composeDuration(); // seconds
    var t1 = delay;
    var dampingDuration = TQ.FrameCounter.gridSnap(TQ.SpringEffect.defaultConfig.dampingDuration); // seconds
    var t2 = t1 + duration;
    var velocity;
    var dt = t2 - t1 - dampingDuration;
    if (dt < MIN_MOVE_TIME) {
      t1 = t2 - dampingDuration - MIN_MOVE_TIME;
      dt = t2 - t1 - dampingDuration;
    }

    velocity = (destinationPos - startPos) / dt;
    return {
      // / for editor only begin
      delay: delay,
      duration: duration,
      // / for editor only end
      destinationPos: destinationPos, // exactly stop at this point
      categoryId: SagCategory.OUT,
      typeId: typeId,
      speed: speed.normSpeed,
      actualSpeed: velocity,
      value0: startPos,
      t1: t1, // start time
      t2: t2
    };
  }

  function getSpeed(typeId) {
    var norm;
    var actual;
    var speedFactor = TQ.Config.speedFactor;
    switch (typeId) {
      case SagType.FADE_IN:
        norm = speeds.fadeIn;
        actual = norm * speedFactor.fadeIn;
        break;

      case SagType.FADE_OUT:
        norm = speeds.fadeOut;
        actual = norm * speedFactor.fadeOut;
        break;

      case SagType.SCALE_IN:
        norm = speeds.scaleOut;
        actual = norm * speedFactor.scaleIn;
        break;

      case SagType.SCALE_OUT:
        norm = speeds.scaleIn;
        actual = norm * speedFactor.scaleOut;
        break;

      case SagType.ROTATE:
        norm = speeds.rotate;
        actual = norm * speedFactor.rotate;
        break;

      case SagType.LEFT_IN:
        norm = speeds.leftIn;
        actual = norm * speedFactor.flyIn;
        break;

      case SagType.LEFT_OUT:
        norm = speeds.leftOut;
        actual = norm * speedFactor.flyOut;
        break;

      case SagType.RIGHT_IN:
        norm = speeds.rightIn;
        actual = norm * speedFactor.flyIn;
        break;

      case SagType.RIGHT_OUT:
        norm = speeds.rightOut;
        actual = norm * speedFactor.flyOut;
        break;

      case SagType.TOP_IN:
        norm = speeds.topIn;
        actual = norm * speedFactor.flyIn;
        break;

      case SagType.TOP_OUT:
        norm = speeds.topOut;
        actual = norm * speedFactor.flyOut;
        break;

      case SagType.BOTTOM_IN:
        norm = speeds.bottomIn;
        actual = norm * speedFactor.flyIn;
        break;

      case SagType.BOTTOM_OUT:
        norm = speeds.bottomOut;
        actual = norm * speedFactor.flyOut;
        break;

      case SagType.TWINKLE:
        norm = speeds.twinkle;
        actual = norm * speedFactor.twinkle;
        break;

      case SagType.FLOAT_X:
        norm = speeds.floatX;
        actual = norm * speedFactor.floatX;
        break;

      default:
        TQ.AssertExt.invalidLogic(false, "unknown case");
        break;
    }

    return { normSpeed: norm, actualSpeed: actual };
  }

  function removeAllSags() {
    var ele = TQ.SelectSet.getLastSolidElement();
    if (!ele) {
      return TQ.MessageBox.prompt(TQ.Locale.getStr("please select an object first!"));
    }
    TQ.TrackRecorder.removeAllSags(ele);
    TQ.DirtyFlag.setElement(ele);
  }

  function removePreviewedSag() {
    if (sagLatest && sagLatest.ele && sagLatest.sag) {
      TQ.TrackRecorder.removeSag(sagLatest.ele, sagLatest.sag);
      TQ.DirtyFlag.setElement(sagLatest.ele);
      sagLatest = null;
    }
  }
})();
