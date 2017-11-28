/**
 * Created by Andrewz on 7/12/2016.
 */

TQ.SocialFB = (function(){
    window.fbAsyncInit = function() {
        FB.init({
            appId      : '273410813018932',
            xfbml      : true,
            version    : 'v2.11'
        });
    };

    var tooSlow = false;
    function init() {
        TQ.State.fbAvailable = false;
        setTimeout(testSpeed, 20000); // 20s
        function testSpeed() {
            tooSlow = !TQ.State.fbAvailable;
        }

        TQ.LazyLoading.loadOne('//connect.facebook.net/en_US/sdk.js', function() {
            if (!tooSlow) {
                TQ.State.fbAvailable = true;
            }
        });
    }

    init();
})();
