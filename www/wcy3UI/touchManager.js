var TQ = TQ || {};
(function() {

    function TouchManager() {
    }
    var isDithering = false;
    var ele = null;
    var ang = 0, scale = 1;
    var dAngle = 0, dScale = 1;
    var pos = {x:0, y:0};
    var isMultiTouching = false;
    var enableTouchScreen = true;

    function initialize() {
        var canvas = document.getElementById("testCanvas");
        if (!enableTouchScreen) {
            return;
        }
        ionic.EventController.onGesture('touch', onStart, canvas);
        ionic.EventController.onGesture('touchend', onTouchEnd, canvas);
        ionic.EventController.onGesture('release', onRelease, canvas);
        ionic.EventController.onGesture('rotate', onRotate, canvas);
        TQ.Assert.isTrue(!!stage, "Stage 没有初始化！");
        TQ.SceneEditor.stage.addEventListener("touch", onTouchStage);

        function onShowToucInfo(e) {
            console.log(e.type);
        }

        // 'scale': not work
        //
        // ionic.EventController.onGesture('pinchin', onPinch, canvas);
        // ionic.EventController.onGesture('pinchout', onPinch, canvas);
        ionic.EventController.onGesture('pinch', onPinch, canvas);
        ionic.EventController.onGesture('drag', onMove, canvas);
        ionic.EventController.onGesture('swipeup', onSwipeUp, canvas);
    }

    var touchedEle;
    function onTouchStage(evt) {
        var result = stage.hitTest(evt.stageX, evt.stageY);
        if (result) {
            console.log("OK!");
        }

        touchedEle = stage.getObjectsUnderPoint(evt.stageX, evt.stageY);
    }

    function getSelectedElement(evt) {
        var newEle = _doGetSelectedElement(evt);
        if (!newEle) {
            newEle = touchedEle;
        }

        if (!newEle) {
            console.error("No Obj touched!");
            TQ.floatToolbar.show(false);
            return;
        }

        if (ele === newEle) {
            return;
        }

        ele = newEle;
        if (ele) {
            console.log("element selected: " + ele.getType() + ", Id=" + ele.id);
            _highlight(ele);
            _showFloatToolbar();
        } else {
            TQ.Log.warn("No Element selected, fake to first element of this level!");
            ele = currScene.currentLevel.elements[0];
            TQ.floatToolbar.show(false);
        }

        if (!ele) {
            TQ.Log.error("No Element selected");
            return;
        }

        ang = ele.getRotation();
        scale = ele.getScale().sx;
        pos = ele.getPosition();

        if (isNaN(scale)) {
            scale = 1;
        }
    }

    function onStart(e) {
        ele = null;
        getSelectedElement(e);
        console.log("start");
    }

    function ditherStart() {
        isDithering = true;
        setTimeout(ditherEnd, 300);
    }

    function ditherEnd() {
        isDithering = false;
    }

    function onTouchEnd(e) {
        isMultiTouching = false;
        ditherStart();
    }

    function onRelease() {
        isMultiTouching = false;
        isDithering = false;
    }

    function onMove(e) {
        if (isMultiTouching || isDithering) {
            return;
        }

        if (!ele) {
            getSelectedElement(e);
        }

        if (!ele) {
            console.log("Move...");
        } else {
            // ele = currScene.currentLevel.elements[0];
            var deltaX = e.gesture.deltaX;
            var deltaY = - e.gesture.deltaY;
            ele.moveTo({x: deltaX + pos.x, y: deltaY + pos.y});
        }
    }

    function onRotate(e) {
        if (isDithering) {
            return;
        }

        if (!ele) {
            getSelectedElement(e);
        }

        if (!ele) {
            console.log("Rotete...");
        } else {
            // ele = currScene.currentLevel.elements[0];
            dAngle = e.gesture.rotation;
            ele.rotateTo(ang - dAngle);
            isMultiTouching = true;
        }
    }

    function onPinch(e) {
        if (isDithering) {
            return;
        }

        if (!ele) {
            getSelectedElement(e);
        }

        if (!ele) {
            console.log("pinch...");
        } else {
            // ele = currScene.currentLevel.elements[0];
            dScale = e.gesture.scale;
            var newScale = scale * dScale;
            if (!isNaN(newScale)) {
                if (Math.abs(newScale) < 0.001) {
                    console.warn("Too small");
                } else {
                    ele.scaleTo({sx:newScale, sy:newScale});
                    isMultiTouching = true;
                }
            }
        }
    }

    function onSwipeUp(evt) {
        ditherStart();
        if (!ele) {
            getSelectedElement(evt);
        }

        TQ.SelectSet.add(ele);
        TQ.SelectSet.delete();
    }
    // private:
    function _doGetSelectedElement(evt) {
        var touchPoint = evt.gesture.srcEvent;
        if ((!!touchPoint.touches) && (touchPoint.touches.length > 0)) {
            touchPoint = touchPoint.touches[0];
        }

        var pageX = touchPoint.pageX;
        var pageY = touchPoint.pageY;

        var rect = TQ.SceneEditor.stage._getElementRect(TQ.SceneEditor.stage.canvas);
        pageX -= rect.left;
        pageY -= rect.top;

        var eles = TQ.SceneEditor.stageContainer.getObjectsUnderPoint(pageX,pageY);
        if ((!!eles)  && (eles.length > 0)) {
            var ele = eles[0].ele;
            var ele2 = TQ.SelectSet.getEditableEle(ele);
            TQ.SelectSet.add(ele2);
            return TQ.SelectSet.peek();
        }

        console.log(pageX + ", " + pageY) ;
    }

    var _showFloatToolbar = function () {
        if ((TQ.floatToolbar != undefined) && TQ.floatToolbar.setPosition && TQ.floatToolbar.show) {
            TQ.floatToolbar.setPosition(0, 0);
            TQ.floatToolbar.show(true);
        }
    };

    function _highlight(ele) {
        if (TQ.SceneEditor.isPlayMode()) {
            return;
        }
        var ele2 = TQ.SelectSet.getEditableEle(ele);
        TQ.SelectSet.add(ele2);
    }

    TouchManager.initialize = initialize;
    TQ.TouchManager = TouchManager;
})();
