/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var isUserControlling = false,
        initialized = false,
        t10 = 0, // 10倍放大的t
        tMin = 0,
        tMax = 0, //用秒s， 不要frame
        tEle = null,
        tMinEle = null,
        bodyEle = null;

    var htmlStr = '<div class="toolbar-layer">' +
        '<div id="timer-slider-2"></div>' +
        '<label id="timer-axis-value" class="ui-font-md inline"></label>' +
        // '<label id="time-slider-min-value" class="ui-font-md inline">0</label>' +
        '</div>';

    return {
        initialize: initialize
    };

    function initialize () {
        if (initialized) {
            setTimeout(onRangeChanged, 100);
            return;
        }

        initialized = true;
        t10 = 10 * TQ.Scene.localT2Global(TQ.FrameCounter.t());
        tMin = 0;
        tMax = TQ.FrameCounter.f2t(TQ.Scene.getTMax());
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
            max: tMax * 10,
            value: t10,   // 1个滑块
            // values: [t10, tMax/2],    // 2个滑块
            start: onMouseStart,
            slide: onMouseAction,
            change: onChange,
            stop: onMouseStop
        });

        displayTime(t10);
        TQ.FrameCounter.addHook(update);
        document.addEventListener(TQ.EVENT.SCENE_TIME_RANGE_CHANGED, onRangeChanged, false);
    }

    function onMouseStart () {
        isUserControlling = true;
    }

    function onMouseStop (event, ui) {
        t10 = ui.value;
        syncToCounter();
        isUserControlling = false;
    }

    function syncToCounter() {
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TQ.FrameCounter.cmdGotoFrame(TQ.FrameCounter.t2f(TQ.Scene.globalT2local(t10/10)));
        TQ.DirtyFlag.requestToUpdateAll();
    }
    function onMouseAction (event, ui) {
        t10 = ui.value;
        // console.log("Mouse Action: t10 = " + t10);
        displayTime(t10);
        syncToCounter();
        //ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
    }

    function onChange () {
        displayTime(t10);
    }

    function update (forceToUpdate) {
        if (forceToUpdate || !isUserControlling) {
            if (forceToUpdate || TQ.FrameCounter.isNew) {
                t10 = 10 * TQ.Scene.localT2Global(TQ.FrameCounter.t());
                bodyEle.slider("value", t10);
            }
        }
    }

    function displayTime (t10) {
        // tEle.innerText
        tEle.textContent = (t10/10).toFixed(1) + '/' + tMax.toString();
    }

    function onRangeChanged() {
        t10 = 10 * TQ.Scene.localT2Global(TQ.FrameCounter.t());
        tMin = 0;
        tMax = TQ.FrameCounter.f2t(TQ.Scene.getTMax());

        if (bodyEle) {
            bodyEle.slider('option', 'min', tMin);
            bodyEle.slider('option', 'max', tMax * 10);
            update (true);
        }
    }
}());
