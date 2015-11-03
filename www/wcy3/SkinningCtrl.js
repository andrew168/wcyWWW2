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
    SkinningCtrl.isWorking = false;
    SkinningCtrl.initialize = function(aStage, scene) {
        SkinningCtrl._stage = aStage;
        SkinningCtrl._scene = scene;
    };

    SkinningCtrl.oldSubjectMode = null;
    SkinningCtrl.start = function() {
        SkinningCtrl._hostObj = TQ.SelectSet.peek();
        if (SkinningCtrl._hostObj == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return;
        }
        SkinningCtrl.isWorking = true;
        SkinningCtrl.oldSubjectMode = TQ.InputCtrl.inSubobjectMode;
        TQ.InputCtrl.inSubobjectMode = true;
        TQ.SelectSet.getSelectedElement();
        SkinningCtrl._hostObj = TQ.SelectSet.pop();
        //ToDo: 能够禁止再次进入吗 $("#skinning").button("disable");
        $(document).bind("mousedown", SkinningCtrl.getSkin);
    };

    SkinningCtrl.getSkin = function () {
        var skin = TQ.SelectSet.pop();
        assertNotNull(TQ.Dictionary.PleaseSelectHost, SkinningCtrl._hostObj);
        if ((skin != null) && (skin.displayObj.id != SkinningCtrl._hostObj.displayObj.id)) {
            SkinningCtrl._scene.skinning(SkinningCtrl._hostObj, skin);
            TQ.SelectSet.clear();
            SkinningCtrl.end();
            // SkinningCtrl.hasNew = true;
        }
    };

    SkinningCtrl.end = function() {
        if (SkinningCtrl.isWorking) {
            SkinningCtrl.isWorking = false;
            if (SkinningCtrl.oldSubjectMode != null){
                TQ.InputCtrl.inSubobjectMode = SkinningCtrl.oldSubjectMode;
            }
            $(document).unbind("mousedown", SkinningCtrl.getSkin);
            //ToDo: 可以吗?  $("#skinning").button("enable");
        }
    };

    TQ.SkinningCtrl = SkinningCtrl;
}) ();
