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
    function State() {
    }

    State.innerWidth = window.innerWidth;
    State.innerHeight = window.innerHeight;
    State.bottomBarHeight = 0;
    State.topBarHeight = 0;
    State.buttonHeight = 0;
    TQ.State = State;
}());
