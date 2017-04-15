/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var isUserControlling = false,
        initialized = false;
        t = 0,
        tMin = 0,
        tMaxFrame = 0,
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
        t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        tMin = 0;
        tMaxFrame = TQ.Scene.getTMax();
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
            // values: [t, tMaxFrame/2],    // 2个滑块
            start: onMouseStart,
            slide: onMouseAction,
            change: onChange,
            stop: onMouseStop
        });

        displayRange();
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
        // t = bodyEle.slider("value");
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TQ.FrameCounter.cmdGotoFrame(TQ.FrameCounter.t2f(TQ.Scene.globalT2local(t)));
        TQ.DirtyFlag.requestToUpdateAll();
    }
    function onMouseAction (event, ui) {
        t = ui.value;
        // console.log("Mouse Action: t = " + t);
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
        tEle.textContent = t.toString() + '/' + tMaxFrame.toString();
    }

    function onRangeChanged() {
        t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        tMin = 0;
        tMaxFrame = TQ.Scene.getTMax();

        if (bodyEle) {
            bodyEle.slider('option', 'min', tMin);
            bodyEle.slider('option', 'max', tMaxFrame);
            update (true);
        }
    }

    function displayRange() {
        // tMinEle.innerText = " : " + tMin + "--" + tMaxFrame;
    }
}());
