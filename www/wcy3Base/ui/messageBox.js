/**
 * Created by Andrewz on 6/17/2016.
 */
var TQ = TQ || {};
TQ.MessageBox = (function() {
    var instance = {
        getInstance: getInstance,
        hide: hide,
        prompt: prompt,
        show: show,
        showWaiting: showWaiting
    };

    return instance;

    function getInstance() {
        return instance;
    }

    function hide() {
        Modal.close();
    }

    function onCancel() {
        console.log("cancelled!");
    }

    function onOk() {
        console.log("Ok!");
    }

    function prompt(msg) {
        Modal.open({content: msg, onOk: onOk, onCancel: onCancel});
    }

    function show(str) {
        Modal.open({content: str});
    }

    function showWaiting(msg) {
        var htmlStr = '<img src="/public/images/loading.gif"> msg';
        show(htmlStr);
    }
})();

TQ.MessageBubble = TQ.MessageBox;  // 为了兼容老的代码，被代替了，
