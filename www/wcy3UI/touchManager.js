var TQ = TQ || {};
(function() {

    function TouchManager() {
    }
    var isDithering = false;
    var ele = null;
    var ang = 0, scale = 1;
    var dAngle = 0, dScale = 1;
    var pos = {x:0, y:0};
    var isOperating = false,
        isMultiTouching = false,
        enableTouchScreen = true;

    function initialize() {
        var canvas = document.getElementById("testCanvas");
        if (!enableTouchScreen) {
            return;
        }
        ionic.EventController.onGesture('touch', onStart, canvas);
        ionic.EventController.onGesture('touchend', onTouchEnd, canvas);
        ionic.EventController.onGesture('release', onRelease, canvas);
        ionic.EventController.onGesture('rotate', onPinchAndRotate, canvas);
        // 'scale': not work
        //
        // ionic.EventController.onGesture('pinchin', onPinch, canvas);
        // ionic.EventController.onGesture('pinchout', onPinch, canvas);
        ionic.EventController.onGesture('pinch', onPinchAndRotate, canvas);
        ionic.EventController.onGesture('drag', onMove, canvas);
        // 其余事件： 'swipeup'.

        TQ.Assert.isTrue(!!stage, "Stage 没有初始化！");
        TQ.SceneEditor.stage.addEventListener("touch", onTouchStage);

        function onShowToucInfo(e) {
            console.log(e.type);
        }

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
            // console.error("No Obj touched!");
            TQ.SelectSet.empty();
            TQ.FloatToolbar.close();
            return;
        }

        if (ele === newEle) {
            return;
        }

        ele = newEle;
        if (ele) {
            // console.log("element selected: " + ele.getType() + ", Id=" + ele.id);
            _highlight(ele);
            _showFloatToolbar(ele.getType());
        } else {
            // TQ.Log.warn("No Element selected, fake to first element of this level!");
            ele = currScene.currentLevel.elements[0];
            TQ.FloatToolbar.close();
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
        TQ.CommandMgr.startNewOperation();
        getSelectedElement(e);
        if (TQ.SelectSet.peek()) {
            isOperating = true;
        }
        // console.log("start event Type = " + e.gesture.eventType + " @ t= " + e.gesture.timeStamp);
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
        var ele = TQ.SelectSet.peek();
        if (ele && ele.snapIt) {
            ele.snapIt();
        }
        isOperating = false;
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
            // console.log("Move...");
        } else {
            // ele = currScene.currentLevel.elements[0];
            var deltaX = e.gesture.deltaX;
            var deltaY = - e.gesture.deltaY;
            // ele.moveTo({x: deltaX + pos.x, y: deltaY + pos.y});
            TQ.CommandMgr.directDo(new TQ.MoveCommand(ele, {x: deltaX + pos.x, y: deltaY + pos.y}));
        }
    }

    function onPinchAndRotate(e) {
        if (isDithering) {
            return;
        }

        if (!ele) {
            getSelectedElement(e);
        }

        if (!ele) {
            console.log("pinch...");
        } else {
            dScale = e.gesture.scale;
            var newScale = scale * dScale;
            if (!isNaN(newScale)) {
                if (Math.abs(newScale) < 0.001) {
                    console.warn("Too small");
                } else {
                    dAngle = e.gesture.rotation;
                    TQ.CommandMgr.directScaleAndRotate(ele, {sx:newScale, sy:newScale}, ang - dAngle);
                    isMultiTouching = true;
                }
            }
        }
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
            for (var i = 0; i < eles.length; i++ ) {
                if (!eles[i].ele) {
                    continue;
                }

                var ele2 = TQ.SelectSet.getEditableEle(eles[i].ele);
                if (!!ele2) {
                    TQ.SelectSet.add(ele2);
                    return TQ.SelectSet.peek();
                }
            }
        }

        // console.log(pageX + ", " + pageY) ;
        return null;
    }

    var _showFloatToolbar = function (type) {
        if ((TQ.FloatToolbar != undefined) && TQ.FloatToolbar.setPosition && TQ.FloatToolbar.show) {
            TQ.FloatToolbar.setPosition(0, 0);
            TQ.FloatToolbar.show(type);
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
    TouchManager.isOperating = function() {return isOperating;};
    TQ.TouchManager = TouchManager;
})();
