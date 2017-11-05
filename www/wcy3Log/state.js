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

    State.innerWidth = window.innerWidth;
    State.innerHeight = window.innerHeight;
    State.bottomBarHeight = 0;
    State.topBarHeight = 0;
    State.buttonHeight = 0;
    TQ.State = State;
}());
