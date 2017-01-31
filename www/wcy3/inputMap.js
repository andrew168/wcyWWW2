/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Input map , 映射输入的键盘和鼠标信息， 到一个内部数据，
 * 在每一个cycle， 清理一次
 * 静态变量
 */

TQ = TQ || {};
var TOUCH_MOVING_FLAG = 999;

(function () {
    var InputMap = {};
    InputMap.playOnlyFlag = true;
    InputMap.isPresseds = [];
    InputMap.lastPresseds = [];
    InputMap.DELETE_KEY = 46;
    InputMap.ERASE_KEY = InputMap.R = 82;
    InputMap.SHOW_ALL_HIDEN_OBJECT_KEY = InputMap.A = 65;
    InputMap.CLONE_Key = InputMap.C = 67;
    InputMap.TEXT_EDIT_KEY = InputMap.E = 69;
    InputMap.GRID_ON_OFF_KEY = InputMap.G = 71;
    InputMap.HIDE_KEY = InputMap.H = 72;
    InputMap.SHOW_KEY = InputMap.S = 83;
    InputMap.ROTATE_KEY = InputMap.Z = 90;
    InputMap.ROTATE_KEY = InputMap.Y = 89;
    InputMap.PLAY_STOP_KEY = InputMap.SPACE = 32;
    InputMap.LAST_FRAME_KEY = InputMap.F7 = 118;
    InputMap.LEFT_SHIFT=16;
    InputMap.LEFT_CTRL=17;
    InputMap.LEFT_ALT=18;
    InputMap.EMPTY_SELECTOR = 27; //ESCAPE;
    InputMap.D0 = 48;
    InputMap.D1 = 49;
    InputMap.D2 = 50;
    InputMap.D3 = 51;
    InputMap.D4 = 52;
    InputMap.D5 = 53;
    InputMap.D6 = 54;
    InputMap.D7 = 55;
    InputMap.D8 = 56;
    InputMap.D9 = 57;
    InputMap.LEFT_ARROW = 39;
    InputMap.RIGHT_ARROW = 37;

    // 支持组合键
    InputMap.LEFT_SHIFT_FLAG = 0x1000;
    InputMap.LEFT_CTRL_FLAG = 0x2000;
    InputMap.LEFT_ALT_FLAG = 0x4000;

    InputMap.isMouseDown=false;
    InputMap.isTouchMoving = false;
    InputMap.toolbarState = InputMap.NO_TOOLBAR_ACTION = null;

    // 私有变量， 用下划线开头， 放在公共变量的后面，必须在所有函数的前面，
    InputMap._on = true;  //  true, 由它处理键盘； false: 不.

    InputMap.setToolbarState = function(buttonIDString) {
        assertNotNull(TQ.Dictionary.FoundNull, buttonIDString);
        InputMap.toolbarState = buttonIDString;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TOOLBAR);
    };

    InputMap.IsOperating = function() {
        return ((InputMap.isTouchMoving || InputMap.isMouseDown) &&
                (InputMap.toolbarState === null));
    };

    InputMap.maps = [];
    InputMap.registerAction = function (key, action){
        // key可以是组合键, 例如:
        // key = InputMap.DELETE_KEY | InputMap.LEFT_SHIFT_FLAG;
		InputMap.maps[key] = action;
    };

    InputMap.restart= function () {
        InputMap.mouseMoving = false;
        InputMap.toolbarState = InputMap.NO_TOOLBAR_ACTION;
        InputMap.lastPresseds = InputMap.isPresseds;
        InputMap.isPresseds = [];
        // 复制长效键:
        InputMap.isPresseds[InputMap.Z] = InputMap.lastPresseds[InputMap.Z]; // 旋转
        InputMap.isPresseds[InputMap.LEFT_SHIFT] = InputMap.lastPresseds[InputMap.LEFT_SHIFT];
        InputMap.isPresseds[InputMap.LEFT_CTRL] = InputMap.lastPresseds[InputMap.LEFT_CTRL];
        InputMap.isPresseds[InputMap.LEFT_ALT] = InputMap.lastPresseds[InputMap.LEFT_ALT];
    };

    InputMap.initialize = function(playOnlyFlag) {
      if (!!playOnlyFlag) {
        return;
      }

      $(document).bind('mousemove touchmove touchcancel', function (e) {
        // TQ.Log.info("which:" + e.which + "mousedown:" + InputMap.isMouseDown + " type:" + e.type + "(x,y):" + e.screenX + "," + e.screenY);
        InputMap.updateSpecialKey(e);
      });

      $(document).bind('mouseup touchend', function (e) {
        InputMap.updateSpecialKey(e);
      });

      $(document).bind('mousedown touchstart', function (e) {
        InputMap.updateSpecialKey(e);
      });

      $(document).keydown(function (e) {
        if (!InputMap._on) {
          return;
        }
        InputMap.updateSpecialKey(e);
        var action = InputMap.maps[InputMap.getCombination(e)];
        if ((action != null) && (!InputMap.isPresseds[e.which])) { // 有action, 而且首次按下
          // 一对down和up,复制一份, 持续按住不放, 只算一次.
          e.stopPropagation();
          e.preventDefault();
          TQ.TaskMgr.addTask(action, []);
        }

        InputMap._updateKey(e, true);
      });

      $(document).keyup(function (e) {
        if (!InputMap._on) {
          return;
        }
        InputMap.updateSpecialKey(e);
        InputMap._updateKey(e, false);
      });
    };

    InputMap._updateKey = function (e, isDown) {
        InputMap.isPresseds[e.which] = isDown;
        // displayInfo2(e.which);
    };

    InputMap.getCombination = function (e) {
        var result = e.which;
        if (InputMap.isPresseds[InputMap.LEFT_CTRL]) result |= InputMap.LEFT_CTRL_FLAG;
        if (InputMap.isPresseds[InputMap.LEFT_SHIFT]) result |= InputMap.LEFT_SHIFT_FLAG;
        if (InputMap.isPresseds[InputMap.LEFT_ALT]) result |= InputMap.LEFT_ALT_FLAG;
        return result;
    };

    InputMap.updateSpecialKey = function(e){
        // 在复合键(例如：alt + Delete 放开的时候, 只有一次keyUp事件, 所有alt键放开的信息丢失了, 所以,需要下面的更新方法)
        InputMap.isPresseds[InputMap.LEFT_CTRL] = e.ctrlKey;
        InputMap.isPresseds[InputMap.LEFT_SHIFT] = e.shiftKey;
        InputMap.isPresseds[InputMap.LEFT_ALT] = e.altKey;

        //  mouse click只激发touchStart，不触发touchEnd，
        // 所以， 状态的控制， 必须
        // 让touchEnd和mouseUp使用相同的处理，（同理：
        // touchStart和mouseDown也使用相同的处理
        switch (e.type) {
            case 'mousedown':
            case 'touchstart':
                InputMap.isMouseDown = true;
                break;

            case 'mouseup':
            case 'touchend':
            case 'touchcancel':
                InputMap.isMouseDown = false;
                break;
        }

        if (InputMap.isMouseDown) {
            switch (e.type) {
                case 'mousemove':
                case 'touchmove':
                    InputMap.mouseMoving = true;
                    break;
                case 'touchcancel':
                    InputMap.mouseMoving = false;
                    break;
            }
        } else {
            InputMap.mouseMoving = false;
        }

        InputMap.updateTouch(e);
    };

    InputMap.updateTouch = function(e) {
        switch (e.type) {
            case 'touchmove': InputMap.isTouchMoving = true; break;
            case 'touchstart': InputMap.isTouchMoving = true; break;
            case 'touchend' : break;
            default : InputMap.isTouchMoving = false;
        }
    };

    InputMap.turnOn = function() {
        TQ.InputMap._on = true;
    };

    InputMap.turnOff = function() {
        TQ.InputMap._on = false;
    };

  TQ.InputMap = InputMap;
}());
