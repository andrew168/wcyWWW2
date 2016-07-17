/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

var TQ = TQ || {};
TQ.TimerUI = (function () {
    var tMinFrame = 0,
        tMaxFrame = 0,
        tEle = null;

    var htmlStr =
        '<div id="time-axis-div" class="toolbar-layer">' +
        '<input id="timer-slider-2" atype="range" min="0" max="5" data-rangeslider>' +
        '<output id="time-value"></output>' +
        '</div>';

    function initialize () {
        var t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
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

    function syncToCounter(t) {
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(TQ.Scene.globalT2local(t)));
        TQ.DirtyFlag.requestToUpdateAll();
    }

    function update () { // called by FrameCounter,
        if (TQ.FrameCounter.isNew) {
            var t = TQ.Scene.localT2Global(TQ.FrameCounter.v);
            if (!axis.isUserControlling) {
                axis.setValue(t);
            }
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

            function onSliderEnd(position, value, isUserControlling) {
                if (isUserControlling) {
                    syncToCounter(value);
                }
                console.log('onSlideEnd');
                console.log('position: ' + position, 'value: ' + value);
            }

            function onSlideValueChanged(position, value, isUserControlling) {
                if (isUserControlling) {
                    syncToCounter(value);
                }
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
