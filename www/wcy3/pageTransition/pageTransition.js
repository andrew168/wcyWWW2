/**
 * Created by Andrewz on 8/25/17.
 */
var TQ = TQ || {};
TQ.PageTransition = (function () {
    var taskQue = [];

    function start(currentId, targetId, callback) {
        if (TQ.PageTransitionEffect.isBusy()) {
            TQ.Log.debugInfo("busy, delay " + currentId +' to ' + targetId + ", total: " + taskQue.length);
            var task = [currentId, targetId, callback];
            if (isNewTask(task)) {
                taskQue.push(task);
            } else {
                TQ.Log.debugInfo("delay duplicated!");
            }
            return;
        }

        TQ.Log.debugInfo("do busy, delay " + currentId + ' to ' + targetId + ", total: " + taskQue.length);

        if (needFastPaging()) {
            callback();
            setTimeout(checkQue);
        } else {
            TQ.PageTransitionEffect.state.page1Image = TQ.ScreenShot.getDataWithBkgColor();
            if (targetId === (currentId - 1)) {
                prevPage();
            }
            if (targetId === (currentId + 1)) {
                nextPage();
            }
            callback();
        }
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
        TQ.PageTransitionEffect.doTransition(transition, checkQue);
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
        TQ.PageTransitionEffect.doTransition(transition, checkQue);
    }

    function checkQue() {
        var next = taskQue.shift();
        if (next) {
            TQ.Log.debugInfo("from delay que: " + taskQue.length +': ' + next[0] + ' to ' + next[1]);
            start(next[0], next[1], next[2]);
        }
    }

    function isNewTask(task) {
        var isNew = true;
        taskQue.forEach(function(item) {
            if ((item[0] === task[0]) &&
                (item[1] === task[1])) {
                isNew = false;
            }
        });
        return isNew;
    }

    function getCurrentPage() {
        return $('#id-page-effect1');
    }

    function getTargetPage() {
        return $('#testCanvas');
    }

    function needFastPaging() {
        return (taskQue.length > 1);
    }

    return {
        start: start
    };
})();
