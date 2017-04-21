/**
 * Created by Andrewz on 4/19/2017.
 */

angular.module('starter').factory("UserService", UserService);
UserService.$inject = ['$http'];
function UserService($http) {
    var user = TQ.userProfile;

    function login(name, psw) {
        var url = TQ.Config.AUTH_HOST + '/user/login/' + name + '/' + psw;
        return $http.get(url)
            .then(onLoginDone);
    }

    function signUp(name, psw, displayName) {
        return $http({
            method: 'POST',
            url: TQ.Config.AUTH_HOST + '/user/signup/' + name + '/' + psw + '/' + displayName
        }).then(onSignUpDone);
    }

    function checkName(name) {
        var url = TQ.Config.AUTH_HOST + '/user/checkname/' + name;
        $http.get(url)
            .then(onCheckNameDone);
    }

    function onCheckNameDone(netPkg) {
        var data = netPkg.data;
        user.isValidName = (data.result === TQ.Const.SUCCESS);
    }

    function onLoginDone(netPkg) {
        var data = netPkg.data;
        if (data.result === TQ.Const.SUCCESS) {
            user.loggedIn = true;
            user.name = data.name;
            user.ID = data.ID;
            user.displayName = data.displayName;
            user.isValidName = true;
        } else {
            user.loggedIn = false;
        }
    }

    function onSignUpDone(netPkg) {
        onLoginDone(netPkg);
    }

    return {
        checkName: checkName,
        login: login,
        signUp: signUp
    }
}
