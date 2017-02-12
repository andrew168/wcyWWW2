/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-13 下午7:16
 */
window.TQ = window.TQ || {};

(function () {

    function Utility () {

    }

    Utility.toCssFont = function(size, face) {
      return (size + "px " + face);
    };

    // 从text的HTML字串中获取tag标签中 attr属性的值
    Utility.extractAttr = function (tag, attr, str, defaultValue) {
      var reg1 =new RegExp("<" + tag + "[^<>]*?\\s" + attr + "=['\"]?(.*?)['\"]?\\s.*?>(.*?)</" +tag +">");
      var reg2 =new RegExp("<" + tag + "[^<>]*?\\s" + attr + "=['\"]?(.*?)['\"]>(.*?)</" +tag +">");
      try {
        var values = reg1.exec(str);
        if (values != null) {
          var result = null;
          if (values.length >= 2) result = values[1];
        }

        if ((result == null) || (result == "")) {
          values = reg2.exec(str);
          if (values != null) {
            result = ( (values.length >= 2) ? values[1] : defaultValue);
          } else {
            result = defaultValue;
          }
        }
      } catch (e)
      {
      }
      return result;
    };

    // 从text的HTML字串中获取tag标签的值
    Utility.extractTag = function (tag, str, defaultValue) {
      var reg =new RegExp("<" + tag + "[^<>]*?>(.*?)</" + tag +">");
      try {
        var values = reg.exec(str);
        if (values != null) {
          return ( (values.length >= 2) ? values[1] : defaultValue);
        }
      } catch (e)
      {
      }
      return defaultValue;
    };

    Utility.forceExt = function (str) {
        if  (str.indexOf('.') > 0) {
            str =  (str.substr(0, str.indexOf('.')) + TQ.Config.EXTENSION);
        } else {
            str =  (str + TQ.Config.EXTENSION);
        }
        return str;
    };

    Utility.getAudioByThumbnail = function(soundSrc) {
        //ToDo：去除src开头的"."
        soundSrc = soundSrc.replace("./", "/");
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, soundSrc.lastIndexOf("\\") <=0 ); // 没有DOS路径符号\\
        var shortName = soundSrc.replace("http://" + TQ.Config.DOMAIN_NAME + "/","");
        return "http://"+ TQ.Config.DOMAIN_NAME+"/"+shortName;
    };

    Utility.getImageByThumbnail = function(thumbnail) {
        var pathToOriginalImg = "mcImages/";
        var pathToThumbnail = "mcThumbs/";
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, thumbnail.lastIndexOf("\\") <=0 ); // 没有DOS路径符号\\
        thumbnail = thumbnail.replace("http://" + TQ.Config.DOMAIN_NAME,"");
        return thumbnail.replace(pathToThumbnail,pathToOriginalImg);
    };

    Utility.getComponentByThumbnail = function(thumbnail) {
        var pathToThumbnail = "mcThumbs/";
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, thumbnail.lastIndexOf("\\") <=0 ); // 没有DOS路径符号\\
        thumbnail = thumbnail.replace("http://" + TQ.Config.DOMAIN_NAME,"");
        var pos = thumbnail.indexOf(pathToThumbnail) + pathToThumbnail.length;
        var newName = thumbnail.substr(pos);
        var end = newName.lastIndexOf('.');
        if (end <= 0) { // 防止它本身没有带后缀
            end = newName.length;
        }
        return newName.substring(0, end) + TQ.Config.EXTENSION;
    };

    Utility.getSceneByThumbnail = function(thumbnail) {
      return Utility.getComponentByThumbnail(thumbnail);
    };

    Utility.isComponent = function() {
        return ($("#tab_right_panel").tabs( "option", "active" ) == 1 );
    };

    Utility.isScene = function() { return ($("#tab_right_panel").tabs( "option", "active" ) == 0 );};
    Utility.getEmptyScene = function () {
      return {"levels":[{"jsonElements":null, "FPS":20, "elements":null, "name":"0"}],
        "overlay":null, "currentLevelId":0, "currentLevel":null};
    };

    // @@ToDo: 显示表达式的字串， 和 文件的行号，
    Utility.assertValid = function(obj)
    {
        assertNotUndefined(TQ.Dictionary.FoundNull, obj);
        assertNotNull(TQ.Dictionary.FoundNull, obj);
    };

    Utility.getExtension = function(path) {
        var start = path.lastIndexOf('.');
        if (start > 0) {
            return path.substr(start);
        }

        return path;
    };

    // adm: animation for dong man 超市
    Utility.isAnimationDesc = function (url) {
        var formats = [".adm"];
        var str = Utility.getExtension(url).toLowerCase();
        for (var i = 0; i < formats.length; i++) {
            if ((str === formats[i] )) {
                return true;
            }
        }
    };

    Utility.isWCY= function (url) {
        var formats = [".wcy"];
        var str = Utility.getExtension(url).toLowerCase();
        for (var i = 0; i < formats.length; i++) {
            if ((str === formats[i] )) {
                return true;
            }
        }
    };

    Utility.isVideo= function (url) {
        var formats = [".mp4"];
        var str = Utility.getExtension(url).toLowerCase();
        for (var i = 0; i < formats.length; i++) {
            if ((str === formats[i] )) {
                return true;
            }
        }
    };

    Utility.isSoundResource = function (url) {
        var formats = [".wav", ".mp3", ".ogg"];
        var str = Utility.getExtension(url).toLowerCase();
        for (var i = 0; i < formats.length; i++) {
            if ((str === formats[i] )) {
                return true;
            }
        }
        return false;
    };

    Utility.isImage = function (url) {
        var str = Utility.getExtension(url).toLowerCase();
        var formats = [".png", ".jpg", ".bmp", ".gif"];
        for (var i = 0; i < formats.length; i++) {
            if ((str === formats[i] ) ) {
                return true;
            }
        }
        return false;
    };

    Utility.isJSON = function (desc) {
        if (!((desc == undefined) || (desc == null))) {
            if (! ((desc.type == undefined) || (desc.type == null))) {
                return true;
            } else if (! ((desc.src == undefined) || (desc.src == null))) {
                return true;
            }
        }
        return false;
    };

    Utility.deltaYinWorld = function(target, offset, event)
    {
      var deltaYinDevice = (event.stageY + offset.y)  - target.y;
      return -deltaYinDevice; // 转到世界坐标系空间。
    };

    Utility.deviceToWorld = function (xDevice, yDevice)
    {
      return {x: xDevice, y: Utility.toWorldCoord(yDevice)};
    };

    Utility.worldToDevioce = function (xWorld, yWorld)
    {
      return {x: xWorld, y: Utility.toDeviceCoord(yWorld)};
    };

    Utility.toDeviceCoord = function(worldY)
    {
        return TQ.Config.workingRegionHeight - worldY;
    };

    Utility.toDeviceRotation = function(worldRotation)
    {
        return - worldRotation;
    };

    Utility.toWorldCoord = function(deviceY)
    {
        return TQ.Config.workingRegionHeight - deviceY;
    };

    Utility.canvas2WindowX = function(x)
    {
        return window.canvas.offsetLeft + x;
    };

    Utility.canvas2WindowY = function(y)
    {
        return window.canvas.offsetTop + y;
    };

    Utility.toDevicePivot = function(pivotY)
        // 用户坐标系下（左下角为0,0）的Pivot定义，转为Device坐标系（top, left) 下的pivot 定义
    {
        return 1- pivotY;
    };

    Utility.readLocalStorage = function (varName, defaultValue) {
        var realValue = localStorage.getItem(varName);
        if ((realValue == "") ||  // Firefox, 没有找到， 就返回"",
            (realValue == "null") ) { // Chrome, 没有找到， 就返回"null",
            realValue = defaultValue;
        }

        return realValue;
    };

    Utility.writeLocalStorage = function (varName, value) {
        return localStorage.setItem(varName, value);
    };

    Utility.getUrlParam = function(param) {
        var request = {
            QueryString : function(val) {
                var uri = window.location.search;
                var re = new RegExp("" + val + "=([^&?]*)", "ig");
                try {
                    var value = ((uri.match(re)) ? (decodeURIComponent(uri.match(re)[0]
                        .substr(val.length + 1))) : '');
                } catch (e) {
                    TQ.Log.criticalError("Error in URL Parameter:" + uri +":" + e.toString());
                    value = "";
                }
                return value;
            }
        };
        return request.QueryString(param);
    };

    Utility.getUserID = function () {
        var userID=TQ.Init.uid;
        if (userID == "") {
            var userID2 = Utility.readLocalStorage("userID", "");
            if (userID2 != "") {
                userID = userID2;
            } else {
                userID = TQ.Config.DefaultUserID; // 系统用户
            }
        } else {
            localStorage.setItem("userID", userID);
        }
        return userID;
    };
    Utility.DEV_PC = 0x0001;
    Utility.DEV_PAD = 0x0002;
    Utility.DEV_MOBILE = 0x0004;

    Utility.OS_ANDROID = 0x0010;
    Utility.OS_IPHONE = 0x0020;
    Utility.OS_WINDOWS = 0x0040;
    Utility.OS_MAC = 0x0080;
    Utility.BR_FIREFOX = 0x00100;
    Utility.BR_CHROME = 0x00200;
    Utility.BR_SAFARI = 0x00400;
    Utility.env = 0;
    Utility.setEnv = function (flag) { Utility.env |= flag; };
    Utility.clearEnv = function (flag) { Utility.env &= ~flag; };
    Utility.hasEnv = function (flag) { return Utility.env & flag; };

    Utility.isSupportedEnvironment = function () {
        var getBrowserInfo = ("" != TQ.Utility.getUrlParam("B")); // &B=0;
        var supported = false;
        if (getBrowserInfo) {
            alert(navigator.userAgent);
        }

        if (navigator.userAgent.match(/(Android)/i)) {
            Utility.setEnv(Utility.DEV_MOBILE);
            Utility.setEnv(Utility.OS_ANDROID);
        } else {
            Utility.setEnv(Utility.DEV_PC);
            Utility.setEnv(Utility.OS_WINDOWS);
        }

        if (navigator.userAgent.indexOf("Chrome") > 0) {
            Utility.setEnv(Utility.BR_CHROME);
            supported = true;
        } else if (navigator.userAgent.indexOf("Firefox") > 0) {
            Utility.setEnv(Utility.BR_FIREFOX);
            supported = true;
        } else if (navigator.userAgent.indexOf("Safari") > 0) {
            Utility.setEnv(Utility.BR_SAFARI);
            supported = true;
        }

        if (!supported) {
            if (Utility.hasEnv(Utility.DEV_PC)) {
                window.location="ShowBrowsers.php";
            } else {
                window.location="MobileBrowsers.php";
            }
        }

        return supported;
    };

    Utility.CheckUserRight = function() {
        var userID = Utility.getUserID();
        // ToDo: 使用数据库
        if ((userID == 10000) ||(userID == 10001) || (userID == 10011) || (userID == 10012)) {
          //  $("#tbDelete").button("enable");
        }
    };

    // Utility2:  使用了全局变量
    Utility.getMaxZ = function() {
        // 踩实在
        assertNotNull(currScene, TQ.Dictionary.FoundNull);
        assertNotNull(currScene.currentLevel, TQ.Dictionary.FoundNull);
        if ((!currScene) || (!currScene.currentLevel)) return 0;
        currScene.currentLevel.persist();
        return stageContainer.getNumChildren();
    };

    /*
    touch事件处理
     */
    Utility.isTouchEvent = function(e) {
        var e0 = getNativeEvent(e);
        return ((e0.touches != null) && (e0.changedTouches != null));
    };

    Utility.isMultiTouchEvent = function(e) {
        if (Utility.isTouchEvent(e))
        {
            var e0 = getNativeEvent(e);
            return (e0.touches.length >= 2);
        }

        return false;
    };

    var __isTouchDevice = -1;
    Utility.isTouchScreen = function() {
        if (__isTouchDevice == -1) {
            var deviceAgent = navigator.userAgent.toLowerCase();
            __isTouchDevice = Modernizr.touch ||
                (deviceAgent.match(/(iphone|ipod|ipad)/) ||
                    deviceAgent.match(/(android)/)  ||
                    deviceAgent.match(/(iemobile)/) ||
                    deviceAgent.match(/iphone/i) ||
                    deviceAgent.match(/ipad/i) ||
                    deviceAgent.match(/ipod/i) ||
                    deviceAgent.match(/blackberry/i) ||
                    deviceAgent.match(/bada/i));
        }

        return __isTouchDevice;
    };


    Utility.getOffsetTop = function (item) {
        if (item.offsetParent)  {
            return item.offsetTop + Utility.getOffsetTop(item.offsetParent);
        }
        return item.offsetTop;
    };

    Utility.getOffsetLeft = function (item) {
        if (item.offsetParent)  {
            return item.offsetLeft + Utility.getOffsetLeft(item.offsetParent);
        }
        return item.offsetLeft;
    };

    Utility.getDefultActionIcon = function() {
        var DEFAULT_ACTION_ICON = 100; // ToDo： 修改此值，根据实际缺省ICON的ID
        return DEFAULT_ACTION_ICON;
    };

    Utility.equalToZero = function(x) {
        return (Math.abs(x) < 0.000001);
    };

    // private
    function getNativeEvent(e) {
        var e0 = e.nativeEvent;
        if (!e0 && e.gesture && e.gesture.srcEvent) { // gesture event of ionic
            e0 = e.gesture.srcEvent;
        }
        return e0;
    }

    TQ.Utility = Utility;
}());
