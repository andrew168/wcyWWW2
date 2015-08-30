<?php
/**
 * 图像数据库的输入和输出:
 * 上传一副图像, updateThumb()
 * 检索一组关键词: searchThumbsByURL();
 */
header('Content-Type:text/html; charset=UTF-8');
require_once("PConfig.php");
require_once("Utils.php");
require_once(BASE_URL."/tq/class/curl.class.php");
$__DEBUG_ON = false;
$g_ImageID = -1;
$g_WcyQuery = "select AutherID, ID, Name, Path, EditorID, CreateTime, EditTime, i.Type, ID as dummy1, ID as dummy2 From Image as i";
$g_WcyQuerySimple = "select Path From Image";
$g_WcyQueryTitle = "select Name From Image";
$__gKeywordsNum = 0;


function _getDB() {
    $gDb = new mysqli();
    $gDb->connect(DATABASE_HOST, DATABASE_USER, DATABASE_PSW, DATABASE_NAME); // "super168");
    if ($gDb !=null)
    {
        $gDb->set_charset('utf8'); //  必须指定UTF8, 防止乱码
    }
    return $gDb;
}

function readKeyword() {
    $keyword = readFromURL('keywords', "");
    echoExt("keywords = ".$keyword);
    // 规范化, 空格, 下划线都转为 唯一的分隔符 ,
    $keyword = explode(",", $keyword);
    // var_dump($keyword);
    return $keyword;
}

function doAddImage($imageID,$uniqueFilename, $filetypeID, $srcImage)
{
    $keywords = readKeyword();
    $thumbName = getThumbname($uniqueFilename);
    echoExt($thumbName);
    if ($srcImage!= null) {
        if ($filetypeID != IMG_PNG) {
            echoExt("$filetypeID文件类别错误: 应该是PNG");
        }
        imagesavealpha($srcImage, true);  // 要求保存alpha信息,
        imagepng($srcImage, IMAGES_PATH.'/'.$uniqueFilename);
/* 
        $conn = new Mongo();//如果设置了密码自己配置DSN
        $db = $conn->mcImages;
        $grid = $db->getGridFS();
        $data = file_get_contents(IMAGES_PATH.'/'.$uniqueFilename); 
        $one = $grid->findOne(array('img_id'=>$uniqueFilename));
        if(empty($one)){
            $id = $grid->storeBytes($data,array("img_id"=>$uniqueFilename)); 
            echo IMAGES_PATH.'/'.$uniqueFilename;
        }
 */
        echoExt(IMAGES_PATH.'/'.$uniqueFilename);
    }

    if ($srcImage == null) {
      $srcImage = createImage(IMAGES_PATH.'/'.$uniqueFilename, $filetypeID);
    }
    // 创建更大的Thumbs， 不必入库，
    createThumbnail(THUMB_WIDTH_B, THUMB_HEIGHT_B, getThumbBPath($thumbName), $filetypeID, $srcImage);
    createThumbnail(THUMB_WIDTH, THUMB_HEIGHT, getThumbPath($thumbName), $filetypeID, $srcImage);
    updateThumb($imageID, convertPHPnameToJSName($thumbName), $keywords);
    // assert($srcImage != null);
    if ($srcImage != null) {
      imagedestroy($srcImage);
    }
}

function searchThumbsByURL()
{
        // 编号从0开始, 符合C的约定. 0是 第一个结果, 1,是第二个,...
        $start = readFromURL('start', 0);
        $start = ($start < 0) ? 0: $start;
        $start = ($start > MAX_IMAGE_NUM) ? MAX_IMAGE_NUM : $start;
        echoExt("start = $start");

        $amount = readFromURL('amount', 100);
        $amount = ($amount < 1) ? 1 : $amount ;
        $amount = ($amount > MAX_IMAGE_NUM) ? MAX_IMAGE_NUM : $amount ;
        echoExt("amount = $amount ");

        $keyword = readKeyword();
        $uid = readFromURL('uid',0);
        searchThumbs($start, $amount, $keyword,$uid);
        //getAllImages($start, $amount);
}

function convertPHPnameToJSName($filename)
{
    return str_replace(THUMBS_PATH, THUMBS_PATH_FOR_JS, $filename);
}

function getThumbname($filename) {
    return $filename;
}

function createThumbnail($_maxWidth, $_maxHeight, $fullname, $filetypeID, $image) {
    // assert($image != null);
    $width = imagesx($image);
    $height = imagesy($image);
    $thumb_width_allowed = ($width < $_maxWidth) ? $width : $_maxWidth;
    $thumb_height_allowed = ($height < $_maxHeight) ? $height : $_maxHeight;
    $thumb_height = $thumb_width_allowed * $height/ $width;
    if ( $thumb_height < $thumb_height_allowed) {
        $thumb_width = $thumb_width_allowed;
    } else {
        $thumb_height = $thumb_height_allowed;
        $thumb_width = $thumb_height_allowed * $width /$height;
    }
    echoExt("imageW,H: $width, $height, thumbW,H: $thumb_width, $thumb_height");
    $thumb = imagecreatetruecolor($thumb_width, $thumb_height);
    $bkcolor=imagecolorallocatealpha($thumb,255,255,255, 127);  // alpha = 0 表示完全不透明，127 表示完全透明
    imagecolortransparent($thumb,$bkcolor);
    imagealphablending($thumb, true);
    imagefill($thumb,0,0,$bkcolor);
    imagesavealpha($thumb, true);
    imagecopyresampled($thumb, $image, 0, 0, 0, 0, $thumb_width, $thumb_height, $width, $height);
    saveImage($thumb, $fullname, $filetypeID);
    echoExt($fullname);
    imagedestroy($thumb);
}

function getThumbPath($thumbName) { return THUMBS_PATH.'/'.$thumbName; }
function getThumbBPath($thumbName) { return THUMBS_PATH_B.'/'.$thumbName; }
function getScenePath($filename) { return SCENE_PATH.'/'.removeExtension($filename).SCENE_EXTENSION; }
function getScreenShotPath($filename) { return IMAGES_PATH.'/'.removeExtension($filename).".png"; }

function removeExtension($filename) {
    $pos = strrpos($filename,'.');     //得到最后一个点的位置
    if ($pos > 0) {
        $filename = substr($filename,0,$pos);
    }
    return $filename;
}

function extractPureID($wcyID) { // remove ‘p'
    $pos = strrpos("p".$wcyID, "p"); //先额外添加1个p，以避免找不到p而返回false，（无法区分 false和0）

    if ($pos > 0) { // 确实含有p， 不是额外添加的。
        $pos = $pos - 1;  // 减去额外添加的p
        $wcyID = substr($wcyID, $pos + 1, strlen($wcyID) - 1 );
    }
    return $wcyID;
}

function createImage($filename, $filetypeID) {
    switch ($filetypeID) {
        case IMG_JPG: return imagecreatefromjpeg($filename);
        case IMG_GIF: return imagecreatefromgif($filename);
        case IMG_PNG: return imagecreatefrompng($filename);
        case IMG_WBMP: return imagecreatefromwbmp($filename);
    }

    echoExt("未识别的文件类别");
    return null;
}

function saveImage($imageResource, $filename, $filetypeID) {
    switch ($filetypeID) {
        case IMG_JPG: return imagejpeg($imageResource, $filename);
        case IMG_GIF: return imagegif($imageResource, $filename);
        case IMG_PNG: imagesavealpha($imageResource, true); return imagepng($imageResource,$filename);
        case IMG_WBMP: return imagewbmp($imageResource,$filename);
    }

    echoExt("未识别的文件类别");
    return null;
}

// GetThumbs();
// 最多查3个关键词, 可以是空的
// uid只对读取我的资源有效
/*
function searchThumbs($start, $amount, $labels,$uid='')
{
    global $__gKeywordsNum;
    $__gKeywordsNum = count($labels);

    if (null == ($gDb=_getDB())) {
        return false;
    }
    $limit = " LIMIT ".$start.", ".$amount;
    $condition ="";
    $first = true;
    $askRefined = false;
    $label_str='';
    $type=0;
    $is_sucai=0;
    $is_sound=0;
    $type_conditions='';

    switch($labels[0]){
    case '微动漫':
        $type_conditions=" and Type=1 ";
        break;
    case '我的素材':
        $type_conditions=" and (Type=2 or Type=3) ";
        $is_sucai=1;
        break;
    case '元件':
        $type_conditions=" and Type=3 ";
        break;
    case '声音':
        $type_conditions=" and Type=11 ";
        $is_sound=1;
        break; 
    default:
        $type_conditions=" and (Type=2 or Type=3) ";
        break;
    }

    $label_condition='';
    if($is_sucai==1){
    
    }else{
        foreach($labels as $label) {
            if ($label == "") continue;
            if ($label == '精选') {
                $askRefined = true;
            }
            $label_str.=$label.',';

            if ($first) {
                $label_condition = " Where Name='".$label."'";
                $first = false;
            } else {
                $label_condition = $label_condition." OR Name='".$label."'";
            }
        }
        $query=$gDb->query("select * from Label $label_condition");
        $label_id_arr=array();
        while($result=$query->fetch_array()){
            $label_id_arr[$result['ID']]=$result['ID'];
        }
        $image_id_arr=array();
        if(!empty($label_id_arr)){
            $query=$gDb->query("select * from Type where LabelID in (".implode(',',$label_id_arr).")");
            while($result=$query->fetch_array()){
                $image_id_arr[$result['ImageID']]=$result['ImageID'];
            }
        }
    }
  
    if ($askRefined) {
        $orderCmd = " ORDER BY  EditTime DESC, ID DESC";
    } else {
        $orderCmd = " ORDER BY  ID DESC";   // ORDER BY HitNum DESC 在只有1个关键词的时候, 最新的上传的图片排在前面
    }

    if(!empty($image_id_arr)){
        $condition.=" and ID in (".implode(',',$image_id_arr).") ";
    }

    if(!empty($uid) && is_numeric($uid) && $is_sound<>1){
        $condition.=" and AutherID=$uid ";
    }else{
        $condition.=" and (AutherID=$uid or Status=1 or Status=2 ) ";
    }
  
    //根据type值读取对应的类型
    $condition.=" $type_conditions ";
    //只读取发布状态
    //如果是我的素材那么读取 自己所有状态
    if($is_sucai || $is_sound){
    }else{
    }

    // Limit 子句, 应该是最后一个
    $query_all ="select * from Image  where 1=1 "
        .$condition
        ." GROUP BY ID"
        .$orderCmd;
    //分页查询
        $query=$query_all.$limit;
    //结果
    $type_array['is_sound']=$is_sound;
    $type_array['is_sucai']=$is_sucai;
    returnResult($query,$query_all,$type_array);
}
 */

function _getPath($query) {
    if (null == ($gDb=_getDB())) {
        return false;
    }

    $result = $gDb->prepare($query);
    $result->execute();
    $path = "";
    $wcyPath = "wcy01.wdm";
    $result->bind_result($path);
    echoExt($path);
    if ($result) {
        while ($result->fetch()) {
            $wcyPath = removeExtension($path).".wdm";
            break;
        }
    } else {
        echoExt("查询失败");
        var_dump($query);
        var_dump($result);
    }

    $result->close();
    return $wcyPath;
}

function wcyID2Title($wcyID)
{
    global $g_WcyQueryTitle;
    $query = $g_WcyQueryTitle." where ID='".$wcyID."'";
    if (null == ($gDb=_getDB())) {
        return false;
    }

    $result = $gDb->prepare($query);
    $result->execute();
    $title = "";
    $wcyTitle = "找不到标题";
    $result->bind_result($title);
    echoExt($title);
    if ($result) {
        while ($result->fetch()) {
            $wcyTitle = $title;
            break;
        }
    } else {
        echoExt("查询失败");
        var_dump($query);
        var_dump($result);
    }

    $result->close();
    return $wcyTitle;
}

function returnResultCount($query){
    if (null == ($gDb=_getDB())) {
        return false;
    }
    $query=$gDb->query($query);
    $tmp=array();
    while($result=$query->fetch_array()){
        $tmp[]=$result;
    }
    return count($tmp);

}
/*
 * 查询结果
 * $query分页查询 $query_all 所有的
 */
/*
function returnResult($query,$query_all='',$type_array=array()) {

    global $__gKeywordsNum;
    if (null == ($gDb=_getDB())) {
        return false;
    }

    $query = $gDb->query($query);
     
    $hitNum = 0;
    $imageAuthorID = 0;
    $ID = 0;
    $editorID = 0;
    $createTime = "";
    $editTime = "";
    $labelName = "";
    $imageTitle = "";
    $type = "";
    $path = "";
    //$result->bind_result($imageAuthorID, $ID, $imageTitle, $path, $editorID, $createTime, $editTime, $type, $labelName, $hitNum);  // 这是按照顺序来对应的,与名字无关.
    // 所以,与Query语句中的顺序要一致

    //echoExt('$imageAuthorID.": ".$ID.": ".$imageTitle.", ".$path.", ".$labelName.", ".$createTime.", ".$editTime.", ".$type.", ".$hitNum');
     
        $tmp='';
        while($result=$query->fetch_array()){
            $ID=$result['ID'];
            $path=$result['Path'];
            $createTime=$result['CreateTime'];
            $imageTitle=$result['Name'];
            $editorID=$result['EditorID'];
            $type=$result['Type'];

            //   echo $imageTitle.", ".$path.", ".$labelName.", ".$hitNum."<br/>";
            //判断标签是不是声音类型
            $sound_src='';
            $image_class='image_click';
            $resource_image_style_ext="style='display:none'";
            if($type_array['is_sound']==1){
                $fullPath = DOMAIN_NAME."/Weidongman/styles/images/new-sound.png";
                $sound_src=" soundSrc=".DOMAIN_NAME."/mcSounds/$path";
                $sound_path=" soundPath='mcSounds/$path'";
            }elseif($type_array['is_sucai']==1){
                $resource_image_style_ext="style='display:block'";
                $fullPath = DOMAIN_NAME."/".THUMBS_PATH_FOR_JS.'/'.upgradeR0166($path);
            }else{
                $fullPath = DOMAIN_NAME."/".THUMBS_PATH_FOR_JS.'/'.upgradeR0166($path);
            }
            echoExt($fullPath."<br/>");
            $width_height='';
            $resource_del_style='';
            if($_SESSION['uid']<>''){
                //$resource_del_style="<a id='ClosenewPop' class='icon-close mywcyid-icon-close' title='关闭' hidefocus='true' href='javascript:void(0)' $resource_image_style_ext></a>";
            }
            //删除按钮
            if($type_array['is_sound']==1){
                //声音资源
                $width_height=" width='32' height='32' ";
                $tmp.= "<li><img src='$fullPath' $sound_src $sound_path wcyID='$ID' title='".htmlspecialchars($imageTitle)."' authorID='$imageAuthorID' editorID='$editorID' createTime='$createTime' editTime='$editTime' Type='$type' $width_height class='sound_click'><a href='javascript:void(0)' $sound_src $sound_path class='start_sound'>试听</a></li>";
            }else{
                //图片资源
                $tmp.="<div class='fn-left'><div class='thumb_div'><img src='$fullPath'  wcyID='$ID' title='$imageTitle' authorID='$imageAuthorID' editorID='$editorID' createTime='$createTime' editTime='$editTime' Type='$type' $width_height class='new-house-main-img $image_class'></div>$resource_del_style</div>";
            }

            // updateToR427($fullPath);
        }
        $arr=array();
        if($type_array['is_sound']==1){
            $list="<ul>$tmp</ul>";
        }else{
            $list= $tmp;
        }

        $count_all=returnResultCount($query_all);
        $arr['count']=$count_all;
        $arr['list']=$list;
        echo json_encode($arr);
    $query->close();
    return true;
}
 */

function wcyID2Path($wcyID)
{
    global $g_WcyQuerySimple;
    $query = $g_WcyQuerySimple." where ID='".$wcyID."'";
    return _getPath($query);
}

function getWcyDetailByID($imageID)
{
    global $g_WcyQuery;
    global $__gKeywordsNum;
    $__gKeywordsNum = 0;
    $query = $g_WcyQuery." where ID='".$imageID."'";
    returnResult($query);
}

function getWcyDetailByThumbID($path)
{
    global $g_WcyQuery;
    global $__gKeywordsNum;
    $__gKeywordsNum = 0;
    $query = $g_WcyQuery." where Path='".$path."'";
    returnResult($query);
}

function updateToR427($fullPath) { //  生成大缩略图, 如果没有的话
    $smallThumbsName = str_replace(DOMAIN_NAME, "../..", $fullPath);
    $bigThumbsName = str_replace("mcThumbs", "mcThumbsB", $smallThumbsName);
    if (file_exists($bigThumbsName)) return;
    $imageName = str_replace("mcThumbsB", "mcImages", $bigThumbsName);
    $srcImage = createImage($imageName, IMG_PNG);
    if ($srcImage) {
       createThumbnail(THUMB_WIDTH_B, THUMB_HEIGHT_B, $bigThumbsName, IMG_PNG, $srcImage);
       imagedestroy($srcImage);
    }
}

function upgradeR0166($oldPath) {
  // 兼容 R0166 changlist 之前的 资源，i.e 把 资源目录 从 "thumbs/XXXXXX.jpg" 改为 " XXXXXX.jpg"
  return str_replace(R0166_THUMBS_PATH_FOR_JS.'/', '', $oldPath); // 与老版本兼容;
}

/**
    * @brief checkType 根据关键词检测是元件还是动画
    *
    * @param $keywords
    *
    * @return 
 */
function checkType($keywords){
    $result=array();
    $_element_flag=preg_match("/.*元件.*/",$keywords);
    $type_name='';
    $type_id='';
    if($_element_flag==1){
        $type_name='element';
        $type_id=3;
    }
    //微创意
    $_wcy_flag=preg_match("/.*微动漫.*/",$keywords);
    if($_wcy_flag==1){
        $type_name='wcy';
        $type_id=1;
    }
    $result['type_name']=$type_name;
    $result['type_id']=$type_id;
    return $result;
}
//更新类型
function updateType($labels,$imageID){
    if(is_array($labels)){
        $labels_str=implode(',',$labels);
    }else{
        $labels_str=$labels;
    }
    //判断是否是元件
    $check_result=checkType($labels_str);
    $type_name=$check_result['type_name'];
    if($type_name=='element'){
        $s_data['typeid']=$check_result['type_id'];
        $s_data['statusid']=1;
    }elseif($type_name=='wcy'){
        $s_data['typeid']=$check_result['type_id'];
        $s_data['statusid']=0;
    }
    $curl=new Curl();
    $s_data['imageid']=$imageID;
    $result_status=$curl->post(DOMAIN_NAME.'/index.php/api/wcy/type_update',$s_data);
    $curl->close();
}
function updateThumb($imageID, $path, $labels)
{
    if (($gDb =_getDB()) != null) {
        updateImageTable($imageID, $path);
        var_dumpExt($labels);

        updateType($labels,$imageID);

        //移除默认的标识(微动漫或者元件)
        unset($labels[0]);

        foreach($labels as $label) {
            echoExt("关键词1: $label");
            $labelID = _getLabelID($label);
            if (!hasRecorded($imageID, $labelID)){  //  不能重复插入。
                addToTypeTable($imageID, $labelID);

                //$result=$gDb->query("select * from Label where ID=$labelID");
                //$row=$result->fetch_assoc();
            }
        }
        $gDb->close();
    }
}

function hasRecorded($imageID, $labelID)
{
    $query ="SELECT ID from Type WHERE ImageID=\"$imageID\" AND LabelID =\"$labelID\"";
    if (__queryID($query, "hasRecorded") >=0) {
        return true;
    }
    return false;
}

// 数据库整理, 删除重复的记录：
//  对于任何一个记录， 检查与其具有相同 ImageID和 LabelID
function _updateRemoveDuplicate() {
    global $gDb;
    for ($i = 0; $i < 305; $i+=10) {
        $gDb = _getDB();
        $query ="SELECT ID, ImageID, LabelID FROM Type LIMIT $i, 10";
        $result = $gDb->prepare($query);
        $result->execute();
        $ID = $ImageID = $LabelID = 0;
        $result->bind_result($ID, $ImageID, $LabelID);
        $IDArr = array();
        $ImageIDArr = array();
        $LabelIDArr = array();
        if ($result) {
            while ($result->fetch()) {
                $IDArr[] = $ID;
                $ImageIDArr[] = $ImageID;
                $LabelIDArr[] = $LabelID;
            }
        }
        $result->close();
        $gDb->close();

        for ($j=0; $j < count($IDArr); $j++) {
            $gDb = _getDB();
            $query2 = "DELETE from Type WHERE ImageID=$ImageIDArr[$j] AND LabelID=$LabelIDArr[$j] AND ID>$IDArr[$j]";
            $result2 = $gDb->prepare($query2);
            $result2->execute();
            $result2->close();
            $gDb->close();
        }
    }
}

function addToImageTable($userID, $desc, $path)
{
    $curl=new Curl();
    $s_data['uid']=$userID;
    $s_data['wcyname']=$desc;
    $s_data['wcypath']=$path;
    $school_id=0;
    //检测是否是学校版本登录
    if(!empty($_SESSION['school_id'])){
        $school_id=$_SESSION['school_id'];
    }
    $s_data['school_id']=$school_id;
    $result=$curl->post(DOMAIN_NAME.'/index.php/api/wcy/wcy_add',$s_data);
    $result=json_decode($result,true);
    $curl->close();
    if($result['status']==false){
        return false; 
    }else{
        return $result['id'];
    }
}

function updateImageTable($ID, $path)
{
    $gDb = _getDB();
    $query ="UPDATE Image SET Path=\"$path\" WHERE ID=\"$ID\"";
    $result = $gDb->query($query);
    if ($result == false) {
        echoExt("不成功");
        echoExt($query);
        return false;
    } else {
        echoExt("插入成功Image表, ");
    }

    return true;
}

function addToTypeTable($imageID, $labelID)
{
    $gDb = _getDB();
    $query ="INSERT INTO Type (ImageID, LabelID) VALUES (\"$imageID\", \"$labelID\")";
    $result = $gDb->query($query);
    if ($result == false) {
        echoExt("不成功");
        echoExt($query);
        return false;
    } else {
        echoExt("插入成功Type表");
    }

    return true;
}

function _addToLabelTable($label)
{
    $gDb = _getDB();
    $query ="INSERT INTO Label (Name) VALUES (\"$label\")";
    $result = $gDb->query($query);
    if ($result == false) {
        echoExt("不成功");
        echoExt($query);
        return false;
    } else {
        echoExt("插入成功, label表");
    }

    return true;
}

function _getLabelID($labelName)
{
    $id = _do_getLabelID($labelName);
    if ($id < 0) {
        _addTolabelTable($labelName);
        $id = _do_getLabelID($labelName);
    }
    if ($id < 0) {
        echoExt("insert标签出错");
    }

    return $id;
}

function deleteImage($userID, $path) {
    $saveImageID = _getImageID2($userID, $path);
    if ($saveImageID == NOT_FOUND) {
        return NOT_FOUND;
    }
    $query ="DELETE FROM Image Where ID=\"$saveImageID\"";
    if (__execQuery($query)) {
        _deleteLabels($saveImageID);
    }

    return $saveImageID;
}

function deleteWDM($userID, $path) {
    $result = deleteImage($userID, $path);
    if ($result >= 0) {
        $result = 0;
        if (!unlink(getScenePath($path))) $result = -2;
        if (!unlink(getScreenShotPath($path))) $result += -4;
        if (!unlink(getThumbPath($path))) $result += -8;
        if (!unlink(getThumbBPath($path))) $result += -16;
    }
    return $result;
}

function _deleteLabels($imageID)
{
    $query ="DELETE FROM Type Where ImageID=\"$imageID\"";
    return __execQuery($query);
}

function _getImageID($userID, $desc,$keywords='') {
    $check_result=checkType($keywords);
    $type_name=$check_result['type_name'];
    $type_id=$check_result['type_id'];
 
    if(!empty($type_id)){
        $query ="SELECT ID FROM Image Where AutherID=$userID AND Name='$desc' AND Type=$type_id ORDER BY ID DESC LIMIT 0, 1";
        $id= __queryID($query, "image");
        return $id;
    }
}

function _getImageID2($userID, $path) {
    $ID = _doGetImageID2($userID, $path);
    if ($ID < 0) $ID = _doGetImageID2($userID, "thumbs/".$path);
    if ($ID < 0) $ID = _doGetImageID2($userID, DOMAIN_NAME."/mcThumbs/".$path);
    return $ID;
}

function _doGetImageID2($userID, $path) {
    if (!isEditor($userID)) {
        $query ="SELECT ID FROM Image Where AutherID=\"$userID\" AND Path=\"$path\"";
    } else {
        $query ="SELECT ID FROM Image Where Path=\"$path\"";
    }
    $ID = __queryID($query, "image");
    return $ID;
}

function _do_getLabelID($labelName)
{
    $query ="SELECT ID FROM Label Where Name=\"$labelName\"";
    return __queryID($query, "label");
}

function generateUniqueImageID($userID, $desc, $fileExtension, $keywords='',$alwaysCreate=false) {
    global $g_ImageID;
    $extensionWithoutDot = str_replace(".", "", $fileExtension);

    $ID = ($alwaysCreate) ? -1 : _getImageID($userID, $desc,$keywords);
     if ($ID < 0 ) {
        $ID=addToImageTable($userID, $desc, "nopic"); // 插入一个空的记录, 保存该文件
        updateType($keywords,$ID);
        //$ID = _getImageID($userID, $desc);
    }
    $g_ImageID = $ID;

    $check_result=checkType($keywords);
    $type_id=$check_result['type_id'];
    //查询关键词第二个分类
    $keywords_arr=explode(',',$keywords);
    if($keywords_arr[1]<>''){
        //提交到分类更新中
        $curl=new Curl();
        $result_status=$curl->post(DOMAIN_NAME.'/index.php/api/category/category_update',array('wcyid'=>$g_ImageID,'category_id'=>$keywords_arr[1],'type_id'=>$type_id));
        $curl->close();
    }
    return "p$g_ImageID.$extensionWithoutDot";
}

function getAllImages($start, $amount)
{
    $gDb = _getDB();
    $gDb->query("set names utf8");
    $limit = " LIMIT ".$start.", ".$amount;
    // Limit 子句, 应该是最后一个
    $query ="select i.Name AS ImageTitle, i.Path from Image as i"
        ." GROUP BY i.Path ".$limit;   //  排除重复的, 即使名字相同, 图片也可能不同,
    // ToDo: 自动检索,比较,排除相同的图像, 以免浪费空间, 允许多个名字共用一个URL
    //  找"阳光"或者"沙滩" 都可以得到 "阳光沙滩"图片, 但是,如果同时检索二者, 则只返回一个图片(合并结果)
    // 不会返回两种相同的图
    $result = $gDb->prepare($query);
    $result->execute();
    $result->bind_result($imageTitle, $path);  // 这是按照顺序来对应的,与名字无关.
    // 所以,与Query语句中的顺序要一致

    echoExt("ImageTitle  Path");
    if ($result) {
        while ($result->fetch()) {
            echo $imageTitle.", ".$path."<br/>";
        }
    } else {
        echoExt("查询失败");
        var_dump($query);
        var_dump($result);
    }

    $result->close();
}

function checkDbError()  //ToDO:
{
    $gDb = _getDB();
    $msg = "error";

    if (0 != ($res = mysqli_error($gDb)))
    {
        print "db error \n" + $res;
    } else {
        print $msg;
    }

    print "db error " + $res;
}

function CheckAllGlobalVariables()
{
    var_dump($_GET); echoExt("");
    var_dump($_POST); echoExt("");
    var_dump($_FILES);echoExt("");
/*
    var_dump($_SESSION); echoExt("");
    var_dump($_SERVER);echoExt("");
    var_dump($_ENV); echoExt("");
    var_dump($_COOKIE);echoExt("");
    var_dump($_REQUEST); echoExt("");
    var_dump($GLOBALS);echoExt("");
*/
}

function getFiletypeID($ext)
{
    $filetypeID = -1;
    switch ($ext) {
        case 'jpg': $filetypeID = IMG_JPG; break;
        case "png": $filetypeID = IMG_PNG; break;
        case "gif": $filetypeID = IMG_GIF; break;
        case "wbmp": $filetypeID = IMG_WBMP; break;
    }

    return $filetypeID;
}

function getExtension($filetypeID)
{
    switch ($filetypeID) {
        case IMG_JPG: return "jpg"; break;
        case IMG_PNG: return "png"; break;
        case IMG_GIF: return "gif"; break;
        case IMG_WBMP: return "wbmp"; break;
    };

    return "unk";
}

function __execQuery($query) {
    $gDb = _getDB();
    $result = $gDb->prepare($query);
    $result->execute();
    if ($result) {
         // delete ，没有msg；
         // 如果bind 一个变量则会出错
        $result->close();
        return true;
    }

    echoExt("查询失败");
    var_dumpExt($query);
    var_dumpExt($result);
    return false;
}

function __queryID($query, $msg) {
    $id='-1';
    $gDb = _getDB();
    $result = $gDb->query($query);
    $result_arr=$result->fetch_assoc();

    if(!empty($result_arr)){
        $id=$result_arr['ID'];
    }
    return $id;
    /* $gDb = _getDB();
    $result = $gDb->prepare($query);
    $result->execute();
    $result->bind_result($ID);
    if ($result) {
        while ($result->fetch()) {
            echoExt("$msg ID = $ID");
            $result->close();
            return $ID;
        }
    }

    echoExt("查询失败");
    var_dumpExt($query);
    var_dumpExt($result);
    return -1; */
}

//设置发布
function set_publish($wcyid){
    if(!empty($wcyid)){
        $gDb = _getDB();
        $query ="update Image set Status=1 where ID=$wcyid";
        $result = $gDb->query($query);
    }
}
//查看当前用户的作品名称是不是存在
function checkWcynameByUid($name,$autherID,$mc_type_id){
    $gDb = _getDB();
    $query ="select * from Image where AutherID=$autherID and Name='$name' and Type=$mc_type_id";
    $result = $gDb->query($query);
    $result_arr=$result->fetch_assoc();
    return $result_arr;
}
function isEditor($userID) { // ToDo: 假函数, 需要实现真正的权限管理
    return (($userID == 1) || ($userID == 9) || ($userID == 10012) || ($userID == 10078) || $userID==31999);
}
?>
