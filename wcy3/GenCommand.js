/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};

(function() {
  var fns = null;
  function GenCommand(cmdIdOrArray, ele, newValue, oldValue) {
    if (!fns) {
      GenCommand.initialize();
    }
    this.receiver = ele;
    this.newValue = newValue;
    this.oldValue = oldValue;
    if (Array.isArray(cmdIdOrArray)) {
      this.type2 = cmdIdOrArray[0];
      this.dofn = cmdIdOrArray[0];
      this.undofn = cmdIdOrArray[1];
    } else {
      this.type2 = cmdIdOrArray;
      this.dofn = fns[cmdIdOrArray].dofn;
      this.undofn = fns[cmdIdOrArray].undofn;
    }
  }
  GenCommand.SCALE = "cmd_scale";
  GenCommand.SCALE_AND_ROTATE = "cmd_scale_rotate";
  GenCommand.MIN_JOINT_ANGLE = "cmd_min_joint_angle";
  GenCommand.MAX_JOINT_ANGLE = "cmd_max_joint_angle";
  GenCommand.CHANGE_LAYER = "cmd_change_layer";
  GenCommand.SET_3D_OBJ = "cmd_set_3D_obj";
  GenCommand.ADD_ITEM = "cmd_add_item";
  GenCommand.PINIT = "cmd_pin_it";

  GenCommand.initialize = function() {
    fns = [];
    fns[GenCommand.SCALE] = { dofn: "scaleTo", undofn: "scaleTo" };
    fns[GenCommand.SCALE_AND_ROTATE] = { dofn: "scaleAndRotateTo", undofn: "scaleAndRotateTo" };
    fns[GenCommand.MIN_JOINT_ANGLE] = { dofn: "setMinAngle", undofn: "setMinAngle" };
    fns[GenCommand.MAX_JOINT_ANGLE] = { dofn: "setMaxAngle", undofn: "setMaxAngle" };
    fns[GenCommand.CHANGE_LAYER] = { dofn: "moveZ", undofn: "moveToZ" };
    fns[GenCommand.SET_3D_OBJ] = { dofn: "attachTo", undofn: "detach" };
    fns[GenCommand.ADD_ITEM] = { dofn: "addElementDirect", undofn: "deleteElement" };
    fns[GenCommand.PINIT] = { dofn: "pinIt", undofn: "pinIt" };
  };
  TQ.inherit(GenCommand, TQ.AbstractCommand);

  GenCommand.prototype.do = function() {
    this.receiver[this.dofn](this.newValue);
    TQ.AssertExt.isTrue(typeof this.oldValue !== "undefined", "oldValue为什么没有赋值？");
  };

  GenCommand.prototype.undo = function() {
    this.receiver[this.undofn](this.oldValue);
  };

  GenCommand.prototype.redo = GenCommand.prototype.do;

  GenCommand.name2 = "GenCommand";
  TQ.GenCommand = GenCommand;
}());

// extensions:
(function() {
  TQ.CommandMgr.directScale = function(ele, newScale) {
    var cmd = new TQ.GenCommand(TQ.GenCommand.SCALE, ele, newScale, ele.getScaleInWorld());
    return TQ.CommandMgr.directDo(cmd);
  };

  TQ.CommandMgr.directScaleAndRotate = function(ele, scale, angle) {
    var oldValue = {
      scale: ele.getScaleInWorld(),
      angle: Math.truncate6(ele.jsonObj.rotation)
    };

    var newScaleAndRotate = {
      scale: scale,
      angle: angle
    };

    return TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.SCALE_AND_ROTATE, ele, newScaleAndRotate, oldValue));
  };
}());
