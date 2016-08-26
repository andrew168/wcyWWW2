/**
 * Created by Andrewz on 8/24/2016.
 * Aux, 都是辅助的， 与核心功能无关，无耦合， 可以直接拿去用到第三个产品中
 */

var TQ = TQ || {};
TQ.IdleCounter = (function() {
    // 内部成员变量， 必须在return之前定义， 否则无效
    var IDLE_DURATION = 5000, // ms
        callbacks = [],
        events = ['keydown', 'keyup', 'touchstart', 'touchend', 'touchmove',
            'mousedown', 'mouseup', 'mousemove'],
        watchDog = null;

    // 接口函数
    return {
        remove: remove,
        start: start,
        stop: stop
    };

    // 所有成员函数， ABC 顺序
    function onWorking() {
        if (watchDog) {
            clearTimeout(watchDog);
        }
        watchDog = setTimeout(stop, IDLE_DURATION);
    }

    function remove(callback) {
        var id = callbacks.indexOf(callback);
        callbacks.splice(0);
        // callbacks.shift(id);
        stop();
    }

    function start(callback) {
        if (callbacks.indexOf(callback) < 0) {
            callbacks.push(callback);
        }

        if (watchDog) {
            return onWorking();
        }

        events.forEach(function(item) {
            document.addEventListener(item, onWorking, true);
        });

        var IDLE_DURATION = 1000; //ms
        watchDog = setTimeout(stop, IDLE_DURATION);
    }

    function stop() {
        clearTimeout(watchDog);
        watchDog = null;
        events.forEach(function(item) {
            document.removeEventListener(item, onWorking, true);
        });

        callbacks.forEach(doIt);

        function doIt(item) {
            item.call();
        }
    }
})();
