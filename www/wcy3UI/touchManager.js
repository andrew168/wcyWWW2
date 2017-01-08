var TQ = TQ || {};
(function () {
    'use strict';
    function TouchManager() {
    }

    var enableTouchScreen = true,
        started = false,
        canvas = null,
        currentOps = null,
        trsaOps = null,
        mCopyOps = null;

    function addHandler(gesture, handler) {
        ionic.EventController.onGesture(gesture, handler, canvas);
    }

    function detachHandler(gesture, handler) {
        ionic.EventController.off(gesture, handler, canvas);
    }

    function initialize() {
        trsaOps = [
            ['touch', TQ.Trsa3.onTouchStart],
            ['touchend', TQ.Trsa3.onTouchEnd],
            ['release', TQ.Trsa3.onRelease],
            ['rotate', TQ.Trsa3.onPinchAndRotate],
            ['pinch', TQ.Trsa3.onPinchAndRotate],
            // 'scale': not work
            //
            // ['pinchin', onPinch],
            // ['pinchout', onPinch],
            ['drag', TQ.Trsa3.onDrag]
            // 其余事件： 'swipeup'.
        ];

        mCopyOps = [
            ['touch', TQ.Trsa3.mCopy]
        ];

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
        currentOps = trsaOps;
        attachOps(currentOps);
        TQ.Assert.isTrue(!!stage, "Stage 没有初始化！");
        TQ.SceneEditor.stage.addEventListener('touch', TQ.Trsa3.onTouchStage);
    }

    function updateOps(state) {
        detachOps(currentOps);
        if (state.isMCopying) {
            currentOps = mCopyOps;
        } else {
            currentOps = trsaOps;
        }
        attachOps(currentOps);
    }

    function attachOps(ops) {
        ops.forEach(function (item) {
            addHandler(item[0], item[1]);
        });
    }

    function detachOps(ops) {
        ops.forEach(function (item) {
            detachHandler(item[0], item[1]);
        });
    }

    function stop() {
        if (!started) {
            TQ.AssertExt.invalidLogic(true, "重复关闭touchManager！");
            return;
        }

        started = false;
        if (currentOps) {
            detachOps(currentOps);
        }

        TQ.Assert.isTrue(!!stage, "Stage 没有初始化！");
        TQ.SceneEditor.stage.removeEventListener('touch', TQ.Trsa3.onTouchStage);
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
    TouchManager.updateOps = updateOps;
    TouchManager.isOperating = TQ.Trsa3.isOperating;
    TQ.TouchManager = TouchManager;
})();
