/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午4:06
 */

this.tuqiangBase = this.tuqiangBase || {};

(function () {
    function Trsa() {
    }

    Trsa.do = function (target, thisLevel, offset, ev, item) {
        if (tuqiang.InputMap.isPresseds[tuqiang.InputMap.A]) {
            TQ.MoveCtrl.moveZ(target, offset, ev);
        } else if (tuqiang.InputMap.isPresseds[tuqiang.InputMap.LEFT_SHIFT]) {
            tuqiang.RotateOP.do(- offset.y / 10);
        } else {
            this._move(target, thisLevel, offset, ev);
            if (target.isClipPoint) {
                this._calculateScale(target, thisLevel, offset, ev, item);
            }

            if (!target.isClipPoint) {
                Trsa.displayClips(target);
            } else {
                Trsa.displayClips(item);
            }
        }
        // indicate that the stage should be updated on the next tick:
        thisLevel.dirty = true;
    }

    Trsa._move = function (target, thisLevel, offset, ev) {
        // offsetY 是device下的， 必须转为jsonObj所用的World坐标系或用户坐标系，才能赋给jsonObj
        target.x = ev.stageX + offset.x;
        target.y = ev.stageY + offset.y;
        target.jsonObj.x = target.x;
        target.jsonObj.y = tuqiang.Utility.toWorldCoord(target.y);
    }

    Trsa._scale = function (target, thisLevel, offset, ev, item) {
        // must move first;
        var sx = (target.x - item.getCenterX()) * 2 / item.naturalWidth();
        var sy = (target.y - item.getCenterY()) * 2 / item.naturalHeight();
        item.jsonObj.scaleX = item.scaleX = sx;
        item.jsonObj.scaleY = item.scaleY = sy;
    }

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

        offsets = [
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

        for (i = 0; i < 8; i++) {
            Trsa.positionIt(Trsa.clipPoints[i], target.x + offsets[i].x - CLIP_WIDTH_HALF, target.y + offsets[i].y - CLIP_WIDTH_HALF);
        }
    }

    Trsa.positionIt = function (jsonObj, x, y) {
        if (jsonObj.displayObj == undefined) {
            return;
        }

        jsonObj.x = jsonObj.displayObj.x = x;
        jsonObj.y = jsonObj.displayObj.y = y;
    }

    Trsa.clipPoints = null;
    Trsa.generateClips = function () {
        var jsonObjs = [
            {isVis:1, x:10.0, y:11.0, ID:0, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:20.0, y:11.0, ID:1, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:30.0, y:11.0, ID:2, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:40.0, y:11.0, ID:3, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:50.0, y:11.0, ID:4, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:60.0, y:11.0, ID:5, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:70.0, y:11.0, ID:6, isClipPoint:true, src:"assets/dragpoint.jpg"},
            {isVis:1, x:80.0, y:11.0, ID:7, isClipPoint:true, src:"assets/dragpoint.jpg"}
        ];
        Trsa.clipPoints = new Array(8);
        for (i = 0; i < 8; i++) {
            Trsa.clipPoints[i] = currScene.addItem(jsonObjs[i], jsonObjs[i].x, jsonObjs[i].y, 1);
        }
    }

    Trsa.getClipID = function (clip) {
        return clip.jsonObj.ID;
    }

    Trsa._calculateScale = function (target, thisLevel, offset, ev, item) {
        var sx = (target.x - item.getCenterX()) * 2 / item.naturalWidth();
        var sy = (target.y - item.getCenterY()) * 2 / item.naturalHeight();

        clipID = this.getClipID(target);
        switch (clipID) {
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
                alert("error");
        }

        item.jsonObj.scaleX = item.scaleX;
        item.jsonObj.scaleY = item.scaleY;
    }
    this.tuqiangBase.Trsa = Trsa;
}());