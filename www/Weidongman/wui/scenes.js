window.TQ= window.TQ || {};
$(function(){
  function Scenes(){
  }
  Scenes.scenes_num=1;//场景数量,真实的,TQ.WCY.getLevelNum()是从0开始
  Scenes.scenes_current_index=0;//虚拟的场景,会有小数
  Scenes.scenes_current=1;//虚拟的场景,不会有小数,在指定位置添加的时候就不需要了
  Scenes.isInsert=false;
  //场景内容
  Scenes.scenes_content_html=function(i,text){
    var data = {
      "i": i,
      'txt':TQ.Dictionary.Scenes_Label_1+text
    }
    var tpl =$('#scenes_div_li_html').html();
    var html = Mustache.render(tpl, data);
    return html;
  }
  //添加场景
  Scenes.scenes_add=function(){
    //$('#scenes_btn').trigger('click')
    if(TQ.Scenes.scenes_num!=1){
      if(Scenes.isInsert==false){
        //正常添加
        TQ.WCY.currentScene.currentLevelId=TQ.WCY.getLevelNum()-1;
        Scenes.scenes_num=parseInt(TQ.Scenes.scenes_num)+1;
        Scenes.scenes_current_index=Scenes.scenes_num;
        Scenes.scenes_current=Scenes.scenes_current_index;
        $('#scenes_ul').append(TQ.Scenes.scenes_content_html(TQ.Scenes.scenes_num,TQ.Scenes.scenes_num));
        TQ.WCY.addLevel();
      }else{
        //指定位置添加
        $('#scenes_ul li').each(function(i){
           var new_current_index=parseFloat(TQ.Scenes.scenes_current_index).toFixed(1);
           var c=parseFloat($(this).attr('num')).toFixed(1);
           //console.log('new___'+new_current_index)

           if(new_current_index == c ){
               TQ.Scenes.isInsert=false;
               var b=(parseFloat(new_current_index)+0.1).toFixed(1);
               //console.log(new_current_index)
               //console.log('b___'+b)
               $(this).after(TQ.Scenes.scenes_content_html(b,b));
               TQ.Scenes.scenes_current_index=b;
               Scenes.scenes_num=parseInt(TQ.Scenes.scenes_num)+1;
               TQ.WCY.addLevel();
           }
        });
      }
    }else{
      Scenes.isInsert=false;//如果是第一次添加，添加后开启增加模式
      Scenes.scenes_num=parseInt(TQ.Scenes.scenes_num)+1;
      Scenes.scenes_current_index=Scenes.scenes_num;
      Scenes.scenes_current=Scenes.scenes_current_index;
      TQ.WCY.addLevel();
      $('#scenes_ul').append(TQ.Scenes.scenes_content_html(TQ.Scenes.scenes_num,TQ.Scenes.scenes_num));
    }
  };
  //选中一个场景
  Scenes.scenes_click=function(click_num,scenes_click_div_obj){
     //TQ.Scenes.scenes_current_index=click_num;
      $('#scenes_ul li').each(function(i){
          $(this).removeClass('new-right-pop-hover')
          if($(this).attr('num')==click_num){
              TQ.Scenes.scenes_current_index=$(this).index()+1;
              //在指定位置添加时候不需要，未指定时候需要
              TQ.Scenes.scenes_current=TQ.Scenes.scenes_current_index;
          }
      });
      if(TQ.Scenes.scenes_current_index !=-1){
          scenes_click_div_obj.addClass('new-right-pop-hover');
      }else{
          TQ.Scenes.scenes_current_index='';
          TQ.Scenes.scenes_current=1
      }
  };
  /**
  * @brief 开启场景列表
  * @param changjing_num 场景数量
  */
  Scenes.scenes_open=function(changjing_num){
      $('#scenes_ul').html(''); 
      TQ.Scenes.scenes_num=changjing_num;
      var str='';
      for(i=1;i<=changjing_num;i++){
        str+=TQ.Scenes.scenes_content_html(i,i);
      }
      $('#scenes_ul').append(str).attr('num',changjing_num);
      $('#scenes_div').attr('display_status','1');
  };

  /**
  * @brief Scenes.scenes_delete 删除场景
  */
  Scenes.scenes_delete=function(num_val){
      TQ.WCY.deleteLevel(num_val);
      console.log(TQ.Scenes.scenes_current_index+"_____"+TQ.WCY.getLevelNum())
      if(TQ.Scenes.scenes_current_index>=TQ.WCY.getLevelNum()){
          TQ.Scenes.scenes_current_index=TQ.WCY.getLevelNum();
      }

      if(TQ.WCY.getLevelNum()<=0){
          $('#scenes_ul').html(TQ.Scenes.scenes_content_html(1,1)).attr('num',1);
          TQ.WCY.addLevel();
          TQ.WCY.gotoLevel(1);
      }
  }
  TQ.Scenes=Scenes;
}());
