"use strict";

angular.module('ngImageCache', []).
    directive('ngImageCache', function() {
        return {
            restrict: 'A',
            link: function(scope, el, attrs) {

                attrs.$observe('ngSrc', function(src) {
                    if (src === "") return;
                    ImgCache.isCached(src, function(path, success) {
                        if (success) {
                            ImgCache.useCachedFile(el);
                        } else {
                            ImgCache.cacheFile(src, function() {
                                ImgCache.useCachedFile(el);
                            });
                        }
                    });

                });
            }
        };
    });
