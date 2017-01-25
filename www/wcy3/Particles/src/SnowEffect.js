var TQ = TQ || {};

(function () {
    'use strict';

    /**
     * A shape particle
     * @constructor
     * @extends createjs.Shape
     */
    var SnowEffect = function () {
    };

    SnowEffect.initialize = initialize;
    SnowEffect.getDefaultOptions = getDefaultOptions;
    SnowEffect.start = start;
    SnowEffect.stop = stop;
    SnowEffect.change = change;
    SnowEffect.set = set;

    var defaultOps = {
        startSize: 3, // 雪花大小，  默认1,  取值范围1-5.
        direction: 0, // 落雪方向： 0：向下， 取值范围： -15度到15度，
        density: 2.8, // 密度， 默认1（小雨）取值范围：1-10
        dy: 10,
        v0: 400,
        endOpacity: 0.1,
        endSize: -1,
        endSizeVar: 5,
        imageSrc: 'http://' + TQ.Config.DOMAIN_NAME + "/mcImages/xuehua1.png"
    };

    var rainOps = {
        startSize: 3, // 雨滴大小，  默认1,  取值范围1-5.
        direction: 0, // 落雪方向： 0：向下， 取值范围： -15度到15度，
        density: 2, // 密度， 默认1（小雨）取值范围：1-10
        dy: 10,
        v0: 400,
        endOpacity: 0.1,
        endSize: -1,
        endSizeVar: 5,
        imageSrc: 'http://' + TQ.Config.DOMAIN_NAME + "/mcImages/yudi3.png"
    };

    var para1 = null,
        emitter = null,
        emitters = [],
        created = false,
        particleImage = null;

    function initialize() {
        emitters.splice(0);
    }

    function getDefaultOptions(type) {
        if (type === TQ.Element.DescType.RAIN) {
            return rainOps;
        }
        return defaultOps;
    }

    function start(options) {
        change(options);
    }

    function change(options) {
        if (!options) {
            options = defaultOps;
        } else {
            if (options.startSize === undefined) {
                options.startSize = defaultOps.startSize;
            }

            if (options.direction === undefined) {
                options.direction = defaultOps.direction;
            }

            if (options.density === undefined) {
                options.density = defaultOps.density;
            }

            if (options.imageSrc === undefined) {
                options.imageSrc = defaultOps.imageSrc;
            }
        }

        set(options);
    }

    function set(option) {
        option.startSize = TQ.MathExt.unifyValue10(option.startSize, 10, 20);
        option.direction = TQ.MathExt.unifyValue10(option.direction, 90-15, 90+15);
        option.density = TQ.MathExt.unifyValue10(option.density, 30, 40);
        para1 = option;
        if (!emitter) {
            _loadAsset();
        } else {
            reset(para1);
            _apply();
        }
        createjs.ParticleEmitter.stopped = false;
    }

    function _apply() {
        if (!hasSameAsset()) {
            particleImage.src = para1.imageSrc;
            particleImage.onload = _apply();
            return;
        }
        for (var i=0; i < emitters.length; i++) {
            var emitter = emitters[i];
            emitter.speed = para1.v0; // 粒子的初始速度，
            emitter.positionVarY = para1.dy;
            emitter.angle = para1.direction;
            emitter.endOpacity = para1.endOpacity;
            emitter.startSize = para1.startSize;
            emitter.startSizeVar = para1.startSize / 2; //10;
            emitter.endSizeVar = para1.endSizeVar;
        }
    }

    function _loadAsset () {
        if (!particleImage) {
            particleImage = new Image();
            particleImage.onload = _initCanvas;
            particleImage.src = para1.imageSrc;
        }
    }

    function hasSameAsset() {
        return particleImage.src === para1.imageSrc;
    }

    // 停止下雨
    function stop() {// 立即停止，消失所有的雨滴
        createjs.ParticleEmitter.stopped = true;
    }

    function _initCanvas  () {
        TQ.Assert.isNotNull(canvas);

        if (!emitter) {
            reset(para1);
            created = true;
        } else {
            _apply(para1);
        }
    }

    function reset(para) {
        var M = para.density;  // 雪花的密度，
        var N = 1;
        var k=0;
        for (var i = 0; i < M; i++) {
            for (var j = 0; j < N; j++) {
                var x = i / M * canvas.width + canvas.width / 10;
                var y = j / N * canvas.height - canvas.height / 10;
                if ((k < emitters.length) && (emitters[k])) {
                    emitters[k].position = new createjs.Point(x, y);
                } else {
                    para.x = x;
                    para.y = y;
                    emitters.push(addParticleEmitter(para));
                }
                k++;
            }
        }
    }

    function addParticleEmitter (para) {
        emitter = new createjs.ParticleEmitter(particleImage);
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
        stageContainer.addChild(emitter);
        return emitter;
    }

    TQ.SnowEffect = SnowEffect;
}());
