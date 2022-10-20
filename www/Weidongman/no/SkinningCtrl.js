/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 把A物体连接到B物体上,
 */

window.TQ = window.TQ || {};

(function () {
  function SkinningCtrl () {

  }
  SkinningCtrl.hasNew = false;
  SkinningCtrl._stage = null;
  SkinningCtrl._scene = null;
  SkinningCtrl._hostObj = null;
  SkinningCtrl.initialize = function(stage, scene) {
    SkinningCtrl._stage = stage;
    SkinningCtrl._scene = scene;
  };

  SkinningCtrl.start = function() {
    if ((SkinningCtrl._hostObj = SkinningCtrl._stage.selectedItem) == null) {
      displayInfo2(TQ.Dictionary.PleaseSelectOne);
      return;
    }

    $("#skinning").button("disable");
    $(document).bind("mousedown", SkinningCtrl.getSkin);
  };

  SkinningCtrl.getSkin = function () {
    var ele = TQ.SelectSet.pop();
    if (ele != null) { var skin = ele.displayObj;}
    assertNotNull(TQ.Dictionary.PleaseSelectHost, SkinningCtrl._hostObj);
    if ((skin != null) && (skin.id != SkinningCtrl._hostObj.id)) {
      SkinningCtrl._scene.skinning(SkinningCtrl._hostObj, skin);
      TQ.SelectSet.clear();
      $(document).unbind("mousedown", SkinningCtrl.getSkin);
      $("#skinning").button("enable");
      // SkinningCtrl.hasNew = true;
    }
  };

  TQ.SkinningCtrl = SkinningCtrl;
}) ();
