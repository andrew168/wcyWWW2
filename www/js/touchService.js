var TQ = TQ || {};
(function() {

    function TouchService() {
    }
    var isDithering = false;
    var ele = null;
    var ang = 0, scale = 1;
    var dAngle = 0, dScale = 1;
    var pos = {x:0, y:0};
    var isMultiTouching = false;

    function initialize() {
        var canvas = document.getElementById("testCanvas");
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
            return;
        }

        if (ele === newEle) {
            return;
        }

        console.log("element changed!");

        ele = newEle;
        if (!ele) {
            ele = currScene.currentLevel.elements[0];
        }

        if (!ele) {
            console.error("No Element selected");
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
            return eles[0].ele;
        }

        console.log(pageX + ", " + pageY) ;
    }

    TouchService.initialize = initialize;
    TQ.TouchService = TouchService;
})();
