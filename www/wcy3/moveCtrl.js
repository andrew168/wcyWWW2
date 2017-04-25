/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    var MoveCtrl = {
        initialize: initialize,
        cmdMoveLayer: cmdMoveLayer,
        moveLayer: moveLayer,
        moveToTop: moveToTop,
        moveToBottom: moveToBottom,
        moveZ: moveZ
    };
    var TO_TOP = 99999,
        TO_BOTTOM = -99999,
        _stage = null,
        _queue = [],
        _direction;

    function initialize(aStage) {
        _stage = aStage;
        _queue.splice(0);
        _direction = 1;
    }

    // 连续Z向移动， 距离越远， 移动的越多。
    // 与鼠标运动快慢， 一致。
    var _accumulateStep = 0,
        _lastItemID = -1;

    $(document).mouseup(function () {
        _accumulateStep = 0;
    });

    function isSameItem(target) {
        return (_lastItemID == target.id);
    }

    function moveZ(ele, offset, ev) {
        var target = ele.displayObj;
        // offset 是 hit点与图像定位点之间的偏移， 在MouseDown的时候由Element的onPress计算的
        var deltaY = TQ.Utility.deltaYinWorld(target, offset, ev);
        var step = Math.floor(deltaY /TQ.Config.MouseSensitivity);
        var deltaStep = (isSameItem(target))? (step - _accumulateStep) : step;
        if (deltaStep != 0) {
            _accumulateStep = step;
            _doMoveZ(ele, deltaStep);
            TQ.Log.out("ID:" + _lastItemID + "sum" + _accumulateStep
                +", step: " + step + ", delta: " + deltaStep);
        }
    }

    /*
    移动层次，step >= 1： 向上移动1层； step <-1： 向下移动1层
     */
    function moveLayer(ele, step) {
        var oldZ = (step >0) ? ele.getMaxZ(): ele.getMinZ();  // 防止，目标z落在自身
        if ((oldZ <= 0) && (step <=0)) { // 已经是最底层， 不能再move了
            TQ.MessageBox.toast(TQ.Locale.getStr('already in lowest layer!'));
        } else {
            step = zAdjustForGroup(oldZ, step); // 防止目标z录入复合体内
            if (step === 0) {
                TQ.MessageBox.toast(TQ.Locale.getStr("couldn't move any more！"));
            } else {
                TQ.CommandMgr.addCommand(new TQ.GenCommand(TQ.GenCommand.CHANGE_LAYER, ele, step, oldZ));
            }
        }
    };

    function zAdjustForGroup(oldZ, step) {
        var ele = TQ.Graphics.findElementAtZ(oldZ + step);
        if (!ele) {
            step = 0;
        } else if (ele.isComposed()) {
            var newZ = (step > 0) ? ele.getMaxZ() : ele.getMinZ();
            step = newZ - oldZ;
        }
        return step;
    }

    // 下面的函数只被command所调用, 不会被其它函数调用
    function cmdMoveLayer(ele, step) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        _openQueue(step);
        _doMoveZ(ele, step);
        _flush();
    }

    /*
    移动到最顶层
     */
    function moveToTop(ele) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        moveLayer(ele, TO_TOP);
    }

    /*
     移动到最底层
     */
    function moveToBottom(ele) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        moveLayer(ele, TO_BOTTOM);
    }

    function _doMoveZ(ele, step) {
        var target = ele.displayObj;
        // move up the selected object toward more visible
        if (null != target) {
            _moveZOne(ele);
            _lastItemID = target.id;
            if (!!ele.children) {
                for (var i=0; i< ele.children.length; i++) {
                    var child = ele.children[i];
                    if (!child.isMarker()) {
                        _doMoveZ(child, step);
                    }
                }
            }
        }
    }

    function _moveZOne(ele)
    {
        if (!ele.displayObj) return;
        var id = _stage.getChildIndex(ele.displayObj);
        if (id >= 0) {
            _queue.push({"id": id, "ele":ele});
        }
    }

    function _openQueue(step) {
        _direction = step;
        _queue.splice(0);
    }

    function _flush() {
        var num = _queue.length;
        if (num > 0) {
            if (_direction < 0) {
                _queue.sort(function(a, b) {return a.id >= b.id;})
            } else {
                _queue.sort(function(a, b) {return a.id <= b.id;})
            }
            var step = _direction;
            // 上移一层但是已经到顶，或者下移一层但是已经到底， 就不再操作）
            if ( (step == 1) && ((_stage.getNumChildren() - 1) == _queue[0].id)) {return; }
            if ( (step == -1) && (0 == _queue[0].id)) {return; }
            // 到底、到顶操作：确保各个子元素的移动距离是一样的， 不能都奔到最顶最低
            if (step === TO_TOP) {
                step = (_stage.getNumChildren() - 1) - _queue[0].id;
            } else if (step === TO_BOTTOM) {
                step = - _queue[0].id;
            }
            if (step == 0) return;
            for (var i = 0; i < num; i ++) {
                var item = _queue.shift();
                _doMoveZOne(item.ele, step);
            }
        }
    }

    function _doMoveZOne(ele, step)
    {
        var target = ele.displayObj;
        if (!target) return;
        var id = _stage.getChildIndex(target);
        if (id >= 0) {
            var newID = TQ.MathExt.range(id + step, 0, _stage.getNumChildren() - 1);
            if (id != newID) {
                if ((step > 1) || (step < -1))  { // move to Top, or Bottom
                    _stage.setChildIndex(ele.displayObj, newID);
                } else {
                    _stage.swapChildrenAt(id, newID);
                }
            }
        }
        TQ.DirtyFlag.setElement(ele);
    }

    TQ.MoveCtrl = MoveCtrl;
}) ();
