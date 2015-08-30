<?php
/**
 * PHP 部分专用的配置文件
 */
define('GLOBAL_DEBUG', true);   //global debug off, 就是完全没有任何输出. 而它On, 则各个模块自己控制On/off
define('CUSTOMER_SERVICE_PHONE','请和客户服务员联系,电话400-661-3568');
define('MAX_IMAGE_NUM', 1000);
// DB和JS使用的名字有区别, Thumb name
define('R0166_THUMBS_PATH_FOR_JS', "thumbs");
define('THUMBS_PATH_FOR_JS', "mcThumbs");
define('THUMBS_PATH', "../../mcThumbs");
define('IMAGES_PATH', "../../mcImages");
define('THUMBS_PATH_B', "../../mcThumbsB");
define('SCENE_PATH', "../../mcAssets");
define('SCENE_EXTENSION','.wdm');
define('THUMB_WIDTH', 100);
define('THUMB_HEIGHT', 50);
define('THUMB_WIDTH_B', 168);
define('THUMB_HEIGHT_B', 136);
define('DATABASE_NAME', "ex1db");
// define('DATABASE_PSW', "123456__abcefg");
define('DATABASE_PSW', "772d5e3194");
define('DATABASE_USER', "root");
define('DATABASE_HOST', "localhost");
// define('DOMAIN_NAME', "localhost");
define('DOMAIN_NAME', "www.udoido.cn");
define('NOT_FOUND', -1);
define('INVALID_USERID', -1);
