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
        this.isPlaying = false;
        if (!this.jsonObj.particles) {
            this.jsonObj.particles = TQ.SnowEffect.getDefaultOptions(this.jsonObj.type);
        }
        this.effect = this.isFEeffect() ? null : TQ.SnowEffect;

        // 要复制 父类中的逻辑
        this.loaded = true;
        this._afterItemLoaded();
        this.setTRSAVZ();
        TQ.DirtyFlag.setElement(this);
    };

    p.setTRSAVZ = function () {
        var jsonObj = this.jsonObj;
        // 可见性由父子共同决定：
        //  如果父物体为空， 该物体的可见性由自己的标志完全决定
        //  如果父物体非空：
        //      父亲实际不可见，则都不可见（一票否决制）；
        //      父亲实际可见，则孩子自己决定
        //
        //   物体的实际可见性就是 displayObj.visible,
        //          如果displayObj为空，用临时标志： visibleTemp,
        //
        var visSum = false;
        if (!this.parent) {
            visSum = jsonObj.isVis;
        } else {
            visSum = this.parent.isVisible() && jsonObj.isVis;
        }
        visSum = visSum || TQ.Element.showHidenObjectFlag;
        this.doShow(visSum);
    };

    p.doShow = function (isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible) {
            this.play();
            TQ.ParticleMgr.register(this);
        } else {
            TQ.ParticleMgr.unregister(this);
            this.stop();
        }
    };

    p.play = function () {
        if (this.isPlaying) {
            return;
        }
        this.isPlaying = true;

        var paras = this.jsonObj.particles;
        if (!paras) {
            paras = null;
            console.error("缺少参数： 粒子效果");
        }
        if (this.isFEeffect()) {
            TQ.ParticleMgr.feStart(paras);
        } else {
            this.effect.start(paras);
        }
    };

    p.stop = function () {
        if (this.isPlaying) {
            this.isPlaying = false;
            if (this.isFEeffect()) {
                TQ.ParticleMgr.feStop();
            } else {
                this.effect.stop();
            }
        }
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

    p.isFEeffect = function() {
        return ((this.jsonObj.type === TQ.Element.DescType.RAIN) ||
        (this.jsonObj.type === TQ.Element.DescType.SNOW))
    };

    TQ.ParticleElement = ParticleElement;
}());
