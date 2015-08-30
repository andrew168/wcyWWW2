/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    TQ.Element.upgradeToVer2 = function(desc)
    {
        desc.version = (!desc.version) ? TQ.Element.VER1 : desc.version;
        if (desc.isPinned == undefined) {desc.isPinned = false;}
    };

    // 工厂, 根据数据制作
    TQ.Element.build = function (level, desc) {
        if (!desc) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, !desc);
            return TQ.ERROR;
        }
        // 此处已经组装好了目录
        TQ.Element.upgradeToVer2(desc);
        switch (desc.type) {
            case "SOUND":
                return new TQ.SoundElement(level, desc);
            case "JointMarker":
                return new TQ.Marker(level, desc);
            case "BUTTON":
                return new TQ.ButtonElement(level, desc);
            case "Text" :
                return new TQ.TextElement(level, desc);
            default :
                break;
        }

        if (TQ.Element.isVideo(desc.src)) {
            return new TQ.VideoElement(level, desc);
        }

        return new TQ.Element(level, desc);
    };

    TQ.Element.isVideo = function (filename) {
        if (!filename) {
            return false;
        }

        var videoExtension = ['mp4', 'mov'];
        var ext = "";
        var index = filename.lastIndexOf('.');
        if (index >= 0) {
            ext = filename.substr(index + 1);
            if (videoExtension.indexOf(ext) >= 0) {
                return true;
            }
        }

        return false;
    };

}());
