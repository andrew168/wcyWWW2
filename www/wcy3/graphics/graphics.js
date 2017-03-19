/**
 * Created by Andrewz on 3/4/2017.
 * 抽取并集中底层函数， 建立自己的绘图库layer，
 * 以便于将来切换到createJS之外的library，
 */
var TQ = TQ || {};
(function () {
    'use strict';
    function Graphics() {
    }

    Graphics.drawBubble = drawBubble;
    Graphics.drawCircle = drawCicle;
    Graphics.drawRect = drawRect;
    Graphics.drawStar = drawStar;
    Graphics.getCanvas = getCanvas;
    Graphics.setCanvas = setCanvas;

    var _canvas = null;
    function getCanvas() {
        if (!_canvas) {
            _canvas = document.getElementById("testCanvas");
        }
        return _canvas;
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

    function drawCicle(shape, x, y, radius) { //shape is createJS.Shape
        var thickness = 1,
            edgeColor = "#000",
            gradientColorS = "#00F",
            gradientColorE = "#F00";

        shape.graphics.ss(thickness).beginStroke(edgeColor).
            beginRadialGradientFill([gradientColorS, gradientColorE], [0, 1], 0, 0, 0, 0, 0, radius).
            drawCircle(x, y, radius).endFill();
    }

    function drawBubble(shape, bubble) {
        //  正中心是 原点
        drawRectBubble(shape, bubble.xmin, bubble.ymin, bubble.width, bubble.height,
            bubble.radiusTL, bubble.radiusTR, bubble.radiusBR, bubble.radiusBL, bubble.anchor)
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

    function drawRectBubble(shape, x, y, w, h, radiusTL, radiusTR, radiusBR, radiusBL, anchor) {
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

        var thickness = 1,
            edgeColor = "#000",
            fillColor = "#DDD";

        shape.graphics.ss(thickness).beginStroke(edgeColor).
            beginFill(fillColor).
            moveTo(x2 - radiusTR, y).
            arcTo(x2 + radiusTR * mTR, y - radiusTR * mTR, x2, y + radiusTR, radiusTR).
            lineTo(x2, y2 - radiusBR).
            arcTo(x2 + radiusBR * mBR, y2 + radiusBR * mBR, x2 - radiusBR, y2, radiusBR).
            lineTo(anchor[0].x, anchor[0].y).
            lineTo(anchor[1].x, anchor[1].y).
            lineTo(anchor[2].x, anchor[2].y).
            lineTo(x + radiusTL, y2).
            arcTo(x - radiusBL * mBL, y2 + radiusBL * mBL, x, y2 - radiusBL, radiusBL).
            lineTo(x, y + radiusTL).
            arcTo(x - radiusTL * mTL, y - radiusTL * mTL, x + radiusTL, y, radiusTL).
            closePath().
            endFill();
    }

    TQ.Graphics = Graphics;
})();
