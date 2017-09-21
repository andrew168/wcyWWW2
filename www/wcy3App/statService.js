/**
 * Created by admin on 12/7/2015.
 */
// 上报各种统计数据
angular.module('starter')
    .factory('StatService', StatService);

StatService.$inject = ['$timeout', '$http'];

function StatService($timeout, $http) {
    var MINIMUM_DURATION = 10000; // 必须看一段时间（例如：10秒）之后， 才算是一个有效的展示

    function startToShow() {
        report('start');
        $timeout(validShow, MINIMUM_DURATION);
    }

    function report(status) {
        TQ.Log.debugInfo("started");
        // 服务器收不到本页面#以后的内容（SPA应用的特点！！！）， 所以， 必须 把本页面url中的hash上传
        // 而且， 参数取值中，不能含特殊字符， 例如：#，/等
        $http.get(TQ.Config.TEST_HOST + '/share' + "?hash=" + status + location.hash.substr(2), {})
            .success(function (data, status, headers, config) {
                TQ.Log.debugInfo(data);
            }).error(function (data, status, headers, config) {
                TQ.Log.debugInfo(data);
            });
    }

    function validShow() {
        TQ.Log.debugInfo("valid");
        //ToDo： 确认是有效的， 例如： 画面是可见的， 具有focus，等
        report('valid');
    }

    function completed() {
        TQ.Log.debugInfo("completed");
    }
    return {
        startToShow: startToShow,
        validShow: validShow,
        completed: completed
    }
}

