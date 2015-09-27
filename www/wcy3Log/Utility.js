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

    Utility.triggerEvent = function (DomElement, eventName, data) {
        var evt = new CustomEvent(eventName);
        if (!!data) {
            evt.data = data;
        }
        DomElement.dispatchEvent(evt);
    };

    // 下面的情况下，有误：
    // TQ.Base.Utility.urlParser('filesystem:http://localhost:8100/temporary/imgcache//mcImages/p10324.png');
    // TQ.Base.Utility.urlParser('unsafe:filesystem:http://localhost:8100/temporary/imgcache//mcImages/p10324.png');
    Utility.urlParser = function(url) {
        var parser = document.createElement('a');
        parser.href = url;
        return parser;
    };

    Utility.urlComposer = function(path, host, protocol) {
        var parser = Utility.urlParser(path);
        if (!host) {
            host = parser.host;
        }

        if (!protocol) {
            protocol = parser.protocol;
        }

        return protocol+"//" + host + parser.pathname;
    };

    function _isSeperator(ch) {
      return ((ch === '/') || ( ch === '\\'));
    }
    Utility.urlConcat = function(path1, path2) {
        var middle = '/';
        if ( _isSeperator(path1[path1.length - 1])) {
            middle = '';
        }

        if (_isSeperator(path2[0])) {
            path2 = path2.substr(1);
        }
        return path1 + middle + path2;
    };

    TQ.Base.Utility = Utility;
}());

