/**
 * Created by Andrewz on 2/25/2016.
 */
var fs = require('fs'),
    callerId = require('caller-id');

var logger = logger|| {};
(function() {
    if (!!logger.initialized ) {
        return;
    }

    var originalConsoleLog = console.log;
    var logFolder = '/logs/udoido/';
    logger.logFilename = "udoido2-25.log";

    function init()
    {
        logger.initialized = true;
        logger.error = logger.warn = logger.log = logger.debug = logger.info;

        replaceConsole();
    }

    var originalConsoleFunctions = {
        log: console.log,
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error
    };

    function replaceConsole() {
        ['log','debug','info','warn','error'].forEach(function (item) {
            console[item] = (item === 'log' ? logger.info : logger[item]);
        });
    }

    function restoreConsole() {
        ['log', 'debug', 'info', 'warn', 'error'].forEach(function (item) {
            console[item] = originalConsoleFunctions[item];
        });
    }

    logger.config = function(logFileName) {
        if (!logger.hasLogFile) {
            logger.logFilename = logFileName;
            logger.hasLogFile = true;
        }
    };

    var log2File = function(entry) {
        fs.appendFile(logFolder + logger.logFilename, new Date().toLocaleString() + ' - ' + entry + '\r\n');
    };

    logger.info = function(msg) {
        var caller = callerId.getData(),
            fullPath = caller.filePath.replace(/\\/g,'/'),
            shortPath = fullPath.substr(fullPath.lastIndexOf('/') + 1),
            stackTrace = "--" + shortPath +", "+ caller.functionName +"(" +  caller.lineNumber + ")";
        msg = msg + stackTrace;
        originalConsoleLog(msg);
        log2File(msg);
    };

    init();
})();

module.exports = logger;
