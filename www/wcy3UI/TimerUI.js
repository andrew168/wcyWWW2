/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var t = 0,
        tMinFrame = 0,
        tMaxFrame = 0,
        tEle = null;

    var htmlStr =
        '<div id="time-axis-div" class="toolbar-layer">' +
        '<input id="timer-slider-2" atype="range" min="0" max="5" data-rangeslider>' +
        '<output id="time-value"></output>' +
        '</div>';

    function initialize () {
        t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
        tMinFrame = 0;
        tMaxFrame = TQ.Scene.getTMax();
        var containerDiv = document.getElementById("timer-bar-div");
        TQ.AssertExt.isNotNull(containerDiv);
        containerDiv.innerHTML = htmlStr;
        tEle = $("#timeValueInput-2");

        axis.init(t, tMinFrame, tMaxFrame);
        displayTime(t);
        TQ.FrameCounter.addHook(update);
    }

    function onMouseStart () {
    }

    function onMouseStop2 (value) {
        t = value;
        syncToCounter();
    }

    function syncToCounter() {
        // t = bodyEle.slider("value");
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(TQ.Scene.globalT2local(t)));
        TQ.DirtyFlag.requestToUpdateAll();
    }

    function onMouseAction2 (value) {
        t = value;
        displayTime(t);
        syncToCounter();
        //ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
    }

    function update () { // called by FrameCounter,
            if (TQ.FrameCounter.isNew) {
                t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
                axis.setValue(t);
            }
    }

    function displayTime (t) {
        var output = document.getElementById('time-value');
        setDomEleValue(output, t);
    }

    function setDomEleValue(ele, t) {
        if ('textContent' in document) { // For ie8 support
            ele.textContent = t;
        } else {
            ele.innerText = t;
        }
    }

    var axis = (function() {
        var bodyEle = null,
            currentValue = 0;

        return {
            setValue: setValue,
            init: init
        };

        function setValue(value) {
            if (currentValue !== value) {
                currentValue = value;
                bodyEle.val(currentValue).change();
            }
        }

        function init(t, tMin, tMax) {
            var $document = $(document);
            var selector = '[data-rangeslider]';
            var $element = $(selector);

            bodyEle = $("#timer-slider-2");
            $document.on('input', '#timer-slider-2', onInputTimeAxis);
            function onInputTimeAxis(e) {
                displayTimeByEle(e.target);
            }

            // Example functionality to demonstrate a value feedback
            function displayTimeByEle(timeAxis) {
                var value = timeAxis.value;
                displayTime(value);
            }

            function setupInitialValue() {
                var attributes = {
                    min: tMin,
                    max: tMax,
                    step: 1
                };

                bodyEle.attr(attributes);
                bodyEle.rangeslider('update', true);
            }

            // Basic rangeslider initialization
            $element.rangeslider({
                polyfill: false,
                onInit: onInitialized,
                onSlide: onSlideValueChanged,
                onSlideEnd: onSliderEnd
            });

            function onInitialized() {
                displayTimeByEle(this.$element[0]);
            }

            function onSliderEnd(position, value) {
                onMouseStop2(value);
                console.log('onSlideEnd');
                console.log('position: ' + position, 'value: ' + value);
            }

            function onSlideValueChanged(position, value) {
                // onMouseStart(value);
                // onMouseAction2(value);

                console.log('onSlide');
                console.log('position: ' + position, 'value: ' + value);
            }

            setupInitialValue();
            setValue(t);
        }
    })();

    return {
        initialize: initialize
    };

}());
