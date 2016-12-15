/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午12:42
 */
window.TQ = window.TQ || {};

(function () {
    function Config() {
    }
    // 陈永添加的配置， begin ---
    var host=window.location.host;
    status=host.indexOf("udoido.cn");
    var api_domain='';
    if(status!='-1'){
        api_domain='api.udoido.cn';
    }else{
        api_domain='api.udoido.com';
    }

    status=host.indexOf("test.udoido.cn");
    if(status!='-1'){
        api_domain='testapi.udoido.cn';
    }

    //ToDo:AZ mobile
    // var api_domain=api_domain+'/'+getcookie('select_lang');
    api_domain=api_domain+'/' + 'en';
    Config.API_DOMAIN_NAME=api_domain;
    Config.attachmentPath='attachment/';
    Config.actionImgPath= Config.attachmentPath+'action_img/';
    // 陈永添加的配置， --- end

    //Config.DOMAIN_NAME="localhost";
     Config.DOMAIN_NAME=window.location.host;
    Config.EXTENSION = "";  // JS 不要后缀, 只有PHP自添加后缀
    Config.color = "#0000FF";
    Config.FONT_LEVEL_UNIT = 16 * 2;
    Config.fontFace = window.TQ.Dictionary.fontFace;
    Config.fontSize = "128"; // px是合成函数自动加的
    Config.BACKGROUND_COLOR = "#FFF"; // HTML5的#系列颜色只有#FFF,不是#FFFFFF.
    Config.workingRegionX0 = 160; // ToDo: 1)初始化, 按照分辨率来. 2)响应窗口尺寸变化 (window.screen.width - 960) /2;
    Config.workingRegionY0 = 63;
    Config.workingRegionWidth = 751;
    Config.workingRegionHeight = 550;
    Config.snapOn = false;
    Config.snapDX = 50;
    Config.snapDY = 50;
    Config.ORIENTATION_PORTRAIT = "portrait";
    Config.ORIENTATION_LANDSCAPE = "landscape";
    Config.orientation = Config.ORIENTATION_PORTRAIT;
    Config.zoomX = 1; // 缩放系数
    Config.zoomY = 1;
    Config.validPageWidth = 960;
    Config.MouseSensitivity = 10;  // 10个像素Z向移动一个层次。
    Config.RotateSensitivity = 2;  // 2个像素Z向移动一个层次。
    Config.pivotX = 0.5;  // 图像缺省: Pivot在(0.5, 0.5)
    Config.pivotY = 0.5;
    Config.TEXT_PIVOT_X = 0.0;
    Config.TEXT_PIVOT_Y = Config.pivotY;
    Config.DISPLAY_CLIPS = false;
    Config.THUMBNAIL_WIDTH = 175;
    Config.THUMBNAIL_HEIGHT = 128;
    Config.RESOURCE_PAGE_SIZE = 15;
    Config.IK_ITERATE_TIME = 1;
    Config.DEMO_SCENE_NAME="SystemDemo1";
    Config.UNNAMED_SCENE = "wcy01";
    Config.THUMBS_CORE_PATH = "mcThumbs/";

    Config.SCENES_CORE_PATH = "mcAssets/";
    Config.WORKS_CORE_PATH = "mcWorks/";
    Config.VIDEOS_CORE_PATH = "mcVideos/";
    Config.TEMP_CORE_PATH = "temp/";
    Config.LOG_CORE_PATH = "log/";
    Config.SCREENSHOT_CORE_PATH = "screenshots/";
    Config.SOUND_PLUGIN_PATH = "../soundjs/";
    Config.DefaultUserID = 10000;

    // utilities tools
    Config.REMOVE_EMPTY_LEVEL_ON = true;

    //以下调试开关,默认值都是release版. 禁止把修改值上传到代码库(代码库是可以发布的版本, 不是调试版).
    Config.IS_DEBUG = false;
    Config.WX_DEBUG_ENABLED = false;
    Config.LOG_LEVEL = 7;  // release 版 为 0,完全没有,输出, 内部release为 1,不用动程序, 也能够看到错误;
    Config.AutoPlay = true; //false , release 版 为 true, 第一次打开网址, 就自动播放;
    Config.AutoSaveEnabled = true;  // release 版 为 true, 自动保存WCY作品到LocalStorage

    // 本地缓存的参数
    //private, must use get/set
    var _resourceHost = "";
    Config.getResourceHost = function() {
        return _resourceHost;
    };

    Config.setResourceHost = function(host) {
        _resourceHost = host;
    };


    Config.useHighlightBox = false;  // 不显示red的亮显box

    //
    Config.hasWx = true;  // 支持微信服务器绑定，绑定到 udoido
    Config.ChromeFileEnabled = true;
    Config.useCloundServerSimulator = true;
    Config.useCreateJsTouch = false;
    Config.statServiceEnabled = false;

    //允许使用本地文件系统缓存网络文件， 以便于离线使用， 和 降低网络流量， 提高系统速度。
    Config.TECH_TEST1_LOCAL_CACHE_ON = false;
    Config.LocalCacheEnabled = false;

    //允许2个素材server， （即：UDOIDO.cn和 本网站）
    Config.TwoMatServerEnabled = false;

    // 入口服务器配置
    Config.ENT_HOST = 'http://show.udoido.cn';

    // 管理和控制服务器的参数
    //Config.MAN_HOST = "http://man.udoido.cn";   // 素材管理， 分配素材id
    Config.MAN_HOST = 'http://show.udoido.cn';   // 素材管理， 分配素材id

    // 素材服务器的参数
    // Config.MAT_HOST = "http://www.udoido.cn"; // for new material (mXXXX),
    // Config.MAT_HOST = "http://bone.udoido.cn";   // for old material(pXXXX), before transfer
    Config.MAT_HOST = 'http://show.udoido.cn';   // for old material(pXXXX), before transfer
    Config.MAT_UPLOAD_API;  // 上传mats所用的url，具体取值，见下面的 两种配置

    // 作品服务器
    // Config.OPUS_HOST = "http://opus.udoido.cn";
    Config.OPUS_HOST = 'http://show.udoido.cn';

    // 签名认证服务器
    // Config.AUTH_HOST = "http://auth.udoido.cn";
    Config.AUTH_HOST = 'http://show.udoido.cn';

    Config.cloundaryEnabled = true; // 选择使用哪一种配置： Cloundary云 或者阿里云的bone，
    Config.Cloudinary = {
        name : 'eplan',
        api_key : "374258662676811"
    };

    // NOPIC 和 NOSOUND，从app code服务器直接获取，节省流量
    Config.APP_SERVER_IMAGES_CORE_PATH = "mcImages/";
    Config.APP_SERVER_SOUNDS_PATH = "mcSounds/";

    // 素材服务器的参数
    var matServerCloundary = {
        MAT_UPLOAD_API: "https://api.cloudinary.com/v1_1/" + Config.Cloudinary.name + "/upload",
        MAT_HOST: 'http://res.cloudinary.com', // /eplan/image/upload';
        IMAGES_CORE_PATH: 'eplan/image/upload/',
        SOUNDS_PATH: 'eplan/video/upload/' //从 localhost的根目录开始, 不是 E盘的根目录
    };

    var matServerBone = {
        MAT_UPLOAD_API: "http://test.udoido.cn/getWSignature",
        MAT_HOST: "http://test.udoido.cn",   // for old material(pXXXX), before transfer
        IMAGES_CORE_PATH: "mcImages/",
        SOUNDS_PATH: "mcSounds/" //从 localhost的根目录开始, 不是 E盘的根目录
    };

    if (Config.cloundaryEnabled) {
        $.extend(Config, matServerCloundary);
    } else {
        $.extend(Config, matServerBone);
    }

    window.TQ.Config = Config;
}());
