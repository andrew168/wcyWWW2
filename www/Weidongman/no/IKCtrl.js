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
    IKCtrl._stage = null;
    IKCtrl._scene = null;
    IKCtrl.EObj = null;  // E点在对象空间的坐标值
    IKCtrl.initialize = function(stage, scene) {
        IKCtrl._stage = stage;
        IKCtrl._scene = scene;
    };
    IKCtrl.isSimpleRotationMode = false; // 切换IK模式 和 单一物体的简单旋转模式。
    IKCtrl.angle = function (S, E, A) { //  从SE 转到SA 需要转多少角度？
        var SE = TQ.Vector2D.create([E.x - S.x, E.y - S.y]);
        var SA = TQ.Vector2D.create([A.x - S.x, A.y - S.y]);
        SE.toUnitVector();
        SA.toUnitVector();
        return SA.angle360From(SE);
    };

    IKCtrl.getE = function (targetElement) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, IKCtrl.EObj);
        var EWorld = targetElement.jsonObj.M.multiply($V([IKCtrl.EObj.x, IKCtrl.EObj.y, 1]));
        return {x: EWorld.elements[0], y: EWorld.elements[1]};
    };

    IKCtrl.hasAchieved = function (E, A) {
        var distance = Math.abs(A.x - E.x) + Math.abs(A.y - E.y);
        // TQ.Log.trace("distance = " + distance + " E: " + E.x + ",  " + E.y + "A:" + A.x +", "+ A.y);
        return (distance < 1);
    };

    IKCtrl.calOneBone = function(child, target, A) {
        // 目的是把E点转动到A点，通过各级bone绕自身轴点S的转动实现
        // S: 转动的支点， 也是当前处理之Bone的pivot点
        // E: 终点， 物体上被鼠标点击的位置，虽然E的物体坐标不变，但其世界坐标在求解过程中是改变的。
        // A: 目的位置， 要把E点移动到A点。
        // child： 当前处理的Bone，
        // target：选中的bone，一般是最末的一个bone。
        var S = child.jsonObj;
        var E = IKCtrl.getE(target);
        if (IKCtrl.hasAchieved(E, A)) return true;
        var angle = IKCtrl.angle(S, E, A);   // 从SE转到SA,
        TQ.CommandMgr.directDo(new TQ.RotateCommand(child, child.jsonObj.rotation + angle));
        var operationFlags = child.getOperationFlags();  // 必须保存， 因为 update和record会清除 此标记。
        child.update(TQ.FrameCounter.t()); // 更新本bone以及 所以后续Bone的 物体坐标, 世界坐标
        TQ.Log.info("image: " + child.jsonObj.src + "angle = " + angle);

        if (IKCtrl.isSimpleRotationMode) return true;  // 简单旋转， 比不牵涉其它关节，

        if (child.isRoot() || child.parent.isPinned()) { // 如果固定了, 不IK
            return false; // 达到根, 迭代了一遍, 未达到目标,
        }

        assertNotNull(TQ.Dictionary.FoundNull, child.parent); //非root关节,有parent
        child.parent.state = operationFlags;
        return IKCtrl.calOneBone(child.parent, target, A);
    };

    IKCtrl.do = function (element, offset, ev, isSimpleRotationMode) {
        IKCtrl.isSimpleRotationMode = isSimpleRotationMode;
        var displayObj  = IKCtrl._stage.selectedItem;
        if (displayObj == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return;
        }

        var target = IKCtrl._scene.findAtom(displayObj);
        if (target == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return;
        }

        var rDeviceX = ev.stageX;
        var rDeviceY = ev.stageY;
        // displayInfo2("ev.stageX,Y=" + rDeviceX +  ", " + rDeviceY);

        var A = TQ.Utility.deviceToWorld(rDeviceX, rDeviceY);
        if (offset.firstTime == true) {
          IKCtrl.EObj = IKCtrl.determineE(element, offset, ev);
          offset.firstTime = false;
        }

        if (!IKCtrl.EObj) {
          displayInfo2(TQ.Dictionary.PleaseSelectOne);
        }

        for (var i =0; i < TQ.Config.IK_ITERATE_TIME; i++) {
            if (IKCtrl.calOneBone(target, target, A)) break;
        }
    };

    IKCtrl.determineE = function(element, offset, ev)
    {
      // 求E点在element元素物体空间的坐标
      // 设备坐标 --》 世界坐标 --》 物体坐标。
      var eDevice = {x: ev.stageX, y: ev.stageY};
      var eWorld = TQ.Utility.deviceToWorld(eDevice.x, eDevice.y);
      var objectSpace = element.jsonObj; // 对象空间的描述，注意: 是element元素自己，不是他的parent !!
      TQ.Pose.worldToObject(eWorld, objectSpace);
      return {x: TQ.Pose.x, y: TQ.Pose.y};
    };

    TQ.IKCtrl = IKCtrl;
}) ();
