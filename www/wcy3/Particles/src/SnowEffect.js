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

    var FeParticle = SnowEffect;
    FeParticle.SNOW = "snow";
    FeParticle.RAIN = "rain";
    FeParticle.MONEY = "money";

    SnowEffect.initialize = initialize;
    SnowEffect.getDefaultOptions = getDefaultOptions;
    SnowEffect.start = start;
    SnowEffect.stop = stop;
    SnowEffect.change = change;
    SnowEffect.set = set;

    var snowOps = { // nXXXX是规范化到[0,10]区间的参数
        nStartSize: 3, // 雪花大小，  默认1,  取值范围1-5.
        nDirection: 0, // 落雪方向： 0：向下， 取值范围： -15度到15度，
        nDensity: 1, // 密度， 默认1（小雨）取值范围：1-10
        dy: 10,
        v0: 200,
        endOpacity: 0.1,
        endSize: -1,
        endSizeVar: 5,
        imageSrc: 'http://' + TQ.Config.DOMAIN_NAME + "/mcImages/xuehua1.png"
    };

    var rainOps = {
        nStartSize: 3, // 雨滴大小，  默认1,  取值范围1-5.
        nDirection: 0, // 落雪方向： 0：向下， 取值范围： -15度到15度，
        nDensity: 1, // 密度， 默认1（小雨）取值范围：1-10
        dy: 10,
        v0: 200,
        endOpacity: 0.1,
        endSize: -1,
        endSizeVar: 5,
        imageSrc: 'http://' + TQ.Config.DOMAIN_NAME + "/mcImages/yudi3.png"
    };

    var yuanbaoOps = {
        nStartSize: 3,
        nDirection: 0,
        nDensity: 1,
        dy: 10,
        v0: 200,
        endOpacity: 0.1,
        endSize: -1,
        endSizeVar: 5,
        imageSrc: 'http://' + TQ.Config.DOMAIN_NAME + "/mcImages/yuanbao1.png"
    };

    var defaultOps = snowOps,
        para1 = null,
        emitters = [],
        created = false,
        particleImage = null,
        images = {};

    function initialize() {
        emitters.splice(0);
        created = false;
        particleImage = null;
        images = {};
    }

    function getDefaultOptions(subType) {
        switch (subType) {
            case TQ.FeParticle.MONEY:
                return TQ.Base.Utility.shadowCopy(yuanbaoOps);
            case TQ.FeParticle.RAIN:
                return TQ.Base.Utility.shadowCopy(rainOps);
            case TQ.FeParticle.SNOW:
                return TQ.Base.Utility.shadowCopy(defaultOps);
            default:
                return TQ.Base.Utility.shadowCopy(defaultOps);
        }
    }

    function start(options) {
        change(options);
    }

    function change(options) {
        if (!options) {
            options = defaultOps;
        } else {
            if (options.nStartSize === undefined) {
                options.nStartSize = options.startSize;
            }
            if (options.nDirection === undefined) {
                options.nDirection = options.direction;
            }
            if (options.nDensity === undefined) {
                options.nDensity = options.nDensity;
            }

            if (options.imageSrc === undefined) {
                options.imageSrc = defaultOps.imageSrc;
            }
        }

        set(options);
    }

    function set(option) {
        option.startSize = TQ.MathExt.unifyValue10(parseFloat(option.nStartSize), 10, 20);
        option.direction = TQ.MathExt.unifyValue10(parseFloat(option.nDirection), 90-15, 90+15);
        option.density = TQ.MathExt.unifyValue10(parseFloat(option.nDensity), 30, 40);
        option.v0 = parseFloat(option.v0);
        para1 = option;
        if (!hasSameAsset()) {
            _loadAsset();
        } else {
            initEmitter(particleImage);
        }
    }

    function resetOne(emitter1, position) {
        emitter1.position = position;
        emitter1.speed = para1.v0; // 粒子的初始速度，
        emitter1.positionVarY = para1.dy;
        emitter1.angle = para1.direction;
        emitter1.endOpacity = para1.endOpacity;
        emitter1.startSize = para1.startSize;
        emitter1.startSizeVar = para1.startSize / 2; //10;
        emitter1.endSizeVar = para1.endSizeVar;
        emitter1.changeImage(particleImage);
    }

    function _loadAsset() {
        var asset = images[para1.imageSrc];
        if (asset) {
            initEmitter(asset);
        } else {
            asset = new Image();
            asset.onload = function () {
                images[para1.imageSrc] = asset;
                initEmitter(asset);
            };
            asset.src = para1.imageSrc;
        }
    }

    function hasSameAsset() {
        return (particleImage && (particleImage.src === para1.imageSrc));
    }

    // 停止下雨
    function stop() {// 立即停止，消失所有的雨滴
        createjs.ParticleEmitter.stopped = true;
    }

    function initEmitter(asset) {
        particleImage = asset;
        reset(para1);
        created = true;
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
                    resetOne(emitters[k], new createjs.Point(x, y));
                } else {
                    para.x = x;
                    para.y = y;
                    emitters.push(addParticleEmitter(para));
                }
                k++;
            }
        }
        createjs.ParticleEmitter.stopped = false;
    }

    function addParticleEmitter (para) {
        var emitter = new createjs.ParticleEmitter(particleImage);
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
    TQ.FeParticle = FeParticle;
}());
