/**
 * Created by admin on 11/3/2015.
 */
var TQ = TQ || {};

(function() {
    function DirtyFlag() {
    }

    DirtyFlag.setEdited = setEdited; // 元素的添加、删除、成组、加关节、TRS等。
    DirtyFlag.setElement = setElement; // 播放的时候， 也可能有位置变化（但是由于时间变化导致的， 非用户操作）
    DirtyFlag.setElementOnly = setElementOnly;
    DirtyFlag.setLevel = setLevel;
    DirtyFlag.setCurrentLevel = setCurrentLevel;
    DirtyFlag.setScene = setAll;
    DirtyFlag.requestToUpdateAll = requestToUpdateAll;

    function setElementOnly(ele) {
        if (!!ele) {
            ele.dirty = true;
        }
    }

    function setEdited(ele) {
      currScene.hasStaleThumbnail = true;
      setElement(ele, true);
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

    function setCurrentLevel(requestDirtyZ) {
      setLevel(currScene.currentLevel, requestDirtyZ);
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
