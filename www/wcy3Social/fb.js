/**
 * Created by Andrewz on 7/12/2016.
 */

TQ.SocialFB = (function() {
  window.fbAsyncInit = function() {
    FB.init({
      appId: "273410813018932",
      autoLogAppEvents: true,
      xfbml: false, // 不必parse我的DOM， 因为我没有使用FB的其它plugins
      version: "v2.11"
    });
  };

  var tooSlow = false;
  function init() {
    TQ.State.fbAvailable = false;
    setTimeout(testSpeed, 20000); // 20s
    function testSpeed() {
      tooSlow = !TQ.State.fbAvailable;
    }

    // var sdkUrl = "https://connect.facebook.net/en_US/sdk/debug.js";
    var sdkUrl = "//connect.facebook.net/en_US/sdk.js";
    TQ.LazyLoading.loadOne(sdkUrl, function() {
      if (!tooSlow) {
        TQ.State.fbAvailable = true;
      }
    });
  }

  init();
})();
