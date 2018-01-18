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
                        title: "稷山板枣的营养价值",
                        ssPath: "http://show.udoido.cn/gem/red-date_files/image009.jpg",
                        desc: "俗话说：“一日吃三枣，终生不显老”、“一日三枣，不黄不老”“日吃十个枣，医生不用找”",
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
