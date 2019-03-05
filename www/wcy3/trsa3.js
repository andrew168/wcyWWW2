/**
 * Created by Andrewz on 12/24/2016.
 */
var TQ = TQ || {};
(function () {
    'use strict';
    function Trsa3() {
    }

    Trsa3.mCopy = mCopy;
    Trsa3.ditherStart = ditherStart;
    Trsa3.onTouchStart = onTouchOrDragStart;
    Trsa3.onMouseDown = onMouseDown;
    Trsa3.onPinchAndRotate = onPinchAndRotate;
    Trsa3.onTouchStage = onTouchStage;
    Trsa3.onTouchEnd = onTouchOrDragEnd;
    Trsa3.onMouseUp = onMouseUp;
    Trsa3.onRelease = onRelease;
    Trsa3.onDrag = onDrag;
    Trsa3.reset = reset;

    var isDithering = false,
        startEle = null,
        startLevel = null,
        startOffsetInDcExt = null,
        startTrsa = {
            needReset: true,
            ang: 0,
            scale: {sx: 1, sy : 1}
        },
        deltaTrsa = {
            ang: 0,
            scale: new TQ.ScaleCalculator()
        };
    var pos = {x: 0, y: 0},
        isMultiTouching = false;

    function mCopy(evt) {
        if (TQ.SelectSet.isEmpty()) {
            return TQ.MessageBox.prompt(TQ.Locale.getStr('please select an object first!'));
        }
        evt = touch2StageXY(evt);
        var results = currScene.currentLevel.cloneElement(TQ.SelectSet.members);
        results.forEach(function(ele) {
            ele.moveTo(ele.dc2World2({x:evt.stageX, y:evt.stageY}));
        });
    }

    function isMultiTouch(e) {
        try {
            return (TQ.Utility.getTouchNumbers(e) > 1);
        } catch (err) { // in case touches not exist
        }

        return false;
    }

    function onTouchStage(evt) {
        e.stopPropagation();
        e.preventDefault();
        var result = stage.hitTest(evt.stageX, evt.stageY);
        if (result) {
            TQ.Log.debugInfo("OK!");
        }
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

        if (newEle instanceof TQ.TextBubble) {
            if (newEle.host) {
                newEle = newEle.host;
            }
        }

        if (startEle === newEle) {
            return;
        }

        startEle = newEle;
        if (startEle.isMarker()) {
            // startEle.limitHostNoRotation();
        }
        // TQ.Log.debugInfo("element selected: " + startEle.getType() + ", Id=" + startEle.id);
        _showFloatToolbar(startEle.getType());
        TQ.AnimationManager.reset(startEle);
        resetStartParams(e);
        if (TQ.Utility.isMouseEvent(e)) {
            TQ.TouchManager.attachHandler('mousemove', onDrag);
        }
        // showFloatToolbar(evt);
        // TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
    }

    function resetStartParams(e) {
        if (!startEle) {
            return;
        }

        if (TQ.Utility.isMouseEvent(e) && !e.altKey && !e.ctrlKey && !e.shiftKey) {
            return;
        }

        startTrsa.needReset = false;
        startTrsa.ang = startEle.getRotation();
        startTrsa.scale = startEle.getScaleInWorld();
        pos = startEle.getPositionInWorld();

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
        startOffsetInDcExt = {x: target.x - evt.stageX, y: target.y - evt.stageY, firstTime: true};

        deltaTrsa.scale.reset();
        deltaTrsa.ang = 0;
    }

    function onTouchOrDragStart(e) { // ==mouse的onPressed，
        onKeyUp(); // 确保删除old handler
        if (e.type === 'mousedown') {
            document.addEventListener('keyup', onKeyUp);
            document.addEventListener('mouseup', onKeyUp);
        }

        TQ.Log.debugInfo("touch start or mousedown" + TQ.Utility.getTouchNumbers(e));
        TQ.CommandMgr.startNewOperation();
        updateStartElement(e);
        e.stopPropagation();
        e.preventDefault();
    }

    function ditherStart() {
        isDithering = true;
        setTimeout(ditherEnd, 300);
    }

    function ditherEnd() {
        isDithering = false;
    }

    function onKeyUp() {
        if (startEle) {
            startTrsa.needReset = true;
        }
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('mouseup', onKeyUp);
    }

    function onTouchOrDragEnd(e) {// ==mouse的onUp，
        if (e.type === 'mouseup') {
            document.removeEventListener('keyup', onKeyUp);
            TQ.TouchManager.detachHandler('mousemove', onDrag);
        }
        if (TQ.Utility.getTouchNumbers(e) >0) {// not real start, 不需要重新旋转物体， 但是需要refresh参数
            startTrsa.needReset = true;
            ditherStart();
        } else {
            isMultiTouching = false;
            if (startEle && startEle.snapIt) {
                startEle.snapIt();
            }
            ditherStart();
            startEle = null;
        }

        TQ.Log.debugInfo("touch end, or mouse up " + TQ.Utility.getTouchNumbers(e));
    }

    function onMouseDown(e) {
        if (isDithering) {
            return;
        }
        TQ.InputMap.updateSpecialKey(e);
        return onTouchOrDragStart(e);
    }

    function onMouseUp(e) {
        if (isDithering) {
            return;
        }
        TQ.InputMap.updateSpecialKey(e);
        return onTouchOrDragEnd(e);
    }

    function onRelease() {
        isMultiTouching = false;
        isDithering = false;
    }

    function onDrag(e) {  //// ==mouse的onMove，
        if (TQ.TouchManager && !TQ.TouchManager.hasStarted()) {
          return;
        }
        if (e.type === 'mousemove') {
            return;
        }

        if (isMultiTouch(e)) {
            console.error("ignore multi touch, in move handler");
            return;
        }

        e = touch2StageXY(e);
        e.stopPropagation();
        e.preventDefault();
        if (!startEle || !isValidOp(e)) {
            TQ.Log.debugInfo(e.type + ": Drag, no selected..., " + TQ.Utility.getTouchNumbers(e));
        } else {
            TQBase.Trsa.do(startEle, startLevel, startOffsetInDcExt, e);
        }
    }

    function isValidOp(e) {
        var result = true;
        e.stopPropagation();
        e.preventDefault();
        if (isDithering) {
            return (result = false);
        }

        if (!startEle) {
            // 首次选中， 不能立即TRSA， 下一个event吧， 以避免TRSA开始时的突变
            updateStartElement(e);
            result = false;
        } else if (startTrsa.needReset) {
            resetStartParams(e);
            result = false;
        }
        return result;
    }

    function onPinchAndRotate(e) {
        if (TQ.TouchManager && !TQ.TouchManager.hasStarted()) {
          return;
        }
        if (TQ.SelectSet.isInMultiCmd()) {
            return;
        }

        if (!startEle || !isValidOp(e)) {
            TQ.Log.debugInfo("pinch..." + TQ.Utility.getTouchNumbers(e));
        } else {
            if (e.type.indexOf('rotate') >=0) {
                /*
                 * IONIC的gesture的角度方向： 顺时针为正， 用度数单位，
                 * ** 数值可能从 正直突然变为等价的负值
                 * ** 逆时针是负！！！！
                 */
                deltaTrsa.ang = startEle.dc2World({rotation: e.gesture.rotation}).rotation;
                TQ.Log.debugInfo("rotate: " + deltaTrsa.ang);
            } else if (e.type.indexOf('pinch') >= 0) {
                deltaTrsa.scale.determineScale(startEle, e);
                TQ.Log.debugInfo("pinch" + deltaTrsa.scale.x + "," + deltaTrsa.scale.y);
            } else {
                TQ.Log.debugInfo("not pinch, rotate: " + e.type);
            }
            var newScaleX = startTrsa.scale.sx * deltaTrsa.scale.sx,
                newScaleY = startTrsa.scale.sy * deltaTrsa.scale.sy;
            if (!isNaN(newScaleX)) {
                if (Math.abs(newScaleX) < 0.00001) {
                    console.warn("Too small");
                } else {
                  if (startEle.jsonObj && startEle.jsonObj.isoScale) {
                    var isoScale = (newScaleX + newScaleY) / 2;
                    newScaleX = isoScale;
                    newScaleY = isoScale;
                  }

                  TQ.CommandMgr.directScaleAndRotate(startEle, {
                    sx: newScaleX,
                    sy: newScaleY
                  }, startTrsa.ang + deltaTrsa.ang);
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

    function touch2StageXY(e) { //让ionic的 touch 和mouse 兼容createJs格式中部分参数
        var touches = TQ.Utility.getTouches(e);
        if (touches.length > 0) {
            var touch = touches[0];
            e.stageX = touch.pageX;
            e.stageY = touch.pageY;
        } else {
            TQ.AssertExt.invalidLogic(false, "应该有touch点");
        }

        return e;
    }

    function reset() {
        isDithering = false;
        isMultiTouching = false;
        startEle = null;
        startTrsa.needReset = true;
    }

    TQ.Trsa3 = Trsa3;
})();
