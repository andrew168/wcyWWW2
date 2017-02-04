/**
 * Created by admin on 9/20/2015.
 */
var TQ = TQ || {};

TQ.EVENT = (function() {
    return {
        REFRESH_UI : 'refresh_ui', //通用event， 不属于某个class
        FILE_SYSTEM_READY: "file system ready",
        DIR_READY: "directory ready",
        MAT_CHANGED: "material or opus uploaded (created, updated, or deteled",
        SCENE_TIME_RANGE_CHANGED: 'scene animation time range change'
    };
}());
