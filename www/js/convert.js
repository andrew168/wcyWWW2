/**
 * Created by Andrewz on 3/18/19.
 */
angular.module("starter").controller("ConvertCtrl", ConvertCtrl);
ConvertCtrl.$inject = ["$scope", "$state", "$stateParams"];

function ConvertCtrl($scope, $state, $stateParams) {
  TQ.QueryParamsConverted = TQ.Utility.parseUrl();
  TQ.QueryParamsConverted.op = $state.current.name;
  TQ.QueryParamsConverted.shareCode = $stateParams.shareCode || TQ.Utility.getUrlParam("opus");
  $state.go("do");
}
