/**
 * Created by Andrewz on 9/17/2016.
 * convert custom event to angularjs event
 * 因为custome evet是发给document.body, 它只冒泡给上级， 不会给下级，
 * 所以，子元素收不到， 需要在 body上加1个中转器
 */

angular.module("starter").directive("eventconverter", EventConverter);
EventConverter.$inject = ["$rootScope"];
function EventConverter($rootScope) {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      var events = [TQ.Scene.EVENT_READY,
        TQ.Scene.EVENT_SAVED,
        TQ.Scene.EVENT_END_OF_PLAY,
        TQ.EVENT.REFRESH_UI];
      events.forEach(function(evt) {
        element.bind(evt, function() {
          $rootScope.$broadcast(evt);
        });
      });
    }
  };
}
