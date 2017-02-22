/**
 * Created by Andrewz on 2/13/2017.
 * 抽取并集中与create库直接相关的操作到此文件，
 * 以便于将来更换为其它的 lib
 */
var TQ = TQ || {};
(function () {
    'use strict';
    function CreateJSAdapter() {
    }

    CreateJSAdapter.attach = function(p) {
        for (var item in CreateJSAdapter) {
            if (typeof CreateJSAdapter[item] === "function") {
                if (item == "attach") {
                    continue;
                }

                p[item] = CreateJSAdapter[item];
            }
        }
        return p;
    };

    CreateJSAdapter.getWidth = function () {
        var w;
        if (this.isVirtualObject()) {// 对于Group物体
            w = 1;
        } else if (this.isMarker()) {
            w = TQ.Marker.RADIUS;
        } else {
            w = this.displayObj.getWidth(true);
        }

        return w;
    };

    CreateJSAdapter.getHeight = function () {
        var h;
        if (this.isVirtualObject()) {// 对于Group物体
            h = 1;
        } else if (this.isMarker()) {
            h = TQ.Marker.RADIUS;
        } else {
            h = this.displayObj.getHeight(true);
        }
        return h;
    };

    CreateJSAdapter.toDeviceCoord = function (displayObj, jsonObj) {
        if (!this.justMoved) {
        }
        this.justMoved = false;
        var obj_dc = this.world2Dc();
        displayObj.x = obj_dc.x;
        displayObj.y = obj_dc.y;
        displayObj.scaleX = obj_dc.sx;
        displayObj.scaleY = obj_dc.sy;
        displayObj.regX = obj_dc.pivotX * this.getWidth();
        displayObj.regY = (1 - obj_dc.pivotY) * this.getHeight(); // regY=0在左上角，同设备坐标一致
        displayObj.rotation = obj_dc.rotation;
    };

    CreateJSAdapter.getScale = function () {
        return CreateJSAdapter.getScaleInWorld();
    };

    CreateJSAdapter.getScaleInWorld = function () {
        return {sx: this.jsonObj.sx, sy: this.jsonObj.sy};
    };

    CreateJSAdapter.getPosition = function () { // in PDC
        return this.getPositionInWorld();
    };

    CreateJSAdapter.getPositionInWorld = function () {
        return {x: this.jsonObj.x, y: this.jsonObj.y};
    };

    CreateJSAdapter.getPositionInDc = function () {
        var obj_dc = this.world2Dc();
        return {x: obj_dc.x, y: obj_dc.y};
    };

    CreateJSAdapter.nw2World = function (oNWorld) {
        // 从规范化的世界坐标Normalized World到世界坐标系(像素坐标)
        var sx = currScene.getDesignatedWidth(),
            sy = currScene.getDesignatedHeight();

        var oWorld = {
            x: oNWorld.x * sx,
            y: oNWorld.y * sy,
            sx: oNWorld.sx * sx,
            sy: oNWorld.sy * sy,
            fontSize: (!oNWorld.fontSize) ? 0 : oNWorld.fontSize * sx,
            rotation: oNWorld.rotation,
            pivotX: oNWorld.pivotX,
            pivotY: oNWorld.pivotY
        };

        return oWorld;
    };

    CreateJSAdapter.pdc2Ndc = function (obj) {
        /* NDC 是归一化的设备坐标，DC， Y轴向上，[0,1]范围，jsonObj保存的是NDC坐标
         PDC是 伪设备坐标，DC， Y轴向上
         DC：是设备坐标， Y轴向下，用于displayObj
         */
        this.justMoved = true;
        var sx = 1 / TQ.Config.workingRegionWidth,
            sy = 1 / TQ.Config.workingRegionHeight;

        return {
            x: (obj.x === undefined) ? Number.NaN : obj.x * sx,
            y: (obj.y === undefined) ? Number.NaN : obj.y * sy,
            sx: (obj.sx === undefined) ? 1 : obj.sx * sx,
            sy: (obj.sy === undefined) ? 1 : obj.sy * sy,
            fontSize: (obj.fontSize === undefined) ? 0 : obj.fontSize * sx,
            rotation: (obj.rotation === undefined) ? 0 : obj.rotation,
            pivotX: (obj.pivotX === undefined) ? 0 : obj.pivotX,
            pivotY: (obj.pivotY === undefined) ? 0 : obj.pivotY
        };
    };

    CreateJSAdapter.dc2World = function(ptDc) {
        var sx = currScene.getDesignatedWidth() / TQ.Config.workingRegionWidth, // 把当前device尺寸，映射到  target尺寸
            sy = currScene.getDesignatedHeight() / TQ.Config.workingRegionHeight;

        return {
            x: (ptDc.x === undefined) ? 0 : ptDc.x * sx,
            y: (ptDc.y === undefined) ? 0 : TQ.Utility.toWorldCoord(ptDc.y) * sy,
            //sx: (ptDc.sx === undefined) ? 1 : ptDc.sx * sx,
            //sy: (ptDc.sy === undefined) ? 1 : ptDc.sy * sy,
            //fontSize: (ptDc.fontSize === undefined) ? 0 : ptDc.fontSize * sx,
            rotation: (ptDc.rotation === undefined) ? 0 : - ptDc.rotation,
            //pivotX: (ptDc.pivotX === undefined) ? 0 : ptDc.pivotX,
            //pivotY: (ptDc.pivotY === undefined) ? 0 : ptDc.pivotY
        };
    };

    CreateJSAdapter.world2Dc = function (ptWorld) {
        var sx = TQ.Config.workingRegionWidth / currScene.getDesignatedWidth(), // 把target尺寸映射到device尺寸
            sy = TQ.Config.workingRegionHeight / currScene.getDesignatedHeight(),
            ptDc;

        if (!ptWorld) {
            ptWorld = this.jsonObj;
            ptDc = {
                sx: (ptWorld.sx === undefined) ? 1 : ptWorld.sx * sx,
                sy: (ptWorld.sy === undefined) ? 1 : ptWorld.sy * sy,
                //fontSize: (ptWorld.fontSize === undefined) ? 0 : ptWorld.fontSize * sx,
                //createJS的角度： 逆时针是负的，所以要 改之
                rotation: (ptWorld.rotation === undefined) ? 0 : -ptWorld.rotation,
                pivotX: (ptWorld.pivotX === undefined) ? 0.5 : ptWorld.pivotX,
                pivotY: (ptWorld.pivotY === undefined) ? 0.5 : ptWorld.pivotY
            };
        } else {
            ptDc = {};
        }

        ptDc.x = (ptWorld.x === undefined) ? 0 : ptWorld.x * sx;
        ptDc.y = (ptWorld.y === undefined) ? 0 : TQ.Utility.toWorldCoord(ptWorld.y * sy);
        return ptDc;
    };

    CreateJSAdapter.world2Object = function(ptWorld) {
        if (!ptWorld) {
            ptWorld = this.jsonObj;
        }

        if (!this.jsonObj.IM) {
            if (!this.jsonObj.M) {
                return ptWorld;
            } else {
                this.jsonObj.IM = this.jsonObj.M.inverse();
            }
        }

        var ptObject = this.jsonObj.IM.multiply($V([ptWorld.x, ptWorld.y, 1]));
        return {x: ptObject.elements[0], y: ptObject.elements[1]};
    };

    CreateJSAdapter.object2World = function (ptObj) {
        if (!ptObj || !this.jsonObj.M) {
            console.error("must have ptObj 和 M");
            return ptObj;
        }

        var ptWorld = this.jsonObj.M.multiply($V([ptObj.x, ptObj.y, 1]));
        return {x: ptWorld.elements[0], y: ptWorld.elements[1]};
    };

    CreateJSAdapter.scaleOne = function (desc) {
        desc.sx = desc.sy = 1;
    };

    CreateJSAdapter.markerScaleOne = function (desc) {
        desc.sx = desc.sy = 1;
    };

    CreateJSAdapter.fontScaleOne = function (desc) {
        desc.sx = desc.sy = 1;
    };

    TQ.CreateJSAdapter = CreateJSAdapter;
})();
