/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var MIN_DURATION = 2; // 10 frames, ==> 0.5s
    var isUserControlling = false,
        initialized = false,
        rangeSlider = {
            minValue: 10,
            maxValue: 20,
            options: {
                floor: 0,
                ceil: 100,
                step: 1,
                minRange: MIN_DURATION,
                // maxRange: MIN_DURATION,
                pushRange: true,
                // translate: onTranslate,
                onStart: onMouseStart,
                onEnd: onMouseStop,
                onChange: onMouseAction // onChange,
            }
        };

    return {
        getT1: getT1,
        getT2: getT2,
        rangeSlider: rangeSlider,
        initialize: initialize,
        setGlobalTime: setGlobalTime
    };

    function initialize () {
        if (initialized) {
            setTimeout(onRangeChanged, 100);
            return;
        }

        initialized = true;
        rangeSlider.minValue = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        rangeSlider.options.floor = 0;
        rangeSlider.options.ceil = Math.ceil(TQ.Scene.getTMax());
        TQ.FrameCounter.addHook(update);
        // 迫使系统render slider
        document.addEventListener(TQ.EVENT.SCENE_TIME_RANGE_CHANGED, onRangeChanged, false);
        var editorService = angular.element(document.body).injector().get('EditorService');
        if (editorService && editorService.forceToRenderSlider) {
            editorService.forceToRenderSlider();
        }
    }

    function onMouseStart () {
        isUserControlling = true;
    }

    function onMouseStop (sliderId, modalValue) {
        syncToCounter(modalValue);
        isUserControlling = false;
    }

    function syncToCounter(t) {
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TQ.FrameCounter.cmdGotoFrame(TQ.Scene.globalT2local(t));
        TQ.DirtyFlag.requestToUpdateAll();
    }

    function setGlobalTime(globalV) {
        syncToCounter(globalV);
        update(true);
    }

    function onMouseAction(sliderId, modelValue, highValue, pointerType) {
        // TQ.Log.debugInfo("Mouse Action: t10 = " + t10);
        syncToCounter(modelValue);
        //ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
    }

    function update (forceToUpdate) {
        if (forceToUpdate || !isUserControlling) {
            if (forceToUpdate || TQ.FrameCounter.isNew) {
                rangeSlider.minValue = TQ.Scene.localT2Global(TQ.FrameCounter.v);
            }
        }
    }

    function onRangeChanged() {
        rangeSlider.minValue = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        rangeSlider.options.floor = 0;
        rangeSlider.options.ceil = Math.ceil(TQ.Scene.getTMax());

        update(true);
    }

    function getT1() {
        return TQ.Scene.globalT2local(TQ.FrameCounter.f2t(rangeSlider.minValue));
    }

    function getT2() {
        return TQ.Scene.globalT2local(TQ.FrameCounter.f2t(rangeSlider.maxValue));
    }

}());
