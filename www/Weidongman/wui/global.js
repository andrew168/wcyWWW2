window.TQ= window.TQ || {};
$(function(){
  //初始化
  function Init(){
  }
  Init.audio_stream=null;//是否点击录音按钮
  Init.wcyid=null;//如果是从编辑页面进来，会出现wcyid
  Init.userCategoryId=0;//用户类型，0普通1是专业
  Init.userTypeId=0;//用户注册版本
  Init.obj=null;
  Init.actionList=null;
  Init.tuding=0;//图定状态
  Init.wcyTempName=null;//临时作品名称
  Init.wcyLocalTempName=null;//临时本地作品名称
  Init.saveServerWcyProcess=0;//临时本地作品名称

  Init.uid='';
  Init.ActionList = [
    "ActionScript",
    "AppleScript"
  ];
  
  Init.init=function(){
    TQ.Init.change_cate('#cate_1','#cate_2');
    TQ.Init.change_cate('#cate_2','#cate_3'); 

    //localStorage.clear();//清除数据
    storedb('TabsMenuCategory').remove();
    storedb('TabsMenuContent').remove();

    TQ.WCY.setMarkerSize(25);//设置零件大小
  }

  //保存到服务器
  Init.saveServerWcy=function(){
    if(TQ.Init.saveServerWcyProcess==0){
      var scenesObj = TQ.WCY.getCurrentScene()
      if(scenesObj!=null && scenesObj!=undefined){
        var allData = scenesObj.getData();
        if(allData.indexOf("mcImages") >= 0 ){
          var otherObj=new Object()
          otherObj.isTimeSaveWcy=true
          if(TQ.Init.wcyTempName!='' && TQ.Init.wcyTempName!=null){
            netSave(TQ.Init.wcyTempName,allData,"微动漫,46",otherObj)
            TQ.ScreenShot.SaveScreen(TQ.Init.wcyTempName,"微动漫,46");
          }
        }
      }
      console.log('保存到服务器');
    }
  }

  //保存到本地
  Init.saveLocalWcy=function(){
    var scenesObj = TQ.WCY.getCurrentScene() 
    if(scenesObj!=null && scenesObj!=undefined){
      var allData = scenesObj.getData();
      storedb('wcyData').remove({"key":TQ.Init.wcyLocalTempName},function(err){});
      storedb('wcyData').insert({"key":TQ.Init.wcyLocalTempName,"content":allData},function(err){});
    }
  }

  //发布
  Init.publish=function(){
    $('#save').trigger('click');
    $('#save-file #publish').val(1);
    /*
    $.ajax({
      type: "POST",
      url: 'http://'+TQ.Config.DOMAIN_NAME+'/wcy/publish',
      success: function(result){
        $('#alert_div #alert_div_yesbtn').css('display','none').attr('status','');
        $('#alert_div #alert_div_nobtn').css('display','').attr('status','');
        $('#alert_div #alert_div_abandonbtn').css('display','none').attr('status','');
        if(result=='success'){
          $('#alert_div #alert_div_content').html('发布成功！');
          easyDialog.open({
            container : 'alert_div'
          });
        }else{
          $('#alert_div #alert_div_content').html('发布失败，请先保存！');
          easyDialog.open({
            container : 'alert_div'
          });
        }
      }
    });
    */
  }

  //保存的时候选择分类,第一次打开的时候，显示全部分类
  Init.change_save_category=function(parent_id,cate_1,cate_2,cate_3){
    var msg_data='';
    var json_data='';
    storedb('SaveCategory').find({"key":parent_id},function(err,result){
      if(!err){
        json_data=result;
      }
    })
    if(json_data!=''){
      msg_data=json_data[0].content;
    }else{
      var f=new Object()
      var cate_html='';
      var url='http://'+TQ.Config.API_DOMAIN_NAME+'/category/children/'+parent_id;
      var result_msg=MYJS.ajax_obj.get(f,url,'json');
      result_msg.success(function(msg){
        console.log(msg)
        msg_data=msg;
        storedb('SaveCategory').insert({"key":parent_id,"content":msg},function(err){})
      })
    }
    if(msg_data!='' && msg_data.list.length>0){
      var msg_list=msg_data.list;
      for(i=0;i<msg_data.total;i++){
        cate_html+='<option value="'+msg_list[i].id+'">'+msg_list[i].name+'</option>';
      }
      $(cate_1).css('display','').html('<select id="" name="">'+cate_html+'</select>');
      $(cate_1).trigger('change');
      $(cate_2).trigger('change');
    }else{
      $(cate_1).html('');
      $(cate_2).html('');
      $(cate_3).html('');
    }
  }

          
  //保存选择分类，除了第一次打开，以后选择的时候选择分类
  Init.change_cate=function(attr_id,attr_nextid){
      
    $(document).on('change',attr_id,function(){
      var this_cat_id=$(this).val();
      var msg_data='';
      var json_data='';

      if(this_cat_id!=null && this_cat_id!=''){
        storedb('ChangeCategory').find({"key":this_cat_id},function(err,result){
          if(!err){
            json_data=result;
          }
        });

        if(json_data!=''){
          msg_data=json_data[0].content;
        }else{
          var f=new Object();
          var cate_html='';
          var url='http://'+TQ.Config.API_DOMAIN_NAME+'/category/children/'+this_cat_id;
          var result_msg=MYJS.ajax_obj.get(f,url,'json');
          result_msg.success(function(msg){
            msg_data=msg;
            storedb('ChangeCategory').insert({"key":this_cat_id,"content":msg},function(err){
            });

          });
        }
      }

      if(msg_data!='' && msg_data.list.length>0){
        var msg_list=msg_data.list;
        for(i=0;i<msg_data.total;i++){
          cate_html+='<option value="'+msg_list[i].id+'">'+msg_list[i].name+'</option>';
        }
        $(attr_nextid).css('display','').html('<select id="" name="">'+cate_html+'</select>');
        $(attr_nextid).trigger('change');
      }else{
        $(attr_nextid).css('display','none').html('');
        $(attr_nextid).trigger('change');
      }
    });
  }

  //获取所有动作列表
  Init.getActionList=function(){
    var f=new Object();
    var result_msg=MYJS.ajax_obj.get(f,'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/actions/getActionList.json','json');
    result_msg.success(function(msg){
      Init.actionList=msg;
    })
  }
  //添加动作的时候自动匹配关键词，显示动作名称 
  Init.ActionInputAutoComplete=function(){
    var autosearch=$( "#action_btn_win_action_name" ).autocomplete({
      source: function(request, response) {
        $.ajax({
          url: 'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/actions/getActionList.json',
          data: {
            keywords: request.term
          },
          success: function(data) {
            response($.map(data.list, function(item) {
              return {
                label: item.name,
                value: item.name,
                a_id: item.id,
                img:item.img
              }
            }));
          }
        });
      },
      select: function(e, ui) {
        $('#action_btn_win_action_img').attr('src','http://'+TQ.Config.DOMAIN_NAME+'/'+TQ.Config.actionImgPath+ui.item.img)
        $('#action_btn_win_action_name').attr('a_id',ui.item.a_id)
      },
      messages: {
        noResults: '',
        results: function() {}
      },
      minLength:0
    }).dblclick(function() {
      $(this).autocomplete("search", "");
    }).data('ui-autocomplete')
    /*autosearch._renderItem=function( ul, item ) {
      return $( "<li>" )
      .attr( "data-value", item.value )
      .attr( "img", item.img )
      .append( $( "<a>" ).text( item.label ) )
      .appendTo( ul );
      }
      */
  }

  /**
  * @brief 显示当前场景数量
  */
  Init.showAllScenes=function(){
    var scenesObj=TQ.WCY.getCurrentScene();
    if(scenesObj!=null && scenesObj!=undefined){
      scenesObj.addHandler("sceneReady", function(){
        var num= scenesObj.levelNum();
        TQ.Scenes.scenes_open(num);
      });
    }
  };

  /**
  * @brief 显示当前场景声音
  */
  Init.showAllScenesSound=function(){
    //TQ.Sound.sound_open(2,'aaa');
    var scenesObj=TQ.WCY.getCurrentScene();
    if(scenesObj!=null && scenesObj!=undefined){
      scenesObj.addHandler("sceneReady", function(){
        var soundArr= scenesObj.getAllSounds();
        if(soundArr){
          var soundNum=soundArr.length;
          //切换场景时候，先清除声音列表，然后再添加
          $('#sound_ul').html('');
          TQ.Sound.sound_open(soundNum,soundArr);
        }
      });
    }
       
  };

  TQ.Init=Init;
}());
//对输入框开关键盘控制
$(document).on('mouseover','input',function(){
  TQ.InputMap.turnOff();  
});
$(document).on('mouseout','input',function(){
  TQ.InputMap.turnOn(); 
});
$(document).on('mouseover','.fancybox-desktop',function(){
  TQ.InputMap.turnOff();  
});
$(document).on('mouseout','.fancybox-desktop',function(){
  TQ.InputMap.turnOn(); 
});
$(document).on('mouseover','#easyDialogBox',function(){
  TQ.InputMap.turnOff();  
});
$(document).on('mouseout','#easyDialogBox',function(){
  TQ.InputMap.turnOn(); 
});
