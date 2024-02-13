/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  记录每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function() {
  function ActionRecorder() {

  }
  ActionRecorder.style = TQ.Channel.LINE_INTERPOLATION;
  ActionRecorder.initialize = function() {};

  // 参见: Decorder的说明
  ActionRecorder.record = function(element, actionName, t) {
    var track = element.animeTrack;
    var jsonObj = element.jsonObj;
    t = TQ.FrameCounter.gridSnap(t);

    if (!actionName) {
      assertFalse(TQ.Dictionary.INVALID_LOGIC, !actionName);
      return;
    }

    // 记录本物体坐标系下的值
    if ((track === undefined) || (track === null)) {
      // 第一次动画记录, 需要先初始化动画轨迹
      track = element.animeTrack = new TQ.AnimeTrack(jsonObj);
      assertNotUndefined(TQ.Dictionary.FoundNull, track);
    }

    if (!track.action) {
      track.action = new TQ.OneChannel(actionName);
    } else {
      if (element.hasFlag(TQ.Element.ACTION_CHANGED)) { // 允许改变关节物体各个关节的可见性
        track.action.record(track, t, actionName, TQ.Channel.JUMP_INTERPOLATION);
        element.clearFlag(TQ.Element.ACTION_CHANGED);
      }
    }
  };

  TQ.ActionRecorder = ActionRecorder;
}());
