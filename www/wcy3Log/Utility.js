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

    TQ.Base.Utility = Utility;
}());

