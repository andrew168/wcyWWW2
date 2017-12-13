/**
 * Created by Andrewz on 6/17/2016.
 */
var TQ = TQ || {};
TQ.MessageBox = (function () {
    var isShowingByForce = false,
        msgList = [],
        timer = null;

    var instance = {
        getInstance: getInstance,
        hide: hide,
        prompt: prompt,
        confirm: confirm,
        show: show,
        show2: show2,
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

        show2(options);
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
        doHide();
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
        doShow({unsafeMessage: str});
    }

    function toast(str) {
        var duration = 1000;
        doShow({unsafeMessage: str, duration: duration});
    }

    function onDuration() {
        isShowingByForce = false;
        if (msgList.length <= 0) {
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

    function show2(options) {
        // {content: msg, onOk: onOk, onCancel: onCancel, duration: duration}
        var buttons = [],
            vexOptions = {
                message: options.content,
                showCloseButton: !!options.showCloseButton,
                unsafeMessage: options.unsafeMessage,
                className: getClassName(options),
                callback: function (value) {
                    if (value) {
                        console.log('Ok');
                        if (options.onOk) {
                            options.onOk();
                        }
                    } else {
                        console.log('canceled!');
                        if (options.onCancel) {
                            options.onCancel();
                        }
                    }
                }
            };

        if (options.okText) {
            buttons.push($.extend({}, vex.dialog.buttons.YES, {text: options.okText}));
        }
        if (options.cancelText) {
            buttons.push($.extend({}, vex.dialog.buttons.NO, {text: options.cancelText}));
        }

        if (buttons.length > 0) {
            vexOptions.buttons = buttons;
        }

        if (!options.onCancel) {
            vex.dialog.alert(vexOptions);
        } else {
            vex.dialog.confirm(vexOptions);
        }
    }

    function getClassName(options) {
        var name = 'vex-theme-default';
        if (options.position) {
            switch (options.position) {
                case 'top':
                    name = 'vex-theme-top';
                    break;
                case 'bottom':
                    name = 'vex-theme-bottom-right-corner';
                    break;
                default :
                    break;
            }
        }

        return name;
    }

    function doHide() {
        vex.closeAll();
    }
})();

TQ.MessageBubble = TQ.MessageBox;  // 为了兼容老的代码，被代替了，

