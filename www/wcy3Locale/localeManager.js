/**
 * Created by Andrewz on 4/25/2017.
 */
var TQ = TQ || {};

TQ.Locale = (function () {
    var Locale = {
        getStr: getStr
    };

    var dict = {
        'is loading': '正在加载....'
    };

    function getStr(tag) {
        // return dict[tag] || tag;
        return tag;
    }

    return Locale;
}());
