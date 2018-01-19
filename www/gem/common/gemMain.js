/**
 * Created by Andrewz on 1/18/18.
 */
angular.module('starter', ['ionic', 'ngCookies'])
    .run(function ($ionicPlatform, WxService) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);

            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }

            angular.element(document).ready(function () {
                function updateWxShareData() {
                    if (TQ.Config.hasWx) { //  更新微信的shareCode， 以供用户随时分享。
                        WxService.init(composeWxShareData());
                    }
                }

                function composeWxShareData() {
                    return {
                        title: getTitle(),
                        ssPath: getFirstImageUrl(),
                        desc: getDesc(),
                        code: "no code"
                    }
                }

                updateWxShareData();
            });
        });
    })

    .config(function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|file|filesystem):/);
    });


function getTitle() {
    var titleEle = document.getElementsByTagName("title");
    if (titleEle && titleEle.length > 0 && titleEle[0]) {
        return titleEle[0]['outerText'];
    }
    return "UdoIdo";
}

function getDesc() {
    return getMetaValue('description');
}


function getMetaValue(name) {
    var metaEle = document.getElementsByTagName("meta"),
        desc = "UdoIdo";
    if (metaEle && metaEle.length > 0) {
        for (i = 0; i < metaEle.length; i++) {
            var ele = metaEle[i];
            if (ele['name'] === name) {
                desc = ele['content'];
                break;
            }
        }
    }
    return desc;
}

function getFirstImageUrl() {
    var imgEles = document.getElementsByTagName("img"),
        imgUrl = null;
    if (imgEles && imgEles.length > 0) {
        for (i = 0; i < imgEles.length; i++) {
            var ele = imgEles[i];
            if (ele['src']) {
                imgUrl = ele['src'];
                break;
            }
        }
    }
    return imgUrl;
}
