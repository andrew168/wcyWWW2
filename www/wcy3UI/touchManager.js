var TQ = TQ || {};
(function() {
  "use strict";
  function TouchManager() {
  }

  var enableTouchScreen = true;
  var initialized = false;
  var started = false;
  var canvas = null;
  var currentOps = null;
  var trsaOps = null;
  var mCopyOps = null;

  function addHandler(gesture, handler) {
    TQ.AssertExt.invalidLogic(!!canvas, "canvas is not initialized!");
    ionic.EventController.onGesture(gesture, handler, canvas);
  }

  function detachHandler(gesture, handler) {
    TQ.AssertExt.invalidLogic(!!canvas, "canvas is not initialized!");
    ionic.EventController.off(gesture, handler, canvas);
  }

  function initialize() {
    trsaOps = [
      ["touch", TQ.Trsa3.onTouchStart],
      ["mousedown", TQ.Trsa3.onMouseDown],

      ["touchend", TQ.Trsa3.onTouchEnd],
      ["mouseup", TQ.Trsa3.onMouseUp],

      ["release", TQ.Trsa3.onRelease],
      ["rotate", TQ.Trsa3.onPinchAndRotate],
      ["pinch", TQ.Trsa3.onPinchAndRotate],
      // 'scale': not work
      //
      // ['pinchin', onPinch],
      // ['pinchout', onPinch],
      ["drag", TQ.Trsa3.onDrag],
      ["touchmove", notHandled]
      // 其余事件： 'swipeup'.
    ];

    mCopyOps = [
      ["touch", TQ.Trsa3.mCopy]
    ];

    canvas = TQ.Graphics.getCanvas();
    if (!enableTouchScreen) {
      return;
    }
    disableBodyScrollInIOS();
    disableBrowserZooming();
    initialized = true;
    start();
  }

  function start() {
    if (started) {
      TQ.AssertExt.invalidLogic(true, "重复启动touchManager！");
      TQ.Trsa3.reset();
      updateOps({ isMCopying: false });
      return;
    }
    started = true;
    if (currentOps) {
      detachOps(currentOps);
    }
    currentOps = trsaOps;
    attachOps(currentOps);
    TQ.Assert.isTrue(!!TQ.SceneEditor.stage, "Stage 没有初始化！");
    TQ.SceneEditor.stage.addEventListener("touch", TQ.Trsa3.onTouchStage);
  }

  function updateOps(state) {
    if (currentOps) {
      detachOps(currentOps);
      currentOps = null;
    }
    if (state.isMCopying) {
      attachOps(mCopyOps);
    } else {
      attachOps(trsaOps);
    }
  }

  function attachOps(ops, newCanvas) {
    if (currentOps) {
      detachOps(currentOps);
      currentOps = null;
    }
    if (newCanvas) {
      canvas = newCanvas;
    }
    if (ops) {
      ops.forEach(function(item) {
        addHandler(item[0], item[1]);
      });
      currentOps = ops;
    }
  }

  function detachOps(ops) {
    if (ops) {
      ops.forEach(function(item) {
        detachHandler(item[0], item[1]);
      });
    }
  }

  var savedState;
  function save() {
    savedState = { ops: currentOps, canvas: canvas };
  }

  function restore() {
    canvas = savedState.canvas;
    if (currentOps) {
      detachOps(currentOps);
    }
    attachOps(savedState.ops);
    savedState = null;
  }

  function stop() {
    if (!started) {
      TQ.AssertExt.invalidLogic(true, "重复关闭touchManager！");
      return;
    }

    started = false;
    if (currentOps) {
      detachOps(currentOps);
    }

    TQ.Assert.isTrue(!!TQ.SceneEditor.stage, "Stage 没有初始化！");
    TQ.SceneEditor.stage.removeEventListener("touch", TQ.Trsa3.onTouchStage);
  }

  function isFirstTouch(e) {
    return (!started && !isMultiTouching);
  }

  function disableBrowserZooming() {
    document.addEventListener("mousewheel", function(e) {
      // TQ.Log.debugInfo(e.type, e.deltaX, e.deltaY, e.wheelDeltaX, e.wheelDeltaY);
      e.preventDefault();
    });
  }

  function disableBodyScrollInIOS() {
    // IOS's page body are scrolling when user touch moving
    document.ontouchstart = disableScroll;
    document.ontouchmove = disableScroll;

    document.addEventListener("touchmove", disableScroll, true);
    document.addEventListener("touchstart", disableScroll, true);

    function disableScroll(e) {
      // TQ.Log.debugInfo(e.type, e.target.tagName, e.srcElement.tagName, e.currentTarget ? e.currentTarget.tagName: 'None',
      //     e.target.nodeName, e.srcElement.nodeName, e.currentTarget ? e.currentTarget.nodeName: 'None');
      var whiteList = ["BUTTON", "INPUT", "TEXTAREA"];
      var tag = "";
      if (e.target && e.target.nodeName) {
        tag = e.target.nodeName.toUpperCase();
      }

      if (whiteList.indexOf(tag) < 0) {
        e.preventDefault();
      }
    }
  }

  function notHandled(e) {
    TQ.Log.debugInfo("event not handled: " + e.type + ", " + (e.touches ? e.touches.length : 0));
  }

  function hasStarted() {
    return started;
  }

  function hasInitialized() {
    return initialized;
  }

  TouchManager.save = save;
  TouchManager.restore = restore;
  TouchManager.addHandler = addHandler;
  TouchManager.attachHandler = addHandler;
  TouchManager.detachHandler = detachHandler;
  TouchManager.initialize = initialize;
  TouchManager.hasStarted = hasStarted;
  TouchManager.hasInitialized = hasInitialized;
  TouchManager.start = start;
  TouchManager.stop = stop;
  TouchManager.attachOps = attachOps;
  TouchManager.updateOps = updateOps;
  TQ.TouchManager = TouchManager;
})();
