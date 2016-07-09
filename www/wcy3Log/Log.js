/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    var Log =function () {
    };

    Log.CLOSE = 0;
    Log.CRITICAL_LEVEL = 1;
    Log.ERROR_LEVEL = 2; // 代替 assert 的throw
    Log.WARN_LEVEL = 5;
    Log.INFO_LEVEL = 7; // 用于 跟踪调试, 查看软件的执行过程
    Log.level = TQ.Config.LOG_LEVEL;
    Log.open = function () { Log.level = Log.INFO_LEVEL;};
    Log.close = function () {Log.level = Log.CLOSE;};
    Log.setLevel = function(level) { Log.level = level;};
    Log.trace = function (str) {  //  只用于跟踪调试, (改info为trace), 不能直接出现在 release版中,
      console.log(str);
    };

    Log.criticalError = function (str) {
        if (Log.level >= Log.CRITICAL_LEVEL) console.error(str);
    };

    Log.error = function (str) {
        if (Log.level >= Log.ERROR_LEVEL) console.error(str);
    };

    Log.warn = function (str) {
        if (Log.level >= Log.WARN_LEVEL) console.warn(str);
    };

    Log.depreciated = function (str) {
        if (!str) {
            str = "";
        }
        console.error("this is depreciated. " + str);
    };

    Log.debugInfo = function (str) {
        console.info(str);
    };

    if (Log.level >= Log.INFO_LEVEL) {
        Log.info = Log.out = function(str) {
            console.log(str);
        };
    } else {
        Log.debugInfo = Log.info = Log.out = function() {};
    }

    Log.alertError = Log.alertInfo = function (str) {
        // 主要是 debug 微信的程序使用
        if (typeof str != "string") {
            str = JSON.stringify(str);
        }
        if (TQ.Config.WX_DEBUG_ENABLED) {
            alert("wx调试__" + str);
        }
    };

    TQ.Log = Log;
}) ();
