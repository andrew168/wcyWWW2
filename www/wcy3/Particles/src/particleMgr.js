/**
 * Created by Andrewz on 1/22/2017.
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 粒子系统的增、删、改、查
 *
 * 是singleton
 * ** 全场粒子：同时只有1个实例在active， 但是， 整个作品， 可以有多个粒子实例（先下雨，后下雪）
 * ** 点粒子源：（鞭炮， 礼花），同时可以有多个
 */
TQ = TQ || {};
(function () {
    function ParticleMgr() {
    }

    var items = [],
        selectedElement = null,
        counter = 0,
        fullscreenEffect = TQ.SnowEffect,
        feRefers = [],
        children = [],
        lastOps = null,
        feReferCount = 0;

    ParticleMgr.change = change;
    ParticleMgr.feStart = feStart;
    ParticleMgr.feStop = feStop;
    ParticleMgr.getOps = getOps;
    ParticleMgr.pause = pause;
    ParticleMgr.removeAll = removeAll;
    ParticleMgr.resume = resume;
    ParticleMgr.initialize = function() {
        fullscreenEffect.initialize(); // 清除emitters;
        counter = 0;
        feRefers.splice(0);
        feReferCount = 0;
        removeAll();
    };

    function change() {
        var n = feRefers.length;
        if (n > 0) {
            var ele = feRefers[n - 1];
            ele.apply();
        }
    }

    function feStart(ele, paras) {
        feReferCount++;
        var lastFe = feRefers.shift();
        feRefers.push(ele);
        if (feReferCount === 1) {
            fullscreenEffect.start(paras);
        } else {
            if (lastFe) {
                TQ.CommandMgr.directDo(new TQ.HideCommand([lastFe], false)); // 隐藏上一个全屏特效
            }
            setTimeout(function() {
                fullscreenEffect.change(paras);
            });
        }

        selectedElement = ele;
        lastOps = paras;
        children[ele.jsonObj.subType] = ele;
    }

    function feStop() {
        feReferCount--;
        if (feReferCount < 0) {
            feReferCount = 0;
        }
        if (feReferCount === 0) {
            fullscreenEffect.stop();
            selectedElement = null;
        }
    }

    ParticleMgr.insertMoney =  function () {
        var existEle = children[TQ.FeParticle.MONEY];
        if (existEle) {
            existEle.show(true);
            existEle.play();
            selectedElement = existEle;
            return;
        }

        var desc = {
            name: TQ.FeParticle.MONEY + counter,
            src: null,
            type: TQ.Element.DescType.FULLSCREEN_EFFECT_PARTICLE,
            subType: TQ.FeParticle.MONEY
        };
        TQ.SceneEditor.addItem(desc);
    };

    ParticleMgr.insertRain = function () {
        var existEle = children[TQ.FeParticle.RAIN];
        if (existEle) {
            existEle.show(true);
            existEle.play();
            selectedElement = existEle;
            return;
        }

        var desc = {
            name: TQ.FeParticle.RAIN + counter,
            src: null,
            type: TQ.Element.DescType.FULLSCREEN_EFFECT_PARTICLE,
            subType: TQ.FeParticle.RAIN
        };

        TQ.SceneEditor.addItem(desc);
    };

    ParticleMgr.insertSnow = function () {
        var existEle = children[TQ.FeParticle.SNOW];
        if (existEle) {
            existEle.show(true);
            existEle.play();
            selectedElement = existEle;
            return;
        }

        // particle 不需要上传本地图片， 所以，不需要通过EditService的addItem,
        // 而是直接调用SceneEditor的
        var desc = {
            name: TQ.FeParticle.SNOW + counter,
            src: null,
            type: TQ.Element.DescType.FULLSCREEN_EFFECT_PARTICLE,
            subType: TQ.FeParticle.SNOW
        };
        TQ.SceneEditor.addItem(desc);
    };

    ParticleMgr.register = function(ele) {
        if (items.indexOf(ele) >= 0) {
            if (!selectedElement) {
                selectedElement = ele;
            }
            return;
        }
        items.push(ele);
        selectedElement = ele;
    };

    ParticleMgr.unregister = function (ele) {
        var id = items.indexOf(ele);
        if (id >= 0) {
            var temp = items.splice(id, 1);
            if (temp[0] === selectedElement) {
                selectedElement = null;
            }
        }
    };

    ParticleMgr.stop = function (evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        if (!!selectedElement) {
            // selectedElement.stop();
            TQ.CommandMgr.directDo(new TQ.HideCommand([selectedElement], false));
            selectedElement = null;
        }
    };

    ParticleMgr.deleteItem = function (evt) {
        if (evt) {
            evt.preventDefault();
            evt.stopPropagation();
        }

        if (selectedElement) {
            var temp = selectedElement;
            selectedElement.stop();
            TQ.CommandMgr.directDo(new TQ.DeleteEleCommand(currScene, temp));
            selectedElement = null;
        }
    };

    function removeAll() {
        selectedElement = null;
        for (var i = items.length - 1; i >= 0; i--) {
            var ele = items[i];
            // if (ele.isMultiScene) continue;
            ele.stop();
            items.splice(i, 1);
        }
    }

    function pause() {
        createjs.ParticleEmitter.stopped = true;
    }

    function getOps() {
        if (!lastOps) {
            lastOps = TQ.SnowEffect.getDefaultOptions();
        }

        return lastOps;
    }

    function resume() {
        createjs.ParticleEmitter.stopped = false;
    }

    TQ.ParticleMgr = ParticleMgr;
}());
