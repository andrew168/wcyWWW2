/**
 * Created by Andrewz on 3/13/2017.
 */
/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午12:42
 */
var TQ = TQ || {};

(function () {
    // 状态参数，及其getter、setter都定义在此
    // State中的参数都是实时生成的， 可以覆盖，下次再调入的时候， 可以恢复。
    // 区别: Config中的参数都是预先定义的， 不可以覆盖的
    function State() {
    }

    Object.defineProperty(State, 'isPlayOnly', {
        get: function () {
            return TQ.WCY.isPlayOnly;
        },
        set: function (x) {
            TQ.WCY.isPlayOnly = x;
        }
    });

    State.innerWidth = 0;
    State.innerHeight = 0;
    State.bottomBarHeight = 0;
    State.bottomFloatToolHeight = 0;
    State.topBarHeight = 0;
    State.buttonHeight = 0;

    var _levelThumbAtBottom;
    Object.defineProperty(State, 'levelThumbAtBottom', {
      get: function () {
        if (typeof _levelThumbAtBottom !== 'undefined') {
          return _levelThumbAtBottom;
        } else if (typeof TQUtility !== 'undefined' && typeof TQUtility.isPC === 'function') {
          _levelThumbAtBottom = !TQUtility.isPC();
          return _levelThumbAtBottom;
        }
        return true;
      }
    });

    State.determineWorkingRegion = determineWorkingRegion;
    State.updateDeviceInfo = updateDeviceInfo;
    State.allowPageTransition = true;
    State.fiexdRootJoint = true; // 关节的根，总是固定的， 不可动的（动态可修改，所以用State，不用Config）
    State.requestToRecordAudio = false;
    Object.defineProperty(State, 'isAddMode', {
        get: function() {
          return (State.editorMode === TQ.SceneEditor.MODE.EDIT);
        }
    });

    Object.defineProperty(State, 'isRecordingAudioMode', {
      get: function () {
        return (State.requestToRecordAudio &&
          (State.editorMode === TQ.SceneEditor.MODE.EDIT));
      }
    });

    var deviceInfoInitialized = false;
    function determineWorkingRegion() {
        if (!deviceInfoInitialized) {
            updateDeviceInfo();
        }

        // top bar的min-height是 11vmin
        var topBarEle = document.getElementById('id_top_bar'),
            bottomBarEle = document.getElementsByClassName('footer')[0],
            accompanyToolBarEle = document.getElementsByClassName('cao_icon')[0],
            buttonEle;
        if (!topBarEle && !bottomBarEle) {
            buttonEle = document.getElementById('id-delete');
            if (!buttonEle) {
                buttonEle = document.getElementsByClassName("button")[0];
            }
            if (buttonEle) {
                State.buttonHeight = TQ.Utility.getCssSize(window.getComputedStyle(buttonEle).height);
            }
            if (isNaN(State.buttonHeight) || !buttonEle) {
                State.buttonHeight = Math.ceil(0.11 * Math.min(State.innerHeight, State.innerWidth));
            }
        } else {
            if (State.isPlayOnly || State.isPlaying || State.isPreviewMode) {

            } else {
                State.buttonHeight = TQ.Utility.getCssSize(window.getComputedStyle(topBarEle).height);
                if (State.levelThumbAtBottom && window.getComputedStyle(bottomBarEle).display !== 'none') {
                  State.bottomBarHeight = TQ.Utility.getCssSize(window.getComputedStyle(bottomBarEle).height);
                } else {
                  State.bottomBarHeight = 0;
                }

                if (accompanyToolBarEle) {
                    State.bottomFloatToolHeight = TQ.Utility.getCssSize(window.getComputedStyle(accompanyToolBarEle).height);
                }
            }
        }

        var topBarHeight = (State.isPlayOnly || State.isPlaying || State.isPreviewMode) ? 0 : State.buttonHeight,
            bottomBarHeight = (State.isPlayOnly || State.isPlaying || State.isPreviewMode || State.isRecordingAudioMode) ? 0 : State.bottomBarHeight,
            h = State.innerHeight,
            w = State.innerWidth,
            designated;

        if (!TQUtility.isPC()) {
          h = h - (topBarHeight + bottomBarHeight);
        }

        designated = !currScene ? TQ.Scene.getDesignatedRegionDefault() : currScene.getDesignatedRegion();
        scaleMin = Math.min(w / designated.w, h / designated.h);
        TQ.Config.workingRegionWidth = scaleMin * designated.w;
        TQ.Config.workingRegionHeight = scaleMin * designated.h;
        if (TQ.Config.workingRegionHeight > TQ.Config.workingRegionWidth) {
            TQ.Config.orientation = TQ.Config.ORIENTATION_PORTRAIT;
        } else {
            TQ.Config.orientation = TQ.Config.ORIENTATION_LANDSCAPE;
        }

        if (!TQUtility.isPC()) {
          TQ.Config.workingRegionX0 = Math.round((State.innerWidth - TQ.Config.workingRegionWidth) / 2);
          TQ.Config.workingRegionY0 = Math.round((State.innerHeight - TQ.Config.workingRegionHeight) / 2);
          TQ.Config.workingRegionY0 += (topBarHeight - (topBarHeight + bottomBarHeight) / 2);
        } else {
          TQ.Config.workingRegionX0 = 0;
          TQ.Config.workingRegionY0 = 0;
        }

        State.bottomBarHeight = bottomBarHeight;
        State.topBarHeight = topBarHeight;
    }

    function updateDeviceInfo() {
        deviceInfoInitialized = true;
        var desktopEle = $('.desktop-ok')[0];
        if (desktopEle) {
            var bodyCss = window.getComputedStyle(desktopEle);
            State.innerWidth = TQ.Utility.getCssSize(bodyCss.width);
            State.innerHeight = TQ.Utility.getCssSize(bodyCss.height);
            if (!State.innerWidth) {
              State.innerWidth = window.innerWidth;
              TQ.AssertExt.invalidLogic(false, "需要设定body的 width");
            }
            if (!State.innerHeight) {
              State.innerHeight = window.innerHeight;
              TQ.AssertExt.invalidLogic(false, "需要设定body的 height");
            }
        } else {
            TQ.AssertExt.invalidLogic(TQ.State.isPlayOnly, "应该先让desktopEle ready");
            State.innerWidth = window.innerWidth;
            State.innerHeight = window.innerHeight;
        }
        return true;
    }
    TQ.QueryParams = {};
    TQ.State = State;
}());
