/**
 * Created by Andrewz on 2/20/2017.
 */

(function () {
    TQ.Scene.upgradeToLatest = function(objJson) {
        console.log("upgrade: old version: " + (!objJson.version? "No" : objJson.version));
        if (!objJson.version || isV_Format(objJson.version)) { // no version, V1, V2, V3
            switch (objJson.version) {
                case TQ.Scene.VER3:
                    upgrade3ToVer31(objJson);
                    break;
                case TQ.Scene.VER2:
                    upgrade2ToVer31(objJson);
                    break;
                case TQ.Scene.VER1:
                    upgrade3ToVer31(objJson);
                    break;
                default:
                    console.error("not supported version: =" + objJson.version);
            }
        }
        // V3_1+
        if (objJson.version  === TQ.Scene.VER3_1) {
            upgrade3_1ToVer3_3(objJson);
        }

        // now it's latest
        console.log(" upgrade result: version = " + objJson.version + ", designed region(W,H)： W = " +
            objJson.designatedWidth + ", H=" + objJson.designatedHeight + ")");
    };

    function upgrade3_1ToVer3_3(objJson) {
        if (!objJson.designatedWidth) { // 是PC做的， 只在 本地debug版
            objJson.designatedWidth = 1094;
            objJson.designatedHeight = 498;
        } else if (objJson.designatedWidth < 2) { // 归一化的， 无法转

        } // 剩余的是： 3.1, 有合理的W，H， 不需要变换
        objJson.version = TQ.Scene.VER3_3;
        return objJson;
    }

    function upgrade3ToVer31(objJson) {
        objJson.version = TQ.Scene.VER3_1;
        objJson.designatedWidth = 1;
        objJson.designatedHeight = 1;
        return objJson;
    }

    function upgrade2ToVer31(objJson) {
        objJson.version = TQ.Scene.VER3_1;
        objJson.designatedWidth = 1094;
        objJson.designatedHeight = 498;
         return objJson;
    }

    function isV_Format(version) { //"V1", --"V3"
        return isNaN(version);
    }
}());
