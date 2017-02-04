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
        console.log("start watch...");
        selectedEvents.forEach(function (item) {
            document.addEventListener(item, onPreviewMenuOn);
        });
    }

    function stopWatch() {
        if (!isWatching || !allowToWatch) {
            return;
        }
        isWatching = false;
        console.log("stop watch!");
        selectedEvents.forEach(function(item) {
            document.removeEventListener(item, onPreviewMenuOn);
        });
    }

    function isSelectedEvent(e) {
        return (e && (selectedEvents.indexOf(e.type) >= 0));
    }

    TQ.PreviewMenu = PreviewMenu;
})();
