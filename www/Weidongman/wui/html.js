TQ = TQ || {};
(function () {
  function Html(){
  }
  //动作弹出窗口
  Html.action_div=function(action_list){
    var result_html='';
    if(action_list.length>0){
      for(i=0;i<action_list.length;i++){
          var timestamp =Date.parse(new Date());
          var thumb_src='';
          if(action_list[i].gifIconID!=undefined){
              thumb_src='http://'+TQ.Config.DOMAIN_NAME+'/'+TQ.Config.actionImgPath+action_list[i].gifIconID+".gif?v="+timestamp;
          }else{
              thumb_src='http://'+TQ.Config.DOMAIN_NAME+'/'+TQ.Config.actionImgPath+action_list[i].name+".gif?v="+timestamp; 
          }
          var data={
              "name":action_list[i].name,
              "fs":action_list[i].fs,
              "F":action_list[i].F,
              "thumb_src":thumb_src
          }
        var tpl =$('#action_list_win_html').html();
       result_html+= Mustache.render(tpl, data);
      }
    }
    return result_html;
  }
  //点击添加动作按钮后的显示的已有动作列表
    Html.action_add_list=function(action_list){
    var result_html='';
    if(action_list.length>0){
       for(i=0;i<action_list.length;i++){
           var timestamp =Date.parse(new Date());
            var thumb_src='';
          if(action_list[i].gifIconID!=undefined){
              thumb_src='http://'+TQ.Config.DOMAIN_NAME+'/'+TQ.Config.actionImgPath+action_list[i].gifIconID+".gif?v="+timestamp;
          }else{
              thumb_src='http://'+TQ.Config.DOMAIN_NAME+'/'+TQ.Config.actionImgPath+action_list[i].name+".gif?v="+timestamp; 
          }
          var data={
              "name":action_list[i].name,
              "fs":action_list[i].fs,
              "F":action_list[i].F,
              "thumb_src":thumb_src
          }
           var tpl =$('#action_btn_win_add_list').html();
           result_html+= Mustache.render(tpl, data);
       } 
    }
    return result_html;
  }

  TQ.Html=Html;
}());
