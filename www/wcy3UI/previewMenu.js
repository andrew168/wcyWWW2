/**
 * Created by Andrewz on 1/26/2017.
 */
var TQ = TQ || {};
(function () {
    'use strict';
    function PreviewMenu() {
    }

    PreviewMenu.hide = onPreviewMenuOff;
    PreviewMenu.initialize = initialize;
    PreviewMenu.startWatch = startWatch;
    PreviewMenu.stopWatch = stopWatch;
    PreviewMenu.disableWatch = disableWatch;
    PreviewMenu.enableWatch = enableWatch;
    function enableWatch () {
        allowToWatch = true;
    }

    function disableWatch() {
        allowToWatch = false;
    }

    var selectedEvents = ['touchstart', 'click'],
        state = null,
        previewMenuOnCallback = null,
        previewMenuOffCallback = null,
        hasTouch = false,
        hasMouse = false,
        isWatching = false,
        allowToWatch = true;

    function initialize(globalState, onCallback, offCallback) {
        state = globalState;
        previewMenuOnCallback = onCallback;
        previewMenuOffCallback = offCallback;
    }

    function onPreviewMenuOn(e) {
        if (!isSelectedEvent(e)) {
            return;
        }

        if (state.isPreviewMode && e && (selectedEvents.indexOf(e.type) >= 0)) {
            stopWatch();
            state.isPreviewMenuOn = true;
            if (previewMenuOnCallback) {
                previewMenuOnCallback();
            }
        }
    }

    function onPreviewMenuOff(e) {
        if (e && !isSelectedEvent(e)) {
            return;
        }

        state.isPreviewMenuOn = false;
        if (previewMenuOffCallback) {
            previewMenuOffCallback();
        }
    }

    function startWatch() {
        if (isWatching || !allowToWatch) {
            return;
        }
        isWatching = true;
        TQ.Log.checkPoint("start watch in preview Menu...");
        setTimeout(function() { // 避免延后一点， 避免被preview按钮的操作触发
            if (isWatching && allowToWatch) { // 防止刚start，就stop， （在App刚刚启动的时候）
                selectedEvents.forEach(function (item) {
                    document.addEventListener(item, onPreviewMenuOn);
                });
            }
        }, 100);
    }

    function stopWatch() {
        if (!isWatching || !allowToWatch) {
            return;
        }
        isWatching = false;
        TQ.Log.debugInfo("stop watch!");
        selectedEvents.forEach(function(item) {
            document.removeEventListener(item, onPreviewMenuOn);
        });
    }

    function isSelectedEvent(e) {
        return (e && (selectedEvents.indexOf(e.type) >= 0));
    }

    TQ.PreviewMenu = PreviewMenu;
})();
