/**
 * Created by Andrewz on 8/25/17.
 */
var TQ = TQ || {};
TQ.PageTransition = (function () {
    function start(currentId, targetId, callback) {
        if (TQ.PageTransitionEffect.isBusy()) {
            setTimeout(function () {
                console.log("busy, delay " + currentId +' to ' + targetId);
                start(currentId, targetId, callback);
            }, 200); // 0.7s
            return;
        }

        TQ.PageTransitionEffect.state.page1Image = TQ.ScreenShot.getDataWithBkgColor();
        if (targetId < currentId) {
            prevPage();
        } else {
            nextPage();
        }
        callback();
    }

    function nextPage() {
        var outPage = getCurrentPage();
        var inPage = getTargetPage();
        var effects = TQ.PageTransitionEffect.getEffect('rotateFoldLeft');
        var transition = {
            outPage: outPage,
            outClass: effects.outClass,
            inPage: inPage,
            inClass: effects.inClass
        };
        TQ.PageTransitionEffect.doTransition(transition);
    }

    function prevPage() {
        var outPage = getCurrentPage();
        var inPage = getTargetPage();
        var effects = TQ.PageTransitionEffect.getEffect('rotateFoldRight');
        var transition = {
            outPage: outPage,
            outClass: effects.outClass,
            inPage: inPage,
            inClass: effects.inClass
        };
        TQ.PageTransitionEffect.doTransition(transition);
    }

    function getCurrentPage() {
        return $('#id-page-effect1');
    }

    function getTargetPage() {
        return $('#testCanvas');
    }

    return {
        start: start
    };
})();
