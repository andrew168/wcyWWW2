
this.TQ = this.TQ || {};

(function () {

    /**
     * A shape particle
     * @constructor
     * @extends createjs.Shape
     */
    var RainEffect = function () {
    };

    RainEffect.start = start;
    var p = RainEffect;

    var defaultOps = {
        size: 3, // 雨滴大小，  默认1,  取值范围1-5.
        direction: 0, // 落雪方向： 0：向下， 取值范围： -15度到15度，
        density: 5 // 密度， 默认1（小雨）取值范围：1-10
    };

    function start(options) {
        if (!options) {
            options = defaultOps;
        } else {
            if (options.size === undefined) {
                options.size = defaultOps.size;
            }

            if (options.direction === undefined) {
                options.direction = defaultOps.direction;
            }

            if (options.density === undefined) {
                options.density = defaultOps.density;
            }
        }

        p.set(options.size, options.direction, options.density);
    }

    p.initialize = function () {
        RainEffect.loadAsset();
    };

    p.set = function(size, direction, density, res, dropImage) {
        size = TQ.MathExt.unifyValue10(size, 10, 20);
        direction = TQ.MathExt.unifyValue10(direction, 90-15, 90+15);
        density = TQ.MathExt.unifyValue10(density, 30, 40);
        p.rain1 = {density: 40, startSize:10, direction:110,    dy:50, v0:300, endOpacity:-1, endSize:0, endSizeVar:5};
        p.rain2 = {density: 40, startSize:20, direction:110,    dy:10, v0:100, endOpacity:0.1, endSize:-1, endSizeVar:5};
        p.para1 = {density: density, startSize:size, direction:direction,    dy:10, v0:100, endOpacity:0.1, endSize:-1, endSizeVar:5};
        if (!p.emitter) {
            p.para1 = p.rain1;
            p._loadAsset();
        } else {
            p._apply();
        }
        //if (!TQ.FrameCounter.isPlaying()) {
        //    $('#play').click();
        //}
        createjs.ParticleEmitter.stopped = false;
    };

    p._apply = function() {
        for (var i=0; i < p.emitters.length; i++) {
            var emitter = p.emitters[i];
            emitter.speed = p.para1.v0; // 粒子的初始速度，
            emitter.positionVarY = p.para1.dy;
            emitter.angle = p.para1.direction;
            emitter.endOpacity = p.para1.endOpacity;
            emitter.startSize = p.para1.startSize;
            emitter.startSizeVar = p.para1.startSize / 2; //10;
            emitter.endSizeVar = p.para1.endSizeVar;
        }
    };

    // 停止下雨
    p.stop = function() {
        createjs.ParticleEmitter.stopped = true;
    };

    p._loadAsset = function() {
        if (!p.particleImage) {
            p.particleImage = new Image();
            p.particleImage.onload = p._initCanvas;
            p.particleImage.src = 'http://'+TQ.Config.DOMAIN_NAME + "/mcImages/yudi3.png";
        }
    };

    p._initCanvas = function () {
        // TQ.Assert.isNotNull(canvas);

        if (!p.emitter) {
            //TQ.Assert.isTrue(false, "必须去除FPS， 否则竞争");
            //createjs.Ticker.setFPS(30);
            //createjs.Ticker.addListener(update);
            //addFPS();
            p._create(p.para1);
            p.created = true;
        } else {
            p._apply(p.para1);
        }
    };

    p._create = function(para) {
        var M = para.density;  // 雨滴的密度，
        var N = 1;
        p.emitters = [];
        for (var i =0; i < M; i++) {
            for (var j = 0; j < N; j++) {
                var x = i/M * canvas.width  + canvas.width/10;
                var y = j/N * canvas.height - canvas.height/10;
                para.x = x;
                para.y = y;
                p.emitters.push(p.addParticleEmitter(para));
            }}
    };

    p.addParticleEmitter = function(para) {
        var emitter = new createjs.ParticleEmitter(p.particleImage);
        emitter.position = new createjs.Point(para.x, para.y);
        emitter.emitterType = createjs.ParticleEmitterType.Emit;
        emitter.emissionRate = 2;  // 产生新粒子的速度
        emitter.maxParticles = 2000; // 粒子库的大小
        emitter.life = 9000; // 粒子的寿命长度
        emitter.lifeVar = 500;
        emitter.speed = para.v0; // 粒子的初始速度，
        emitter.speedVar = 20; //
        emitter.positionVarX = 20;
        emitter.positionVarY = para.dy;
        emitter.accelerationX = 0;
        emitter.accelerationY = 0;
        emitter.radialAcceleration = 0;
        emitter.radialAccelerationVar = 0;
        emitter.tangentalAcceleration = 0;
        emitter.tangentalAccelerationVar = 0;
        emitter.angle = para.direction;
        emitter.angleVar = 10;
        emitter.startSpin = 20;
        emitter.startSpinVar = 10;
        emitter.endSpin = null;
        emitter.endSpinVar = null;
        emitter.startColor = [190, 190, 255];
        emitter.startColorVar = [50, 50, 0];
        emitter.startOpacity = 1;
        emitter.endColor = null;
        emitter.endColorVar = null;
        emitter.endOpacity = para.endOpacity;
        emitter.startSize = para.startSize;
        emitter.startSizeVar = para.startSize / 2; //10;
        emitter.endSize = 0;
        emitter.endSizeVar = para.endSizeVar;
        p.emitter = emitter;
        stage.addChild(emitter);
        return emitter;
    };

    TQ.RainEffect = RainEffect;
}());


// var fpsLabel;       // label to show the current frames per second

function update() {
    // fpsLabel.text = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
    stage.update();
}

function addFPS() {
    // fpsLabel = new createjs.Text("-- fps", "bold 14px Arial", "#BBBBBB");
    // stage.addChild(fpsLabel);
}
