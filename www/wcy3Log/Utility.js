/**
 * Created by admin on 9/18/2015.
 */
var TQ = TQ || {};
TQ.Base = TQ.Base || {};

(function() {
    function Utility() {

    }

    Utility.isMobileDevice = function() {
        return (ionic.Platform.isAndroid() ||
            ionic.Platform.isIOS() ||
            ionic.Platform.isWebView() ||
            ionic.Platform.isWindowsPhone());
    };

    Utility.triggerEvent = function (DomElement, eventName) {
        DomElement.dispatchEvent(new CustomEvent(eventName));
    };

    // 下面的情况下，有误：
    // TQ.Base.Utility.urlParser('filesystem:http://localhost:8100/temporary/imgcache//mcImages/p10324.png');
    // TQ.Base.Utility.urlParser('unsafe:filesystem:http://localhost:8100/temporary/imgcache//mcImages/p10324.png');
    Utility.urlParser = function(url) {
        var parser = document.createElement('a');
        parser.href = url;
        return parser;
    };

    TQ.Base.Utility = Utility;
}());

