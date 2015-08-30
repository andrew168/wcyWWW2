/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午12:42
 */
window.TQ = window.TQ || {};

(function () {
    function Config() {
    }
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
    var api_domain=api_domain+'/' + 'en';
    //Config.DOMAIN_NAME="localhost";
    Config.DOMAIN_NAME=window.location.host;
    Config.API_DOMAIN_NAME=api_domain;
    Config.EXTENSION = "";  // JS 不要后缀, 只有PHP自添加后缀
    Config.color = "#0000FF";
    Config.fontFace = window.TQ.Dictionary.fontFace;
    Config.fontSize = "36"; // px是合成函数自动加的
    Config.BACKGROUND_COLOR = "#FFF"; // HTML5的#系列颜色只有#FFF,不是#FFFFFF.
    Config.workingRegionX0 = 160; // ToDo: 1)初始化, 按照分辨率来. 2)响应窗口尺寸变化 (window.screen.width - 960) /2;
    Config.workingRegionY0 = 63;
    Config.workingRegionWidth = 751;
    Config.workingRegionHeight = 550;
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
    Config.IMAGES_CORE_PATH = "mcImages/";
    Config.SCENES_CORE_PATH = "mcAssets/";
    Config.SOUNDS_PATH ="mcSounds/"; //从 localhost的根目录开始, 不是 E盘的根目录
    Config.SOUND_PLUGIN_PATH = "../soundjs/";
    Config.DefaultUserID = 10000;

    // utilities tools
    Config.REMOVE_EMPTY_LEVEL_ON = true;

    //以下调试开关,默认值都是release版. 禁止把修改值上传到代码库(代码库是可以发布的版本, 不是调试版).
    Config.IS_DEBUG = false;
    Config.LOG_LEVEL = 2;  // release 版 为 0,完全没有,输出, 内部release为 1,不用动程序, 也能够看到错误;
    Config.AutoPlay = true;  // release 版 为 false, 第一次打开网址, 就自动播放;

    Config.attachmentPath='attachment/';
    Config.actionImgPath= Config.attachmentPath+'action_img/';
    window.TQ.Config = Config;
}());
