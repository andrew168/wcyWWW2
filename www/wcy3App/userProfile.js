/**
 * Created by admin on 11/29/2015.
 */
var TQ = TQ || {};
TQ.userProfile = (function() {
    var self = {
        keepMeLogin: false,
        loggedIn: false,  // 没有login，其余的信息都无意义
        isSignUping: false,
        displayName: "",
        name: "",
        ID: "",
        sessionToken: "",
        timesShared: 0,
        readFromCache: readFromCache,
        saveToCache: saveToCache
    };

    var readCache = TQ.Base.Utility.readCache,
        writeCache = TQ.Base.Utility.writeCache;

    function readFromCache() {
        self.name = readCache('user_name', "");
        self.displayName = readCache('user_displayName', "");
        self.ID = readCache('user_ID', "");
        self.keepMeLogin = TQ.Base.Utility.readCacheWithParse('user_keepMeLogin', false);
    }

    function saveToCache() {
        writeCache('user_name', self.name);
        writeCache('user_displayName', self.displayName);
        writeCache('user_ID', self.ID);
        writeCache('user_keepMeLogin', self.keepMeLogin);
    }

    readFromCache();

return self;
})();
