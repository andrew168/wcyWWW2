/**
 * Created by Andrewz on 3/4/2017.
 * 抽取并集中底层函数， 建立自己的绘图库layer，
 * 以便于将来切换到createJS之外的library，
 */
var TQ = TQ || {};
TQ.Graphics = (function () {
    'use strict';
    var ET_MOVETO = 1, // Element Type in polygon
        ET_ARC = 2,
        ET_LINE = 3;

    var _canvas = null;

    return {
        drawBubble: drawBubble,
        drawCircle: drawCircle,
        drawRect: drawRect,
        drawStar: drawStar,
        getCanvas: getCanvas,
        getCanvasBkgColor: getCanvasBkgColor,
        getCanvasWidth: getCanvasWidth,
        getCanvasHeight: getCanvasHeight,
        getStage: getStage,
        setCanvas: setCanvas,
        findElementAtZ: findElementAtZ
    };

    function getStage() {
        return stageContainer;
    }

    function getCanvas() {
        if (!_canvas) {
            _canvas = document.getElementById("testCanvas");
        }
        return _canvas;
    }

    function getCanvasWidth() {
        return getCanvas().width;
    }

    function getCanvasHeight() {
        return getCanvas().height;
    }

    function getCanvasBkgColor() {
        TQ.AssertExt.invalidLogic(!!_canvas);
        return window.getComputedStyle(_canvas, null).getPropertyValue('background-color');
    }

    function setCanvas() {
        if (_canvas) {
            _canvas.height = Math.round(TQ.Config.workingRegionHeight);
            _canvas.width = Math.round(TQ.Config.workingRegionWidth);
            _canvas.style.top = Math.round(TQ.Config.workingRegionY0) + "px";
            _canvas.style.left = Math.round(TQ.Config.workingRegionX0) + "px";
            if (!!currScene) {
                console.log(TQ.State.viewportWidth, TQ.State.viewportHeight, "---", TQ.Config.workingRegionWidth, TQ.Config.workingRegionHeight, "---", currScene.getDesignatedWidth(), currScene.getDesignatedHeight(), "AAAAA");
            }
        }
    }

    function drawCircle(shape, x, y, radius, gradientColorS, gradientColorE) { //shape is createJS.Shape
        var thickness = 1,
            edgeColor = "#000";

        if (!gradientColorS) { // 兼容
            gradientColorS = "#00F";
            gradientColorE = "#F00";
        }

        shape.graphics.ss(thickness).beginStroke(edgeColor).
            beginRadialGradientFill([gradientColorS, gradientColorE], [0, 1], 0, 0, 0, 0, 0, radius).
            drawCircle(x, y, radius).endFill();
    }

    function drawBubble(shape, bubble) {
        //  正中心是 原点
        var geoModel = calBubbleModel(bubble.xmin, bubble.ymin, bubble.width, bubble.height,
            bubble.radiusTL, bubble.radiusTR, bubble.radiusBR, bubble.radiusBL, bubble.anchor);
        drawPolygon(shape, geoModel);
    }

    function drawRect(shape, x0,y0, w, h) {
        // 左下角， + pivot
        var thickness = 1,
            edgeColor = "#000";
        var radius = 2;
        var xc = x0 - w/2,
            yc = y0 - h/2;

        shape.graphics.ss(thickness).beginStroke(edgeColor).
            drawRoundRect(xc, yc, w, h, radius).
            endFill();
    }

    function drawStar(shape, x, y, w, h) {
        var thickness = 1,
            edgeColor = "#000",
            radius = Math.min(w, h),
            edgeNumber = 6;

        shape.graphics.ss(thickness).beginStroke(edgeColor).
            drawPolyStar(x, y, radius, edgeNumber, 0).
            endFill();
    }

    function calBubbleModel(x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL, anchor) {
        // 在物体空间计算
        var max = (w < h ? w : h) / 2;
        var mTL = 0, mTR = 0, mBR = 0, mBL = 0,
            x2 = x + w,
            y2 = y + h;

        if (radiusTL < 0) {
            radiusTL *= (mTL = -1);
        }
        if (radiusTL > max) {
            radiusTL = max;
        }
        if (radiusTR < 0) {
            radiusTR *= (mTR = -1);
        }
        if (radiusTR > max) {
            radiusTR = max;
        }
        if (radiusBR < 0) {
            radiusBR *= (mBR = -1);
        }
        if (radiusBR > max) {
            radiusBR = max;
        }
        if (radiusBL < 0) {
            radiusBL *= (mBL = -1);
        }
        if (radiusBL > max) {
            radiusBL = max;
        }

        return [{type: ET_MOVETO, x: x2 - radiusTR, y: y},
            {type: ET_ARC, x: x2 + radiusTR * mTR, y: y - radiusTR * mTR, x2: x2, y2: y + radiusTR, r: radiusTR},
            {type: ET_LINE, x: x2, y: y2 - radiusBR},
            {type: ET_ARC, x: x2 + radiusBR * mBR, y: y2 + radiusBR * mBR, x2: x2 - radiusBR, y2: y2, r: radiusBR},
            {type: ET_LINE, x: x + radiusTL, y: y2},
            {type: ET_ARC, x: x - radiusBL * mBL, y: y2 + radiusBL * mBL, x2: x, y2: y2 - radiusBL, r: radiusBL},
            {type: ET_LINE, x: x, y: y + radiusTL},
            {type: ET_ARC, x: x - radiusTL * mTL, y: y - radiusTL * mTL, x2: x + radiusTL, y2: y, r: radiusTL},
            {type: ET_LINE, x: anchor[2].x, y: anchor[2].y},
            {type: ET_LINE, x: anchor[1].x, y: anchor[1].y},
            {type: ET_LINE, x: anchor[0].x, y: anchor[0].y}
        ];
    }

    function drawPolygon(shape, geoModel) {
        // 转为设备空间
        var thickness = 1,
            edgeColor = "#000",
            fillColor = "#DDD";
        var brush = shape.graphics.ss(thickness).beginStroke(edgeColor).
            beginFill(fillColor);
        var i;
        for (i = 0; i < geoModel.length; i++) {
            var item = geoModel[i];
            switch (item.type) {
                case ET_MOVETO:
                    brush.moveTo(item.x, toCanvasDevice(item.y));
                    break;
                case ET_LINE:
                    brush.lineTo(item.x, toCanvasDevice(item.y));
                    break;
                case ET_ARC:
                    brush.arcTo(item.x, toCanvasDevice(item.y), item.x2, toCanvasDevice(item.y2), item.r);
                    break;
                default:
                    console.error("known type!", item.type);
            }
        }
        brush.closePath().
            endFill();
    }

    function toCanvasDevice(objY) {  //只是反Y坐标， 不能被Height减，否则有系统误差
        return -objY;
    }

    // stage
    function findElementAtZ(z) {
        var displayObj = stageContainer.getChildAt(z),
            ele = (!displayObj) ? null:  displayObj.ele;
        while (ele && ele.parent) {
            ele = ele.parent;
        }

        return ele;
    }
})();
