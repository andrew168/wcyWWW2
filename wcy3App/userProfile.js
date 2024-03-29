/**
 * Created by admin on 11/29/2015.
 */
var TQ = TQ || {};
TQ.userProfile = (function() {
  var self = {
    needManualLogin: true,
    loggedIn: false, // 没有login，其余的信息都无意义
    isSignUping: false,
    hasSignedUp: false, // 尚未注册的用户，显示注册界面。否则显示登录界面
    displayName: "",
    name: "",
    age: 6, // ToDo: 需要用户录入
    city: "无锡", // ToDo: 需要用户录入
    ID: "",
    sessionToken: "",
    timesShared: 0,
    readFromCache: readFromCache,
    saveToCache: saveToCache,
    isGuest: function() {
      return (self.name && (self.name.indexOf("guest") === 0) &&
          (self.displayName && (self.displayName.indexOf("guest") === 0)));
    },
    getUserName: function() {
      return (self.isGuest() ? "游客" : self.displayName);
    },
    hasWxUserGranted: function() {
      var guestName = "wxOpenIdF微信用户"; // 与后台，小程序保持一致
      // 区别：
      // wx游客： 'wxNewYearCard'，
      // wx授权用户，再次登录: 'wxUser' + OpenId,  wx中的昵称
      return (TQUtility.isMiniProgramWebView() &&
          (self.name.indexOf("wxOpenId") === 0) && (self.name !== guestName));
    }
  };

  var readCache = TQ.Base.Utility.readCache;
  var writeCache = TQ.Base.Utility.writeCache;

  function readFromCache() {
    self.name = readCache("user_name", "");
    self.displayName = readCache("user_displayName", "");
    self.ID = readCache("user_ID", "");
    self.hasSignedUp = readCache("user_hasSignedUp", false);
    self.age = readCache("user_age", self.age);
    self.city = readCache("user_city", self.city);
    self.needManualLogin = TQ.Base.Utility.readCacheWithParse("user_needManualLogin", self.needManualLogin);
  }

  function saveToCache() {
    writeCache("user_name", self.name);
    writeCache("user_displayName", self.displayName);
    writeCache("user_ID", self.ID);
    writeCache("user_age", self.age);
    writeCache("user_city", self.city);
    writeCache("user_needManualLogin", self.needManualLogin);
    writeCache("user_hasSignedUp", self.hasSignedUp);
  }

  readFromCache();

  return self;
})();
