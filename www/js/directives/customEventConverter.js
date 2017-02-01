/**
 * Created by Andrewz on 9/17/2016.
 * convert custom event to angularjs event
 * 因为custome evet是发给document.body, 它只冒泡给上级， 不会给下级，
 * 所以，子元素收不到， 需要在 body上加1个中转器
 */

angular.module('starter').directive('eventconverter', EventConverter);
EventConverter.$inject = ['$rootScope'];
function EventConverter($rootScope) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind(TQ.Scene.EVENT_READY, function () {
                $rootScope.$broadcast(TQ.Scene.EVENT_READY);
            });
            element.bind(TQ.Scene.EVENT_SAVED, function () {
                $rootScope.$broadcast(TQ.Scene.EVENT_SAVED);
            });
        }
    };
}
