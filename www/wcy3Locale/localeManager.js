/**
 * Created by Andrewz on 4/25/2017.
 */
var TQ = TQ || {};
TQ.Locale = (function () {
    "use strict";
    var dict = {};
    var self = {
        setLang: setLang,
        setDictionary : setDictionary,
        getStr: getStr
    };

    function setLang(lang) {
        var $http = angular.element(document.body).injector().get('$http');
        $http({
            method: 'GET',
            url: '/dictionary/' + lang +'.json'
        }).then(function onSuccess(response) {
            var data = (response.status === 200) ? response.data : [];
            if (typeof data === 'object') {
                dict = data;
            }
        });
    }
    function setDictionary(newDict) {
        dict = newDict;
    }

    function getStr(tag) {
        TQ.AssertExt.isNotNull(dict);
        return dict[tag] || tag;
    }

    return self;
}());
