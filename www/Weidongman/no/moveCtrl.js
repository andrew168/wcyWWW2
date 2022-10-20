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
  MoveCtrl.initialize = function(stage) {
    MoveCtrl._stage = stage;
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

  MoveCtrl.moveZ = function (target, offset, ev) {
    // offset 是 hit点与图像定位点之间的偏移， 在MouseDown的时候由Element的onPress计算的
    var deltaY = TQ.Utility.deltaYinWorld(target, offset, ev);
    var step = Math.floor(deltaY /TQ.Config.MouseSensitivity);
    var deltaStep = (MoveCtrl.isSameItem(target))? (step - MoveCtrl._accumulateStep) : step;
    if (deltaStep != 0) {
      MoveCtrl._accumulateStep = step;
      MoveCtrl._moveZ(target,deltaStep);
      TQ.Log.out("ID:" + MoveCtrl._lastItemID + "sum" + MoveCtrl._accumulateStep
                +", step: " + step + ", delta: " + deltaStep);
    }
  };

  MoveCtrl._moveZ = function (target, step) {
    // move up the selected object toward more visible
    if (null != target) {
      var id = MoveCtrl._stage.getChildIndex(target);
      var newID = TQ.MathExt.range(id + step, 0, MoveCtrl._stage.getNumChildren() -1);
      MoveCtrl._stage.swapChildrenAt(id, newID);
      MoveCtrl._lastItemID = target.id;
    }
  };

  TQ.MoveCtrl = MoveCtrl;
}) ();
