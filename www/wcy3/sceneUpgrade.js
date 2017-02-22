/**
 * Created by Andrewz on 2/20/2017.
 */

(function () {
    TQ.Scene.upgradeToVer3_1 = function(objJson) {
        switch (objJson.version) {
            case TQ.Scene.VER3_1:
                break;
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
                console.error("not supported?" + objJson.version);
        }
    };

    function upgrade3ToVer31(objJson) {
        objJson.version = TQ.Scene.VER3_1;
        objJson.designatedWidth = 1;
        objJson.designatedHeight = 1;
        return objJson;
    }

    function upgrade2ToVer31(objJson) {
        objJson.version = TQ.Scene.VER3_1;
        objJson.designatedWidth = 1093;
        objJson.designatedHeight = 615;
        return objJson;
    }
}());
