<!doctype html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />


    <title>微创�?---创造，分享，轻松，快乐�?/title>
    <script type="text/javascript" src="Weidongman/src/Dictionary.js"></script>
    <script type="text/javascript" src="Weidongman/src/Config.js"></script>
    <script type="text/javascript" src="Weidongman/src/Log.js"></script>
    <script type="text/javascript" src="Weidongman/src/utility.js"></script>
    <script>
        window.onload = function() {
            if (TQ.Utility.isSupportedEnvironment()) {
                var para ="";
                var action = "";
                var wcyID = TQ.Utility.getUrlParam("play2");
                if (wcyID != "") {
                    para = "?wcyID=" + wcyID;
                    action = "Play";
                } else {
                    var sceneName = TQ.Utility.getUrlParam("play");
                    if ((sceneName != "")) { // 指定场景名称
                        para = "?id="+sceneName;
                        action = "Play";
                    }
                }

                if ((action == "")) { // 没有指定wcy名称�?�?wcyID
                    action = "mc";
                    var wcyID = TQ.Utility.getUrlParam("wcyID");
                    if (wcyID != "") {
                        para = "?wcyID=" + wcyID;
                    } else {
                        var sceneName = TQ.Utility.getUrlParam("id");
                        if ((sceneName != "")) { // 指定场景名称
                            para = "?id="+sceneName;
                        }
                    }
                }

                var userID = TQ.Utility.getUserID();
                var keywords = TQ.Utility.getUrlParam("keywords");
                if (keywords != "") {
                    TQ.Utility.writeLocalStorage("keywords", keywords);
                }
                window.location="http://"+ TQ.Config.DOMAIN_NAME + "/" + action +".php" + para;
            }
        };
    </script>
</head>
<body>
</body>
</html>
