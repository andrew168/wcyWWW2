/**
 * 图强动漫引擎, 专利产品, 让生活动漫起来.
 * 强大的创意动力源泉
 * 微创意拍摄和播放专用的Timer,(实际上在内部就是 Framer Counter, 对外,为了用户方便, 按照当前FPS转为时间),
 * FrameCounter记录实际拍摄的时刻(帧编号), 而不是日历时长. 时间轴的0点在片头, 终点在片尾..
 * 例如: 假设每秒20帧: FPS = 20; i.e. 一帧的对应1/20 秒, === 0.05秒.
 * 片子的第一个画面(帧): FrameCounter =0, 第二个画面(帧): FrameCounter = 1, 或0.05秒, 依次类推,
 * 第100帧, FrameCounter = 100, 或5秒.
 * 在一个Scene内如此,
 * 在一个Level内部,也如此. Level 1里面有Frame 0, Level 2 里面也有. 各是各的.
 */

window.TQ = window.TQ || {};

(function() {
  function FrameCounter() {
    assertNotHere(TQ.Dictionary.INVALID_LOGIC); // Singleton, 禁止调用
  }

  var _isRecording = false;
  var NORMAL_SPEED = 1;
  var LOW_SPEED = 0.5;
  var STATE_GO = 1; // 调在使用之前, 常量在使用之前必须先定义(包括初始化,例如下面给_state赋值)
  var STATE_STOP = 0;
  var STATE_PAUSE = 2;
  var STATE_RESUME = 3;
  var baseStep = NORMAL_SPEED;
  var step = baseStep;
  var abOptions = null;
  var lastTimestamp;

  FrameCounter.EVENT_AB_PREVIEW_STOPPED = "ab preview stopped";
  FrameCounter.isNew = true; // 新的时刻, 需要更新数据
  FrameCounter.v = 0;
  FrameCounter.defaultFPS = 20;
  var vMax = 3 * FrameCounter.defaultFPS; // 空白带子, 长度为 30秒 * 每秒20帧,  600
  FrameCounter.cmdGotoFrame = cmdGotoFrame;

  var _FPS = FrameCounter.defaultFPS; // 下划线是内部变量, 禁止外面引用
  var state = STATE_STOP;
  var requestState = null;
  var autoRewind = false;
  var currLevel = null;

  FrameCounter.addHook = addHook;
  FrameCounter.toggleSpeed = toggleSpeed;

  var _hooks = [];
  function addHook(hook) {
    _hooks.push(hook);
  }

  /*  FrameCounter 是一个控制器, 不是存储器, 所以它不保留任何值,
     * 也不复制这些值, 以避免数据的不一致.
     * 而Level是存储器, (也可能带有执行器的功能, 复合型的), 保有 FPS, fileLength等值.
     * */
  FrameCounter.initialize = function(t0, FPS, level) {
    // ToDo: 要 最大长度吗? 要, 而且是当前level的实实在在的max
    assertNotNull(TQ.Dictionary.FoundNull, t0); // 必须强制调用者遵从, 以简化程序,  因为此部分与用户的任意性无关
    assertNotNull(TQ.Dictionary.FoundNull, FPS);
    assertNotNull(TQ.Dictionary.FoundNull, level);
    FrameCounter.v = t0 * FPS;
    _FPS = FPS;
    currLevel = level;
    vMax = t2f(level.getTime());
    TQ.InputMap.registerAction(TQ.InputMap.LAST_FRAME_KEY,
      function() {
        level.setTime(FrameCounter.t());
        vMax = FrameCounter.v;
      }
    );
  };

  FrameCounter.isAtBeginning = function() {
    return FrameCounter.v < 1;
  };

  FrameCounter.t = function() {
    return FrameCounter.v / _FPS;
  };

  FrameCounter.tGrid = function() {
    return FrameCounter.gridSnap(FrameCounter.t());
  };

  FrameCounter.gridSnap = function(t) {
    return Math.round(t * 100) / 100;
  };

  FrameCounter.f2t = function(frameNumber) {
    return (frameNumber / _FPS);
  };

  FrameCounter.f2tGrid = function(frameNumber) {
    return FrameCounter.gridSnap(FrameCounter.f2t());
  };

  FrameCounter.t2f = t2f;
  function t2f(t) {
    return t * _FPS;
  }

  FrameCounter.forward = function() {
    step = 2 * baseStep;
    state = STATE_GO;
  };

  FrameCounter.backward = function() {
    TQ.AssertExt.depreciated("backward: 过时了");
    step = -2 * baseStep;
    state = STATE_GO;
  };

  FrameCounter.gotoBeginning = function() {
    cmdGotoFrame(0);
  };

  FrameCounter.gotoEnd = function() {
    cmdGotoFrame(vMax);
  };

  FrameCounter.gotoFrame = function(v) {
    FrameCounter.v = v;
    TQ.FrameCounter.isNew = true;
  };

  FrameCounter.setABOptions = function(options) {
    abOptions = options;
  };

  FrameCounter.goto = function(t) {
    FrameCounter.gotoFrame(t * _FPS);
  };

  // 前进一个delta. (delta是负值, 即为倒带)
  FrameCounter.update = function() {
    FrameCounter.updateState();
    var newTimestamp = Date.now();
    var vDelta = t2f((newTimestamp - lastTimestamp) / 1000);
    lastTimestamp = newTimestamp;

    if (state === STATE_GO) {
      if (FrameCounter.hasUIData) {
        FrameCounter.hasUIData = false;
        return;
      }

      FrameCounter.v = FrameCounter.v + vDelta;

      if (abOptions) {
        if (FrameCounter.t() > abOptions.tEnd) {
          FrameCounter.stop();
        }
      } else if (FrameCounter.v > vMax) {
        if (_isRecording) {
          vMax += step;
        } else {
          // FrameCounter.v = vMax;
        }
      }

      if (FrameCounter.v < 0) {
        if (autoRewind) {
          FrameCounter.v = vMax;
        } else {
          FrameCounter.v = 0;
        }
      }

      TQ.FrameCounter.isNew = true;
      assertTrue(TQ.Dictionary.CounterValidation, FrameCounter.v >= 0);
    }

    if (_hooks.length > 0) {
      _hooks.forEach(updateHook);
    }
  };

  function updateHook(hook) {
    hook();
  }

  FrameCounter.updateState = function() {
    switch (requestState) {
      case null: break;
      case STATE_GO : {
        step = baseStep;
        state = STATE_GO;
        break;
      }
      case STATE_STOP: {
        state = STATE_STOP;
        break;
      }
      case STATE_PAUSE:
        state = STATE_PAUSE;
        break;

      case STATE_RESUME:
        state = STATE_GO;
        break;
    }
    requestState = null;
  };

  // state: 不能由外部改变, 必须是update自己改变, 以保持其唯一性
  FrameCounter.play = function() {
    lastTimestamp = Date.now();
    requestState = STATE_GO;
    // ToDo: 暂时关闭GIF文件的生成
    /* if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL])
        {
            canvas.width = 180;
            canvas.height = 180;
            $("#testCanvas").hide();
            TQ.GifManager.begin();
        }
        */
  };

  FrameCounter.stop = function() {
    requestState = STATE_STOP;
    if (abOptions) {
      var tStop = abOptions.stopAt;
      abOptions = null;
      setTimeout(function() {
        FrameCounter.goto(tStop);
        TQ.DirtyFlag.requestToUpdateAll();
        TQ.Base.Utility.triggerEvent(document, FrameCounter.EVENT_AB_PREVIEW_STOPPED);
      }, 100);
    } else {
      cmdGotoFrame(FrameCounter.v);
    }

    if (TQ.GifManager.isOpen) {
      TQ.GifManager.end();
      TQ.Graphics.setCanvas();
      $("#testCanvas").show();
    }
  };

  FrameCounter.pause = function() {
    if ((requestState === STATE_GO) ||
            (state === STATE_GO)) {
      requestState = STATE_PAUSE;
    }
  };

  FrameCounter.resume = function() {
    if ((requestState === STATE_PAUSE) ||
            (state === STATE_PAUSE)) {
      requestState = STATE_RESUME;
    }
  };

  FrameCounter.autoRewind = function() {
    autoRewind = !autoRewind;
  };

  FrameCounter.startRecord = function() {
    _isRecording = true;
  };

  FrameCounter.stopRecord = function() {
    _isRecording = false;
  };

  FrameCounter.isInverse = function() { return step < 0; };
  FrameCounter.isPlaying = function() { return ((state === STATE_GO) || (state === STATE_PAUSE)); };
  FrameCounter.isPaused = function() { return (FrameCounter.isPlaying() && (state === STATE_PAUSE)); };
  FrameCounter.isRecording = function() { return _isRecording; };
  FrameCounter.isRequestedToStop = function() { return (requestState === STATE_STOP); };
  FrameCounter.finished = function() { return (!_isRecording && (FrameCounter.v >= vMax)); };
  FrameCounter.abPreviewFinished = function() {
    return (abOptions && (FrameCounter.t() > abOptions.tEnd));
  };
  FrameCounter.isAutoRewind = function() { return autoRewind; };

  FrameCounter.maxTime = function() {
    return vMax / _FPS;
  };

  FrameCounter.reset = function() {
    requestState = null;
    vMax = 3 * FrameCounter.defaultFPS; // 空白带子, 长度为 30秒 * 每秒20帧,  600
    FrameCounter.v = 0;
    state = STATE_STOP;
  };

  FrameCounter.setTMax = function(tMax) {
    vMax = t2f(tMax);
    if (FrameCounter.v > vMax) {
      FrameCounter.v = vMax;
    }
  };

  FrameCounter.trim = function(tObj1, tObj2) {
    if (tObj1.levelId === tObj2.levelId) {
      vMax -= t2f(tObj2.t - tObj1.t);
    } else { // in tObj2.levelId,
      vMax -= t2f(tObj2.t);
    }
  };

  var stateReceiver = null;
  function toggleSpeed(flag, receiver) {
    if (flag && (flag === TQ.Const.TOGGLE_RESET)) {
      TQ.AssertExt.expectObject(!receiver);
      stateReceiver = receiver;
      stateReceiver.isLowSpeed = false;
      normalSpeed();
    } else {
      TQ.AssertExt.expectObject(!stateReceiver);
      stateReceiver.isLowSpeed = !stateReceiver.isLowSpeed;
      if (stateReceiver.isLowSpeed) {
        lowSpeed();
      } else {
        normalSpeed();
      }
    }
  }

  function lowSpeed() {
    if (baseStep === NORMAL_SPEED) {
      step = step * LOW_SPEED / NORMAL_SPEED;
    }
    baseStep = LOW_SPEED;
  }

  function normalSpeed() {
    if (baseStep === LOW_SPEED) {
      step = step * NORMAL_SPEED / LOW_SPEED;
    }
    baseStep = NORMAL_SPEED;
  }

  function cmdGotoFrame(v) {
    TQ.CommandMgr.directDo(new TQ.SetTimeCommand(v));
  }

  TQ.FrameCounter = FrameCounter;
}());
