<?php # Script 11.2 - upload_image.php
require_once 'ImageDBIO.php';  // 相对于本PHP所在的位置
//* 本地上传php处理部分
// Check if the form has been submitted:
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isLogged()) {
        echo "请先登录�?;
        return;
    }
    $userID = readFromURL('userID', -1);

    global $g_ImageID;
    // Check for an uploaded file:
    //* 拖动上传php处理部分
    $img_url=$_POST['url_val'];
    if(!empty($img_url)){
        $img_url_data=file_get_contents($img_url);
        header("Content-type: image/png");
        $im = imagecreatefromstring($img_url_data);
        if ($im !== false) {
            $descFilename =substr(urlencode($img_url), 0, 250);
            $fileExtension = "png";
            $filetypeID = getFiletypeID($fileExtension);
            $uniqueFilename = generateUniqueImageID($userID, $descFilename, $fileExtension, true);
            imagepng($im, IMAGES_PATH."/".$uniqueFilename);
            imagedestroy($im);
            doAddImage($g_ImageID,$uniqueFilename, $filetypeID, null);
            echo "成功地上传了".$descFilename;
            return;
        }
    } else if (isset($_FILES['userFile'])) {
        // Validate the type. Should be JPEG or PNG.
        $allowed = array ('image/pjpeg', 'image/jpeg', 'image/JPG', 'image/X-PNG', 'image/PNG', 'image/png', 'image/x-png', 'image/gif', 'image/GIF');
        $descFilename = "{$_FILES['userFile']['name']}";
        if (empty($descFilename) || !file_exists ($_FILES['userFile']['tmp_name'])) {
            return;
        }
        $fileExtension = findExtension($descFilename);
        $filetypeID = getFiletypeID($fileExtension);
        if (($filetypeID >= 0) && in_array($_FILES['userFile']['type'], $allowed)) {
            echoExt("file type: $fileExtension, ID=$filetypeID");
            $uniqueFilename = generateUniqueImageID($userID, $descFilename, $fileExtension, true);
            echoExt("$descFilename ==> $uniqueFilename");
            // Move the file over.
            if (move_uploaded_file ($_FILES['userFile']['tmp_name'], IMAGES_PATH."/".$uniqueFilename)) {
                echoExt("<p><em>The file has been uploaded to $uniqueFilename !</em></p>");
                doAddImage($g_ImageID,$uniqueFilename, $filetypeID, null);
                echo "成功地上传了".$descFilename;
            } // End of move... IF.
        }
    }

    // Check for an error:
    if ($_FILES['userFile']['error'] > 0) {
        echo '<p class="error">The file could not be uploaded because: <strong>';

        // Print a message based upon the error.
        switch ($_FILES['userFile']['error']) {
            case 1:
                print 'The file exceeds the upload_max_filesize setting in php.ini.';
                break;
            case 2:
                print 'The file exceeds the MAX_FILE_SIZE setting in the HTML form.';
                break;
            case 3:
                print 'The file was only partially uploaded.';
                break;
            case 4:
                print 'No file was uploaded.';
                break;
            case 6:
                print 'No temporary folder was available.';
                break;
            case 7:
                print 'Unable to write to the disk.';
                break;
            case 8:
                print 'File upload stopped.';
                break;
            default:
                print 'A system error occurred.';
                break;
        } // End of switch.

        print '</strong></p>';

    } // End of error IF.
    // Delete the file if it still exists:
    if (file_exists ($_FILES['userFile']['tmp_name'])) {
        unlink ($_FILES['userFile']['tmp_name']);
    }
}
?>

<!DOCTYPE html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />


	<title>微创�?---我创造，我分享，轻松，快乐！</title>
	<title>Upload an Image</title>
	<style type="text/css" title="text/css" media="all">
		.error {
			font-weight: bold;
			color: #C00;
		}
        #image{border: 3px solid #DDDDDD;border-radius: 10px 10px 10px 10px;color: #FF3300;
            display: inline-block;
            min-height: 60px;
            padding: 10px;
        }
        #image img{max-width:100px; max-height:60px;}
        #image li{padding:2px; border-bottom:1px dashed #CCC;}
    </style>
    <script type="text/javascript" src="/lib/jquery-1.9.1.min.js"></script>
    <script type="text/javascript" src="/Weidongman/src/utility.js"></script>
    <script language="javascript">
        $().ready(function(){
            $("#userID").val(TQ.Utility.getUserID());
            $("#image").mouseover(function(){
                $("#url_val").val($(this).val());
                $(this).val('');
            });

            $("#image").bind("mouseover", function(){
                var url_val=$("#url_val").val();
                url_val=$.trim(url_val);
                var userID = TQ.Utility.getUserID(); //ToDo:
                if(url_val!=''){
                    $.ajax({
                        type: "POST",
                        url: "upload_image.php",
                        data: {url_val:url_val, userID:userID},
                        success: function(msg){
                            if(msg==1){
                                alert('保存成功');
                                $("#image").attr('readonly','true');
                            } else {
                                alert(msg);
                            }
                        },
                        fail: function(msg) {
                            alert(msg);
                        }
                    });
                }
            });
        });
        function setImageEnable(){
            $("#image").removeAttr('readonly');
        }
    </script>

</head>
<body>

<form id="form_upload" enctype="multipart/form-data" action="upload_image.php" method="post">

    <input type="hidden" name="MAX_FILE_SIZE" value="524288" />
    <input type="hidden" name="userID" id="userID" value="-1"; />

    <fieldset><legend>可以选择JPEG、PNG、GIF类型<512KB的图�?</legend>
        <p>从本地计算机上传�?input type="file" name="userFile" /></p>
        <p>输入网址(可直接把图片拖放到此�?�?
            <textarea  name="image" id="image"  style="min-width:300px;min-height:60px;border:3px dashed silver;" OnDragOver="setImageEnable()"></textarea>
            <input id="url_val" name="url_val" type="text" style="display:none"/>
        </p>

        <p><label for="keywords">标签</label><input type="text" value="道具" id="keywords" name="keywords"/></p>
        <p><b>标签用逗号分开, 例如: 道具,鲜花,玫瑰</b></p>
        <p>版权声明：所有图片的版权归作者所有，只有图片所有者可以定价、出售此图片�?/p>
        <p>严禁上传违法违规的图片，禁止黄赌毒图片！否则后果自负</p>
   	</fieldset>

    <div align="center"><input id="button_upload_file" type="submit" name="submit" value="Submit" /></div>

</form>
</body>

