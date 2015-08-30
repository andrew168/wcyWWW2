<?php # Script 11.2 - upload_image.php
require_once 'ImageDBIO.php';  // 相对于本PHP所在的位置
//* 本地上传php处理部分
// Check if the form has been submitted:
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $userID = 10001; // readFromURL('userID', -1);

    global $g_ImageID;
    // Check for an uploaded file:
    //* 拖动上传php处理部分
    $img_url=$_POST['url_val'];
    if(!empty($img_url)){
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
