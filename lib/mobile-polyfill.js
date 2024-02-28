/**
 * Created by andrew on 10/31/2015.
 * 主要是针对 android，IOS mobile上的缺陷， 提供支持
 */


// android 4.2 以下版本的webview缺少 CustomEvent
if (typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function(type, eventInitDict) {
        var newEvent = document.createEvent('CustomEvent');
        newEvent.initCustomEvent(type,
            !!(eventInitDict && eventInitDict.bubbles),
            !!(eventInitDict && eventInitDict.cancelable),
            (eventInitDict ? eventInitDict.detail : null));
        return newEvent;
    };
}
