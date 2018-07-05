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

    State.innerWidth = window.innerWidth;
    State.innerHeight = window.innerHeight;
    State.bottomBarHeight = 0;
    State.topBarHeight = 0;
    State.buttonHeight = 0;
    State.determineWorkingRegion = determineWorkingRegion;
    State.updateDeviceInfo = updateDeviceInfo;
    State.allowPageTransition = true;

    var deviceInfoInitialized = false;

    function determineWorkingRegion() {
        var isLandscape = TQUtility.isLandscape();
        if (!deviceInfoInitialized) {
            updateDeviceInfo();
        }

        // top bar的min-height是 11vmin
        var topBarEle = document.getElementById('id_top_bar'),
            bottomBarEle = document.getElementById('id_bottom_bar'),
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
            if (TQ.WCY.isPlayOnly || State.isPlaying || State.isPreviewMode) {

            } else {
                State.buttonHeight = TQ.Utility.getCssSize(window.getComputedStyle(topBarEle).height);
                State.bottomBarHeight = TQ.Utility.getCssSize(window.getComputedStyle(bottomBarEle).height);
            }
        }

        var topBarHeight = (TQ.WCY.isPlayOnly || State.isPlaying || State.isPreviewMode) ? 0 : State.buttonHeight,
            bottomBarHeight = (TQ.WCY.isPlayOnly || State.isPlaying || State.isPreviewMode) ? 0 : State.bottomBarHeight,
            h = State.innerHeight - (isLandscape? 0: (topBarHeight + bottomBarHeight)),
            w = State.innerWidth,
            designated = !currScene ? TQ.Scene.getDesignatedRegionDefault() : currScene.getDesignatedRegion();

        scaleMin = Math.min(w / designated.w, h / designated.h);
        TQ.Config.workingRegionWidth = scaleMin * designated.w;
        TQ.Config.workingRegionHeight = scaleMin * designated.h;
        if (TQ.Config.workingRegionHeight > TQ.Config.workingRegionWidth) {
            TQ.Config.orientation = TQ.Config.ORIENTATION_PORTRAIT;
        } else {
            TQ.Config.orientation = TQ.Config.ORIENTATION_LANDSCAPE;
        }

        TQ.Config.workingRegionX0 = (isLandscape? (State.innerWidth - TQ.Config.workingRegionWidth) :
            Math.round((State.innerWidth - TQ.Config.workingRegionWidth) / 2));

        if (isLandscape) {
            TQ.Config.workingRegionY0 = 0;
        } else {
            TQ.Config.workingRegionY0 = Math.round((State.innerHeight - TQ.Config.workingRegionHeight) / 2);
            TQ.Config.workingRegionY0 += (topBarHeight - (topBarHeight + bottomBarHeight) / 2);
        }

        State.bottomBarHeight = bottomBarHeight;
        State.topBarHeight = topBarHeight;
    }

    function updateDeviceInfo() {
        if (deviceInfoInitialized && (State.innerWidth === window.innerWidth) &&
            (State.innerHeight === window.innerHeight)) {  // no change
            return false;
        }

        deviceInfoInitialized = true;
        var desktopEle = $('.desktop-ok')[0];
        State.innerWidth = (desktopEle) ? TQ.Utility.getCssSize(window.getComputedStyle(desktopEle).width) :
            window.innerWidth;
        State.innerHeight = window.innerHeight;
        return true;
    }

    TQ.State = State;
}());
