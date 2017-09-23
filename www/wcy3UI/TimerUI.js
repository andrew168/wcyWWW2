/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var isUserControlling = false,
        initialized = false,
        t = 0,
        tMin = 0,
        tMaxFrame = 0,
        tEle = null,
        tMinEle = null,
        bodyEle = null;

    var htmlStr = '<div id="timer-slider-2"></div>' +
            '<label id="timer-axis-value" class="toolbar-layer ui-font-md inline"></label>';

    return {
        initialize: initialize
    };

    function initialize () {
        if (initialized) {
            setTimeout(onRangeChanged, 100);
            return;
        }

        initialized = true;
        t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        tMin = 0;
        tMaxFrame = Math.ceil(TQ.Scene.getTMax());
        var containerDiv = document.getElementById("timer-bar-div");
        TQ.AssertExt.isNotNull(containerDiv);
        containerDiv.innerHTML = htmlStr;
        bodyEle = $("#timer-slider-2");
        tEle = document.getElementById('timer-axis-value');
        tMinEle = document.getElementById('time-slider-min-value');

        bodyEle.slider({
            orientation: "horizontal",
            range: "min",
            min: tMin,
            max: tMaxFrame,
            value: t,   // 1个滑块
            // values: [t10, tMax/2],    // 2个滑块
            start: onMouseStart,
            slide: onMouseAction,
            change: onChange,
            stop: onMouseStop
        });

        displayTime(t);
        TQ.FrameCounter.addHook(update);
        document.addEventListener(TQ.EVENT.SCENE_TIME_RANGE_CHANGED, onRangeChanged, false);
    }

    function onMouseStart () {
        isUserControlling = true;
    }

    function onMouseStop (event, ui) {
        t = ui.value;
        syncToCounter();
        isUserControlling = false;
    }

    function syncToCounter() {
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TQ.FrameCounter.cmdGotoFrame(TQ.Scene.globalT2local(t));
        TQ.DirtyFlag.requestToUpdateAll();
    }
    function onMouseAction (event, ui) {
        t = ui.value;
        // TQ.Log.debugInfo("Mouse Action: t10 = " + t10);
        displayTime(t);
        syncToCounter();
        //ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
    }

    function onChange () {
        displayTime(t);
    }

    function update (forceToUpdate) {
        if (forceToUpdate || !isUserControlling) {
            if (forceToUpdate || TQ.FrameCounter.isNew) {
                t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
                bodyEle.slider("value", t);
            }
        }
    }

    function displayTime (t) {
        // tEle.innerText
        tEle.textContent = t.toFixed(0).toString() + '/' + tMaxFrame.toString();
    }

    function onRangeChanged() {
        t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        tMin = 0;
        tMaxFrame = Math.ceil(TQ.Scene.getTMax());

        if (bodyEle) {
            bodyEle.slider('option', 'min', tMin);
            bodyEle.slider('option', 'max', tMaxFrame);
            update (true);
        }
    }
}());
