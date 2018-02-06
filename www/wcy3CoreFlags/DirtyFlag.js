/**
 * Created by admin on 11/3/2015.
 */
var TQ = TQ || {};

(function() {
    function DirtyFlag() {
    }

    DirtyFlag.setElement = setElement;
    DirtyFlag.setElementOnly = setElementOnly;
    DirtyFlag.setLevel = setLevel;
    DirtyFlag.setScene = setAll;
    DirtyFlag.requestToUpdateAll = requestToUpdateAll;

    function setElementOnly(ele) {
        if (!!ele) {
            ele.dirty = true;
        }
    }

    function setElement(ele) {
        setElementOnly(ele);
        if (currScene) {
            currScene.isDirty = true;
            if (currScene.currentLevel) {
                currScene.currentLevel.isDirty = true;
            }
        }
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
