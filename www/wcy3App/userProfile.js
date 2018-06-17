/**
 * Created by admin on 11/29/2015.
 */
var TQ = TQ || {};
TQ.userProfile = (function() {
    var self = {
        needManualLogin: true,
        loggedIn: false,  // 没有login，其余的信息都无意义
        isSignUping: false,
        displayName: "",
        name: "",
        age: 6,         //ToDo: 需要用户录入
        city: '无锡',    //ToDo: 需要用户录入
        ID: "",
        sessionToken: "",
        timesShared: 0,
        readFromCache: readFromCache,
        saveToCache: saveToCache,
        isGuest: function () {
            return (self.name && (self.name.indexOf('guest') ===0) &&
                (self.displayName && (self.displayName.indexOf('guest') === 0)));
        },
        getUserName: function () {
            return (self.isGuest()? '游客': self.displayName);
        }
    };

    var readCache = TQ.Base.Utility.readCache,
        writeCache = TQ.Base.Utility.writeCache;

    function readFromCache() {
        self.name = readCache('user_name', "");
        self.displayName = readCache('user_displayName', "");
        self.ID = readCache('user_ID', "");
        self.age = readCache('user_age', self.age);
        self.city = readCache('user_city', self.city);
        self.needManualLogin = TQ.Base.Utility.readCacheWithParse('user_needManualLogin', self.needManualLogin);
    }

    function saveToCache() {
        writeCache('user_name', self.name);
        writeCache('user_displayName', self.displayName);
        writeCache('user_ID', self.ID);
        writeCache('user_age', self.age);
        writeCache('user_city', self.city);
        writeCache('user_needManualLogin', self.needManualLogin);
    }

    readFromCache();

return self;
})();
