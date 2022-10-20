window.TQ= window.TQ || {};
$(function(){
  function funcAction(){
  }
  //添加动作
  funcAction.add=function(f,ele,qiangzhi){
    var result_msg=MYJS.ajax_obj.post_formdata(f,'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/actions/updateAction.json','json');
    result_msg.success(function(msg){
      var imgname=msg.imgname;
      if(msg.status=='extension_error'){
        $('#easydialog_win #msg').html(TQ.Dictionary.MC_Label_1);
      }else if(msg.status=='name_error'){
        $('#easydialog_win #msg').html(TQ.Dictionary.MC_Label_2);
      }else{
        var a_nameId =msg.id;
        var a_style_repeat=$('#action_btn_win_style_repeat').val();
        var a_start_val=$('#action_start_val').val();
        var a_end_val=$('#action_end_val').val();
        // console.log(a_nameId,a_start_val, a_end_val)
        var action_result=null;
        var action_style=null;
        if(a_style_repeat=='1'){
          action_style=TQ.Action.STYLE_1;
        }else{
          action_style=TQ.Action.STYLE_REPEAT;
        }
        aa=ele.addAction(parseInt(a_nameId),parseInt(a_start_val),parseInt(a_end_val), action_style,imgname,qiangzhi);
        $('#easydialog_win').hide();
        $('#action_add_btn').trigger('click');
        $('#easydialog_win #action_img_file').hide();
      }
    });
  }
  funcAction.getActionId=function(name,huidiao){
    var f=new Object();
    f.name=name;
    var result_msg=MYJS.ajax_obj.get(f,'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/actions/getActionFirst.json','json');
    result_msg.success(function(msg){
      if(msg.status==1){
          
      }
    });
  
  }
  TQ.funcAction=funcAction;
}());
