/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
    function ParticleElement(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj != 'string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.instance = null;
        this._isNewSkin = false;
        this.isFirstTimePlay = true;
        if (!!jsonObj.t0) { // 记录插入点， 只在插入点开始播放
            this.t0 = jsonObj.t0;
        } else {
            this.t0 = 0;
        }
        this.version = jsonObj.version;
        this.isMultiScene = (this.isVer2plus()) ? true : false;
        this.initialize(jsonObj);
    }

    var p = ParticleElement.prototype = new TQ.Element(null, null, null, null);
    p._parent_doShow = p.doShow;
    p.isSelectable = function () {
        return false;
    };

    p._doLoad = function () {
        p.isPlaying = false;
        var paras = this.jsonObj.particles;
        if (!paras) {
            console.error("缺少参数： 粒子效果");
            p.effect = TQ.SnowEffect;
        } else {
            switch (params.type) {
                case TQ.RainEffect.name:
                    p.effect = TQ.RainEffect;
                    break;
                case TQ.SnowEffect.name:
                default:
                    p.effect = TQ.SnowEffect;
            }
        }
    };

    p.doShow = function (isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible) this.play();
        else this.stop();
    };

    p.play = function () {
        if (p.isPlaying) {
            return;
        }
        p.isPlaying = true;

        var paras = this.jsonObj.particles;
        if (!paras) {
            console.error("缺少参数： 粒子效果");
        } else {
            p.effect.change(paras);
        }

        p.effect.start();
    };

    p.stop = function () {
        p.isPlaying = false;
        p.effect.stop();
    };

    p._doAddItemToStage = function () {};
    p._doRemoveFromStage = function () {};
    p.highlight = function(){};

    p.calculateLastFrame = function () {
        if (!this.instance) return 0;
        if (this.isMultiScene) return 0;  // ToDo: 需要补改变当前的录制长度， （如：200帧的默认值），跨场景的声音， 不能用来计算本场景的最后一帧
        return (this.t0 + this.instance.duration / 1000);
    };

    // 计算元素插入点的绝对时刻（与当前level无关， 只与元素所在level有关），
    p.toGlobalTime = function (t) {
        return (this.level.getT0() + t);
    };

    TQ.ParticleElement = ParticleElement;
}());
