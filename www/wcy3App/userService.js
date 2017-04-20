/**
 * Created by Andrewz on 4/19/2017.
 */

angular.module('starter').factory("UserService", UserService);
UserService.$inject = ['$http'];
function UserService($http) {
    var user = userProfile.user;

    function login(name, psw) {
        var url = TQ.Config.AUTH_HOST + '/user/login/' + name + '/' + psw;
        $http.get(url)
            .then(onLoginDone, onLoginDone);
    }

    function signIn(name, psw, displayName) {
        return $http({
            method: 'POST',
            url: TQ.Config.AUTH_HOST + '/user/signin/' + name + '/' + psw + '/' + displayName
        }).then(onSignInDone, onSignInDone);
    }

    function checkName(name) {
        var url = TQ.Config.AUTH_HOST + '/user/checkname/' + name;
        $http.get(url)
            .then(onCheckNameDone, onCheckNameDone);
    }

    function onCheckNameDone(data) {
        user.isValidName = (data.result === TQ.Const.SUCCESS);
    }

    function onLoginDone(data) {
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

    function onSignInDone(data) {
        onLoginDone(data);
    }

    return {
        checkName: checkName,
        login: login,
        signIn: signIn
    }
}
