/**
 * Created by Andrewz on 1/22/2017.
 */
/**
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
        counter = 0;

    ParticleMgr.removeAll = removeAll;
    ParticleMgr.pause = pause;
    ParticleMgr.resume = resume;
    ParticleMgr.initialize = function() {
        counter = 0;
        removeAll();
    };

    ParticleMgr.insertRain = function () {
        var desc = {name: TQ.Element.DescType.RAIN+counter, src: null, type: TQ.Element.DescType.RAIN};
        TQ.SceneEditor.addItem(desc);
    };

    ParticleMgr.insertSnow = function() {
        // particle 不需要上传本地图片， 所以，不需要通过EditService的addItem,
        // 而是直接调用SceneEditor的
        var desc = {name: TQ.Element.DescType.SNOW + counter, src: null, type: TQ.Element.DescType.SNOW};
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
        if (selectedElement) {
            selectedElement.stop();
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
            TQ.CommandMgr.directDo(new TQ.DeleteEleCommand(currScene, selectedElement));
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

    function resume() {
        createjs.ParticleEmitter.stopped = false;
    }

    TQ.ParticleMgr = ParticleMgr;
}());
