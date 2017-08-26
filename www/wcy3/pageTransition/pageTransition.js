/**
 * Created by Andrewz on 8/25/17.
 */
var TQ = TQ || {};

TQ.PageTransition = (function () {
    var pagesCount = $('div.pt-page').length,
        current = 0;

    function init() {
        var page = getPage(current);
        TQ.PageTransitionEffect.showPage(page, null);
    }

    function nextPage() {
        if (TQ.PageTransitionEffect.isBusy()) {
            return false;
        }

        var outPage = getPage(current);
        current = toNextPage2();
        var inPage = getPage(current);
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
        if (TQ.PageTransitionEffect.isBusy()) {
            return false;
        }

        var outPage = getPage(current);
        current = toPrevPage2();
        var inPage = getPage(current);
        var effects = TQ.PageTransitionEffect.getEffect('rotateFoldRight');
        var transition = {
            outPage: outPage,
            outClass: effects.outClass,
            inPage: inPage,
            inClass: effects.inClass
        };
        TQ.PageTransitionEffect.doTransition(transition);
    }

    function toNextPage2() {
        ++pagesCount;
        if (current > pagesCount - 1) {
            current = 0;
        }
        return current;
    }

    function toPrevPage2() {
        --current;
        if (current < 0) {
            current = pagesCount -1;
        }
        return current;
    }

    function getPage(pageID) {
        return $('.pt-page-' + pageID);
    }

    init();

    return {
        init: init,
        nextPage: nextPage,
        prevPage: prevPage
    };
})();


function nextPage() {
    TQ.PageTransition.nextPage(0);
}
function prevPage() {
    TQ.PageTransition.prevPage(0);
}
