var TQ = TQ || {};
(function() {

    function TouchManager() {
    }

    var enableTouchScreen = true,
        started = false,
        canvas = null;

    function addHandler(gesture, handler) {
        ionic.EventController.onGesture(gesture, handler, canvas);
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
        ionic.EventController.onGesture('touch', TQ.Trsa3.onStart, canvas);
        ionic.EventController.onGesture('touchend', TQ.Trsa3.onTouchEnd, canvas);
        ionic.EventController.onGesture('release', TQ.Trsa3.onRelease, canvas);
        ionic.EventController.onGesture('rotate', TQ.Trsa3.onPinchAndRotate, canvas);
        // 'scale': not work
        //
        // ionic.EventController.onGesture('pinchin', onPinch, canvas);
        // ionic.EventController.onGesture('pinchout', onPinch, canvas);
        ionic.EventController.onGesture('pinch', TQ.Trsa3.onPinchAndRotate, canvas);
        ionic.EventController.onGesture('drag', TQ.Trsa3.onMove, canvas);
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
        ionic.EventController.off('touch', TQ.Trsa3.onStart, canvas);
        ionic.EventController.off('touchend', TQ.Trsa3.onTouchEnd, canvas);
        ionic.EventController.off('release', TQ.Trsa3.onRelease, canvas);
        ionic.EventController.off('rotate', TQ.Trsa3.onPinchAndRotate, canvas);
        // 'scale': not work
        //
        // ionic.EventController.off('pinchin', onPinch, canvas);
        // ionic.EventController.off('pinchout', onPinch, canvas);
        ionic.EventController.off('pinch', TQ.Trsa3.onPinchAndRotate, canvas);
        ionic.EventController.off('drag', TQ.Trsa3.onMove, canvas);
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
