/**
 * Created by Andrewz on 6/17/2016.
 */
var TQ = TQ || {};
TQ.MessageBox = (function () {
    var TYPE_PROMPT = 'prompt',
        TYPE_CONFIRM = 'confirm',
        TYPE_SHOW = 'show',
        TYPE_TOAST = 'toast',
        TYPE_PROGRESS = 'progress';

    var isShowingByForce = false,
        instances = {},
        msgList = [],
        timer = null;


    var instance = {
        getInstance: getInstance,
        hide: hide,
        reset: reset,
        hideProgressBox: hideProgressBox,
        prompt: prompt, //可以被reset.
        promptWithNoCancel: promptWithNoCancel,
        confirm: confirm, // 有OK和Cancel两个按钮， 不能被reset, 用户必须click
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
        var inst = show2(options);
        if (!options.mustClick) {
            instances[options.type] = inst;
        }
        return (inst);
    }

    function getInstance() {
        return instance;
    }

    function reset() {
        // 仅仅是清除任何显示的对话框，但是，要避免重入，特别是，此对话框的onOK调用reset
        setTimeout(hide);
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

    function promptWithNoCancel(msg, onOk1) {
      prompt(msg, onOk1, null, true, {noCancel: true});
    }

    function prompt(msg, onOk1, onCancel1, mustClick, options) {
      if (!options) {
        options = {};
      }

      options.mustClick = !!mustClick;
      options.unsafeMessage = msg;
      options.onOk = onOk1 ? onOk1 : onOk;

      if (onCancel1) {
        options.onCancel = onCancel1;
      }

      options.type = TYPE_PROMPT;
      return (doShow(options));
    }

    function confirm(options) {
        options.type = TYPE_CONFIRM;
        return doShow(options);
    }

    function show(str) {
        return doShow({unsafeMessage: str, type: TYPE_SHOW});
    }

    function toast(str) {
        var duration = 1000;
        return doShow({unsafeMessage: str, duration: duration, type: TYPE_TOAST});
    }

    function onDuration() {
        isShowingByForce = false;
        hide(instances[TYPE_TOAST]);
        instances[TYPE_TOAST] = null;
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
        return doShow({unsafeMessage: htmlStr, position: 'bottom', type: TYPE_PROGRESS});
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
                mustClick: options.mustClick,
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

        if (options.okText) {
            buttons.push($.extend({}, vex.dialog.buttons.YES, {text: options.okText}));
        }

        if (!options.noCancel) {
          if (!options.cancelText) {
            options.cancelText = TQ.Locale.getStr('Cancel');
          }

          if (options.cancelText) {
            buttons.push($.extend({}, vex.dialog.buttons.NO, {text: options.cancelText}));
          }
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
            hideProgressBox();
            if (instances[TYPE_SHOW]) {
                vex.close(instances[TYPE_SHOW]);
                instances[TYPE_SHOW] = null;
            }

            if (instances[TYPE_PROMPT]) {
                var options = instances[TYPE_PROMPT].options;
                if (!options.mustClick) {
                    vex.close(instances[TYPE_PROMPT]); // 这个close， 还在调用callback，容易造成死循环
                    instances[TYPE_PROMPT] = null;
                }
            }

            if (instances[TYPE_TOAST]) {
                vex.close(instances[TYPE_TOAST]);
                instances[TYPE_TOAST] = null;
            }
        } else {
            vex.close(ref);
        }
    }

    function hideProgressBox() {
        if (instances[TYPE_PROGRESS]) {
            hide(instances[TYPE_PROGRESS]);
            instances[TYPE_PROGRESS] = null;
        }
    }

    function initVex() {
        // popstate事件不close
        vex.defaultOptions.closeAllOnPopState = false;
    }

})();

TQ.MessageBubble = TQ.MessageBox;  // 为了兼容老的代码，被代替了，

