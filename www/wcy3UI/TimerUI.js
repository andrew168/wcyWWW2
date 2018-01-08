/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var MIN_DURATION = 0; // 10 frames, ==> 0.5s
    var isUserControlling = false,
        initialized = false,
        rangeSlider = {
            minValue: 0,
            maxValue: 0,
            options: {
                floor: 0,
                ceil: 100,
                step: 1,
                minRange: MIN_DURATION,
                // maxRange: MIN_DURATION,
                pushRange: true,
                translate: onTranslate,
                onStart: onMouseStart,
                onEnd: onMouseStop,
                onChange: onMouseAction // onChange,
            }
        };

    return {
        getTObject1: getTObject1,
        getTObject2: getTObject2,
        onTrimCompleted: onTrimCompleted,
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
        rangeSlider.minValue = TQ.FrameCounter.t2f(TQ.Scene.localT2Global(TQ.FrameCounter.t()));
        rangeSlider.options.floor = 0;
        rangeSlider.options.ceil = Math.ceil(TQ.FrameCounter.t2f(TQ.Scene.getTMax()));
        TQ.FrameCounter.addHook(update);
        // 迫使系统render slider
        document.addEventListener(TQ.EVENT.SCENE_TIME_RANGE_CHANGED, onRangeChanged, false);
        onRangeChanged();
    }

    function onMouseStart () {
        isUserControlling = true;
    }


    function onMouseStop(sliderId, modelValue, highValue, pointerType) {
        if (TQ.State.showTrimTimeline) {
            syncToCounter(highValue);
        } else {
            syncToCounter(modelValue);
        }
        isUserControlling = false;
    }

    function syncToCounter(v) {
        var t = TQ.FrameCounter.f2t(v);
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        var tObj = TQ.Scene.globalT2local(t);
        TQ.FrameCounter.cmdGotoFrame(TQ.FrameCounter.t2f(tObj.t));
        TQ.DirtyFlag.requestToUpdateAll();
    }

    function setGlobalTime(globalT) {
        var globalV = TQ.FrameCounter.t2f(globalT);
        syncToCounter(globalV);
        update(true);
    }

    function onMouseAction(sliderId, modelValue, highValue, pointerType) {
        // TQ.Log.debugInfo("Mouse Action: t10 = " + t10);
        if (TQ.State.showTrimTimeline) {
            syncToCounter(highValue);
        } else {
            syncToCounter(modelValue);
        }
        //ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
    }

    function update (forceToUpdate) {
        if (forceToUpdate || !isUserControlling) {
            if (forceToUpdate || TQ.FrameCounter.isNew) {
                rangeSlider.minValue = TQ.FrameCounter.t2f(TQ.Scene.localT2Global(TQ.FrameCounter.t()));
            }
        }
    }

    function onRangeChanged() {
        rangeSlider.minValue = TQ.FrameCounter.t2f(TQ.Scene.localT2Global(TQ.FrameCounter.t()));
        rangeSlider.options.floor = 0;
        rangeSlider.options.ceil = Math.ceil(TQ.FrameCounter.t2f(TQ.Scene.getTMax()));

        var editorService = angular.element(document.body).injector().get('EditorService');
        if (editorService && editorService.forceToRenderSlider) {
            editorService.forceToRenderSlider();
        }

        update(true);
    }

    function onTrimCompleted() {
        rangeSlider.maxValue = rangeSlider.minValue;
        setGlobalTime(TQ.FrameCounter.f2t(rangeSlider.minValue));
    }

    function getTObject1() {
        return TQ.Scene.globalT2local(TQ.FrameCounter.f2t(rangeSlider.minValue), true);
    }

    function getTObject2() {
        return TQ.Scene.globalT2local(TQ.FrameCounter.f2t(rangeSlider.maxValue), true);
    }

    function onTranslate(value, id, which) {
        TQ.Log.debugInfo(value + ',' + id + ',' + which);
        var t,
            result;
        t = TQ.FrameCounter.f2t(value);
        if ((which === 'model') ||(which === 'high')) {
            result = t.toFixed(1);
        } else {
            if (which === 'floor') {
                result = t.toFixed(0) + '';
            } else if (which === 'ceil') {
                result = t.toFixed(0) + 's';
            }
        }
        return result;
    }
}());
