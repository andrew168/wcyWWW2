/**
 * Created by Andrewz on 12/24/2016.
 */
var TQ = TQ || {};
(function () {
    'use strict';
    function Trsa3() {
    }

    Trsa3.mCopy = mCopy;
    Trsa3.onTouchStart = onTouchStart;
    Trsa3.onPinchAndRotate = onPinchAndRotate;
    Trsa3.onTouchStage = onTouchStage;
    Trsa3.onTouchEnd = onTouchEnd;
    Trsa3.onRelease = onRelease;
    Trsa3.onDrag = onDrag;

    var isDithering = false,
        startEle = null,
        startLevel = null,
        startOffset = null,
        startTrsa = {
            ang: 0,
            scale: {sx: 1, sy : 1}
        },
        deltaTrsa = {
            ang: 0,
            scaleXY: 1
        };
    var pos = {x: 0, y: 0},
        deltaX0 = 0,
        deltaY0 = 0,
        isMultiTouching = false;

    var touchedEle;

    function mCopy(evt) {
        if (TQ.SelectSet.isEmpty()) {
            return TQ.MessageBox.prompt("请先选择物体！");
        }
        evt = touch2StageXY(evt);
        var results = currScene.currentLevel.cloneElement(TQ.SelectSet.members);
        results.forEach(function(ele) {
            ele.moveTo(TQ.Utility.deviceToWorld(evt.stageX, evt.stageY));
        });
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

    function updateStartElement(e) {
        TQ.AssertExt.invalidLogic(!!e);
        if (!e) {
            return;
        }

        TQ.SelectSet.updateByGesture(e);
        var newEle = TQ.SelectSet.peekLatestEditableEle();
        if (!newEle) {
            startEle = null;
            // console.error("No Obj touched!");
            TQ.SelectSet.empty();
            TQ.FloatToolbar.close();
            return;
        }

        if (startEle === newEle) {
            return;
        }

        startEle = newEle;
        // console.log("element selected: " + startEle.getType() + ", Id=" + startEle.id);
        _highlight(startEle);
        _showFloatToolbar(startEle.getType());

        startTrsa.ang = startEle.getRotation();
        startTrsa.scale = startEle.getScale();
        pos = startEle.getPosition();
        deltaX0 = e.gesture.deltaX;
        deltaY0 = e.gesture.deltaY;

        if (isNaN(startTrsa.scale.sx)) {
            startTrsa.scale.sx = 1;
            startTrsa.scale.sy = 1;
        }

        // setup base
        startLevel = currScene.currentLevel;

        var target = startEle.displayObj;
        if (target === null) { // 防止 刚刚被删除的物体.
            return;
        }
        var evt = touch2StageXY(e);
        target = startEle.getPositionInDc();
        startOffset = {x: target.x - evt.stageX, y: target.y - evt.stageY, firstTime: true};
        // showFloatToolbar(evt);
        // TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
    }

    function onTouchStart(e) { // ==mouse的onPressed，
        console.log("touch start" + e.gesture.touches.length);
        TQ.CommandMgr.startNewOperation();
        updateStartElement(e);
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

    function onTouchEnd(e) {// ==mouse的onUp，
        isMultiTouching = false;
        if (startEle && startEle.snapIt) {
            startEle.snapIt();
        }
        ditherStart();
        startEle = null;
        var hasGesture = !!e.gesture;
        var touchNumber = (hasGesture) ? e.gesture.touches.length : e.touches.length;
        console.log("touch end " + touchNumber + (hasGesture ? " gesture Obj" : ""));
    }

    function onRelease() {
        isMultiTouching = false;
        isDithering = false;
    }

    function onDrag(e) {  //// ==mouse的onMove，
        if (isDithering) {// || (TQ.SelectSet.isInMultiCmd() && startEle && !startEle.isMarker())) {
            return;
        }

        if (isMultiTouch(e)) {
            console.error("ignore multi touch, in move handler");
            return;
        }

        if (!startEle) {
            console.log("not started, force to start in onDrag!");
            return onTouchStart(e);
        }
        if (!startEle) {
            return updateStartElement(e);
        }

        e = touch2StageXY(e);

        if (!startEle) {
            // console.log("Move..." + e.gesture.touches.length);
        } else {
            e.stopPropagation();
            e.preventDefault();

            TQBase.Trsa.do(startEle, startLevel, startOffset, e, stageContainer.selectedItem);
/*            var deltaX = e.gesture.deltaX - deltaX0;
            var deltaY = -(e.gesture.deltaY - deltaY0);
            // startEle.moveTo({x: deltaX + pos.x, y: deltaY + pos.y});
            TQ.CommandMgr.directDo(new TQ.MoveCommand(startEle, {x: deltaX + pos.x, y: deltaY + pos.y}));
*/
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

        if (!startEle) {
            // 首次选中， 不能立即TRSA， 下一个event吧， 以避免TRSA开始时的突变
            return updateStartElement(e);
        }

        if (!startEle) {
            console.log("pinch..." + e.gesture.touches.length);
        } else {
            if (e.type.indexOf('rotate') >=0) {
                console.log("rotate");
                deltaTrsa.ang = e.gesture.rotation;
            } else if (e.type.indexOf('pinch') >= 0) {
                console.log("pinch");
                deltaTrsa.scaleXY = e.gesture.scale;
            } else {
                console.log("not pinch, rotate: " + e.type);
            }
            var newScaleX = startTrsa.scale.sx * deltaTrsa.scaleXY,
                newScaleY = startTrsa.scale.sy * deltaTrsa.scaleXY;
            if (!isNaN(newScaleX)) {
                if (Math.abs(newScaleX) < 0.001) {
                    console.warn("Too small");
                } else {
                    TQ.CommandMgr.directScaleAndRotate(startEle, {sx: newScaleX, sy: newScaleY}, startTrsa.ang - deltaTrsa.ang);
                    isMultiTouching = true;
                }
            }
        }
    }

    // private:
    var _showFloatToolbar = function (type) {
        if ((TQ.FloatToolbar != undefined) && TQ.FloatToolbar.setPosition && TQ.FloatToolbar.show) {
            TQ.FloatToolbar.setPosition(0, 0);
            TQ.FloatToolbar.show(type);
        }
    };

    function _highlight(ele) {
        // highlight 只是亮显， 不能修改选择集
        if (TQ.SceneEditor.isPlayMode()) {
            return;
        }
        // var ele2 = TQ.SelectSet.getEditableEle(ele);
        // TQ.SelectSet.add(ele2);
    }

    function touch2StageXY(e) { //让ionic的 touch 和mouse 兼容createJs格式中部分参数
        var srcEvent = e.gesture.srcEvent;
        var touch = isMouseEvent(srcEvent)? srcEvent: srcEvent.touches[0];
        e.stageX = touch.pageX;
        e.stageY = touch.pageY;
        return e;
    }

    function isMouseEvent(e) {
        return (e instanceof MouseEvent);
    }

    TQ.Trsa3 = Trsa3;
})();
