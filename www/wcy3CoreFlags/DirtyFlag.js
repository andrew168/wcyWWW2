/**
 * Created by admin on 11/3/2015.
 */
var TQ = TQ || {};

(function() {
    function DirtyFlag() {
    }

    DirtyFlag.setElement = setElement;
    DirtyFlag.setLevel = setLevel;
    DirtyFlag.setScene = setAll;
    DirtyFlag.requestToUpdateAll = requestToUpdateAll;

    function setElement(ele) {
        // ele.isDirty = true;
        if (!!ele) {
            ele.dirty = true;
        }
        currScene.isDirty = true;
        currScene.currentLevel.isDirty = true;
    }

    function setLevel(level) {
        if (!!level) {
            level.isDirty = true;
        }
        currScene.isDirty = true;
    }

    function setAll() {
        return setElement();
    }

    function requestToUpdateAll() {
        currScene.isDirty = true;
        currScene.currentLevel.requestToUpdateAll();
    }

    TQ.DirtyFlag = DirtyFlag;
}());
