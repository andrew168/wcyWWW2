window.TQ= window.TQ || {};
$(function(){
  function WdMenu(){
  }
  //新建作品的时候
  WdMenu.newScene=function(){
    storedb('wcyData').remove()
    storedb('TabsMenuContent').remove()
    openScene(TQ.Config.UNNAMED_SCENE);
    /*
         *     //window.location.href='http://'+TQ.Config.DOMAIN_NAME+'/wcy/index';
        //清除声音列表
        $('#sound_ul').html('');
        //清除场景列表,并且设置新场景编号是1
        $('#scenes_ul').html(TQ.Scenes.scenes_content_html(1,1));
        TQ.FrameCounter.gotoBeginning();
        $('#playRecord').trigger('click');
        $('#stop').trigger('click');
        openScene(TQ.Config.UNNAMED_SCENE);
        //关闭资源区
        $('.tabmenu_left_ajax_btn').attr('display_status',0);
        $('#category_menu_div').hide();
        //关闭弹出框

        easyDialog.close();
        //如果添加动作是开启状态，执行
        if($("#action_add_btn").attr('display_status')==1){
            $('#action_add_btn').trigger('click');
        }
        //如果动作列表是开启状态，执行
        if($("#action_btn").attr('display_status')==1){
            $('#action_btn').trigger('click');
        }
        */

  };
  TQ.WdMenu=WdMenu;
});
//    <!-- 弹出式菜单的行为部分 -->
var Menu = {};
$(function(){
  //录音
  $('#recorder').click(function(){
    var recorder_status=$(this).attr('status');
    if(recorder_status==1){
      $(this).attr('status',0);
      $('#recorder span').removeClass('luying-hover')
    }else{
      TQ.Recorderobj.getResultStartStop();
      $(this).attr('status',1);
      $('#recorder span').addClass('luying-hover')
    }
  });

});

function initMenu() {
  clearSubjectModeAndMultiSelect();
  Menu.JointStarted = false;
  Menu.GroupStarted = false;
  Menu.tb3Dfy = false; //  互斥的操作， 避免同时嵌套使用
  TQ.InputCtrl.showMarkerOnly = false;
}
function setSubjectModeAndMultiSelect ()
{
  if (!TQ.InputCtrl.inSubobjectMode) { // 设置 零件模式
    if (!Menu.JointStarted) {  //加关节操作中， 必须是 真的 零件模式， 不能只是 showMarker
      // TQ.InputCtrl.showMarkerOnly = true;
    }
    if (Menu.JointStarted) { // 只有加关节才进入零件模式， 以便于修改各个关节的转轴点。
      $("#subElementMode").click();
    }
  }

  if (!TQ.InputCtrl.vkeyCtrl) { // 设置多选
    $("#tbVkeyCtrl").click();
  }
}

function clearSubjectModeAndMultiSelect()
{
  TQ.InputCtrl.showMarkerOnly = false;
  if (TQ.InputCtrl.inSubobjectMode) {
    $("#subElementMode").click();
  }

  if (TQ.InputCtrl.vkeyCtrl) { // 清除多选
    $("#tbVkeyCtrl").click();
  }

  if (Menu.tb3Dfy) {
    $("#tb3Dfy").click();
  }
}

function utilToolbarItemClick(toolbarItem,callback){
  $(document).on('click',toolbarItem,function(){
    callback();
  });
}

//<!-- Toolbar 的行为 -->
function initToolbar() {
  $("#repeat").buttonset();
  utilToolbarItemClick("#newScene",  function () {
    TQ.WdMenu.newScene();
  });

  function mySave(){
    save();
    //$('#save-file #publish').val(0)
  }
  utilToolbarItemClick("#save", mySave);
  // utilToolbarItem("#open", "打开一个微创意", "ui-icon-folder-open",openSceneTest);
  utilToolbarItemClick("#tbUndo",  TQ.CommandMgr.undo);
  utilToolbarItemClick("#tbRedo",  TQ.CommandMgr.redo);
  // utilToolbarItemClick("#tbDelete", deleteScene);
  utilToolbarItemClick("#tbDelete",   TQ.SelectSet.delete);
  //utilToolbarItem("#addLevel",  addLevelTest);
  //utilToolbarItemClick("#addLevel",'', addLevelTest);
  utilToolbarItemClick("#addText", function(){
    $('.tabmenu_left_ajax_btn').attr('display_status',0);
    $('#category_menu_div').hide();
    TQ.TextEditor.addText(TQ.Dictionary.defaultText);
    TQ.TextEditor.create();
  });
  utilToolbarItemClick("#skinning",   function() {TQ.SkinningCtrl.start(); });
  utilToolbarItemClick("#joint",   menu_joint);
  utilToolbarItemClick("#tbMinAngle",   function() {TQ.IKCtrl.setLimitation(0);});
  utilToolbarItemClick("#tbMaxAngle",   function() {TQ.IKCtrl.setLimitation(1);});
  utilToolbarItemClick("#tbUnjoint",   function() {
    TQ.InputCtrl.vkeyUnjoint = true;
    menu_unJoint();
    TQ.InputCtrl.vkeyUnjoint = false;
  });
  utilToolbarItemClick("#setStage",  function () {
    setStageSize(320, 240);
  });

  utilToolbarItemClick("#btn-pin-it",   TQ.SelectSet.pinIt);
  // utilToolbarItem("#uploadImage",  uploadImageWindow);
  // utilToolbarItem("#shooting", "实时拍摄动画", "ui-icon-video",makeAnimationTest);
  // utilToolbarItemClick("#tbAnimation",  editActions);
  utilToolbarItemClick("#tb3Dfy", function() {
    if (Menu.JointStarted) { click_div('#joint'); Menu.JointStarted = false; } //  互斥的操作， 避免同时嵌套使用
    if (Menu.GroupStarted) {click_div('#group'); Menu.GroupStarted = false;}
    click_div('#tb3Dfy');
    if (Menu.tb3Dfy) {
      Menu.tb3Dfy = false;
      create3DElement();
    } else {
      TQ.SelectSet.clear();
      Menu.tb3Dfy = true;
      setSubjectModeAndMultiSelect();
    }
  });
  utilToolbarItemClick("#group",  function() {
    if (Menu.JointStarted) { click_div('#joint'); Menu.JointStarted = false; } //  互斥的操作， 避免同时嵌套使用
    if (Menu.tb3Dfy) { click_div('#tb3Dfy'); Menu.tb3Dfy = false;}
    click_div('#group');
    if (Menu.GroupStarted) {
      Menu.GroupStarted = false;
      TQ.SelectSet.groupIt();
    } else {
      TQ.SelectSet.clear();
      Menu.GroupStarted = true;
      setSubjectModeAndMultiSelect();
    }
  });

  utilToolbarItemClick("#tbUngroup",
    function () {
      TQ.InputCtrl.vkeyUngroup = true;
      TQ.SelectSet.groupIt();
      TQ.InputCtrl.vkeyUngroup = false;
    });
  utilToolbarItemClick("#beginning",   function() {TQ.FrameCounter.gotoBeginning(); });
  utilToolbarItemClick("#end",  function() {TQ.FrameCounter.gotoEnd()});
  utilToolbarItemClick("#backward",   function() { TQ.FrameCounter.backward(); });
  utilToolbarItemClick("#forward",  function() { TQ.FrameCounter.forward(); });
  utilToolbarItemClick("#rewind",   function() { TQ.FrameCounter.autoRewind();click_div('#rewind'); });
  utilToolbarItemClick("#subElementMode",  function() {
    click_div('#subElementMode');
    TQ.InputCtrl.inSubobjectMode = !TQ.InputCtrl.inSubobjectMode;
    TQ.SelectSet.updateDecorations(TQ.InputCtrl.inSubobjectMode==true);
  });

  //弹出保存或者取消

  utilToolbarItemClick("#tbMove",   function() {
    var old = TQ.InputCtrl.vkeyMove;
    TQ.InputCtrl.clearVkey(); // 只有一个键盘
    TQ.InputCtrl.vkeyMove = !old;
  });

  utilToolbarItemClick("#tbRotate",   function() {
    var old = TQ.InputCtrl.vkeyRotate;
    TQ.InputCtrl.clearVkey(); // 只有一个键盘
    TQ.InputCtrl.vkeyRotate = !old;
  });

  utilToolbarItemClick("#tbScale",   function() {
    var old = TQ.InputCtrl.vkeyScale;
    TQ.InputCtrl.clearVkey(); // 只有一个键盘
    TQ.InputCtrl.vkeyScale = !old;
  });

  utilToolbarItemClick("#tbLift",   function() {
    var old = TQ.InputCtrl.vkeyLift;
    TQ.InputCtrl.clearVkey(); // 只有一个键盘
    TQ.InputCtrl.vkeyLift = !old;
  });

  utilToolbarItemClick("#tbHideShow", function () { TQ.SelectSet.show(false);} );
  utilToolbarItemClick("#tbRemoveTrack",   TQ.SelectSet.eraseAnimeTrack);

  utilToolbarItemClick("#linearMode",  function() {
    click_div('#linearMode');
    TQ.TrackRecorder.style = (
      (TQ.TrackRecorder.style == TQ.TrackDecoder.LINE_INTERPOLATION) ?
        TQ.TrackDecoder.JUMP_INTERPOLATION :
        TQ.TrackDecoder.LINE_INTERPOLATION);
  });

  utilToolbarItemClick("#play",  function() {
    TQ.WCY.doPlay();
    $('#stop').css('display','');
    $('#play').css('display','none');

    //录音
    if($('#recorder').attr('status')==1){
      if (TQ.SceneEditor.isEditMode()) {
        TQ.Recorderobj.startRecording(TQ.WCY.getCurrentLevelID(),TQ.WCY.getCurrentTime());
      }
    }

  });

  utilToolbarItemClick("#stop",  function() {
    TQ.WCY.doStop();
    if($('#recorder').attr('status')==1){
      if (TQ.SceneEditor.isEditMode()) {
        var formData = new FormData();
        TQ.Recorderobj.stopRecording(formData);
      }
    }
    $('#play').css('display','');
    $('#stop').css('display','none')
  });

  //开始录制
  utilToolbarItemClick("#playRecord",function(){
    TQ.WCY.doPlayRecord();
    $('#stopRecord').css('display','');
    $('#playRecord').css('display','none')
    functionButton('show');
  });

  //停止录制
  utilToolbarItemClick("#stopRecord",function(){
    functionButton('hide');
    TQ.WCY.doStopRecord();
    $('#playRecord').css('display','');
    $('#stopRecord').css('display','none')
  });

  utilToolbarItemClick("#keepTrace", function() {
    TQ.InputCtrl.leaveTraceOn = !TQ.InputCtrl.leaveTraceOn;
  });
  utilToolbarItemClick("#tbVkeyCtrl",  function() {
    click_div('#tbVkeyCtrl');
    TQ.InputCtrl.vkeyCtrl = !TQ.InputCtrl.vkeyCtrl;
  });

  // $("#tbDelete").button("disable");  // 默认禁止
  $("#open").button("disable");  // 默认禁止

  hideButtons();
  //添加动作按钮
  utilToolbarItemClick("#action_add_btn", function(){
    var this_obj=$('#action_add_btn');
    $('#action_btn_win_list').html('');
    $('#action_btn_win_action_img').attr('src','');
    $('#easydialog_win #msg').html('');

    //把添加动作的弹窗里action_id改为空，因为是新动作
    $('#easydialog_win #yesbtn').attr('action_id','');

    if(this_obj.attr('display_status')==1){
      $.fancybox.close()

    }else{
      $.fancybox({
        href: '#easydialog_win',
        closeBtn:false,
        helpers:  {
          overlay : null
        },
        beforeShow: function() {
          this.wrap.draggable();
        }
      });
    }
    /*
                    easyDialog.open({
                      container :'easydialog_win',
                      overlay : false
                    });
                    */

    var display_status=this_obj.attr('display_status');
    if(display_status==undefined || display_status==0){
      //打开,显示已经添加的动作
      var ele=TQ.WCY.getCurrentElement();
      if(ele){
        var action_list=ele.getActionSet();
        var action_list_html='';
        if(action_list!=null && action_list!=''){
          action_list_html=TQ.Html.action_add_list(action_list);
          //添加到
          $('#action_btn_win_list').html(action_list_html);
        }
        //$('#action_win').show();
        $('#action_start_end_div').show();
        this_obj.attr('display_status',1);
        click_div('#action_add_btn');
      }else{
        $('#alert_div #alert_div_nobtn').css('display','').attr('status','');
        $('#alert_div #alert_div_yesbtn').css('display','none').attr('status','');
        $('#alert_div #alert_div_abandonbtn').css('display','none').attr('status','');
        $('#alert_div #alert_div_content').html(TQ.Dictionary.Win_xuanzhongsucai);
        easyDialog.open({
          container : 'alert_div'
        });
      }

    }else{
      $('#easydialog_win').hide();
      var s=$('#action_start_btn').attr('num_val');
      var e=$('#action_end_btn').attr('num_val');
      $('#action_start_end_div').hide();
      click_div('#action_add_btn');
      this_obj.attr('display_status',0);
    }
  });
  //动作按钮
  utilToolbarItemClick("#action_btn",  function(){
    $('#action_list_win').html('');
    var this_obj=$('#action_btn');
    var display_status=this_obj.attr('display_status');
    click_div('#action_btn');
    if(display_status==undefined || display_status==0){
      this_obj.attr('display_status',1);
      //显示当前所有动作
      var ele=TQ.WCY.getCurrentElement();
      if(ele){
        var action_list=ele.getActionSet();
        var action_list_html='';
        if(action_list){
          $('#action_div').css('display','block');
          action_list_html=TQ.Html.action_div(action_list);
          $('#action_list_win').html(action_list_html);
        }else{
          $('#alert_div #alert_div_nobtn').css('display','').attr('status','');
          $('#alert_div #alert_div_yesbtn').css('display','none').attr('status','');
          $('#alert_div #alert_div_abandonbtn').css('display','none').attr('status','');
          $('#alert_div #alert_div_content').html(TQ.Dictionary.Win_yuansuweidingyidongzuo);
          easyDialog.open({
            container : 'alert_div'
          });
          click_div('#action_btn');
          this_obj.attr('display_status',0);
        }
      }else{
        $('#alert_div #alert_div_nobtn').css('display','').attr('status','');
        $('#alert_div #alert_div_yesbtn').css('display','none').attr('status','');
        $('#alert_div #alert_div_abandonbtn').css('display','none').attr('status','');
        $('#alert_div #alert_div_content').html(TQ.Dictionary.Win_xuanzhongsucai);
        easyDialog.open({
          container : 'alert_div'
        });
        click_div('#action_btn');
        this_obj.attr('display_status',0);
      }
    }else{
      $('#action_div').css('display','none');
      this_obj.attr('display_status',0);
    }
  });
  //定义互动按钮事件
  utilToolbarItemClick("#hudong_add_btn",  function(){
    var this_obj=$('#hudong_add_btn');
    var display_status=this_obj.attr('display_status');
    click_div('#hudong_add_btn');
    if(display_status==undefined || display_status==0){
      this_obj.attr('display_status',1);
      var element_obj=TQ.WCY.getCurrentElement();
    }else{
      this_obj.attr('display_status',0);
    }
    $('#action_div').hide();
  });
}

/**
 * @brief click_div 按下去显示的效果
 *  btn_id 按钮的id
 */
function click_div(btn_id){
  var click_btn_img_class='';
  if(btn_id=='#joint'){
    set_click_flag_gif(btn_id,'gif-link');
  }else if(btn_id=='#tb3Dfy'){
    set_click_flag_gif(btn_id,'gif-3d');
  }else if(btn_id=='#group'){
    set_click_flag_gif(btn_id,'gif-group');
  }else if(btn_id=='#linearMode'){
    set_click_flag(btn_id,'bn-ans-icon');
  }else if(btn_id=='#subElementMode'){
    set_click_flag(btn_id,'bn-ans-icon');
  }else if(btn_id=='#rewind'){
    set_click_flag(btn_id,'bn-ans-icon');
  }else if(btn_id=='#action_add_btn'){
    set_click_flag(btn_id,'bn-new-hover');
  }else if(btn_id=='#action_btn'){
    set_click_flag(btn_id,'bn-new-hover');
  }else if(btn_id=='#hudong_add_btn'){
    set_click_flag(btn_id,'bn-new-hover');
  }
}

/**
 * @brief set_click_flag_gif  设置按钮状态gif
 *
 * @param this_obj 按钮id
 * @param click_btn_img_class 按下去的样式
 */
function set_click_flag_gif(this_obj,click_btn_img_class){
  var click_flag=$(this_obj).attr('click_flag');
  if(click_flag==1){
    $(this_obj).removeClass(click_btn_img_class).attr('click_flag',0).removeClass('gif');
  }else{
    $(this_obj).addClass(click_btn_img_class).attr('click_flag',1).addClass('gif');
  }
}

/**
 * @brief set_click_flag 设置按钮点击状态
 *
 * @param this_obj
 * @param click_btn_img_class
 *
 * @return
 */
function set_click_flag(this_obj,click_btn_img_class){
  var click_flag=$(this_obj).attr('click_flag');
  if(click_flag==1){
    $(this_obj).removeClass(click_btn_img_class).attr('click_flag',0);
  }else{
    $(this_obj).addClass(click_btn_img_class).attr('click_flag',1);
  }
}


/**
* @brief hideButtons 根据用户类型隐藏不同的菜单，专业版
*
* @return
*/
function hideButtons(){
  var professional=["joint","tbMinAngle","tbMaxAngle","tbUnjoint",'action_add_btn',"tb3Dfy","tbVkeyCtrl","subElementMode","linearMode","mirrorX","mirrorY"];


  if(TQ.Init.userCategoryId==0){
    //专业版显示全部
    if(TQ.Init.userTypeId==9){

    }else if(TQ.Init.userTypeId==6){
      //学校版学生
      //如果是给儿童用，隐藏不需要的功能
      var childrenTypeMenu=["joint","tbMinAngle","tbMaxAngle","tbUnjoint",'action_add_btn',"tb3Dfy","tbVkeyCtrl","subElementMode","linearMode","mirrorX","mirrorY",'addText','hudong','mohuan','sound','my','group','tbUngroup','skinning','action_btn'];
      var num = childrenTypeMenu.length;
      for (var i = 0; i < num; i++) {
        $('#' + childrenTypeMenu[i]).hide();
      }
    }else{
      //其他版本不显示
      var num = professional.length;
      for (var i = 0; i < num; i++) {
        $('#' + professional[i]).hide();
      }
    }

  }
}

//    <!-- Tab菜单的行为 -->
function initTabsMenu(){
  $("#tab_right_panel").tabs({
    active: 2,
    load: function() {
      $('div#tab_right_panel img').draggable({helper: 'clone'}).addClass("list_med_pic");
      initTabContentNavigator();
    }
  });
  // {selected:"1" : 缺省选择第二个菜单；
  // event:"mouseover",鼠标经过，即可换菜单， 不需要点击，
  // disabled:[2]：禁止某个选项；
  // cookie:{expires:7}}
}

function menu_joint() {
  if (Menu.GroupStarted) {click_div('#group');  Menu.GroupStarted = false; }
  if (Menu.tb3Dfy) { click_div('#tb3Dfy'); Menu.tb3Dfy = false;}
  click_div('#joint');
  if (Menu.JointStarted) {
    Menu.JointStarted = false;
    TQ.SelectSet.jointIt();  // jointIt 必须运行在零件模式下!!!
  } else {
    TQ.SelectSet.clear();
    Menu.JointStarted = true;
    setSubjectModeAndMultiSelect();
  }
}

function menu_unJoint() {
  if (Menu.GroupStarted) {click_div('#group');  Menu.GroupStarted = false; }
  if (Menu.tb3Dfy) { click_div('#tb3Dfy'); Menu.tb3Dfy = false;}
  if (Menu.JointStarted) {
    Menu.JointStarted = false;
  }
  TQ.SelectSet.jointIt();  // jointIt 必须运行在零件模式下!!!
}

function setStageSize (width, height) {
  var canvas = document.getElementById("testCanvas");
  canvas.width = width;
  canvas.height = height;
//  $("#workingarea").css("width", width.toString() + "px");
//  $("#workingarea").css("height", height.toString() + "px");
}

function initCreateEnvironment(playOnly) {
  if (playOnly) {
  } else {
    initMenu();
    initToolbar();
    //$("#toolbar").addClass('ui-widget-header ui-corner-all');
    initTabsMenu();
    initWorkingArea();
    $("#toolbar").show();  // 在Css中关闭， 此处根据需要show
    $("#footer").show();
    $("#tab_right_panel").show();
    $("#timeAxisDiv").show();
  }
}
function startWcy(sceneName, playOnly) {

  var contentLocal=null;

  if ((sceneName == "")) { // 优先使用 wcyID
    sceneName = TQ.Utility.getUrlParam("id");  // 其次是path, 上次打开的wcy， 欢迎新客户界面
    if ((sceneName == "")) { // 没有指定场景名称
      sceneName = localStorage.getItem("sceneName");
    }
  }

  if (!sceneName) {
    sceneName = TQ.Config.DEMO_SCENE_NAME;
  }


  //ToDo: First
  /*
    //删除.wdm结尾的
    storedb('wcyData').find({"key":TQ.Init.wcyLocalTempName},function(err,result){
        if(!err){
            if(result!=''){
                contentLocal=result[0].content;
            }
        }
    });
*/

  // var fileInfo = {name: sceneName, content:contentLocal};
  init(fileInfo);
  if (!playOnly) TQ.Utility.CheckUserRight();
  mcDeferLoad();
}
function mcDeferLoad() {
  // 延迟加载编辑功能模块，例如：TextEditor， FileDialog。
//  $.get('http://'+TQ.Config.DOMAIN_NAME+'/mcDeferLoad.html', {}, function(str) {
  //$.get('http://'+TQ.Config.DOMAIN_NAME+'/wcy/mcDeferLoadHtml', {}, function(str) {
  //$('body').append(str);
  TQ.TextEditor.initialize();
  TQ.FileDialog.initialize();
  TQ.MessageBubble.initialize();
  //});
};


/**
* @brief functionButton 显示或者隐藏按钮
*
*/
function functionButton(str){
  if(str=='show'){
    $('#addLevel').show();
    $('.changjing_del').show();
    $('.functionButton').show();
    $('#recorder').show();
  }else{
    $('#addLevel').hide();
    $('.changjing_del').hide();
    $('.functionButton').hide();
    $('#recorder').hide();
  }
}
