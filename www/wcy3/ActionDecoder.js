/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  解释动画轨迹的数据， 计算每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function ActionDecoder()
    {

    }

    ActionDecoder.calculate = function (track, t) {
        TQ.Pose.action = (!track.action) ?
            TQ.poseDefault.action : TQ.TrackDecoder.calOneChannel(track, track.action, t);

        if (!TQ.Pose.action) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.Pose.action);
            TQ.Pose.action = ActionDecoder._findValidName(track.action.value);
        }
        return TQ.Pose.action;
    };

    ActionDecoder._findValidName = function(names) {
        for (var i = 0; i < names.length; i++) {
            if (!names[i]) continue;
            return names[i];
        }
    };

    TQ.ActionDecoder = ActionDecoder;
}());
