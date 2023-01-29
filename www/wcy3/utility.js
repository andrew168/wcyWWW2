/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-13 下午7:16
 */
window.TQ = window.TQ || {};

(function () {

  function Utility () {

  }

  var localIdCounter = 0,
    localIdTimeBase = Date.now();

  Utility.getFilesFromEvent = function(evt) {
    let files = null;
    if (!!evt) {
      if (evt.currentTarget && evt.currentTarget.files) {
        files = evt.currentTarget.files;
      } else if (evt.target && evt.target.files) {
        files = evt.target.files;
      } else if (evt.srcElement && evt.srcElement.files) {
        files = evt.srcElement.files;
      }
    }
    return files;
  }

  Utility.toCssFont = function(option) {
    // !!! 只接受 合法的 CSS font attribute, ex. "bold 36px Arial"
    // 不能带color
    var result = "";
    if (option.bold) {
      result += 'bold ';
    }
    if (option.italic) {
      result += 'italic ';
    }
    result +=option.fontSize + "px " + option.fontFace;
    return result;
  };

  Utility.fontSize2Level = function (size) {
    return '' + (parseFloat(size) / TQ.Config.FONT_LEVEL_UNIT);
  };

  Utility.getCssSize = function(cssValue) {
    if ((cssValue === 'auto') || (!cssValue)) {
      return 0;
    }
    return parseFloat(cssValue.replace("px", ""));
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

  Utility.forceExt = function (str, newExtension) {
    if (!newExtension) {
      newExtension = TQ.Config.EXTENSION;
    }
    if  (str.indexOf('.') > 0) {
      str =  (str.substr(0, str.indexOf('.')) + newExtension);
    } else {
      str =  (str + newExtension);
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
    var formats = [".wav", ".mp3", ".ogg", ".3gp"]; // 3gp是手机录音结果
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

  Utility.isImageFile = function (file) {
    return ((file instanceof File) && (file.type) && (file.type.indexOf('image') >=0));
  };

  Utility.isImage64 = function (data) {
    // "data:image/png;base64"
    var headers;
    return ((typeof data === 'string') &&
            (headers=data.slice(0,40)) &&
            (headers.indexOf("data:image/") >= 0) &&
            (headers.indexOf("base64") >= 0));
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
    TQ.Log.upgrade("offsetInWorld");
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

  Utility.toWorldCoord = function(canvasY)
  // 这是Canvas设备的坐标， 不是浏览器整个client区的坐标，在Canvas只占用部分client区域的时候， 有用
  // 而 canvas的height， 就是workingRegionHeight
  {
    return TQ.Config.workingRegionHeight - canvasY;
  };

  Utility.eventToDevice = function (evt) {
    // 因为UDOIDO没有的工作区画布只占用一部分，所有需要从浏览器的stageX,Y坐标转为工作区的device坐标
    return {x: evt.stageX - TQ.Config.workingRegionX0, y: evt.stageY - TQ.Config.workingRegionY0};
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
    return TQ.Base.Utility.readCache(varName, defaultValue);
  };

  Utility.writeLocalStorage = function (varName, value) {
    TQ.Base.Utility.writeCache(varName, value);
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

  Utility.getShareCodeFromUrl = function(url) {
    TQ.Log.depreciated('被parseUrl替代，2019.3以后删除');
    return Utility.parseUrl(url).shareCode;
  };

  function getHashFromUrl(url) {
    var pos = url.indexOf('/#/'),
      hash;
    if (pos < 0) {
      if (url.indexOf('#/') == 0) {
        hash = url;
      } else {
        hash = "";
      }
    } else {
      hash = url.substr(pos + 1);
    }
    return hash;
  }

  function parseUrl(url) {
    var params = {},
      shareCode = "";
    var hash = (!url) ? window.location.hash : getHashFromUrl(url);
    if (hash) {
      hash = decodeURIComponent(decodeURIComponent(hash));
      var questionMarkPos = hash.indexOf('?'),
        commandStr,
        queryString;

      if (questionMarkPos >=0) {
        commandStr = hash.substr(0, questionMarkPos);
        queryString = hash.substr(questionMarkPos + 1);
      } else {
        commandStr = hash;
        queryString = '';
      }

      var words = commandStr.split(/\/|\?/);// 其中[3]是？之后的全部query参数
      if (words[1].toLowerCase() !== 'do') { // 新的url
        if (words[2]) {
          shareCode = words[2];
        } // "/#/welcome"
      }

      if (queryString != null && queryString !== "") {
        params = transformToAssocArray(queryString);
        if (!shareCode && params.sc) {
          shareCode = params.sc;
        }
      }
    }

    return {shareCode: shareCode, params: params};
  }

  Utility.getShareCodeCore = function (shareCodeLong) {
    var shareCodeDecoded = decodeURIComponent(decodeURIComponent(shareCodeLong));
    return shareCodeDecoded.split('?')[0];
  };

  function transformToAssocArray(parameters) {
    var params = {};
    var prmarr = parameters.split("&");
    for (var i = 0; i < prmarr.length; i++) {
      var tmparr = prmarr[i].split("=");
      params[tmparr[0]] = tmparr[1];
    }
    return params;
  }

  Utility.isValidWcyId = function(wcyId) {
    return ((typeof wcyId === 'number') && wcyId >=0);
  };

  Utility.getWcyIdFromUrl = function (url) {
    return Utility.shareCode2Id(parseUrl(url).shareCode);
  };

  Utility.wcyId2Url = function (opusId) {
    return TQ.Config.OPUS_HOST + "/#/do?sc=" + Utility.wcyId2ShareCode(opusId);
  };

  Utility.shareCode2Id = function (shareCode) {
    var items = shareCode.split('_');
    if (items.length > 1) {
      return items[1];
    }

    return -1;
  };

  Utility.wcyId2ShareCode = function (id) {
    return ("0_" + id + "_0_0");
  };

  Utility.isFbAvailable = function() {
    var host = window.location.host.toLowerCase();
    return (host.indexOf('udoido.cn') < 0);
  };

  Utility.getUserId = function () {
    var userId=TQ.Init.uid;
    if (userId == "") {
      var userId2 = Utility.readLocalStorage("userId", "");
      if (userId2 != "") {
        userId = userId2;
      } else {
        userId = TQ.Config.DefaultUserId; // 系统用户
      }
    } else {
      localStorage.setItem("userId", userId);
    }
    return userId;
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
    var supported = false;
    if (ionic.Platform.isAndroid()) {
      Utility.setEnv(Utility.DEV_MOBILE);
      Utility.setEnv(Utility.OS_ANDROID);
      supported = true;
    } else if (ionic.Platform.isIOS() || ionic.Platform.isIPad()) {
      Utility.setEnv(Utility.DEV_MOBILE);
      Utility.setEnv(Utility.OS_IPHONE);
      supported = true; // false;
    } else {
      Utility.setEnv(Utility.DEV_PC);// or Mac
      Utility.setEnv(Utility.OS_WINDOWS); // or Mac OS
      supported = true; // false;
    }

    if (isChrome()) {
      Utility.setEnv(Utility.BR_CHROME);
      supported = true;
    } else if (isMacSafari()) {
      Utility.setEnv(Utility.BR_SAFARI);
      supported = true;
    }

    return supported;
  };

  function isChrome() {
    // please note,
    // that IE11 now returns undefined again for window.chrome
    // and new Opera 30 outputs true for window.chrome
    // and new IE Edge outputs to true now for window.chrome
    // and if not iOS Chrome check
    // so use the below updated condition
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1,
      isIOSChrome = winNav.userAgent.match("CriOS");

    var result = false;
    if (isIOSChrome) { // chrome in IOS
      result = true;
    } else if (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
      result = true;
    } else {
      result = false;
    }

    return result;
    // http://stackoverflow.com/questions/4565112/javascript-how-to-find-out-if-the-user-browser-is-chrome/13348618#13348618
  }

  function isMacSafari() {
    var ua = navigator.userAgent.toLowerCase();
    return ((ua.indexOf('mac os x') > -1) &&
        (ua.indexOf('macintosh') > -1) &&
        (ua.indexOf('applewebkit') > -1) &&
        (ua.indexOf('safari') > -1));
  }

  Utility.CheckUserRight = function() {
    var userId = Utility.getUserId();
    // ToDo: 使用数据库
    if ((userId == 10000) ||(userId == 10001) || (userId == 10011) || (userId == 10012)) {
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

  Utility.isMouseEvent = function (e) {
    return (e instanceof MouseEvent);
  };

  Utility.getTouchNumbers = function(e) {
    return Utility.getTouches(e).length;
  };

  Utility.getTouches = function (e) {
    var touches;
    if (Utility.isMouseEvent(e)) {
      switch (e.type) {
        case 'mousemove':
        case 'mousedown':
          touches = [e];
          break;
        case 'mouseup':
          touches = [];
          break;
        default:
          console.error(e.type + "found unprocessed event!");
      }
    } else if (e.gesture && e.gesture.touches) {
      touches = e.gesture.touches;
    } else if (e.touches) {
      touches = e.touches;
    } else {
      touches = [];
    }

    return touches;
  };

  Utility.isTouchEvent = function(e) {
    var e0 = getNativeEvent(e);
    return (!!e0 && (e0.touches != null) && (e0.changedTouches != null));
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

  Utility.equalWithin2 = function (x, y) {// 2位小数点
    return (Math.abs(x - y) < 0.01);
  };

  Utility.equalBoxSize = function (box1, box2) {
    return ((Math.abs(box1.w - box2.w) < 0.01) && (Math.abs(box1.h - box2.h) < 0.01));
  };

  Utility.equalBox = function (box1, box2) {
    return ((Math.abs(box1.x - box2.x) < 0.01) && (Math.abs(box1.y - box2.y) < 0.01) &&
            Utility.equalBoxSize(box1, box2));
  };

  Utility.limitToAcuteAngle = function(angle) {
    var absAngle = Math.abs(angle);
    while (absAngle > 180) {
      if (angle < 0) {
        angle = 360 + angle;
      } else {
        angle = -360 + angle;
      }
      absAngle = Math.abs(angle);
    }

    if (absAngle > 180) {
      console.error("应该是锐角" + angle);
    }

    return angle;
  };

  Utility.limitTo360 = function (angle) {
    if ((angle > 360) || (angle < -360)) {
      angle = (angle % 360);
    }
    return angle;
  };

  Utility.mirror = function (pStart, pEnd) {
    //                  Start--->End
    //   EndMirrored<---Start
    return {
      x: 2 * pStart.x - pEnd.x,
      y: 2 * pStart.y - pEnd.y
    };
  };

  Utility.getTopicId = function() {
    var topicIdFromScene = (currScene && currScene.topicId)? currScene.topicId: 0;
    if (!topicIdFromScene) { // 防止"" 和 string型的数字
      topicIdFromScene = 0;
    } else {
      topicIdFromScene = parseInt(topicIdFromScene);
    }

    return (TQ.State && TQ.State.topic) ? TQ.State.topic._id : topicIdFromScene;
  };

  // private
  function getNativeEvent(e) {
    var e0 = e.nativeEvent;
    if (!e0 && e.gesture && e.gesture.srcEvent) { // gesture event of ionic
      e0 = e.gesture.srcEvent;
    }
    return e0;
  }

  Utility.getColorR = function(color) {
    checkColorString(color);
    return parseInt(color.substr(1, 2), 16);
  };

  Utility.getColorG = function(color)
  {
    checkColorString(color);
    return parseInt(color.substr(3, 2), 16);
  };

  Utility.getColorB = function(color)
  {
    checkColorString(color);
    return parseInt(color.substr(5, 2), 16);
  };

  Utility.RGB2Color = function(r, g, b) {
    return '#' + number2Hex(r) + number2Hex(g) + number2Hex(b);
  };

  Utility.getWorld2DcScale = function () {
    var sx = 1,
      sy = 1;

    if (currScene) {
      sx = TQ.Config.workingRegionWidth / currScene.getDesignatedWidth();
      sy = TQ.Config.workingRegionHeight / currScene.getDesignatedHeight();
    }

    return {sx: sx, sy: sy};
  };

  Utility.getDc2WorldScale = function () {
    var sx = 1,
      sy = 1;

    if (currScene) {
      sx = currScene.getDesignatedWidth() / TQ.Config.workingRegionWidth;
      sy = currScene.getDesignatedHeight() / TQ.Config.workingRegionHeight;
    }

    return {sx: sx, sy: sy};
  };

  Utility.world2css = function (x, y) {
    TQ.AssertExt.invalidLogic(!!TQ.State.innerHeight, "应该先让desktopEle ready");

    // window的左下角是（0,0）
    var canvas = TQ.Graphics.getCanvas(),
      canvasStyle = getComputedStyle(canvas, null),
      xCanvasOriginInCss = removePx(canvasStyle.left),
      yCanvasOriginInCss = removePx(canvasStyle.bottom),
      sx = currScene.getDesignatedWidth() / TQ.Config.workingRegionWidth,
      sy = currScene.getDesignatedHeight() / TQ.Config.workingRegionHeight;

    if (isNaN(yCanvasOriginInCss)) {
      yCanvasOriginInCss = TQ.State.innerHeight -
                (removePx(canvasStyle.top) + removePx(canvasStyle.height));
    }

    return {x: x / sx + xCanvasOriginInCss,
      y: y / sy + yCanvasOriginInCss};
  };

  Utility.world2cssFromTop = function (x, y) {
    TQ.AssertExt.invalidLogic(!!TQ.State.innerHeight, "应该先让desktopEle ready");
    var pos = Utility.world2css(x,y);
    return {
      x: pos.x,
      y: TQ.State.innerHeight - pos.y
    };
  };

  Utility.sendTextToClipboard = function (str) {
    var textArea = document.createElement("textarea");
    textArea.value = str;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    setTimeout(function () {
      document.execCommand("Copy");
    });
  };

  Utility.removeWelcomeTextPage = function () {
    function removeDomEleById(domId) {
      var domEle = document.getElementById(domId);
      if (domEle) {
        angular.element(domEle).remove();
      }
    }

    removeDomEleById('welcome-div');
    removeDomEleById('id-play-panel');
    removeDomEleById('welcome-brand');
  };

  function removePx(xInCss) {
    var result = Number(xInCss.replace("px", ""));
    if (isNaN(result)) {
      TQ.Log.error("css 取值错误， NaN： " + xInCss);
    }
    return result;
  }

  function number2Hex(n) {
    var str = n.toString(16).toUpperCase();
    if (n === 0) {
      return "00";
    } else if (n < 16) {
      return "0" +str;
    }

    return str;
  }

  function checkColorString(color) {
    TQ.Assert.isTrue(color[0] === '#', '颜色格式必须是#AABBCC');
  }

  var isDithering = false;
  function ditherStart() {
    isDithering = true;
    setTimeout(ditherEnd, 200);
  }

  function ditherEnd() {
    isDithering = false;
  }

  function preventDither() {
    var readyToGo = !isDithering;
    ditherStart();
    return readyToGo;
  }

  function createLocalId() {
    // localId是服务器Id（global Id）的补充，
    // 避免在object初创，没有global Id的时候导致混乱，简化逻辑
    // 比如： 缓存http存储的 storageManager就使用opus的localId来区别是否同一个对象
    // local Id, 唯一编号，平等对待各种对象，opus，level，element,....
    return 'localId' + localIdTimeBase + '-' + (++localIdCounter);
  }


  Utility.createLocalId = createLocalId;
  Utility.parseUrl = parseUrl;
  Utility.preventDither = preventDither;
  TQ.Utility = Utility;
}());
