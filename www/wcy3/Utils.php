<?php
function findExtension($descFilename) {
    $pos = strpos($descFilename, ".", strlen($descFilename) - 4);
    return strtolower(substr($descFilename, $pos + 1));
}

function echoExt($msg) {
    global $__DEBUG_ON;
    if ($__DEBUG_ON) {
        echo $msg."<br/>";
    }
}

function var_dumpExt($obj) {
    global $__DEBUG_ON;
    if ($__DEBUG_ON) {
        var_dump($obj); echo "<br/>";
    }
}

function readFromURL($parameterName, $defaultValue) {
    $result = isset($_REQUEST[$parameterName]) ? $_REQUEST[$parameterName] : $defaultValue;
    if ($result == null) {// 在safari下
        $result = $defaultValue;
    }

    return $result;
}

function isLogged() {
    $userID = readFromURL('userID', -1);
    if (($userID == -1) ||
        ($userID == null)) {  //Safari读出的结果是 null
        return false;
    }

    return true;
}