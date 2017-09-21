/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

var TQ = TQ || {};

TQ.Log = (function () {
    var self = {
        CLOSE: 0,
        CRITICAL_LEVEL: 1,
        ERROR_LEVEL: 2, // 代替 assert 的throw
        WARN_LEVEL: 5,
        INFO_LEVEL: 7, // 用于 跟踪调试, 查看软件的执行过程

        upgrade: upgrade,
        alertInfo: alertInfo,
        alertError: alertError,
        matrixDebugInfo: matrixDebugInfo,
        tsrDebugInfo: tsrDebugInfo,
        debugInfo: debugInfo,
        depreciated: depreciated,
        warn: warn,
        error: error,
        criticalError: criticalError,
        trace: trace,
        setLevel: setLevel,

        open: open,
        close: close
    };

    var logLevel = TQ.Config.LOG_LEVEL;

    function open() { logLevel = self.INFO_LEVEL;}
    function close() {logLevel = self.CLOSE;}
    function setLevel(level) { logLevel = level;}
    function trace(str) {  //  只用于跟踪调试, (改info为trace), 不能直接出现在 release版中,
        for (var i = 1; i < arguments.length; i++) {
            str += "," + arguments[i];
        }
        debugInfo(str);
    }

    function criticalError(str) {
        if (logLevel >= self.CRITICAL_LEVEL) {
            for (var i = 1; i < arguments.length; i++) {
                str += "," + arguments[i];
            }
            console.error(str);
        }
    }

    function error(str) {
        if (logLevel >= self.ERROR_LEVEL) {
            for (var i = 1; i < arguments.length; i++) {
                str += "," + arguments[i];
            }
            console.error(str);
        }
    }

    function warn(str) {
        if (logLevel >= self.WARN_LEVEL) {
            for (var i = 1; i < arguments.length; i++) {
                str += "," + arguments[i];
            }
            console.warn(str);
        }
    }

    function depreciated(str) {
        if (TQ.Config.depreciateCheckOn) {
            if (!str) {
                str = "";
            }
            for (var i = 1; i < arguments.length; i++) {
                str += "," + arguments[i];
            }
            error("this is depreciated. " + str);
        }
    }

    function debugInfo(str) {
        if (logLevel >= self.INFO_LEVEL) {
            for (var i = 1; i < arguments.length; i++) {
                str += "," + arguments[i];
            }
            console.info(str);
        }
    }

    function tsrDebugInfo(msg, obj) {
        if (logLevel >= self.INFO_LEVEL) {
            debugInfo(msg + "(" + obj.x.toFixed(2) + "," + obj.y.toFixed(2) + "), Scale(" +
                obj.sx.toFixed(2) + "," + obj.sy.toFixed(2) + "), A:" + obj.rotation.toFixed(2));
        }
    }

    function matrixDebugInfo(msg, m) {
        if (logLevel >= self.INFO_LEVEL) {
            debugInfo(msg + "matrix translation: " + m.elements[0][2].toFixed(20) + ", " +
                m.elements[1][2].toFixed(20) + " " + m.elements[2][2].toFixed(20));
        }
    }

    function alertError(str) {
        // 主要是 debug 微信的程序使用
        if (typeof str != "string") {
            str = JSON.stringify(str);
        }

        for (var i = 1; i < arguments.length; i++) {
            str += "," + arguments[i];
        }

        if (TQ.Config.hasWx && TQ.Config.WX_DEBUG_ENABLED) {
            alert("wx调试__" + str);
        } else {
            error(str);
        }
    }
    function alertInfo(str) {
        // 主要是 debug 微信的程序使用
        if (typeof str != "string") {
            str = JSON.stringify(str);
        }
        for (var i = 1; i < arguments.length; i++) {
            str += "," + arguments[i];
        }

        if (TQ.Config.hasWx && TQ.Config.WX_DEBUG_ENABLED) {
            alert("wx调试__" + str);
        } else {
            info(str);
        }
    }

    function upgrade(str) {
        if (logLevel >= self.ERROR_LEVEL) {
            if (!str) {
                str = "";
            }
            for (var i = 1; i < arguments.length; i++) {
                str += "," + arguments[i];
            }

            console.error("必须升级到：" + str);
        }
    }

    // init
    if (logLevel >= self.INFO_LEVEL) {
        self.info = self.out = function (str) {
            if (logLevel >= self.INFO_LEVEL) {
                for (var i = 1; i < arguments.length; i++) {
                    str += "," + arguments[i];
                }
                console.log(str);
            }
        };
    } else {
        self.debugInfo = self.info = self.out = function () {
        };
    }

    return self;
}) ();
