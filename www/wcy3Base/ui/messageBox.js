/**
 * Created by Andrewz on 6/17/2016.
 */
var TQ = TQ || {};
TQ.MessageBox = (function () {
    var isShowingByForce = false,
        toastInstance,
        progressInstance,
        promptInstance,
        confirmInstance,
        showInstance,
        msgList = [],
        timer = null;


    var instance = {
        getInstance: getInstance,
        hide: hide,
        hideProgressBox: hideProgressBox,
        prompt: prompt,
        confirm: confirm, // 有OK和Cancel两个按钮
        show: show, // show 就是alert，只有OK按钮
        show2: show2,
        showWaiting: showWaiting,
        toast: toast
    };

    initVex();
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

        return show2(options);
    }

    function getInstance() {
        return instance;
    }

    function hide(ref) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }

        isShowingByForce = false;
        doHide(ref);
    }

    function onCancel() {
        TQ.Log.debugInfo("cancelled!");
    }

    function onOk() {
        TQ.Log.debugInfo("Ok!");
    }

    function prompt(msg, onOk1, onCancel1) {
        var option = {
            unsafeMessage: msg,
            onOk: onOk1? onOk1: onOk
        };

        if (onCancel1) {
            option.onCancel = onCancel1;
        }

        return (promptInstance = doShow(option));
    }

    function confirm(options) {
        return (confirmInstance = doShow(options));
    }

    function show(str) {
        return (showInstance = doShow({unsafeMessage: str}));
    }

    function toast(str) {
        var duration = 1000;
        return (toastInstance = doShow({unsafeMessage: str, duration: duration}));
    }

    function onDuration() {
        isShowingByForce = false;
        var tempInstance = toastInstance;
        toastInstance = null;
        hide(tempInstance);
        if (msgList.length <= 0) {
            return;
        }

        var oldList = msgList;
        msgList = [];
        for (; oldList.length > 0;) {
            doShow(oldList.pop());
        }
    }

    function showWaiting(msg) {
        var htmlStr = '<img src="/public/images/loading.gif"> ' + msg;
        return (progressInstance = doShow({unsafeMessage: htmlStr, position: 'bottom'}));
    }

    function show2(options) {
        // {content: msg, onOk: onOk, onCancel: onCancel, duration: duration}
        var buttons = [],
            vexOptions = {
                message: options.content,
                showCloseButton: !!options.showCloseButton,
                unsafeMessage: options.unsafeMessage,
                overlayClosesOnClick: !!options.overlayClosesOnClick,
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

        if (options.overlayClassName) {
            vexOptions.overlayClassName = options.overlayClassName;
        }

        if (!options.okText) {
            options.okText = TQ.Locale.getStr('OK');
        }

        if (!options.cancelText) {
            options.cancelText = TQ.Locale.getStr('Cancel');
        }

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
            return vex.dialog.alert(vexOptions);
        }
        return vex.dialog.confirm(vexOptions);
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

    function doHide(ref) {
        if (!ref) {
            var tempInstance;
            hideProgressBox();
            if (showInstance) {
                tempInstance = showInstance;
                showInstance = null;
                vex.close(tempInstance);
            }

            if (promptInstance) {
                tempInstance = promptInstance;
                promptInstance = null;
                vex.close(tempInstance); // 这个close， 还在调用callback，容易造成死循环
            }

            if (confirmInstance) {
                tempInstance = confirmInstance;
                confirmInstance = null;
                vex.close(tempInstance);
            }

            if (toastInstance) {
                tempInstance = toastInstance;
                toastInstance = null;
                vex.close(tempInstance);
            }
        } else {
            vex.close(ref);
        }
    }

    function hideProgressBox() {
        if (progressInstance) {
            var tempInstance = progressInstance;
            progressInstance = null;
            hide(tempInstance);
        }
    }

    function initVex() {
        // popstate事件不close
        vex.defaultOptions.closeAllOnPopState = false;
    }

})();

TQ.MessageBubble = TQ.MessageBox;  // 为了兼容老的代码，被代替了，

