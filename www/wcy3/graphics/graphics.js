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

    function drawCicle(shape, x, y, radius) { //shape is createJS.Shape
        shape.graphics.ss(radius).beginStroke("#0F0").
            beginRadialGradientFill(["#FFF", "#F00"], [0, 1], 0, 0, 0, 0, 0, radius).
            drawCircle(x, y, radius).endFill();
    }

    TQ.Graphics = Graphics;
})();
