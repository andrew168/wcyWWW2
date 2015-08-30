$(function(){
  function Sound(){
  }
  Sound.sound_list_arr=new Array();
  Sound.sound_list_id=1;

  //声音模板
  Sound.sound_content_html=function(this_obj,sound_obj_arr_id){
    $('#new_right').css('display','block');
    $('#sound_ul').css('display','block');
    //var _src=this_obj.attr('src');
    var data = {
      "_title": this_obj.attr('title'),
      '_sound_obj_arr_id':sound_obj_arr_id
    }
    var tpl =$('#sound_li_html').html();
    var html = Mustache.render(tpl, data);
    $('#sound_ul').append(html);
  }

  //添加录音
    Sound.recorder_sound_click=function(this_obj,level_id,current_time){
    var sound_obj_result=TQ.WCY.addResToStageCenter(this_obj,level_id,current_time);
    Sound.sound_list_arr[Sound.sound_list_id]=sound_obj_result;
    TQ.Sound.sound_content_html(this_obj, Sound.sound_list_id);
    Sound.sound_list_id++; 
  }
  //添加声音
  Sound.sound_click=function(this_obj){
    var sound_obj_result=TQ.WCY.addResToStageCenter(this_obj);
    Sound.sound_list_arr[Sound.sound_list_id]=sound_obj_result;
    TQ.Sound.sound_content_html(this_obj,Sound.sound_list_id);
    Sound.sound_list_id++; 
  }
   //删除声音
  Sound.sound_del=function(this_obj){
    var sound_obj_arr_id=this_obj.attr('sound_obj_arr_id');
    TQ.WCY.deleteElement(Sound.sound_list_arr[sound_obj_arr_id]);
    this_obj.parent().remove();
  };
 
  //点击声音图标,开关声音
  Sound.sound_btn_open=function(){
    if($('#sound_btn').attr('display_status')=='0'){
      $('#sound_ul').css('display','block')
      $('#sound_btn').attr('display_status','1');
    }else{
      $('#sound_ul').css('display','none')
      $('#sound_btn').attr('display_status','0');
    }
  };

  /**
  * @brief Sound.sound_open=function  显示声音列表
  *
  * @param sound_num 声音数量
  */
  Sound.sound_open=function(sound_num,sound_obj_result){
      for(i=1;i<=sound_num;i++){
          var j=i-1;
          Sound.sound_list_arr[Sound.sound_list_id]=sound_obj_result[j];
          var soundName=sound_obj_result[j].getAlias();
          var sound_html='<label soundsrc="/mcSounds/p11593.mp3" title="'+soundName+'"></label>';
          TQ.Sound.sound_content_html($(sound_html),Sound.sound_list_id);
          Sound.sound_list_id++;
      }

      $('#scenes_ul').show();
      $('#sound_btn').attr('display_status','1');
  
  };
  //试听声音
  Sound.sound_start=function(this_obj){
      var sound_path=this_obj.attr('soundPath');
      sound_path = TQ.Utility.getAudioByThumbnail(sound_path);
      TQ.SoundMgr.play(sound_path);
  }
  TQ.Sound=Sound;
}());

