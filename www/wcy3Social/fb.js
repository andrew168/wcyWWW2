/**
 * Created by Andrewz on 7/12/2016.
 */

TQ.SocialFB = (function(){
    window.fbAsyncInit = function() {
        FB.init({
            appId      : '273410813018932',
            xfbml      : true,
            version    : 'v2.6'
        });
    };

    function init() {
        TQ.LazyLoading.loadOne('//connect.facebook.net/en_US/sdk.js');
    }

    init();
})();
