/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    var StageBuffer =function () {
    };
    StageBuffer.isBatchMode = false;  // by default, it's not batchMode, i.e. closed,
    StageBuffer.members = [];
    StageBuffer.open = function () { StageBuffer.isBatchMode = true;};
    StageBuffer.close = function () {
     StageBuffer.flush();
     StageBuffer.isBatchMode = false;
     };

     /*
    求上边界： 即: 在zIndex > z的范围中， 求最小的zIndex（在上边最靠近z）。
     */
    StageBuffer.findUpperBoundary = function(z) {
        if ((!currScene) || (!currScene.currentLevel) ||(!currScene.currentLevel.elements)) {
            return null;
        }
        if (z == -1) { // group 物体， 不需要进入stage
            return null;
        }
         return TQ.MathExt.findUpperBoundary(currScene.currentLevel.elements, z);
    };

    StageBuffer.add = function (ele) {
        if (StageBuffer.isBatchMode) {
            StageBuffer.members.push(ele);
        } else {
            var upperEle = StageBuffer.findUpperBoundary(ele.jsonObj.zIndex);
            ele._doAddItemToStage(upperEle);
        }
    };

    StageBuffer.flush = function () {
        assertTrue(TQ.Dictionary.MustBeBatchMode, StageBuffer.isBatchMode);
        StageBuffer.members.sort(TQ.Element.compare);
        for (var i = 0; i < StageBuffer.members.length; i++) {
            var ele = StageBuffer.members[i];
            var upperEle = StageBuffer.findUpperBoundary(ele.jsonObj.zIndex);
            ele._doAddItemToStage(upperEle);
        }
        StageBuffer.members.splice(0);
    };

    TQ.StageBuffer = StageBuffer;
}) ();
