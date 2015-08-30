/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    var _rootBoneDefault = {};
    _rootBoneDefault.x = 0;
    _rootBoneDefault.y = 0;
    _rootBoneDefault.sx = 1;
    _rootBoneDefault.sy = 1;
    _rootBoneDefault.rotation = 0;
    _rootBoneDefault.M = TQ.Matrix2D.I();
    _rootBoneDefault.IM = TQ.Matrix2D.I();   // Inverse Matrix, 逆矩阵

    var poseDefault = {};
    function Pose () {}
    Pose.x = poseDefault.x = 0;
    Pose.y = poseDefault.y = 0;
    Pose.rotation = poseDefault.rotation = 0;
    Pose.sx = poseDefault.sx = 1;
    Pose.sy = poseDefault.sy = 1;
    Pose.visible = poseDefault.visible = 1;
    Pose.action = poseDefault.action = "idle";
    Pose._parentPoseWorld = null;

    Pose._toWorldCoordinate = function(poseWorld, parentPoseWorld) {
        // 物体坐标 ===>到 世界坐标下
        if (parentPoseWorld == null) {
            parentPoseWorld = _rootBoneDefault;
        }
        var M = TQ.Matrix2D.transformation(Pose.x, Pose.y, Pose.rotation, Pose.sx, Pose.sy);
        poseWorld.M = parentPoseWorld.M.multiply(M);
        poseWorld.IM = null;   // 必须清除上一个时刻的 IM,因为M变了,IM过时了, 但是, 不要计算, 等到用时再算.
        var Vjw = parentPoseWorld.M.multiply($V([Pose.x, Pose.y, 1]));
        poseWorld.x = Vjw.elements[0];
        poseWorld.y = Vjw.elements[1];
        if ((Vjw.elements[2]< 0.99) || (Vjw.elements[2]> 1.01) )
        {
            assertEqualsDelta(TQ.Dictionary.INVALID_PARAMETER, 1, Vjw.elements[2], 0.01); //齐次分量应该近似为1
        }
        poseWorld.rotation = parentPoseWorld.rotation + Pose.rotation;
        poseWorld.sx = parentPoseWorld.sx * Pose.sx;
        poseWorld.sy = parentPoseWorld.sy * Pose.sy;
        poseWorld.isVis = Pose.visible;
    };

    Pose.worldToObject = function(poseWorld, parentPoseWorld) {
        // 这是反变换:  世界坐标  ==> 物体坐标. 用于拍摄记录物体的操作, 不是播放.
        // 其中, 世界坐标中的参数, 必须完整.
        //   例如: 如果是平移变换, 那么只有平移变换的值是有意义的.
        //  其余参数, 如: 角度, 比例, 等等, 都是由以前的动画轨迹计算得来的, 保持不变即可.
        //   所以可以做到: 有选择地拍摄, 录制.

        // Pose 是一个公共的地方, 你不赋值, 它就是上一个elemenet留下的.
        if (parentPoseWorld == null) {
            parentPoseWorld = _rootBoneDefault;
        }
        if (parentPoseWorld.IM == undefined) {
            // 父矩阵是上一个迭代计算的, 对应拍摄的第一时刻, 没有.
            // 而且, 在播放的时候, 会生成新的M, 并清除上一个时刻的IM
            // ToDo:优化 如果正在拍摄, 可以直接利用拍摄的计算结果, 少算一次变换和矩阵.
            assertValid(TQ.Dictionary.ParentMatrixFromLastIteration, parentPoseWorld.M);
            parentPoseWorld.IM = parentPoseWorld.M.inverse();
        }
        assertValid(TQ.Dictionary.ParentMatrixFromLastIteration, parentPoseWorld.IM);
        var V = parentPoseWorld.IM.multiply($V([poseWorld.x, poseWorld.y, 1]));
        Pose.x = V.elements[0];
        Pose.y = V.elements[1];
        if ((V.elements[2]< 0.99) || (V.elements[2]> 1.01) )
        {
            assertEqualsDelta(TQ.Dictionary.INVALID_PARAMETER, 1, V.elements[2], 0.01);  //齐次分量应该近似为1
        }
        Pose._parentPoseWorld = parentPoseWorld;  //  保留， 因为后面的函数也要使用。
    };

    Pose.worldToObjectExt = function(poseWorld, parentPoseWorld) {
        Pose.worldToObject(poseWorld, parentPoseWorld);
        parentPoseWorld = Pose._parentPoseWorld; // 获取上个函数的修改（改 null为有意义的值）
        Pose.rotation = poseWorld.rotation - parentPoseWorld.rotation;
        Pose.sx = poseWorld.sx / parentPoseWorld.sx;
        Pose.sy = poseWorld.sy / parentPoseWorld.sy;

        // 维护矩阵, 供子孙使用
        var M = TQ.Matrix2D.transformation(Pose.x, Pose.y, Pose.rotation, Pose.sx, Pose.sy);
        poseWorld.M = parentPoseWorld.M.multiply(M);
        poseWorld.IM = poseWorld.M.inverse();
        assertNotNull(poseWorld.IM);  // 好习惯, 检查重要数据的出口, 确保是合格的

        Pose.visible = poseWorld.isVis;
    };

    TQ.poseDefault = poseDefault;
    TQ.Pose = Pose;
}());
