/**
 * Created by Andrewz on 3/18/2017.
 */
var TQDebugger = TQDebugger || {};
(function(){
    var _eleSelected = null;
    TQDebugger.dumpAll = dumpAll;
    TQDebugger.dumpSelected = dumpSelected;
    TQDebugger.reset = reset;

    function dumpAll() {
        dumpArray(0, currScene.currentLevel.elements);
    }

    function dumpSelected() {
        if (!_eleSelected) {
            _eleSelected = reset();
        }

        if (_eleSelected) {
            dumpOne(0, _eleSelected);
        }
    }

    function reset() {
        _eleSelected = TQ.SelectSet.peekEditableEle();
        if (!_eleSelected) {
            _eleSelected = TQ.SelectSet.peekLatestEditableEle();
            if (!_eleSelected) {
                console.log("select an element, first!");
            }
        }
        return _eleSelected;
    }

    function dumpArray(depth, elements) {
        if (!elements) {
            return;
        }

        var n = elements.length,
            i;

        for (i = 0; i < n; i++) {
            dumpOne(depth, elements[i]);
        }
    }

    function dumpOne(depth, e) {
        var msg = "";
        for (var j = 0; j < depth; j++) {
            msg += "  ";
        }

        var jsonObj = e.jsonObj;
        console.log(msg + e.jsonObj.type + "_" + e.id + ": z = " + e.getZ() + " x = " + jsonObj.x.toFixed(1) + " y=" +
                jsonObj.y.toFixed(1) + ", sx= " + jsonObj.sx.toFixed(1) + " sy= " + jsonObj.sy.toFixed(1) + ", ang = " + jsonObj.rotation.toFixed(1) +
                " pvX=" + jsonObj.pivotX.toFixed(2) + ", pvY=" + jsonObj.pivotY.toFixed(2));
        if (e.children && e.children.length > 0) {
            dumpArray(depth + 1, e.children);
        }
    }
}());
