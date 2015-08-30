/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Input map , 映射输入的键盘和鼠标信息， 到一个内部数据，
 * 在每一个cycle， 清理一次
 * 静态变量
 */

TQ = TQ || {};

(function () {
    var InputMap = {};
    InputMap.isPresseds = [];
    InputMap.lastPresseds = [];
    InputMap.DELETE_KEY = 46;
    InputMap.ERASE_KEY = InputMap.R = 82;
    InputMap.SHOW_ALL_HIDEN_OBJECT_KEY = InputMap.A = 65;
    InputMap.CLONE_Key = InputMap.C = 67;
    InputMap.TEXT_EDIT_KEY = InputMap.E = 69;
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

    // 支持组合键
    InputMap.LEFT_SHIFT_FLAG = 0x1000;
    InputMap.LEFT_CTRL_FLAG = 0x2000;
    InputMap.LEFT_ALT_FLAG = 0x4000;

    InputMap.isMouseDown=false;
    InputMap.toolbarState = InputMap.NO_TOOLBAR_ACTION = null;
    InputMap.setToolbarState = function(buttonIDString) {
        assertNotNull(TQ.Dictionary.FoundNull, buttonIDString);
        InputMap.toolbarState = buttonIDString;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TOOLBAR);
    };
    
    InputMap.IsOperating = function() {
        return (InputMap.isMouseDown && (InputMap.toolbarState == null));
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

    $(document).mousemove(function(e) {
        TQ.Log.info("which:" + e.which + "mousedown:" + InputMap.isMouseDown + " type:" + e.type + "(x,y):" + e.screenX +"," + e.screenY);
        InputMap.mouseMoving = true;
        InputMap.updateSpecialKey(e);
    });

    $(document).mouseup(function(e) {
        InputMap._updateMouse(e, false);
        InputMap.updateSpecialKey(e);
    });

    $(document).mousedown(function(e) {
        InputMap._updateMouse(e, true);
        InputMap.updateSpecialKey(e);
    });

    $(document).keydown(function (e) {
        if ((!TQ.FileDialog) || (!TQ.TextEditor)) {
        } else {
            if ((TQ.FileDialog.visible || TQ.TextEditor.visible)) return;
        }
        InputMap.updateSpecialKey(e);
        var action = InputMap.maps[InputMap.getCombination(e)];
        if ( (action != null) && (!InputMap.isPresseds[e.which])) { // 有action, 而且首次按下
            // 一对down和up,复制一份, 持续按住不放, 只算一次.
            e.stopPropagation();
            e.preventDefault();
            TQ.TaskMgr.addTask(action, []);
        }

        InputMap._updateKey(e, true);
    });

    $(document).keyup(function (e) {
        if ((!TQ.FileDialog) || (!TQ.TextEditor)) {
        } else {
            if (TQ.FileDialog.visible || TQ.TextEditor.visible  ) return;
        }
        InputMap.updateSpecialKey(e);
        InputMap._updateKey(e, false);
    });

    InputMap._updateKey = function (e, isDown) {
        InputMap.isPresseds[e.which] = isDown;
        // displayInfo2(e.which);
    };

    InputMap._updateMouse = function (e, isDown) {
        InputMap.isMouseDown = isDown;
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
    };

    TQ.InputMap = InputMap;
}());