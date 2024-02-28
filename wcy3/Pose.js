/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function() {
  var _rootBoneDefault = {};
  _rootBoneDefault.x = 0;
  _rootBoneDefault.y = 0;
  _rootBoneDefault.sx = 1;
  _rootBoneDefault.sy = 1;
  _rootBoneDefault.rotation = 0;
  _rootBoneDefault.alpha = 1;
  _rootBoneDefault.color = TQ.Config.color;
  _rootBoneDefault.M = TQ.Matrix2D.I();
  _rootBoneDefault.IM = TQ.Matrix2D.I(); // Inverse Matrix, 逆矩阵

  var poseDefault = {};
  function Pose() {}
  Pose.x = poseDefault.x = 0;
  Pose.y = poseDefault.y = 0;
  Pose.rotation = poseDefault.rotation = 0;
  Pose.sx = poseDefault.sx = 1;
  Pose.sy = poseDefault.sy = 1;
  Pose.visible = poseDefault.visible = 1;
  Pose.alpha = poseDefault.alpha = 1;
  Pose.color = poseDefault.color = TQ.Config.color;

  Pose.action = poseDefault.action = "idle";

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
    if (parentPoseWorld.IM === undefined) {
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
    TQ.Assert.isTrue(!isNaN(Pose.x), "x 为 NaN！！！");
    TQ.Assert.isTrue(!isNaN(Pose.y), "y 为 NaN！！！");
    if ((V.elements[2] < 0.99) || (V.elements[2] > 1.01)) {
      assertEqualsDelta(TQ.Dictionary.INVALID_PARAMETER, 1, V.elements[2], 0.01); // 齐次分量应该近似为1
    }
  };

  Pose.tsrWorld2Object = function(ele) {
    var tsrWorld = ele.jsonObj;
    var originObj = ele.parentWorld2Object(tsrWorld);
    var parentTsrWorld = (!ele.parent || !ele.parent.jsonObj) ? _rootBoneDefault : ele.parent.jsonObj; // 获取上个函数的修改（改 null为有意义的值）

    var tsrObj = Pose;
    tsrObj.x = originObj.x;
    tsrObj.y = originObj.y;
    tsrObj.rotation = tsrWorld.rotation - parentTsrWorld.rotation;
    tsrObj.sx = tsrWorld.sx / parentTsrWorld.sx;
    tsrObj.sy = tsrWorld.sy / parentTsrWorld.sy;
    tsrObj.visible = tsrWorld.isVis;
    tsrObj.color = tsrWorld.color;
    tsrObj.alpha = tsrWorld.alpha;

    // 维护矩阵, 供子孙使用
    var M = TQ.Matrix2D.transformation(tsrObj.x, tsrObj.y, tsrObj.rotation, tsrObj.sx, tsrObj.sy);
    tsrWorld.M = parentTsrWorld.M.multiply(M);
    tsrWorld.IM = tsrWorld.M.inverse();
    assertNotNull(tsrWorld.IM); // 好习惯, 检查重要数据的出口, 确保是合格的
  };
  TQ.poseDefault = poseDefault;
  TQ.Pose = Pose;
}());
