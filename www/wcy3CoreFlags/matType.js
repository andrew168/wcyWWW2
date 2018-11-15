/**
 * Created by Andrewz on 7/9/2016.
 */
var TQ = TQ || {};
TQ.MatType = (function() {
    return {
        //素材
        BKG: 10, // 'bkgimage',
        PROP: 20, // 'propimage',
        PEOPLE: 30, // 'peopleimage',
        SOUND: 40, //,'audio';

        // 作品
        OPUS: 90,  //  "mywork",
        TOPIC: 91,  // 主题
        PUBLISHED_OPUS: 92,
        FINE_OPUS: 93,

        // depreciated
        LOCAL: -1,
        ALBUM : -2,
        CAMERA: -3,
        toEType: function (matType) {
            var eType;
            switch (matType) {
                case TQ.MatType.BKG:
                    eType = TQ.Element.ETYPE_BACKGROUND;
                    break;
                case TQ.MatType.PROP:
                    eType = TQ.Element.ETYPE_PROP;
                    break;
                case TQ.MatType.PEOPLE:
                    eType = TQ.Element.ETYPE_CHARACTER;
                    break;
                case TQ.MatType.SOUND:
                    eType = TQ.Element.ETYPE_AUDIO;
                    break;
                default:
                    TQ.Log.error("未处理的matType！");
                    eType = TQ.Element.ETYPE_PROP;
            }
            return eType;
        }
    };
})();
