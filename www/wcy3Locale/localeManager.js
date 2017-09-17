/**
 * Created by Andrewz on 4/25/2017.
 */
var TQ = TQ || {};
TQ.Locale = (function () {
    var dict = TQ.LocaleDict;
    var Locale = {
        setDictionary : setDictionary,
        getStr: getStr
    };

    function setDictionary(newDict) {
        dict = newDict;
    }

    function getStr(tag) {
        TQ.AssertExt.isNotNull(dict);
        return dict[tag] || tag;
    }

    if (TQ.LocaleDict) { // 如果dict先加载成功
        dict = TQ.LocaleDict;
    }
    return Locale;
}());
