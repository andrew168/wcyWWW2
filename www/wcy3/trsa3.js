/**
 * Created by Andrewz on 12/24/2016.
 */
var TQ = TQ || {};
(function () {
    function Trsa3() {
    }

    Trsa3.onStart = onStart;
    Trsa3.onPinchAndRotate = onPinchAndRotate;
    Trsa3.onTouchStage = onTouchStage;
    Trsa3.onTouchEnd = onTouchEnd;
    Trsa3.onRelease = onRelease;
    Trsa3.onMove = onMove;
    Trsa3.onPinchAndRotate = onPinchAndRotate;
    Trsa3.isOperating = isOperating;

    var isDithering = false,
        ele = null;
    var ang = 0, scale = 1;
    var dAngle = 0, dScale = 1;
    var pos = {x: 0, y: 0},
        deltaX0 = 0,
        deltaY0 = 0,
        isOperatingFlag = false,
        isMultiTouching = false;

    var touchedEle;

    function isOperating() {
        return isOperatingFlag;
    }

    function isMultiTouch(e) {
        try {
            return (e.gesture.touches.length > 1);
        } catch (err) { // in case touches not exist
        }

        return false;
    }

    function onTouchStage(evt) {
        e.stopPropagation();
        e.preventDefault();
        var result = stage.hitTest(evt.stageX, evt.stageY);
        if (result) {
            console.log("OK!");
        }

        touchedEle = stage.getObjectsUnderPoint(evt.stageX, evt.stageY);
    }

    function getSelectedElement(e) {
        TQ.AssertExt.invalidLogic(!!e);
        if (!e) {
            return;
        }
        var newEle = _doGetSelectedElement(e);
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
        deltaX0 = e.gesture.deltaX;
        deltaY0 = e.gesture.deltaY;

        if (isNaN(scale)) {
            scale = 1;
        }
    }

    function onStart(e) {
        console.log("touch start" + e.gesture.touches.length);
        ele = null;
        TQ.CommandMgr.startNewOperation();
        getSelectedElement(e);
        if (TQ.SelectSet.peek()) {
            isOperatingFlag = true;
        }
        e.stopPropagation();
        e.preventDefault();
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
        isOperatingFlag = false;
        ditherStart();
        var hasGesture = !!e.gesture;
        var touchNumber = (hasGesture) ? e.gesture.touches.length : e.touches.length;
        console.log("touch end " + touchNumber + (hasGesture ? " gesture Obj" : ""));
    }

    function onRelease() {
        isMultiTouching = false;
        isDithering = false;
    }

    function onMove(e) {
        if (isDithering || TQ.SelectSet.isInMultiCmd()) {
            return;
        }

        if (isMultiTouch(e)) {
            console.error("ignore multi touch, in move handler");
            return;
        }

        if (!ele) {
            getSelectedElement(e);
        }

        if (!ele) {
            // console.log("Move..." + e.gesture.touches.length);
        } else {
            e.stopPropagation();
            e.preventDefault();
            var deltaX = e.gesture.deltaX - deltaX0;
            var deltaY = -(e.gesture.deltaY - deltaY0);
            // ele.moveTo({x: deltaX + pos.x, y: deltaY + pos.y});
            TQ.CommandMgr.directDo(new TQ.MoveCommand(ele, {x: deltaX + pos.x, y: deltaY + pos.y}));
        }
    }

    function onPinchAndRotate(e) {
        if (TQ.SelectSet.isInMultiCmd()) {
            return;
        }

        e.stopPropagation();
        e.preventDefault();
        if (isDithering) {
            return;
        }

        if (!ele) {
            getSelectedElement(e);
        }

        if (!ele) {
            console.log("pinch..." + e.gesture.touches.length);
        } else {
            dScale = e.gesture.scale;
            var newScale = scale * dScale;
            if (!isNaN(newScale)) {
                if (Math.abs(newScale) < 0.001) {
                    console.warn("Too small");
                } else {
                    dAngle = e.gesture.rotation;
                    TQ.CommandMgr.directScaleAndRotate(ele, {sx: newScale, sy: newScale}, ang - dAngle);
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

        var eles = TQ.SceneEditor.stageContainer.getObjectsUnderPoint(pageX, pageY);
        if ((!!eles) && (eles.length > 0)) {
            for (var i = 0; i < eles.length; i++) {
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

    TQ.Trsa3 = Trsa3;
})();
