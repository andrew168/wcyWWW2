/**
 * Created by Andrewz on 4/19/2017.
 */

angular.module('starter').factory("UserService", UserService);
UserService.$inject = ['$http', '$auth'];
function UserService($http, $auth) {
    var user = TQ.userProfile;

    function canAutoLogin() {
        return  $auth.isAuthenticated();
    }

    function tryAutoLogin() {
        TQ.AssertExt.invalidLogic(canAutoLogin(), "must call canAutoLogin to determine");
        return getProfile();
    }

    function login(name, psw) {
        return $auth.login({email: name.toLowerCase(), password: psw}).
            then(getProfile).
            catch(onGetProfileFailed);
    }

    function authenticate(authName) {
        return $auth.authenticate(authName).
            then(getProfile).
            catch(onGetProfileFailed);
    }

    function logout(name) {
        return $auth.logout().
            then(onLogoutDone);
    }

    function signUp(name, psw, displayName) {
        return $auth.signup({email: name.toLowerCase(), password: psw, displayName: displayName}).
            then(getProfile).
            catch(onGetProfileFailed);
    }

    function checkName(name) {
        var url = TQ.Config.AUTH_HOST + '/user/checkname/' + name;
        $http.get(url)
            .then(onCheckNameDone).
            catch(onGetProfileFailed);
    }

    function onCheckNameDone(netPkg) {
        var data = netPkg.data;
        user.isValidName = (data.result === TQ.Const.SUCCESS);
    }

    function getProfile() {
        return $http.get(TQ.Config.AUTH_HOST + '/auth/api/me').
            then(onGetProfileSuccess).
            catch(onGetProfileFailed);
    }

    function onGetProfileSuccess(netPkg) {
        var data = netPkg.data;
        if (netPkg.status === TQ.Const.STATUS200) {
            user.loggedIn = true;
            user.needManualLogin = false;
            user.name = data.name;
            user.ID = data.ID;
            user.displayName = data.displayName;
            user.isValidName = true;
            user.saveToCache();
            user.canAdmin = data.canAdmin;
            user.canApprove = data.canApprove;
            user.canBan = data.canBan;
            user.canRefine = data.canRefine;
            TQ.Log.debugInfo("login successfully!  welcome "+ user.displayName + ", " + user.name);
        } else {
            onGetProfileFailed(netPkg);
        }
    }

    function onGetProfileFailed(netPkg) {
        var data = netPkg.data;
        if (data && data.errorID) {
            user.displayNameError = (TQ.Protocol.ERROR.DISPLAY_NAME_INVALID === data.errorID) ||
                (TQ.Protocol.ERROR.DISPLAY_NAME_INVALID_OR_TAKEN === data.errorID);
            user.nameError = (TQ.Protocol.ERROR.NAME_IS_INVALID === data.errorID) ||
                (TQ.Protocol.ERROR.NAME_IS_TAKEN === data.errorID) ||
                (TQ.Protocol.ERROR.NAME_IS_INVALID_OR_TAKEN === data.errorID);
            user.passwordError = (TQ.Protocol.ERROR.PASSWORD_IS_INVALID === data.errorID) ||
                (TQ.Protocol.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT === data.errorID);
            if (!user.displayNameError || user.nameError) {
                user.passwordError = true;
            }
        }
        user.loggedIn = false;
        $auth.logout(); // 本地也远程server切换时候遗留的token
        TQ.Log.debugInfo("login failed!");
    }

    function onLogoutDone(netPkg) {
        user.loggedIn = false;
        user.needManualLogin = true;
        user.isValidName = true;
        user.saveToCache();
    }

    return {
        authenticate: authenticate,
        canAutoLogin: canAutoLogin,
        tryAutoLogin: tryAutoLogin,
        checkName: checkName,
        getProfile: getProfile,
        login: login,
        logout: logout,
        signUp: signUp
    }
}
