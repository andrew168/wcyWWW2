/**
 * Created by Andrewz on 4/25/2017.
 */
var TQ = TQ || {};
TQ.Locale = (function () {
    "use strict";
    var defaultLang = 'en',
        currentLang = null,
        fondNewTag = false,
        dataReady = false,
        onReadyCallback,
        dict = {},
        self = {
            isReady: function () {return dataReady;},
            onReady: onReady,
            getStr: getStr,
            initialize: initialize,
            output: output,
            setLang: setLang
        };

    function onReady(callback) {
      if (dataReady) {
        callback();
      } else {
        onReadyCallback = callback;
      }
    }

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
                dataReady = true;
                if (onReadyCallback) {
                  onReadyCallback();
                  onReadyCallback = null;
                }
            } else {
              TQ.AssertExt.invalidLogic(false, "dictionary 文件内容错误");
            }
        });
    }

    function getStr(tag) {
        if (!tag || !dataReady) { // null字串， 或者locale尚未初始化
            return tag;
        }

        TQ.AssertExt.isNotNull(dict);
        if (!dict[tag]) {
            dict[tag] = tag2String(tag);
            console.error("need translation: " + tag);
            fondNewTag = true;
        }

        return dict[tag];
    }

    function tag2String(tag) {
        return tag.replace(/-/g, ' ');
    }

    function initialize(lang) {
        if (!lang) {
            lang = defaultLang;
        }
        setLang(lang); // 不能立即用， 因为angular的模块尚未inject
    }

    function output() {
        if (!fondNewTag) {
            console.log('new new tag found!');
        } else {
            console.log(JSON.stringify(dict));
        }
    }

    return self;
}());
