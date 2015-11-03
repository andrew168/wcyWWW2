/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
function HUD() {
    this.icons = new Array();
    this.createIcons();
}

HUD.prototype.getNumOfIcons = function () {
    return this.icons.length;
},

    HUD.prototype.createIcons = function () {
        // Define a spritesheet. Note that this data was exported by Zoë.
        var ss = new createjs.SpriteSheet({
            "images":["assets/3-wq.png"],
            "frames":{
                "height":98,
                "width":103,
                "regX":0,
                "regY":0,
                "count":5
            }
        });

        var x0 = 90; // 550 - 30 - 30;
        var y0 = 366; // 21 +300 + 30 +15;
        var dx = 103;

        // x0 -= 4*dx - 12;
        // y0 -= 50;

        for (var i = 0; i < 5; i++) {
            this.icons[i] = new createjs.Sprite(ss);
            this.icons[i].x = x0 + i * dx;
            this.icons[i].y = y0;
            this.icons[i].gotoAndStop(i);
        }
    };

    HUD.prototype.getIcon = function (i) {
        if (i < this.icons.length) {
            return this.icons[i];
        }

        return null;
    };

    HUD.prototype.addIcons = function () {
        for (var i = 0; i < 5; i++) {
            stageContainer.addChild(this.icons[i]);
        }

        // Add Grant to the stage, and add it as a listener to Ticker to get updates each frame.
        // createjs.Ticker.setFPS(60);
        // createjs.Ticker.addListener(stage);
    };

    HUD.prototype.removeIcons = function () {
        for (var i = 0; i < 5; i++) {
            if (stageContainer.contains(this.icons[i])) {
                stageContainer.removeChild(this.icons[i]);
            }
        }
    };
    TQ.HUD = HUD;
}());
