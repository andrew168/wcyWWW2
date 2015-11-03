/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    function MoveCtrl () {

    }
    MoveCtrl._stage = null;
    MoveCtrl.initialize = function(aStage) {
        MoveCtrl._stage = aStage;
        MoveCtrl.queue = [];
        MoveCtrl._direction = 1;
    };

    // 连续Z向移动， 距离越远， 移动的越多。
    // 与鼠标运动快慢， 一致。
    MoveCtrl._accumulateStep = 0;
    MoveCtrl._lastItemID = -1;

    $(document).mouseup(function () {
        MoveCtrl._accumulateStep = 0;
    });

    MoveCtrl.isSameItem = function(target) {
        return (MoveCtrl._lastItemID == target.id);
    };

    MoveCtrl.moveZ = function (ele, offset, ev) {
        var target = ele.displayObj;
        // offset 是 hit点与图像定位点之间的偏移， 在MouseDown的时候由Element的onPress计算的
        var deltaY = TQ.Utility.deltaYinWorld(target, offset, ev);
        var step = Math.floor(deltaY /TQ.Config.MouseSensitivity);
        var deltaStep = (MoveCtrl.isSameItem(target))? (step - MoveCtrl._accumulateStep) : step;
        if (deltaStep != 0) {
            MoveCtrl._accumulateStep = step;
            MoveCtrl._doMoveZ(ele, deltaStep);
            TQ.Log.out("ID:" + MoveCtrl._lastItemID + "sum" + MoveCtrl._accumulateStep
                +", step: " + step + ", delta: " + deltaStep);
        }
    };

    /*
    移动层次，step >= 1： 向上移动1层； step <-1： 向下移动1层
     */
    MoveCtrl.moveLayer = function (ele, step) {
        var oldZ = ele.getZ();
        TQ.CommandMgr.addCommand(new TQ.GenCommand(TQ.GenCommand.CHANGE_LAYER, ele, step, oldZ));
    };

    // 下面的函数只被command所调用, 不会被其它函数调用
    MoveCtrl.cmdMoveLayer = function (ele, step) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        MoveCtrl._openQueue(step);
        MoveCtrl._doMoveZ(ele, step);
        MoveCtrl._flush();
    };

    /*
    移动到最顶层
     */
    MoveCtrl.moveToTop = function (ele) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        MoveCtrl.moveLayer(ele, 99999);
    };

    /*
     移动到最底层
     */
    MoveCtrl.moveToBottom = function (ele) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        MoveCtrl.moveLayer(ele, -99999);
    };

    MoveCtrl._doMoveZ = function (ele, step) {
        var target = ele.displayObj;
        // move up the selected object toward more visible
        if (null != target) {
            MoveCtrl._moveZOne(ele);
            MoveCtrl._lastItemID = target.id;
            if (!!ele.children) {
                for (var i=0; i< ele.children.length; i++) {
                    MoveCtrl._doMoveZ(ele.children[i], step);
                }
            }
        }
    };

    MoveCtrl._moveZOne = function(ele)
    {
        if (!ele.displayObj) return;
        var id = MoveCtrl._stage.getChildIndex(ele.displayObj);
        if (id >= 0) {
            MoveCtrl.queue.push({"id": id, "ele":ele});
        }
    };

    MoveCtrl._openQueue = function(step) {
        MoveCtrl._direction = step;
        MoveCtrl.queue.splice(0);
    };

    MoveCtrl._flush = function() {
        var num = MoveCtrl.queue.length;
        if (num > 0) {
            if (MoveCtrl._direction < 0) {
                MoveCtrl.queue.sort(function(a, b) {return a.id >= b.id;})
            } else {
                MoveCtrl.queue.sort(function(a, b) {return a.id <= b.id;})
            }
            var step = MoveCtrl._direction;
            // 上移一层但是已经到顶，或者下移一层但是已经到底， 就不再操作）
            if ( (step == 1) && ((MoveCtrl._stage.getNumChildren() - 1) == MoveCtrl.queue[0].id)) {return; }
            if ( (step == -1) && (0 == MoveCtrl.queue[0].id)) {return; }
            // 到底、到顶操作：确保各个子元素的移动距离是一样的， 不能都奔到最顶最低
            if (step > 1) {
                step = (MoveCtrl._stage.getNumChildren() - 1) - MoveCtrl.queue[0].id;
            } else if (step < -1) {
                step = - MoveCtrl.queue[0].id;
            }
            if (step == 0) return;
            for (var i = 0; i < num; i ++) {
                var item = MoveCtrl.queue.shift();
                MoveCtrl._doMoveZOne(item.ele, step);
            }
        }
    };

    MoveCtrl._doMoveZOne = function(ele, step)
    {
        var target = ele.displayObj;
        if (!target) return;
        var id = MoveCtrl._stage.getChildIndex(target);
        if (id >= 0) {
            var newID = TQ.MathExt.range(id + step, 0, MoveCtrl._stage.getNumChildren() - 1);
            if (id != newID) {
                if ((step > 1) || (step < -1))  { // move to Top, or Bottom
                    MoveCtrl._stage.setChildIndex(ele.displayObj, newID);
                } else {
                    MoveCtrl._stage.swapChildrenAt(id, newID);
                }
            }
        }
        TQ.DirtyFlag.setElement(ele);
    };

    TQ.MoveCtrl = MoveCtrl;
}) ();
