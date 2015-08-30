/**
 * 图强动漫引擎, 专利产品, 大众动画
 */

window.TQ = window.TQ || {};

(function (){
    /// UI 部分
    function TimerUI(){
    }

    TimerUI.isUserControlling = false;
    TimerUI.t = 0;
    TimerUI.initialize = function() {
        var tStart = TQ.FrameCounter.v;
        var tMin = 0;
        var tMaxFrame = TQ.FrameCounter.max;
        TimerUI.body = $( "#timer-slider" );
        TimerUI.body.slider({
            orientation: "horizontal",
            range: "min",
            min: tMin,
            max: tMaxFrame,
            value: tStart,
            start: TimerUI.onMouseStart,
            slide: TimerUI.onMouseAction,
            change: TimerUI.onChange,
            stop: TimerUI.onMouseStop
        });
        $('#maxTimeValue').text(tMaxFrame);
        TimerUI.displayTime(tStart);
    };

    TimerUI.onMouseStart = function() { TimerUI.isUserControlling = true; };

    TimerUI.onMouseStop = function() {
        TimerUI.t = TimerUI.body.slider( "value" );
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(TimerUI.t));
        TimerUI.isUserControlling = false;
    };

    TimerUI.onMouseAction = function (event,ui) {
        TimerUI.displayTime(ui.value);
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TIMER_UI);
        TimerUI.t = TimerUI.body.slider( "value" );
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(TimerUI.t));
        //ToDo: 移动时间轴的位置, 修改帧频率, 增加刻度的显示, 增加缩放
    };

<<<<<<< .mine
    TimerUI.onChange = function () { TimerUI.displayTime(TimerUI.t); };
=======
    TimerUI.onChange = function () {
      var maxTimeValueText=$('#maxTimeValue').text();
      if(TimerUI.t==maxTimeValueText){
        var newTime=TimerUI.t+200;
        TQ.FrameCounter.max=newTime;
        TimerUI.maxTimeValue=newTime;
        $('#maxTimeValue').text(newTime);
        TimerUI.body.slider("option", "max", newTime); 
      }else{
        TimerUI.displayTime(TimerUI.t);
      } 
    };
>>>>>>> .r1075

    TimerUI.update = function () {
        if (!TimerUI.isUserControlling) {
            if (TQ.FrameCounter.isPlaying()) {
                TimerUI.t = TQ.FrameCounter.v;
                TimerUI.body.slider( "value", TimerUI.t);
            }
        }
    };
  
    TimerUI.displayTime = function(t) {
        $("#timeValueInput").val(t.toString());
    };

    TQ.TimerUI = TimerUI;
}());
