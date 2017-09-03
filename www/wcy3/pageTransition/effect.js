/**
 * Created by Andrewz on 8/22/17.
 */
var TQ = TQ || {};
TQ.PageTransitionEffect = (function () {
    var isAnimating = false,
        outPageEnd = false,
        inPageEnd = false,
        animEndEventNames = {
            'WebkitAnimation': 'webkitAnimationEnd',
            'OAnimation': 'oAnimationEnd',
            'msAnimation': 'MSAnimationEnd',
            'animation': 'animationend'
        },
// animation end event name
        animEndEventName = animEndEventNames[Modernizr.prefixed('animation')],
// support css animations
        support = Modernizr.cssanimations,
        defaultEffectName = 'rotateFoldLeft',
        editorService,
        effectsList = {
            'rotateFoldLeft': {
                outClass: 'pt-page-rotateFoldLeft', // 左翻
                inClass: 'pt-page-moveFromRightFade'
            },
            'rotateFoldRight': {
                outClass: 'pt-page-rotateFoldRight', // 右翻
                inClass: 'pt-page-moveFromLeftFade'
            },
            'rotateFoldTop pt-page-ontop': {
                outClass: 'pt-page-rotateFoldTop pt-page-ontop', // 上翻
                inClass: 'pt-page-moveFromBottomFade'
            },
            'rotateFoldBottom': {
                outClass: 'pt-page-rotateFoldBottom', // 下翻
                inClass: 'pt-page-moveFromTopFade'
            }
        };

    var state = {
        page1Image: null,
        page1On: false
    };

    var _interface = {
        state: state,
        doTransition: doTransition,
        getEffect: getEffect,
        init: init,
        isBusy: isBusy
    };

    function init() {
    }

    function doTransition(transition, callback) {
        var outPage = transition.outPage,
            inPage = transition.inPage;
        editorService = angular.element(document.body).injector().get('EditorService')
        TQ.Log.debugInfo("page transition start...");
        isAnimating = true;
        state.page1On = true;
        outPage.on(animEndEventName, function () {
            outPage.off(animEndEventName);
            outPageEnd = true;
            state.page1On = false;
            state.page1Image = null;
            if (inPageEnd) {
                onEndAnimation(transition, callback);
            }
        });

        attachEffect(outPage, transition.outClass);

        inPage.on(animEndEventName, function () {
            inPage.off(animEndEventName);
            inPageEnd = true;
            if (outPageEnd) {
                onEndAnimation(transition, callback);
            }
        });

        attachEffect(inPage, transition.inClass);

        if (!support) {
            onEndAnimation(transition);
        }

        editorService.forceToRefreshUI();
    }

    function onEndAnimation(transition, callback) {
        outPageEnd = false;
        inPageEnd = false;
        isAnimating = false;
        TQ.Log.debugInfo("page transition end!");

        setTimeout(function() {
            detachEffect(transition.outPage, transition.outClass);
            detachEffect(transition.inPage, transition.inClass);
            callback();
            editorService.forceToRefreshUI();
        });
    }

    function detachEffect(page, classes) {
        if (classes) {
            page.removeClass(classes);
        }
    }

    function attachEffect(page, effectClass) {
        if (effectClass) {
            page.addClass(effectClass);
        }
    }

    function isBusy() {
        return isAnimating;
    }

    function getEffect(name) {
        if (effectsList[name]) {
            return effectsList[name];
        }
        return effectsList[defaultEffectName]
    }

    return _interface;
}());