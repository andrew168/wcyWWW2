window.TQ = window.TQ || {};

(function () {
    var WatchDog = {},
        tasks = [null];
    WatchDog.start = function (callback, duration) {
        tasks.push(setTimeout(callback, duration));
        return tasks.length-1;
    };

    WatchDog.clear = function (taskId) {
        if (taskId > 0 && tasks[taskId] > 0 ) {
            clearTimeout(tasks[taskId]);
            delete tasks[taskId];
        }
    };

    TQ.WatchDog = WatchDog;
}());
