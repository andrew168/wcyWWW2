/**
 * Created by Andrewz on 4/19/2017.
 */

angular.module('starter').factory("UserService", UserService);
UserService.$inject = ['$http', '$auth'];
function UserService($http, $auth) {
  var user = TQ.userProfile,
    userList = [];

  function canAutoLogin() {
    return  $auth.isAuthenticated();
  }

  function tryAutoLogin() {
    TQ.AssertExt.invalidLogic(canAutoLogin(), "must call canAutoLogin to determine");
    return getProfile();
  }

  function tryAutoSignUp() {
    var name = 'guest' + (new Date()).getTime();
    return signUp(name, name, name);
  }

  function login(name, psw, from, nickName) {
    if (!from) { // 对于WX MiniP 平台, wxCode, 保持原来的大小写
      name = name.toLowerCase();
    }
    return $auth.login({email: name, password: psw, from: from, nickName: nickName}).
      then(getProfile).
      catch(onGetProfileFailed);
  }

  function loginFromWx(wxBoneToken, displayName) {
    // return login('wxNewYearCard', 'TqTest123');
    var authorizer = 'wx'; // AUTH.WX 见服务器的const.js
    return login(wxBoneToken, 'wxGranted', authorizer, displayName);
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

  function signUp(user) {
    return $auth.signup(user).then(onSignUp).catch(onGetProfileFailed);
  }

  function onSignUp(netPkg) {
    var data = netPkg.data;
    if (data && data.errorId) {
      return onGetProfileFailed(netPkg);
    }
    return getProfile();
  }

  function checkName(name) {
    var url = TQ.Config.AUTH_HOST + '/user/checkname/' + name;
    $http.get(url)
      .then(onCheckNameDone).
      catch(onGetProfileFailed);
  }

  function setAdmin(userId) {
    if (user.canAdmin) {
      return $http.get(TQ.Config.AUTH_HOST + '/user/privilege/' + userId + '/255');
    }
  }

  function getUserList() {
    if (user.canAdmin) {
      return $http.get(TQ.Config.AUTH_HOST + '/user/list')
        .then(function(netPkg) {
          userList = netPkg.data;
        });
    }
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
      var age = (!data.age ? user.age : data.age),
        city = (!data.city ? user.city : data.city);

      TQUtility.extendWithoutObject(user, data);
      user.loggedIn = true;
      user.hasSignedUp = true;
      user.needManualLogin = false;
      user.age = age;
      user.city = city;
      user.isValidName = true;
      user.saveToCache();
      // 有特别能力解决问题的人 superman
      var superman = ['人人动画_Andrew郅刚', 'toronto1111'];
      superman.some(function (displayName) {
        if (user.name === displayName || user.displayName === displayName) {
          user.canSolve = true;
          return true;
        }
      });

      TQ.Log.checkPoint("login successfully!  welcome "+ user.displayName + ", " + user.name);
    } else {
      onGetProfileFailed(netPkg);
    }
  }

  function onGetProfileFailed(netPkg) {
    var data = netPkg.data;
    if (data && data.errorId) {
      user.nameError = (TQ.Protocol.ERROR.NAME_IS_INVALID === data.errorId) ||
                (TQ.Protocol.ERROR.NAME_IS_TAKEN === data.errorId) ||
                (TQ.Protocol.ERROR.NAME_IS_INVALID_OR_TAKEN === data.errorId);
      user.passwordError = (TQ.Protocol.ERROR.PASSWORD_IS_INVALID === data.errorId) ||
                (TQ.Protocol.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT === data.errorId);
      if (user.nameError) {
        user.passwordError = true;
      }
    } else {
      if (!TQ.MessageBox.hasCriticalError()) {
        TQ.MessageBox.promptWithNoCancel("(code=9901): " + 
          TQ.Locale.getStr("network connection failed, please check network availability"));
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
    tryAutoSignUp: tryAutoSignUp,
    checkName: checkName,
    getProfile: getProfile,
    getUserList: getUserList,
    setAdmin: setAdmin,
    login: login,
    loginFromWx: loginFromWx,
    logout: logout,
    signUp: signUp
  }
}
