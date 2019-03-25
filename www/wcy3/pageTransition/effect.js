/**
 * Created by Andrewz on 8/22/17.
 */
var TQ = TQ || {};
TQ.PageTransitionEffect = (function () {
    var isAnimating = false,
        watchDogMaxTime = 2000, // 超过2000ms，还没有结束动画， 则迫使结束
        watchDogTask = -1,
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

    return {
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
        editorService = angular.element(document.body).injector().get('EditorService');
        TQ.Log.debugInfo("page transition start...");
        isAnimating = true;
        watchDogTask = TQ.WatchDog.start(function () {
            if (isAnimating) {// 此变量是易变的， 所以，必须显式地clear dog
                onOutPageAnimeEnd();
                onInPageAnimeEnd();
            }
        }, watchDogMaxTime);

        state.page1On = true;
        outPage.on(animEndEventName, onOutPageAnimeEnd);

        function onOutPageAnimeEnd() {
            outPage.off(animEndEventName);
            outPageEnd = true;
            state.page1On = false;
            state.page1Image = null;
            if (inPageEnd) {
                onEndAnimation(transition, callback);
            }
        }

        attachEffect(outPage, transition.outClass);

        inPage.on(animEndEventName, onInPageAnimeEnd);
        function onInPageAnimeEnd() {
            inPage.off(animEndEventName);
            inPageEnd = true;
            if (outPageEnd) {
                onEndAnimation(transition, callback);
            }
        }

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
        TQ.WatchDog.clear(watchDogTask);
        setTimeout(function() {
            detachEffect(transition.outPage, transition.outClass);
            detachEffect(transition.inPage, transition.inClass);
            callback();
            editorService.forceToRefreshUI();
        });
        TQUtility.triggerEvent(document, TQ.PageTransitionEffect.EVENT_COMPLETED);
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

}());

TQ.PageTransitionEffect.EVENT_COMPLETED = 'page transition end';
