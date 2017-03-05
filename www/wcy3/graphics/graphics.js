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

    Graphics.drawCircle = drawCicle;
    Graphics.drawRect = drawRect;
    Graphics.drawStar = drawStar;

    function drawCicle(shape, x, y, radius) { //shape is createJS.Shape
        var thickness = 1,
            edgeColor = "#000",
            gradientColorS = "#00F",
            gradientColorE = "#F00";

        shape.graphics.ss(thickness).beginStroke(edgeColor).
            beginRadialGradientFill([gradientColorS, gradientColorE], [0, 1], 0, 0, 0, 0, 0, radius).
            drawCircle(x, y, radius).endFill();
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

    TQ.Graphics = Graphics;
})();
