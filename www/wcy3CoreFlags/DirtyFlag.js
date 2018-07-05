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

    function setElement(ele, requestDirtyZ) {
        setElementOnly(ele);
        if (currScene) {
            currScene.isDirty = true;
            if (currScene.currentLevel) {
                currScene.currentLevel.isDirty = true;
                if (requestDirtyZ) {
                    currScene.currentLevel.isDirtyZ = true;
                }
            }
        }
    }

    function setLevel(level, requestDirtyZ) {
        if (!!level) {
            level.isDirty = true;
            if (requestDirtyZ) {
                level.isDirtyZ = true;
            }
        }
        currScene.isDirty = true;
    }

    function setAll() {
        return setElement();
    }

    function requestToUpdateAll() {
        if (currScene) {
            currScene.isDirty = true;
            if (currScene.currentLevel) {
                currScene.currentLevel.requestToUpdateAll();
            }
        }
    }

    TQ.DirtyFlag = DirtyFlag;
}());
