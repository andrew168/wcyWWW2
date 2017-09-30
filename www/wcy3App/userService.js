/**
 * Created by Andrewz on 4/19/2017.
 */

angular.module('starter').factory("UserService", UserService);
UserService.$inject = ['$http'];
function UserService($http) {
    var user = TQ.userProfile;

    function canAutoLogin() {
        return  ((!!user.name) && (!!user.ID) && (!user.needManualLogin));
    }

    function tryAutoLogin() {
        TQ.AssertExt.invalidLogic(canAutoLogin(), "must call canAutoLogin to determine");
        var url = TQ.Config.AUTH_HOST + '/user/autologin/' + user.name + '/' + user.ID;
        return $http.get(url)
            .then(onLoginDone);
    }

    function login(name, psw) {
        var url = TQ.Config.AUTH_HOST + '/user/login/' + name + '/' + psw;
        return $http.get(url)
            .then(onLoginDone);
    }

    function logout(name) {
        onLogoutDone();
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
            user.needManualLogin = false;
            user.name = data.name;
            user.ID = data.ID;
            user.displayName = data.displayName;
            user.isValidName = true;
            user.saveToCache();
        } else {
            user.displayNameError = (TQ.Protocol.ERROR.DISPLAY_NAME_INVALID === data.errorID) ||
                (TQ.Protocol.ERROR.DISPLAY_NAME_INVALID_OR_TAKEN === data.errorID);
            user.nameError = (TQ.Protocol.ERROR.NAME_IS_INVALID === data.errorID) ||
                (TQ.Protocol.ERROR.NAME_IS_TAKEN === data.errorID) ||
                (TQ.Protocol.ERROR.NAME_IS_INVALID_OR_TAKEN === data.errorID);
            user.passwordError = (TQ.Protocol.ERROR.PASSWORD_IS_INVALID === data.errorID) ||
                (TQ.Protocol.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT === data.errorID);
            user.loggedIn = false;
        }
    }

    function onLogoutDone(netPkg) {
        user.loggedIn = false;
        user.needManualLogin = true;
        user.isValidName = true;
        user.saveToCache();
    }

    function onSignUpDone(netPkg) {
        onLoginDone(netPkg);
    }

    return {
        canAutoLogin: canAutoLogin,
        tryAutoLogin: tryAutoLogin,
        checkName: checkName,
        login: login,
        logout: logout,
        signUp: signUp
    }
}
