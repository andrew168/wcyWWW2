/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
  function InputCtrl () {

  }
  InputCtrl._stage = null;
  InputCtrl.MODE_ROTATE = 1;
  InputCtrl.MODE_SCALE = 2;
  InputCtrl.mode = InputCtrl.MODE_ROTATE;
  InputCtrl.inSubobjectMode = false;
  InputCtrl.leaveTraceOn = false; // 不绘制运动轨迹
  InputCtrl.initialize = function(stage) {
    InputCtrl._stage = stage;
    TQ.InputMap.registerAction(TQ.InputMap.C,  function () {
      currScene.currentLevel.cloneElement(TQ.SelectSet.members);
    });
    TQ.InputMap.registerAction(TQ.InputMap.HIDE_KEY |TQ.InputMap.LEFT_ALT_FLAG,  function() {
      TQ.SelectSet.show(false);
    });
    TQ.InputMap.registerAction(TQ.InputMap.HIDE_KEY,  function() {
      TQ.SelectSet.show(false);
    });
    TQ.InputMap.registerAction(TQ.InputMap.SHOW_KEY,  function() {
      TQ.SelectSet.show(true);
    });
    TQ.InputMap.registerAction(TQ.InputMap.SHOW_KEY | TQ.InputMap.LEFT_ALT_FLAG,  function() {
      TQ.SelectSet.show(true);
    });
    TQ.InputMap.registerAction(TQ.InputMap.SHOW_ALL_HIDEN_OBJECT_KEY,  function() {
      TQ.Element.showHidenObjectFlag = !TQ.Element.showHidenObjectFlag;
    });

    TQ.InputMap.registerAction(TQ.InputMap.PLAY_STOP_KEY,  function() {
      $("#play").click();
    });
  };

  // 连续Z向移动， 距离越远， 移动的越多。
  // 与鼠标运动快慢， 一致。
  InputCtrl._accumulateStep = 0;
  InputCtrl._lastItemID = -1;

  $(document).mouseup(function () {
    InputCtrl._accumulateStep = 0;
  });

  InputCtrl.isSameItem = function(target) {
    return (InputCtrl._lastItemID == target.id);
  };

  InputCtrl.getDelta = function (mode, element, target, offset, ev) {
    // offset 是 hit点与图像定位点之间的偏移， 在MouseDown的时候由Element的onPress计算的
    var deltaY = TQ.Utility.deltaYinWorld(target, offset, ev);
    var deltaX = (ev.stageX + offset.x)  - target.x;
    var delta = deltaY + deltaX;
    var sensitivity = (mode == InputCtrl.MODE_ROTATE) ?
      TQ.Config.RotateSensitivity : TQ.Config.MouseSensitivity;
    InputCtrl.step = Math.floor(delta / sensitivity);
    var deltaStep = (InputCtrl.isSameItem(target))? (InputCtrl.step - InputCtrl._accumulateStep) : InputCtrl.step;
    TQ.Log.out("ID:" + InputCtrl._lastItemID + "sum" + InputCtrl._accumulateStep
            +", step: " + InputCtrl.step + ", delta: " + deltaStep);
    if (null != target) {
      InputCtrl._lastItemID = target.id;
    }
    return deltaStep;
  };

  InputCtrl.scale = function (element, target, offset, ev) {
    var deltaStep = InputCtrl.getDelta(InputCtrl.MODE_SCALE, element, target, offset, ev);
    var coefficient = 1;
    if (deltaStep == 0) {
      return ;
    } else if (deltaStep > 0) {
      coefficient = 1.1 * deltaStep;
    } else if (deltaStep < 0) {
      coefficient = 0.9 * (-deltaStep);
    }
    coefficient = TQ.MathExt.range(coefficient, 0.8, 1.2 );
    if (null != target) {
      assertTrue(TQ.Dictionary.INVALID_PARAMETER, (coefficient > 0)); //比例变换系数应该是正值
      var MIN_SCALE = 0.1, MAX_SCALE = 2;
      coefficient = InputCtrl.limitScale(element.jsonObj.sx, MIN_SCALE, MAX_SCALE, coefficient);
      coefficient = InputCtrl.limitScale(element.jsonObj.sy, MIN_SCALE, MAX_SCALE, coefficient);
      TQ.CommandMgr.directDo(new TQ.ScaleCommand(element,
        {sx: element.jsonObj.sx * coefficient,
          sy: element.jsonObj.sy * coefficient}));
      InputCtrl._accumulateStep = InputCtrl.step;
    }

    // displayInfo2("deltaStep: " + deltaStep + " Scale coefficient:" + coefficient);
  };

  InputCtrl.limitScale = function(currentScale, minScale, maxScale, coefficient) {
    var newScale =  currentScale * coefficient;
    if (newScale > maxScale) {
      coefficient = maxScale / currentScale;
    } else if (newScale < minScale) {
      coefficient = minScale / currentScale;
    }
    return coefficient;
  };
  InputCtrl.setSubobjectMode = function() {
    InputCtrl.inSubobjectMode = true;
    var btns = $("#subElementMode");
    btns[0].checked = true;
    btns.button("refresh");
  };
  TQ.InputCtrl = InputCtrl;
}) ();
