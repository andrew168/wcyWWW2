'use strict';

var perfInspector = {
    options: {
        debug: false,  /* call the log method ? */
        minThread: 30
    },

    firstTime: null,
    lastTime: null
};

perfInspector.log = function(msg) {
    if (perfInspector.options.debug) {
        var getTimeInfo = function () {
            var timeStamp = new Date();
            var t = timeStamp.getTime();
            var diff = (!perfInspector.lastTime) ? 0 : (t - perfInspector.lastTime);
            perfInspector.lastTime = t;
            if (!perfInspector.firstTime) {
                perfInspector.firstTime = t;
            }
            var diffAll = t - perfInspector.firstTime;
            return {text: diff + " of " + diffAll, diff: diff};
        };

        var style = "color:blue;background:yellow;font-weight:bold;";
        var result = getTimeInfo();

        if (result.diff < perfInspector.options.minThread) {
            return;
        }

        if (result.diff < 20) {
            console.log(msg + ":\t" + result.text + ";");
        } else {
            console.log(msg + ":\t%c" + result.text + ";", style);
        }
    }
};

perfInspector.init = function() {
    if (perfInspector.options.debug) {
        perfInspector.log("start...");
        document.onclick = function() {
            perfInspector.log('clicked');
        }
    }
};

perfInspector.init();