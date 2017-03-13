/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 把A物体连接到B物体上,
 */

window.TQ = window.TQ || {};

(function () {
    function IKCtrl () {

    }
    // 任何时候, 都是IK动画, 除非是 Break it 进入子物体编辑模式. 默认就是最好的状态, 精锐尽出
    IKCtrl._scene = null;
    IKCtrl.EObj = null;  // E点在对象空间的坐标值， 在拖动过程中是不变的， 但是在世界坐标下是变的
    IKCtrl.initialize = function(aStage, scene) {
        IKCtrl._scene = scene;
    };
    IKCtrl.isSimpleRotationMode = false; // 切换IK模式 和 单一物体的简单旋转模式。
    IKCtrl.angle = function (S, E, A) { //  从SE 转到SA 需要转多少角度？
        var SE = TQ.Vector2D.calDirection(S, E);
        var SA = TQ.Vector2D.calDirection(S, A);
        return limitToAcuteAngle(SA.angle360From(SE));
    };

    function limitToAcuteAngle(angle) {
        var absAngle = Math.abs(angle);
        if (absAngle > 180) {
            if (angle < 0) {
                angle = 360 + angle;
            } else {
                angle = -360 + angle;
            }
        }

        absAngle = Math.abs(angle);
        if (absAngle > 180) {
            console.error("应该是锐角" + angle);
        }

        return angle;
    }

    IKCtrl.getEWorld = function (targetElement) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, IKCtrl.EObj);
        return targetElement.object2World(IKCtrl.EObj);
    };

    IKCtrl.hasAchieved = function (E, A) {
        var distance = Math.abs(A.x - E.x) + Math.abs(A.y - E.y);
        // TQ.Log.trace("distance = " + distance + " E: " + E.x + ",  " + E.y + "A:" + A.x +", "+ A.y);
        return (distance < 1);
    };

    IKCtrl.applyLimitation = function(child, angle) {
        if ((child.jsonObj.angleMin != null)  || (child.jsonObj.angleMax != null)) {
            var angleMin = child.jsonObj.angleMin, angleMax = child.jsonObj.angleMax;

            var parentAngle = 0;
            if (child.parent != null) {
                parentAngle = child.parent.jsonObj.rotation;
            }
            var relativeAngle = angle - parentAngle;  // relative to parent;
            relativeAngle = TQ.MathExt.range(relativeAngle, angleMin, angleMax);
            angle = relativeAngle + parentAngle;
        }

        return limitToAcuteAngle(angle);
    };

    /*
    设置关节的运动范围限制，limitation有值， 则用之， 否则，以当前的位置作为界限。
    界限是相对于父物体的，是相对值， 不是绝对值
    type = 0: 设置 最小值；
    tyoe = 1: 其它 设置 最大值;
     */
    IKCtrl.setLimitation = function(type, angle) {
        var child = TQ.SelectSet.peek();
        if (child == null) return;
        if (angle == null) {
            angle = child.jsonObj.rotation;
        }
        var parentAngle = 0;
        if (child.parent != null) {
            parentAngle = child.parent.jsonObj.rotation;
        }
        var relativeAngle = angle - parentAngle;  // relative to parent;

        var oldValue;
        var cmd_type;
        if (type == 0) {
            oldValue = (child.jsonObj.angleMin == undefined) ? null: child.jsonObj.angleMin;
            cmd_type = TQ.GenCommand.MIN_JOINT_ANGLE;
        } else {
            oldValue = (child.jsonObj.angleMax == undefined) ? null: child.jsonObj.angleMax;
            cmd_type = TQ.GenCommand.MAX_JOINT_ANGLE;
        }
        TQ.CommandMgr.directDo(new TQ.GenCommand(cmd_type,
            child, relativeAngle, oldValue));

        //检查合法性
        if ((child.jsonObj.angleMin != null) && (child.jsonObj.angleMax != null)) {
            if (child.jsonObj.angleMin  > child.jsonObj.angleMax) {
                TQ.MessageBubble(TQ.Dictionary.INVALID_PARAMETER);
            }
        }
    };

    IKCtrl.calOneBone = function(child, target, A) {
        // 目的是把E点转动到A点，通过各级bone绕自身轴点S的转动实现
        // S: 转动的支点， 也是当前处理之Bone的pivot点
        // E: 终点， 物体上被鼠标点击的位置，虽然E的物体坐标不变，但其世界坐标在求解过程中是改变的。
        // A: 目的位置， 要把E点移动到A点。
        // child： 当前处理的Bone，
        // target：选中的bone，一般是最末的一个bone。
        var S = child.getPositionInWorld();
        var E = IKCtrl.getEWorld(target);
        if (IKCtrl.hasAchieved(E, A)) return true;
        var angle = IKCtrl.angle(S, E, A);   // 从SE转到SA,
        var operationFlags = child.getOperationFlags();  // 必须保存， 因为 update和record会清除 此标记。
        IKCtrl.rotate(child, angle);
        if (IKCtrl.isSimpleRotationMode) return true;  // 简单旋转， 比不牵涉其它关节，

        if (child.isRoot() || child.parent.isPinned()) { // 如果固定了, 不IK
            TQ.Log.debugInfo("not achieved: (" +
                Math.round(A.x) + "," + Math.round(A.y) + ") <-- (" +
                Math.round(E.x) + "," + Math.round(E.y) + ")");
            return false; // 达到根, 迭代了一遍, 未达到目标,
        }

        assertNotNull(TQ.Dictionary.FoundNull, child.parent); //非root关节,有parent
        child.parent.setFlag(operationFlags);
        return IKCtrl.calOneBone(child.parent, target, A);
    };

    /*
    旋转物体（及其子物体），angle角度， (逆时针为正， 顺时针为负）
     */
    IKCtrl.rotate = function (child, angle) {
        assertNotNull(TQ.Dictionary.FoundNull, child);
        if (!child) return;

        angle = IKCtrl.applyLimitation(child, child.jsonObj.rotation + angle);
        TQ.CommandMgr.directDo(new TQ.RotateCommand(child, angle));
        child.update(TQ.FrameCounter.t()); // 更新本bone以及 所以后续Bone的 物体坐标, 世界坐标
        TQ.Log.info("ele.id " + child.id + ": angle = " + angle);
        TQ.DirtyFlag.setElement(child);
    };

    IKCtrl.do = function (element, offset, ev, isSimpleRotationMode) {
        console.log("ele.id =", element.id, "offest = ", JSON.stringify(offset));
        IKCtrl.isSimpleRotationMode = isSimpleRotationMode;
        var target  = TQ.SelectSet.peek();
        if (target == null) {
            TQ.Log.debugInfo(TQ.Dictionary.PleaseSelectOne);
            return;
        }

        var rDeviceX = ev.stageX;
        var rDeviceY = ev.stageY;
        var A = element.dc2World({x:rDeviceX, y:rDeviceY});
        if (offset.firstTime == true) {
          IKCtrl.EObj = IKCtrl.determineE(element, offset, ev);
          offset.firstTime = false;
        }

        if (!IKCtrl.EObj) {
          displayInfo2(TQ.Dictionary.PleaseSelectOne);
        }

        for (var i =0; i < TQ.Config.IK_ITERATE_TIME; i++) {
            if (IKCtrl.calOneBone(target, target, A)) {
                return TQ.Log.debugInfo("achieved");
            }
        }
    };

    IKCtrl.determineE = function(element, offset, ev) {
        // 求E点在element元素物体空间的坐标
        // 设备坐标 --》 世界坐标 --》 物体坐标。
        var eDevice = {x: ev.stageX, y: ev.stageY},
            eWorld = element.dc2World(eDevice);
        return element.world2Object(eWorld);
    };

    TQ.IKCtrl = IKCtrl;
}) ();
