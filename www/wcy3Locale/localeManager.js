/**
 * Created by Andrewz on 4/25/2017.
 */
var TQ = TQ || {};
TQ.Locale = (function () {
    "use strict";
    var defaultLang = 'en',
        currentLang = null,
        dict = {},
        self = {
            getStr: getStr,
            initialize: initialize,
            setLang: setLang
        };

    function setLang(lang) {
        if (currentLang && (currentLang === lang)) {
            return;
        }
        var injector = angular.element(document.body).injector();
        if (!injector) {
            return;
        }
        currentLang = lang;
        var $http = injector.get('$http');
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

    function getStr(tag) {
        TQ.AssertExt.isNotNull(dict);
        return dict[tag] || tag;
    }

    function initialize(lang) {
        if (!lang) {
            lang = defaultLang;
        }
        setLang(lang); // 不能立即用， 因为angular的模块尚未inject
    }

    return self;
}());
