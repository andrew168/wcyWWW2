/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午12:42
 */
window.TQ = window.TQ || {};

(function () {
    var Config = {};

    // 系统容量参数
    Config.MAX_UNDO_STEP = 100;
    Config.MAX_KEYFRAME = 2000;
    Config.MAX_FILE_SIZE = 1024000; // 1M;
    // 陈永添加的配置， begin ---
    var host=window.location.host,
        rootDomain = (host.indexOf('udoido.com') >=0) ? 'udoido.com': 'udoido.cn',
        api_domain='api.' + rootDomain;

    if(host.indexOf('test.' + rootDomain) >=0){
        api_domain='testapi.' + rootDomain;
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
    Config.workingRegionX0 = 0;  // in device 坐标系 // ToDo: 1)初始化, 按照分辨率来. 2)响应窗口尺寸变化 (window.screen.width - 960) /2;
    Config.workingRegionY0 = 0;
    Config.workingRegionWidth = 751; // 舞台的尺寸（当前设备的, 从设备中读出）
    Config.workingRegionHeight = 550;
    Config.designatedWidth = 1024; // 414; //1093; //360; // 目标设备的尺寸,默认是（360*640），由系统从作品中动态读出，
                                  // 旧文件升级时候的缺省是(751， 550),
    Config.designatedHeight = 748; // 736; //615; // 640;
    Config.snapOn = false; // true;
    Config.snapAngleOn = false; // true;
    Config.snapDX = 10;
    Config.snapDY = 10;
    Config.ORIENTATION_PORTRAIT = "portrait";
    Config.ORIENTATION_LANDSCAPE = "landscape";
    Config.orientation = Config.ORIENTATION_PORTRAIT;
    Config.zoomX = 1; // 缩放系数
    Config.zoomY = 1;
    Config.MouseSensitivity = 10;  // 10个像素Z向移动一个层次。
    Config.RotateSensitivity = 2;  // 2个像素Z向移动一个层次。
    Config.pivotX = 0.5;  // 图像缺省: Pivot在(0.5, 0.5)
    Config.pivotY = 0.5;
    Config.TEXT_PIVOT_X = 0.5;
    Config.TEXT_PIVOT_Y = Config.pivotY;
    Config.DISPLAY_CLIPS = false;
    Config.THUMBNAIL_WIDTH = 175;
    Config.THUMBNAIL_HEIGHT = 128;
    Config.RESOURCE_PAGE_SIZE = 15;
    Config.IK_ITERATE_TIME = 1;
    Config.DEMO_SCENE_NAME="SystemDemo1";
    Config.UNNAMED_SCENE = "wcy01";
    Config.INVALID_WCY_ID = -1;
    Config.THUMBS_CORE_PATH = "mcThumbs/";

    Config.SCENES_CORE_PATH = "mcAssets/";
    Config.WORKS_CORE_PATH = "mcWorks/";
    Config.VIDEOS_CORE_PATH = "mcVideos/";
    Config.TEMP_CORE_PATH = "temp/";
    Config.LOG_CORE_PATH = "log/";
    Config.SCREENSHOT_CORE_PATH = "screenshots/";
    Config.SOUND_PLUGIN_PATH = "../soundjs/";
    Config.DefaultUserID = 10000;
    Config.speedFactor = {
        flyIn: 200,
        flyOut: 200,
        fadeIn: 0.25,
        fadeOut: 0.25,
        scaleIn: 2,
        scaleOut: 2,
        rotate: 140,
        twinkle: 1
    };

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


    Config.hightlightOn = true;
    Config.useHighlightBox = false;  // 不显示red的亮显box
    Config.koutuOn = false; // 默认是不抠图， 如果打开，则自动抠图， 并且自动剔除周边的空白
    Config.removeWhiteMarginOnly = false; // 在抠图的情况下， 只去除空白边，比全面抠图
    Config.textBubbleOn = false;
    Config.useCreateJSFullContainer = false; // 不把ele放到group container的displayObj中， 而是仍然放在stageContainer中
    Config.ignoreCachedFile = true;  //忽略保存在cache中的文件数据， 等用户ID系统正常使用之后， 再考虑如何启用它。


    //
    Config.hasWx = true;  //如果在微信之外使用，则自动关闭此功能： 支持微信服务器绑定，绑定到 udoido
    Config.hasFacebook = false; // 中国没有fb,
    Config.wx = {appId: 'wx5fe65e70536d0258'}; // udoido
    Config.hasAudioRecording = false;  // 没有录音功能
    Config.ChromeFileEnabled = true;
    Config.useCloundServerSimulator = true;
    Config.useCreateJsTouch = false;
    Config.statServiceEnabled = false;

    //允许使用本地文件系统缓存网络文件， 以便于离线使用， 和 降低网络流量， 提高系统速度。
    Config.TECH_TEST1_LOCAL_CACHE_ON = false;
    Config.LocalCacheEnabled = false;

    //允许2个素材server， （即：udoido.com和 本网站）
    Config.TwoMatServerEnabled = false;

    // 入口服务器配置
    Config.ENT_HOST = 'http://show.' + rootDomain;

    // 管理和控制服务器的参数
    //Config.MAN_HOST = 'http://man.' + rootDomain;   // 素材管理， 分配素材id
    Config.MAN_HOST = 'http://show.' + rootDomain;   // 素材管理， 分配素材id

    // 素材服务器的参数
    // Config.MAT_HOST = 'http://www.' + rootDomain; // for new material (mXXXX),
    // Config.MAT_HOST = 'http://bone.' + rootDomain;   // for old material(pXXXX), before transfer
    Config.MAT_HOST = 'http://show.' + rootDomain;   // for old material(pXXXX), before transfer
    Config.MAT_UPLOAD_API;  // 上传mats所用的url，具体取值，见下面的 两种配置

    // 作品服务器
    // Config.OPUS_HOST = 'http://opus.' + rootDomain;
    Config.OPUS_HOST = 'http://show.' + rootDomain;
    Config.TEST_HOST = 'http://test.' + rootDomain;
    Config.BONE_HOST = 'http://bone.' + rootDomain;

    // 签名认证服务器
    // Config.AUTH_HOST = 'http://auth.' + rootDomain;
    Config.AUTH_HOST = 'http://show.' + rootDomain;

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
        MAT_UPLOAD_API: Config.TEST_HOST + '/getWSignature',
        MAT_HOST: Config.TEST_HOST,   // for old material(pXXXX), before transfer
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
