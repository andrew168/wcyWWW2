/**
 * Created by Andrewz on 6/17/2016.
 */
var TQ = TQ || {};
TQ.MessageBox = (function() {
    var isShowingByForce = false,
        msgList = [],
        timer = null;

    var instance = {
        getInstance: getInstance,
        hide: hide,
        prompt: prompt,
        confirm: confirm,
        show: show,
        showWaiting: showWaiting,
        toast: toast
    };

    return instance;

    function isEqualMsg(options1, options2) {
        return options1.content === options2.content;
    }

    function doShow(options) {
        if (isShowingByForce) {
            if ((msgList.length > 0) && isEqualMsg(options, msgList[msgList.length - 1])) {
                return;
            }
            return msgList.push(options);
        }

        if (options.duration) {
            isShowingByForce = true;
            timer = setTimeout(onDuration, options.duration);
        }

        Modal.open(options);
    }

    function getInstance() {
        return instance;
    }

    function hide() {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        isShowingByForce = false;
        Modal.close();
    }

    function onCancel() {
        TQ.Log.debugInfo("cancelled!");
    }

    function onOk() {
        TQ.Log.debugInfo("Ok!");
    }

    function prompt(msg) {
        doShow({content: msg, onOk: onOk, onCancel: onCancel});
    }

    function confirm(options) {
        doShow(options);
    }

    function show(str) {
        doShow({content: str});
    }

    function toast(str) {
        var duration = 1000;
        doShow({content: str, duration: duration});
    }

    function onDuration() {
        isShowingByForce = false;
        if (msgList.length <=0) {
            return hide();
        }

        var oldList = msgList;
        msgList = [];
        for (; oldList.length > 0;) {
            doShow(oldList.pop());
        }
    }

    function showWaiting(msg) {
        var htmlStr = '<img src="/public/images/loading.gif"> ' + msg;
        show(htmlStr);
    }
})();

TQ.MessageBubble = TQ.MessageBox;  // 为了兼容老的代码，被代替了，
