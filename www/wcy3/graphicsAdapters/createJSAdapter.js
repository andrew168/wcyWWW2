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

    var _rootBoneDefaultTsr = { // 缺省的TSR参数： 无平移， 无旋转， 无比例
        x: 0,
        y: 0,
        rotation: 0,
        sx: 1,
        sy: 1,
        M: TQ.Matrix2D.I(),
        IM: TQ.Matrix2D.I(),   // Inverse Matrix, 逆矩阵
        visible: true,  // 没有animeTrack， 没有M， 都应该是可见的
        alpha: 1
    };

    function getDefaultRootTsr() {
        return _rootBoneDefaultTsr;
    }

    CreateJSAdapter.getDefaultRootTsr = getDefaultRootTsr;
    CreateJSAdapter.attach = function(p) {
        for (var item in CreateJSAdapter) {
            if (typeof CreateJSAdapter[item] === "function") {
                if (item == "attach") {
                    continue;
                }

                if (!p[item]) {
                    p[item] = CreateJSAdapter[item];
                }
            }
        }
        return p;
    };

    CreateJSAdapter.getWidth = function () {
        var w;
        if (this.isVirtualObject()) {// 对于Group物体
            w = 1;
        } else if (this.isBitmap()) {
            w = this.displayObj.naturalWidth();
        } else {
            TQ.AssertExt.isNotNull(false, "发现新的元素类别：" + this.name);
        }

        return w;
    };

    CreateJSAdapter.getHeight = function () {
        var h;
        if (this.isVirtualObject()) {// 对于Group物体
            h = 1;
        } else if (this.isBitmap()) {
            h = this.displayObj.naturalHeight();
        } else {
            TQ.AssertExt.isNotNull(false, "发现新的元素类别：" + this.name);
        }
        return h;
    };

    CreateJSAdapter.toDeviceCoord = function (displayObj, jsonObj) {
        if (!this.justMoved) {
        }
        TQ.Log.debugInfo(this.jsonObj.type + ', jsonObj(x,y) = ' + this.jsonObj.x + ',' + this.jsonObj.y );
        this.justMoved = false;
        var obj_dc = this.world2Dc();
        displayObj.x = obj_dc.x;
        displayObj.y = obj_dc.y;
        displayObj.scaleX = (jsonObj.mirrorY ? -obj_dc.sx : obj_dc.sx);
        displayObj.scaleY = (jsonObj.mirrorX ? -obj_dc.sy : obj_dc.sy);
        displayObj.regX = obj_dc.pivotX * this.getWidth();
        displayObj.color = jsonObj.color;
        displayObj.alpha = jsonObj.alpha;

        // regX，Y坐标：(由createJS定义的)
        // *   +Y 向下， 同设备坐标一致
        // * 对于图像和Text： 原点regY=0在左上角，
        // * 对于Shape（圆， 矩形， 星形）： regXY（0，0) 在正中心

        // PivotXY: (在物体空间定义， 由TQ定义)
        // *   +Y 向上， 同世界坐标系一致
        // * 对于图像类： Pivot原点在左上角，
        // * 对于Shape中的圆：  Pivot原点在正中心
        if (displayObj instanceof createjs.Shape) {
            displayObj.regY = -obj_dc.pivotY * this.getHeight();
        } else {
            displayObj.regY = (1 - obj_dc.pivotY) * this.getHeight();
        }
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

    CreateJSAdapter.getPositionInNdc = function () {
        return this.pdc2Ndc(this.getPositionInWorld());
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
        var scale = TQ.Utility.getDc2WorldScale();
        return {
            x: (ptDc.x === undefined) ? 0 : ptDc.x * scale.sx,
            y: (ptDc.y === undefined) ? 0 : TQ.Utility.toWorldCoord(ptDc.y) * scale.sy,
            //sx: (ptDc.sx === undefined) ? 1 : ptDc.sx * sx,
            //sy: (ptDc.sy === undefined) ? 1 : ptDc.sy * sy,
            //fontSize: (ptDc.fontSize === undefined) ? 0 : ptDc.fontSize * sx,
            rotation: (ptDc.rotation === undefined) ? 0 : - ptDc.rotation,
            //pivotX: (ptDc.pivotX === undefined) ? 0 : ptDc.pivotX,
            //pivotY: (ptDc.pivotY === undefined) ? 0 : ptDc.pivotY
        };
    };

    CreateJSAdapter.dc2World2 = function (ptDc) {
        // DC坐标：是event中的(pageX, pageY)，window的innerWidth和Height坐标系，不含address bar， 原点在左上角，
        // World坐标： Canvas上的实际绘图区，
        var scale = TQ.Utility.getDc2WorldScale(),
            x0d = (TQ.State.innerWidth - TQ.Config.workingRegionWidth)/2,
            y0d = TQ.State.innerHeight - (TQ.State.innerHeight - TQ.Config.workingRegionHeight)/2;

        if (ptDc.x === undefined) {
            ptDc.x = 0;
        }
        if (ptDc.y === undefined) {
            ptDc.y = 0;
        }
        if (ptDc.rotation === undefined) {
            ptDc.rotation = 0;
        }

        return {
            x: (ptDc.x - x0d) * scale.sx,
            y: (y0d - ptDc.y) * scale.sy,
            rotation: -ptDc.rotation
        };
    };

    CreateJSAdapter.world2Dc = function (ptWorld) {
        var scale = TQ.Utility.getWorld2DcScale(),
            sx = scale.sx,
            sy = scale.sy,
            sMin = Math.min(sx, sy),
            ptDc;

        sx = sy = sMin; // 可以自适应到任何屏幕， 但是， 必须等比例
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
        ptDc.y = (ptWorld.y === undefined) ? 0 : TQ.Utility.toDeviceCoord(ptWorld.y * sy);
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

    CreateJSAdapter.dWorld2Object = function (displacementInWorld) {
        var originInWorld = {x:0, y:0},
            originInObject = this.world2Object(originInWorld),
            displacementInObj = this.world2Object(displacementInWorld);
        return {x: displacementInObj.x - originInObject.x, y: displacementInObj.y - originInObject.y};
    };

    CreateJSAdapter.dDc2Object = function (ptDc) {
        var p0Dc = {x: 0, y:0, rotation: 0},
            p0World = this.dc2World2(p0Dc),
            ptWorld = this.dc2World2(ptDc),
            p0Object = this.world2Object(p0World),
            ptObject = this.world2Object(ptWorld);


        return {
            x: ptObject.x - p0Object.x,
            y: ptObject.y - p0Object.y,
            rotation: ptObject.rotation - p0Object.rotation
        };
    };

    CreateJSAdapter.parentWorld2Object = function (ptWorld) {
        if (!ptWorld) {
            ptWorld = this.jsonObj;
        }

        if (!this.parent) {
            return ptWorld;
        }

        return this.parent.world2Object(ptWorld);
    };

    CreateJSAdapter.object2World = function (ptObj) {
        if (!ptObj || !this.jsonObj.M) {
            console.error("must have ptObj 和 M");
            return ptObj;
        }

        var ptWorld = this.jsonObj.M.multiply($V([ptObj.x, ptObj.y, 1]));
        if ((ptWorld.elements[2] < 0.99) || (ptWorld.elements[2] > 1.01)) {
            assertEqualsDelta(TQ.Dictionary.INVALID_PARAMETER, 1, ptWorld.elements[2], 0.01); //齐次分量应该近似为1
        }

        return {x: ptWorld.elements[0], y: ptWorld.elements[1]};
    };

    CreateJSAdapter.tsrObject2World = function (pose) {
        // Pose 总是临时生成的，
        var tsrObj = pose,
            shapeObj = [{x: 0, y: 0}],
            originObj = shapeObj[0];

        // 物体坐标 ===>到 世界坐标下
        // 平移部分：
        var tsrWorld = this.jsonObj,
            originWorld = this.object2World(originObj); //  only平移
        tsrWorld.x = originWorld.x;
        tsrWorld.y = originWorld.y;

        // 比例和旋转部分：
        var parentTSRWorld = (!this.parent || !this.parent.jsonObj) ? getDefaultRootTsr() : this.parent.jsonObj;
        tsrWorld.rotation = parentTSRWorld.rotation + tsrObj.rotation;
        tsrWorld.sx = parentTSRWorld.sx * tsrObj.sx;
        tsrWorld.sy = parentTSRWorld.sy * tsrObj.sy;

        // 可见性：
        tsrWorld.isVis = tsrObj.visible;
        if (tsrObj.color !== undefined) {
            tsrWorld.color = tsrObj.color;
        }
        if (tsrObj.alpha !== undefined) {
            tsrWorld.alpha = tsrObj.alpha;
        }
    };

    CreateJSAdapter.updateM = function (parent, Pose) {
        var tsrObj = Pose;
        if (!tsrObj) {
            TQ.Log.debugInfo("Root element, use default trsObj");
            tsrObj = getDefaultRootTsr();
        }

        if (!parent || !parent.M) {
            parent = getDefaultRootTsr();
        }

        var M = TQ.Matrix2D.transformation(tsrObj.x, tsrObj.y, tsrObj.rotation, tsrObj.sx, tsrObj.sy);
        var tsrWorld = this.jsonObj;
        tsrWorld.M = parent.M.multiply(M);
        tsrWorld.IM = null;   // 必须清除上一个时刻的 IM,因为M变了,IM过时了, 但是, 不要计算, 等到用时再算.
        tsrWorld.visible = parent.isVis;
        tsrWorld.alpha = tsrWorld.alpha * parent.alpha;
        // TQ.Log.matrixDebugInfo("parent: ", parent.M);
        TQ.Log.matrixDebugInfo(this.id + ": ", tsrWorld.M);
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
