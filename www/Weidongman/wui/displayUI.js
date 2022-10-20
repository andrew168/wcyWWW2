window.TQ= window.TQ || {};
$(function(){
  function displayUI(){
  }
  
  displayUI.currentObject = null;
  //显示菜单
  displayUI.displayMenu=function(elem,etype){
    $('#hudong_add_btn').show()
    displayUI.show_hide($('#hudong_add_btn'),etype);
  }
  //动作窗口
  displayUI.displayActionSet=function(elem,etype){
    if($('#hudong_add_btn').attr('display_status')==1){
      var ele=elem;
      if(ele){
        var action_list=ele.getActionSet();
        $('#action_btn').trigger('click');
      }
      var action_list_html='';
      if(action_list){
        action_list_html=TQ.Html.action_div(action_list);
        $('#action_list_win').html(action_list_html);
      }

      //$('#action_btn').trigger('click')
    }
  }

  displayUI.show_hide=function(obj,etype){
    //按钮
    if(etype==TQ.Element.ETYPE_BUTTON){
      obj.show();
      //打开后，保存当前动作按钮元素
      displayUI.currentObject=TQ.WCY.getCurrentElement();
    }else{
      //如果不是动作按钮，那么 添加动作按钮隐藏
      if(obj.attr('display_status')==1){
        //displayUI.currentObject=TQ.WCY.getCurrentElement();
        obj.show();
      }else{
        obj.hide();
      }
    }

  };

  //资源菜单显示
  displayUI.resourceMenu=function(etype){
    $('.category_menu_btn').each(function(){
      $(this).css('display','none');
      var this_etype=$(this).find('a').attr('etype');
      if(this_etype==etype){
        $(this).css('display','block');
      }
    });
  };

  /**
  * @brief function 只被wcy.min调用
  */
  displayUI.initialize = function(){
    TQ.Init.showAllScenes();
    TQ.Init.showAllScenesSound();
  
  };
  TQ.displayUI=displayUI;
}());
