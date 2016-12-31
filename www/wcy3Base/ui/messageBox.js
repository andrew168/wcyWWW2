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

    function doShow(options) {
        if (isShowingByForce) {
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
        console.log("cancelled!");
    }

    function onOk() {
        console.log("Ok!");
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
        var duration = 3000;
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
