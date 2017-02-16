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
            w = 100;
        } else if (this.isMarker()) {
            w = 1;
        } else {
            w = this.displayObj.getWidth(true);
        }

        return w;
    };

    CreateJSAdapter.getHeight = function () {
        var h;
        if (this.isVirtualObject()) {// 对于Group物体
            h = 100;
        } else if (this.isMarker()) {
            h = 1;
        } else {
            h = this.displayObj.getHeight(true);
        }
        return h;
    };

    CreateJSAdapter.toDeviceCoord = function (displayObj, jsonObj) {
        if (!this.justMoved) {
            // this.setNdc(this.jsonObj);
        }
        this.justMoved = false;
        var obj_dc = this.world2Dc();
        displayObj.x = obj_dc.x;
        displayObj.y = obj_dc.y;
        displayObj.scaleX = obj_dc.sx;
        displayObj.scaleY = obj_dc.sy;
        displayObj.regX = obj_dc.pivotX * this.getWidth();
        displayObj.regY = obj_dc.pivotY * this.getHeight();
        displayObj.rotation = obj_dc.rotation;
    };

    CreateJSAdapter.getScale = function () {
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        return {sx: obj_pdc.sx, sy: obj_pdc.sy};
    };

    CreateJSAdapter.getPosition = function () { // in PDC
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        return {x: obj_pdc.x, y: obj_pdc.y};
    };

    CreateJSAdapter.getPositionInWorld = function () {
        return {x: this.jsonObj.x, y: this.jsonObj.y};
    };

    CreateJSAdapter.getPositionInNdc = function () {
        return {x: this.jsonObj.x, y: this.jsonObj.y};
    };

    CreateJSAdapter.getPositionInDc = function () {
        var obj_pdc = this.ndc2Pdc(this.jsonObj);
        var obj_dc = this.pdc2dc(obj_pdc);
        return {x: obj_dc.x, y: obj_dc.y};
    };

    CreateJSAdapter.ndc2Pdc = function (obj) {
        var sx = TQ.Config.workingRegionWidth,
            sy = TQ.Config.workingRegionHeight;

        var obj_pdc = {
            x: obj.x * sx,
            y: obj.y * sy,
            sx: obj.sx * sx,
            sy: obj.sy * sy,
            fontSize: (!obj.fontSize) ? 0 : obj.fontSize * sx,
            rotation: obj.rotation,
            pivotX: obj.pivotX,
            pivotY: obj.pivotY
        };

        return obj_pdc;
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
        var sx = 1 / TQ.Config.workingRegionWidth,
            sy = 1 / TQ.Config.workingRegionHeight;

        return {
            x: (ptDc.x === undefined) ? 0 : ptDc.x * sx,
            y: (ptDc.y === undefined) ? 0 : TQ.Utility.toWorldCoord(ptDc.y) * sy,
            //sx: (ptDc.sx === undefined) ? 1 : ptDc.sx * sx,
            //sy: (ptDc.sy === undefined) ? 1 : ptDc.sy * sy,
            //fontSize: (ptDc.fontSize === undefined) ? 0 : ptDc.fontSize * sx,
            //rotation: (ptDc.rotation === undefined) ? 0 : ptDc.rotation,
            //pivotX: (ptDc.pivotX === undefined) ? 0 : ptDc.pivotX,
            //pivotY: (ptDc.pivotY === undefined) ? 0 : ptDc.pivotY
        };
    };

    CreateJSAdapter.ndc2Dc = function(ptNdc) {
        return this.world2Dc(ptNdc);
    };

    CreateJSAdapter.world2Dc = function (ptWorld) {
        var sx = TQ.Config.workingRegionWidth,
            sy = TQ.Config.workingRegionHeight,
            ptDc;

        if (!ptWorld) {
            ptWorld = this.jsonObj;
            ptDc = {
                sx: (ptWorld.sx === undefined) ? 1 : ptWorld.sx * sx, // 只在toDeviceCoord中使用
                sy: (ptWorld.sy === undefined) ? 1 : ptWorld.sy * sy,
                //fontSize: (ptWorld.fontSize === undefined) ? 0 : ptWorld.fontSize * sx,
                rotation: (ptWorld.rotation === undefined) ? 0 : ptWorld.rotation,
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
            return ptWorld;
        }
        var ptObject = this.jsonObj.IM.multiply($V([ptWorld.x, ptWorld.y, 1]));
        return {x: ptObject.elements[0], y: ptObject.elements[1]};
    };

    CreateJSAdapter.scaleOne = function (desc) {
        var sx = 1 / this.getWidth(),
            sy = 1 / this.getHeight();
        desc.sx = sx;
        desc.sy = sy;
    };

    CreateJSAdapter.fontScaleOne = function (desc) {
        var realHeight = desc.fontSize / TQ.Config.workingRegionHeight;
        var pixel2Ndc = 1 / Math.max(this.getWidth(), this.getHeight());

        desc.sx = desc.sy = pixel2Ndc * realHeight;
    };

    TQ.CreateJSAdapter = CreateJSAdapter;
})();
