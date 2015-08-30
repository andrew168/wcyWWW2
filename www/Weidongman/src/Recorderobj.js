window.TQ = window.TQ || {};
(function(){

  function Recorderobj(){

  }
  var resultSoundInfo='';

  var audioConstraints = {
    audio: true,
  };

  var audioStream;
  var recorder;
  Recorderobj.current_level_id;
  Recorderobj.current_time;

  /**
  * @brief Recorderobj.startRecording=function 
  *
  * @param current_level_id 当前场景
  * @param current_time 当前时间
  */
  Recorderobj.startRecording=function(current_level_id,current_time){
    Recorderobj.current_level_id=current_level_id;
    Recorderobj.current_time=current_time;
    if (!audioStream)
      navigator.getUserMedia(audioConstraints, function(stream) {
        if (window.IsChrome) stream = new window.MediaStream(stream.getAudioTracks());
        audioStream = stream;

        audio.src = URL.createObjectURL(audioStream);
        audio.play();

        recorder = window.RecordRTC(stream, {
          type: 'audio'
        });
        recorder.startRecording();
      }, function() {
      });
      else {
        audio.src = URL.createObjectURL(audioStream);
        audio.play();
        if (recorder) recorder.startRecording();
      }

      window.isAudio = true;

      this.disabled = true;
  }
  //模拟插入耳机时候
   Recorderobj.getResultStartStop=function(){
      if (!audioStream)
      navigator.getUserMedia(audioConstraints, function(stream) {
        if (window.IsChrome) stream = new window.MediaStream(stream.getAudioTracks());
        audioStream = stream;

        audio.src = URL.createObjectURL(audioStream);
        audio.play();

        recorder = window.RecordRTC(stream, {
          type: 'audio'
        });
      }, function() {
      });
      else {
        audio.src = URL.createObjectURL(audioStream);
        audio.play();
      }

      window.isAudio = true;

      this.disabled = true;

     if (recorder){
       recorder.stopRecording(function(url) {
       });
     }
  }


  Recorderobj.getResultSoundInfo=function(){
    return resultSoundInfo;
  }

  Recorderobj.stopRecording=function(formData){
    audio.src = '';
    if (recorder){
      recorder.stopRecording(function(url) {

        var blob =recorder.getBlob();
        var fileType = 'audio'; // or "audio"
        formData.append(fileType + '-blob', blob);

        var xhr = new XMLHttpRequest();
        xhr.addEventListener('progress', function(e) {
          var done = e.position || e.loaded, total = e.totalSize || e.total;
          //console.log('xhr progress: ' + (Math.floor(done/total*1000)/10) + '%');
        }, false);
        if ( xhr.upload ) {
          xhr.upload.onprogress = function(e) {
            var done = e.position || e.loaded, total = e.totalSize || e.total;
            //上传
            $('#alert_div #alert_div_yesbtn').css('display','none').attr('status','');
            $('#alert_div #alert_div_nobtn').css('display','none').attr('status','');
            $('#alert_div #alert_div_abandonbtn').css('display','none').attr('status','');
            $('#alert_div #alert_div_content').html(TQ.Dictionary.zhengzaibaocunluyin);
            easyDialog.open({
              container : 'alert_div'
            });
            //console.log('xhr.upload progress: ' + done + ' / ' + total + ' = ' + (Math.floor(done/total*1000)/10) + '%');
          };
        }
        xhr.onreadystatechange = function(e) {
          if ( 4 == this.readyState ) {
          //  console.log(['xhr upload complete', e]);
          }
        };
        xhr.addEventListener("load", function(evt){
          sound_result=evt.target.responseText;
          sound_result_obj=$.parseJSON(sound_result);
          var sound_html='<a class="sound_click" href="javascript:void(0)" src="http://'+TQ.Config.DOMAIN_NAME+'/Weidongman/styles/images/new-sound.png" soundsrc="'+sound_result_obj.Path_full+'" soundpath="'+sound_result_obj.Path_full+'" wcyid="'+sound_result_obj.wcyid+'" title="'+sound_result_obj.name+'" authorid="'+sound_result_obj.AutherID+'" editorid="'+sound_result_obj.AutherID+'" createtime="'+sound_result_obj.CreateTime+'" edittime="'+sound_result_obj.EditTime+'" type="'+sound_result_obj.Type+'" etype="'+TQ.Element.ETYPE_AUDIO+'"></a>';
          TQ.Sound.recorder_sound_click($(sound_html),Recorderobj.current_level_id,Recorderobj.current_time)
          easyDialog.close();
        }, false);

        
        var url='http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/wcy/recorder_save.json';
        xhr.open('post',url , true);
        xhr.send(formData);
 
      });
    }

  }

  TQ.Recorderobj = Recorderobj;
} ())
