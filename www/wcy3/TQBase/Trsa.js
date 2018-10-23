/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午4:06
 */

window.TQBase = window.TQBase || {};

(function () {
    function Trsa() {
    }

    Trsa.lastOperationFlag = 0;
    // 功能单一化:
    // 1) 只是 生成新的世界坐标.
    // 2) 不绘制了(不修改displayObj的值), 留给element.update 统一做
    //
    // 但是, 提供自己的状态, 供外界查询
    Trsa.do = function (element, thisLevel, offset, ev) {
        var target = element.displayObj;
        if (element.isPinned()) {
            displayInfo2(TQ.Dictionary.Locked);
            return;
        }
        if (target == null) {
            displayInfo2("empty object or deleted, element.TBD = " +  element.TBD);
            return;
        }

        currScene.isSaved = false;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        if ( (TQ.SkinningCtrl.hasNew) )
        { // 它们可能删除了当前选中的物体;
        } else if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_SHIFT] || TQ.InputCtrl.vkeyLift) {
            element.setFlag(TQ.Element.ZING);
            TQ.MoveCtrl.moveZ(element, offset, ev);
        } else if (element.isJoint() && !TQ.InputCtrl.inSubobjectMode) {
            element.setFlag(TQ.Element.TRANSLATING);
            element.setFlag(TQ.Element.ROTATING);
            Trsa.lastOperationFlag = element.getOperationFlags();
            TQ.CompositeCommand.open();
            TQ.IKCtrl.do(element, offset, ev, false);
        } else {
            if (altIsPressed(ev) || TQ.InputCtrl.vkeyRotate) {
                element.setFlag(TQ.Element.ROTATING);
                Trsa.lastOperationFlag = element.getOperationFlags();
                TQ.IKCtrl.do(element, offset, ev, true);
            } else if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyScale) {
                element.setFlag(TQ.Element.SCALING);
                TQ.InputCtrl.scale(element, target, offset, ev);
            } else if (TQ.Utility.isMultiTouchEvent(ev) && ev.nativeEvent.scale) { // nativeEvent.scale在Win7触屏笔记本上不存在
                var scale = 1 + (ev.nativeEvent.scale - 1) * 0.5; // 减慢速度， 太快了
                TQ.InputCtrl.doScale(element, scale, scale);
            }   else {
                element.setFlag(TQ.Element.TRANSLATING);
                this._move(element, thisLevel, offset, ev);
                if (target.isClipPoint) {
                    this._calculateScale(target, thisLevel, offset, ev, element.host);
                }

                if (!target.isClipPoint) {
                    Trsa.displayClips(target);
                } else {
                    Trsa.displayClips(element.host);
                }
            }
        }

        Trsa.lastOperationFlag = element.getOperationFlags();
        var touches = TQ.Utility.getTouches(ev),
            posInfo = (touches.length <= 0 ) ? "" :
                ", at(" + touches[0].pageX + ", " + touches[0].pageY + ")";
        TQ.Log.debugInfo(ev.type + ", OP: " + Trsa.lastOperationFlag + posInfo);
        element.dirty = true;
        element.dirty2 = true;
        element.isOperating = true;
        // indicate that the stage should be updated on the next tick:
        thisLevel.dirty = true;
    };

    Trsa._move = function (element, thisLevel, offset, ev) {
        // offsetY 是device下的， 必须转为jsonObj所用的World坐标系或用户坐标系，才能赋给jsonObj
        var ptDevice = {
                x: ev.stageX + offset.x,
                y: ev.stageY + offset.y
            },
            ptWorld = element.dc2World(ptDevice);
        if (!element.isMarker()) {
            TQ.CommandMgr.directDo(new TQ.MoveCommand(element, ptWorld));
        } else {
            if (!!element.host){
                element.host.onMoveMarker(element, ptWorld);
            }
        }
        if (TQ.InputCtrl.leaveTraceOn) {
            TQ.TraceMgr.addNewPosition(element);
        }
    };

    /***
     *   ---> y
     *   |     0    7    6
     *   V
     *         1         5
     *
     *         2    3    4
     *
     * @param target
     */
    Trsa.displayClips = function (target) {
        if (!TQ.Config.DISPLAY_CLIPS) {
          return ;
        }

        const CLIP_WIDTH_HALF = 16 / 2;
        if ((Trsa.clipPoints == undefined) || (Trsa.clipPoints == null)
            ||(Trsa.clipPoints[0] == undefined)) {
            Trsa.generateClips();
        }

        if (target.isClipPoint) {
            return;
        }

        var h = target.getHeight();
        var w = target.getWidth();

        var offsets = [
            {"x":0, "y":0},
            {"x":0, "y":h / 2},
            {"x":0, "y":h},
            {"x":w / 2, "y":h},
            {"x":w, "y":h},
            {"x":w, "y":h / 2},
            {"x":w, "y":0},
            {"x":w / 2, "y":0},
            {"x":0, "y":0}
        ];

        for (var i = 0; i < 8; i++) {
            Trsa.positionIt(Trsa.clipPoints[i], target.x + offsets[i].x - CLIP_WIDTH_HALF, target.y + offsets[i].y - CLIP_WIDTH_HALF);
        }
    };

    Trsa.positionIt = function (jsonObj, x, y) {
        if (jsonObj.displayObj == undefined) {
            return;
        }

        jsonObj.x = jsonObj.displayObj.x = x;
        jsonObj.y = jsonObj.displayObj.y = y;
    };

    Trsa.clipPoints = null;
    Trsa.generateClips = function () {
        var jsonObjs = [
            {isVis:1, x:10.0, y:11.0, ID:0, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:20.0, y:11.0, ID:1, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:30.0, y:11.0, ID:2, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:40.0, y:11.0, ID:3, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:50.0, y:11.0, ID:4, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:60.0, y:11.0, ID:5, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:70.0, y:11.0, ID:6, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:80.0, y:11.0, ID:7, isClipPoint:true, src:"sysImages/dragpoint.jpg"}
        ];
        Trsa.clipPoints = new Array(8);
        for (var i = 0; i < 8; i++) {
            Trsa.clipPoints[i] = currScene.addItem(jsonObjs[i], jsonObjs[i].x, jsonObjs[i].y, 1);
        }
    };

    Trsa.getClipId = function (clip) {
        return clip.jsonObj.ID;
    };

    Trsa._calculateScale = function (target, thisLevel, offset, ev, item) {
        var sx = (target.x - item.getCenterX()) * 2 / item.naturalWidth();
        var sy = (target.y - item.getCenterY()) * 2 / item.naturalHeight();

        var clipId = this.getClipId(target);
        switch (clipId) {
            case 3:
                item.scaleY = sy;
                break;
            case 4:
                item.scaleX = sx;
                item.scaleY = sy;
                break;
            case 5:
                item.scaleX = sx;
                break;
            default:
                assertNotHere(TQ.Dictionary.INVALID_PARAMETER); //夹点ID不对
        }

        item.jsonObj.scaleX = item.scaleX;
        item.jsonObj.scaleY = item.scaleY;
    };

    function altIsPressed(ev) {
        if (ev.altKey !== undefined) {
            return ev.altKey;
        } else if (ev.gesture && ev.gesture.srcEvent) {
            return ev.gesture.srcEvent.altKey;
        }
        return false;
    }
    TQBase.Trsa = Trsa;
}());
