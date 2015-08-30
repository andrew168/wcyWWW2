var useHammer = false;
var hammertime = null;
var hammerEle = null;
var oldAngle = 0;

var addHammerByID = function(htmlEleID) {
    if (!hammertime) {
        var ele = document.getElementById(htmlEleID);
        addHammer(ele);
    }
};

var addHammer = function(ele) {

    if ((!useHammer) || (!!hammertime)) {
        return;
    }

    hammerEle = ele;
    hammertime = new Hammer(ele);
    hammertime.get('pinch').set({ enable: true });
    hammertime.get('rotate').set({ enable: true });
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
  
    var paras = null;
    var timeStamp = 0;
    var rotateTarget = null;

    var onRotate = function (ev) {
        if (ev.type !== 'rotate') {
            return;
        }

        var ele = null;
        var paras = getParas(ev);
        if (paras.isNewCmd) {
            ele = getTarget(ev);
            oldAngle = ele.getRotation();
            rotateTarget = ele;
        } else {
            ele = rotateTarget;
        }

        if (ele) {
            if ((paras.rotation) && !isNaN(paras.rotation)) {
                ele.rotateTo(oldAngle - paras.rotation);
            }
        }
    };

    var onPinch = function (ev) {
        if (ev.type !== 'pinch') {
            return;
        }

        var ele = null;
        var paras = getParas(ev);
        if (paras.isNewCmd) {
            ele = getTarget(ev);
            oldScale = ele.getScale();
            scaleTarget = ele;
        } else {
            ele = scaleTarget;
        }

        if (ele) {
            if ((paras.scale) && !isNaN(paras.scale)) {
                ele.scaleTo(oldScale * paras.scale);
            }
        }
    };

    var getParas = function (ev) {
        if (!paras) {
            paras = {};
            timeStamp = ev.timeStamp;
        }

        paras.type = ev.type;
        paras.timeDiff = ev.timeStamp - timeStamp;
        paras.isNewCmd = (paras.timeDiff > 100);
        paras.rotation = Math.truncate6(ev.rotation);
        timeStamp = ev.timeStamp;
        return paras;
    };

    // 只有第一个cmd需要target，其余的只是继续采用就行
    var getTarget = function (ev) {
        var o = {x: ev.center.x, y: ev.center.y};
        var displayObj = stage._getObjectsUnderPoint(o.x, o.y, null, true, 1);
        if (!!displayObj) {
            return displayObj.ele || null;
        }
        return null;
    };


    hammertime.on('pan pinch rotate swipe', function (ev) {
        if (!paras) {
            paras = {};
            paras.isNewCmd = true;
            timeStamp = ev.timeStamp;
        } else {
            paras.isNewCmd = (paras.type !== ev.type);
        }

        switch (ev.type) {
            case 'pinch':
                onPinch(ev);
                break;
            case 'rotate':
                onRotate(ev);
                break;
        }
    });
};
