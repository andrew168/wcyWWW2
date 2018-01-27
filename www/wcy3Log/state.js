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

    State.isPlayOnly = true; // 阻止显示菜单， 直到确认是edit状态
    State.innerWidth = window.innerWidth;
    State.innerHeight = window.innerHeight;
    State.bottomBarHeight = 0;
    State.topBarHeight = 0;
    State.buttonHeight = 0;
    State.determineWorkingRegion = determineWorkingRegion;
    State.updateDeviceInfo = updateDeviceInfo;

    function determineWorkingRegion() {
        // top bar的min-height是 11vmin
        var buttonHeight = (TQ.WCY.isPlayOnly || State.isPlaying || State.isPreviewMode)? 0:  Math.ceil(0.11 * Math.min(State.innerHeight, State.innerWidth)),
            topBarHeight = buttonHeight,
            bottomBarHeight = topBarHeight,
            h = State.innerHeight - topBarHeight - bottomBarHeight,
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

        TQ.Config.workingRegionX0 = Math.round((State.innerWidth - TQ.Config.workingRegionWidth) / 2);
        TQ.Config.workingRegionY0 = Math.round((State.innerHeight - TQ.Config.workingRegionHeight) / 2);
        TQ.Config.workingRegionY0 += (topBarHeight - (topBarHeight + bottomBarHeight) / 2);
        State.bottomBarHeight = bottomBarHeight;
        State.topBarHeight = topBarHeight;
        State.buttonHeight = buttonHeight;
    }

    function updateDeviceInfo() {
        if ((State.innerWidth === window.innerWidth) &&
            (State.innerHeight === window.innerHeight)) {  // no change
            return false;
        }

        State.innerWidth = window.innerWidth;
        State.innerHeight = window.innerHeight;
        return true;
    }

    TQ.State = State;
}());
