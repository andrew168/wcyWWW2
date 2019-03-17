/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 把A物体连接到B物体上,
 */

window.TQ = window.TQ || {};

(function () {
    function IKCtrl () {

    }

    IKCtrl.initialize = initialize;

    IKCtrl.applyLimitation = applyLimitation;
    IKCtrl.do = doIK;
    IKCtrl.rotate =rotate;
    IKCtrl.setLimitation = setLimitation;

    // 任何时候, 都是IK动画, 除非是 Break it 进入子物体编辑模式. 默认就是最好的状态, 精锐尽出
    var EObj = null,  // E点在对象空间的坐标值， 在拖动过程中是不变的， 但是在世界坐标下是变的
        isSimpleRotationMode = false; // 切换IK模式 和 单一物体的简单旋转模式。

    function initialize(aStage, scene) {
    }

    function vec2Angle(S, E, A) { //  从SE 转到SA 需要转多少角度？
        var SE = TQ.Vector2D.calDirection(S, E);
        var SA = TQ.Vector2D.calDirection(S, A);
        return TQ.Utility.limitToAcuteAngle(SA.angle360From(SE));
    }

    function getEWorld(targetElement) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, EObj);
        return targetElement.object2World(EObj);
    }

    function hasAchieved(E, A) {
        var distance = Math.abs(A.x - E.x) + Math.abs(A.y - E.y);
        // TQ.Log.trace("distance = " + distance + " E: " + E.x + ",  " + E.y + "A:" + A.x +", "+ A.y);
        return (distance < 1);
    }

    function applyLimitation(child, angle) {
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

        return TQ.Utility.limitToAcuteAngle(angle);
    }

    /*
    设置关节的运动范围限制，limitation有值， 则用之， 否则，以当前的位置作为界限。
    界限是相对于父物体的，是相对值， 不是绝对值
    type = 0: 设置 最小值；
    tyoe = 1: 其它 设置 最大值;
     */
    function setLimitation(type, angle) {
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
    }

    function calOneBone(child, target, A, idIterations) {
        // 目的是把E点转动到A点，通过各级bone绕自身轴点S的转动实现
        // S: 转动的支点， 也是当前处理之Bone的pivot点
        // E: 终点， 物体上被鼠标点击的位置，虽然E的物体坐标不变，但其世界坐标在求解过程中是改变的。
        // A: 目的位置， 要把E点移动到A点。
        // child： 当前处理的Bone，
        // target：选中的bone，一般是最末的一个bone。
        var S = child.getPositionInWorld();
        var E = getEWorld(target);
        TQDebugger.Panel.logInfo(idIterations + ", X, " + child.id + ", EO(" +
          Math.round(EObj.x) + "," + Math.round(EObj.y) + ") <- A(" +
          Math.round(A.x) + "," + Math.round(A.y) + ") <- E(" +
          Math.round(E.x) + "," + Math.round(E.y) + ")");

        if (hasAchieved(E, A)) return true;
        var angle = vec2Angle(S, E, A);   // 从SE转到SA,
        var operationFlags = child.getOperationFlags();  // 必须保存， 因为 update和record会清除 此标记。
        rotate(child, angle);
        if (isSimpleRotationMode) return true;  // 简单旋转， 比不牵涉其它关节，

        var parent = child.parent;
        if (child.isRoot() || !parent || parent.isPinned() ||
          (parent.isRoot() && TQ.State.fiexdRootJoint)) { // 如果固定了, 不IK
            return false; // 达到根, 迭代了一遍, 未达到目标,
        }

        assertNotNull(TQ.Dictionary.FoundNull, child.parent); //非root关节,有parent
        child.parent.setFlag(operationFlags);
        return calOneBone(child.parent, target, A);
    }

    /*
    旋转物体（及其子物体），angle角度， (逆时针为正， 顺时针为负）
     */
    function rotate(child, angle) {
        assertNotNull(TQ.Dictionary.FoundNull, child);
        if (!child) return;

        angle = applyLimitation(child, child.jsonObj.rotation + angle);
        child.rotateTo(child.getRotateDirection() * angle);
        child.update(TQ.FrameCounter.t()); // 更新本bone以及 所以后续Bone的 物体坐标, 世界坐标
        TQ.Log.info("IKRotate ele.id " + child.id + " @ angle = " + angle);
        TQ.DirtyFlag.setElement(child);
    }

    function doIK(element, offset, ev, isSimpleRotation) {
        TQ.Log.debugInfo("ele.id =", element.id, "offest = ", JSON.stringify(offset));
        isSimpleRotationMode = isSimpleRotation;
        var target  = TQ.SelectSet.peek();
        if (target == null) {
            TQ.Log.debugInfo(TQ.Dictionary.PleaseSelectOne);
            return;
        }

        var A = element.dc2World(TQ.Utility.eventToDevice(ev));

        if (offset.firstTime) {
          EObj = determineE(element, offset, ev);
          offset.firstTime = false;
        }

        if (!EObj) {
          displayInfo2(TQ.Dictionary.PleaseSelectOne);
        }

        for (var i =0; i < TQ.Config.IK_ITERATE_TIME; i++) {
            if (calOneBone(target, target, A, i)) {
                return TQ.Log.debugInfo("achieved");
            }
        }
    }

    function determineE(element, offset, ev) {
        // 求E点在element元素物体空间的坐标
        // 设备坐标 --》 世界坐标 --》 物体坐标。
        var eDevice = TQ.Utility.eventToDevice(ev),
            eWorld = element.dc2World(eDevice);
        return element.world2Object(eWorld);
    }

    TQ.IKCtrl = IKCtrl;
}) ();
