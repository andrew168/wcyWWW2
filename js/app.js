// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module("starter", ["ionic", "ngStorage", "ngCordova", "ngFileUpload",
  "ui.select", "satellizer", "rzModule"])
  .run(function($ionicPlatform, DeviceService, AppService) {
    $ionicPlatform.ready(function() {
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

      angular.element(document).ready(function() {
        if (!DeviceService.isReady()) {
          // $cordovaProgress.showSimple(true);
          ionic.Platform.ready(AppService.init);
        } else {
          AppService.init();
        }
      });
    });
  })

// workaround: ngClick Fires Twice on Button #1022
  .directive("myClick", function() {
    return function(scope, element, attrs) {
      element.bind("touchstart click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        scope.$apply(attrs["myClick"]);
      });
    };
  })

/* if conflict bewteen ng Material and IONIC
     /*
     .config(function($mdGestureProvider) {
     $mdGestureProvider.skipClickHijack();
     })
     */
  .config(function($stateProvider, $urlRouterProvider, $authProvider, $compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|file|filesystem):/);

    $authProvider.facebook({
      clientId: "273410813018932"
    });

    $authProvider.google({
      clientId: "143028246441-qvsoi6ug4qnfg5mtl5rd8jfjjrb5itcj.apps.googleusercontent.com"
    });

    $authProvider.wechat({
      appid: "wx5fe65e70536d0258"
    });

    $authProvider.twitter({
      url: "/auth/twitter",
      authorizationEndpoint: "https://api.twitter.com/oauth/authenticate",
      redirectUri: window.location.origin,
      oauthType: "1.0",
      // oauth_token: '920796548572868608-0LZ8K881BA6XiesnqIFfkYiYL5YlRLc',
      // oauth_verifier: "abcd123",
      popupOptions: { width: 495, height: 645 }
    });

    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
      .state("do", {
        url: "/do",
        templateUrl: "/templates/tab-dash.html",
        controller: "DashCtrl"
      })
      .state("opus", {
        url: "/opus/:shareCode",
        templateUrl: "/templates/convert.html",
        controller: "ConvertCtrl"
      })
      .state("wcy", {
        url: "/wcy/:shareCode",
        templateUrl: "/templates/convert.html",
        controller: "ConvertCtrl"
      })
      .state("edit", {
        url: "/edit/:shareCode",
        templateUrl: "/templates/convert.html",
        controller: "ConvertCtrl"
      })
      .state("opus.edit", {
        url: "/edit" // 没有templateUrl，也没有controller， 都是父state的，也就不刷新页面了
        // 但是， 也不能直接打开
      })

      .state("welcome", {
        url: "/welcome",
        templateUrl: "/templates/tab-dash.html",
        controller: "DashCtrl"
      })
    ;

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise("/welcome");
  });
