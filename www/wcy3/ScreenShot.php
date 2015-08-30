<?php
/**
*  ScreenShot: 复制单个屏幕(Canvas部分), 上传到服务器,
*  , 或连续复制屏幕, 制作GIF图像,上传到服务器/显示到页面上
*  可以指定 透明色, 背景色, 复制的范围(默认是整个canvas),
*  静态函数, 不需要初始化
**/
require_once 'ImageDBIO.php';  // 相对于本PHP所在的位置
function saveScreenShot($msg, $imageName) {
    global $g_ImageID;
    $result = $msg."检查数据";
    if (!isset($_POST['base64data'])) return $result; //  没有数据, 退出
    $result = $msg."检查用户ID和权限";
    $userID = readFromURL('userID', -1);
    $keywords = readFromURL('keywords', -1);
    if ($userID == -1) {
        $result = "请先登录";
        return $result;
    }
    $result =$msg."3";
    $data = preg_replace('/data:image\/(png|jpg|jpeg|gif|bmp);base64/','',$_POST['base64data']);
    $data = base64_decode($data);
    $img = imagecreatefromstring($data);
    $result =$msg."4";
    $fileExtension = "png";
    $desc = $imageName;
    $uniqueFilename = generateUniqueImageID($userID, $desc, $fileExtension,$keywords);
    //$uniqueFilename=_getImageID($userID,$desc,$keywords);
    doAddImage($g_ImageID, $uniqueFilename, getFiletypeID($fileExtension), $img);
    $result = "生成了屏幕截图";
    return $result;
}

if (isset($_POST['imageName'])) {
    $result = "保存不成功！".CUSTOMER_SERVICE_PHONE. ",错误代号:6";
    $result .="2";
    $imageName = $_POST['imageName'];
    echoExt($imageName);
    $result = saveScreenShot($result, $imageName);
}

echo($result);
/*
$data = 'data:image/png;base64,AAAFBfj42Pj4';
list($type, $data) = explode(';', $data);
list(, $data)      = explode(',', $data);
$data = base64_decode($data);
file_put_contents('/tmp/image.png', $data);
*/
