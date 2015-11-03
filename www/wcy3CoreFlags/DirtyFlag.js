/**
 * Created by admin on 11/3/2015.
 */
var TQ = TQ || {};

(function() {
    function DirtyFlag() {
    }

    function setElement(ele) {
        // ele.isDirty = true;
        ele.dirty = true;
        currScene.isDirty = true;
        currScene.currentLevel.isDirty = true;
    }

    function setLevel(level) {
        level.isDirty = true;
        currScene.isDirty = true;
    }

    TQ.DirtyFlag = DirtyFlag;
    DirtyFlag.setElement = setElement;
    DirtyFlag.setLevel = setLevel;
}());
