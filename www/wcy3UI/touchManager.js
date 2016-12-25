var TQ = TQ || {};
(function () {
    'use strict';
    function TouchManager() {
    }

    var enableTouchScreen = true,
        started = false,
        canvas = null;

    function addHandler(gesture, handler) {
        ionic.EventController.onGesture(gesture, handler, canvas);
    }

    function detachHandler(gesture, handler) {
        ionic.EventController.off(gesture, handler, canvas);
    }

    function initialize() {
        canvas = document.getElementById("testCanvas");
        if (!enableTouchScreen) {
            return;
        }
        disableBodyScrollInIOS();
        start();
    }

    function start() {
        if (started) {
            TQ.AssertExt.invalidLogic(true, "重复启动touchManager！");
            return;
        }
        started = true;
        addHandler('touch', TQ.Trsa3.onTouchStart);
        addHandler('touchend', TQ.Trsa3.onTouchEnd);
        addHandler('release', TQ.Trsa3.onRelease);
        addHandler('rotate', TQ.Trsa3.onPinchAndRotate);
        addHandler('pinch', TQ.Trsa3.onPinchAndRotate);
        // 'scale': not work
        //
        // addHandler('pinchin', onPinch);
        // addHandler('pinchout', onPinch);
        addHandler('drag', TQ.Trsa3.onDrag);
        // 其余事件： 'swipeup'.

        TQ.Assert.isTrue(!!stage, "Stage 没有初始化！");
        TQ.SceneEditor.stage.addEventListener("touch", TQ.Trsa3.onTouchStage);
    }

    function stop() {
        if (!started) {
            TQ.AssertExt.invalidLogic(true, "重复关闭touchManager！");
            return;
        }

        started = false;
        detachHandler('touch', TQ.Trsa3.onTouchStart);
        detachHandler('touchend', TQ.Trsa3.onTouchEnd);
        detachHandler('release', TQ.Trsa3.onRelease);
        detachHandler('rotate', TQ.Trsa3.onPinchAndRotate);
        detachHandler('pinch', TQ.Trsa3.onPinchAndRotate);
        // 'scale': not work
        //
        // detachHandler('pinchin', onPinch);
        // detachHandler('pinchout', onPinch);
        detachHandler('drag', TQ.Trsa3.onDrag);
        // 其余事件： 'swipeup'.

        TQ.Assert.isTrue(!!stage, "Stage 没有初始化！");
        TQ.SceneEditor.stage.removeEventListener("touch", TQ.Trsa3.onTouchStage);
    }

    function isFirstTouch(e) {
        return (!started && !isMultiTouching);
    }

    function disableBodyScrollInIOS() {
        // IOS's page body are scrolling when user touch moving
        document.ontouchstart = disableScroll;
        document.ontouchmove = disableScroll;
        function disableScroll(e) {
            // console.log(e.type, e.target.tagName, e.srcElement.tagName, e.currentTarget ? e.currentTarget.tagName: 'None',
            //     e.target.nodeName, e.srcElement.nodeName, e.currentTarget ? e.currentTarget.nodeName: 'None');
            var whiteList = ["BUTTON", 'INPUT', 'TEXTAREA'];
            var tag = "";
            if (e.target && e.target.nodeName) {
                tag = e.target.nodeName.toUpperCase();
            }

            if (whiteList.indexOf(tag) < 0) {
                e.preventDefault();
            }
        }
    }

    TouchManager.addHandler = addHandler;
    TouchManager.initialize = initialize;
    TouchManager.start = start;
    TouchManager.stop = stop;
    TouchManager.isOperating = TQ.Trsa3.isOperating;
    TQ.TouchManager = TouchManager;
})();
