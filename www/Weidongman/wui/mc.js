//window.onerror=function(){return true;}
window.TQ = window.TQ || {};
$(function(){
    function mohuan(){
    }

    mohuan.default_size=1;
    mohuan.default_direction=1;
    mohuan.default_density=1;

    mohuan.size=1;
    mohuan.direction=1;
    mohuan.density=1;
    mohuan.current_type=null;

    mohuan.change=function(size,direction,density){
        if(mohuan.current_type=='rain'){
            TQ.WCY.rainChange(size,direction,density);
        }else if(mohuan.current_type=='snow'){
            TQ.WCY.snowChange(size,direction,density);
        }
    }

    mohuan.start=function(type){
        var s_html='<div src="" wcyid="rain" title="rain" type="" etype="5"></div>';
        if(type=='rain'){
            TQ.mohuan.current_type='rain';
            TQ.WCY.rain(TQ.mohuan.size,TQ.mohuan.direction,TQ.mohuan.density,$(s_html),'yudi1.png');
        }else if(type=='snow'){
            TQ.mohuan.current_type='snow';
            TQ.WCY.snow(TQ.mohuan.size,TQ.mohuan.direction,TQ.mohuan.density,$(s_html),'xuehua1.png');
        }
    }
    mohuan.stop=function(type){
        switch(type){
            case "snow":
                TQ.WCY.snowStop();
            break;
            case "rain":
                TQ.WCY.rainStop();
            break;
        }
    }

    function action(){

    }
    action.startVal=1;
    action.endVal=35;
    action.minVal=1;
    action.maxVal=200;

    TQ.action=action;
    TQ.mohuan = mohuan;
}());

$(function(){

    TQ.Init.init();
    TQ.Init.ActionInputAutoComplete();
    //打开场景按钮
    $('#scenes_btn').click(function(){
        TQ.Scenes.scenes_open();
    })
    //声音按钮
    $('#music_btn').click(function(){
        TQ.Scenes.tools_show_hidden('music_btn');
        TQ.Scenes.check_show_new();
    });

    //添加场景
    $(document).on('click','#addLevel',function(){
        TQ.Scenes.scenes_add();
         //TQ.WCY.gotoLevel(TQ.WCY.getLevelNum()+1);
         TQ.WCY.gotoLevel(TQ.Scenes.scenes_current);
         //console.log(TQ.Scenes.scenes_current)
    });
    //删除场景
    $(document).on('click','.changjing_del',function(){
        var thisObj=$(this);
        //场景是从0开始
        MYJS.alert_obj.alert(TQ.Dictionary.Scenes_Label_2+$(this).attr('num')+"？",2,'yes',function(){
            TQ.Scenes.scenes_delete(thisObj.attr('num')-1);
            //先调到指定场景，然后删除
            TQ.WCY.gotoLevel(thisObj.parent().index()-1);
            thisObj.parent().remove();

            MYJS.alert_obj.close(2);
        },'no');

    });
    //选中一个场景
    $(document).on('click','#scenes_ul .scenes_num_li_btn span',function(){
        TQ.Scenes.isInsert=true;
        var to_scenes=0;
        var this_num=$(this).attr('num');
        $('#scenes_ul li').each(function(i){
            if($(this).attr('num')==this_num){
                to_scenes=i;
            }
        });
        TQ.WCY.gotoLevel(to_scenes);

        if(TQ.Scenes.scenes_num!=1){
            //选中后添加的时候,自动变成有序的数字
            //TQ.Scenes.scenes_current_index=TQ.Scenes.scenes_num;
            TQ.Scenes.scenes_current_index=parseFloat(this_num);

            //TQ.Scenes.scenes_current_index=TQ.Scenes.scenes_num;
            TQ.Scenes.scenes_click($(this).attr('num'),$(this));
        }else{
            //第一次添加
            TQ.Scenes.scenes_click(TQ.Scenes.scenes_current_index,$(this));
        }
    });
    /*****菜单******/
    //分类菜单--所有分类
    $(document).on('click','#category_menu_all',function(){
        TQ.TabsMenu.openDiv();
        $('#category_content').css('display','none');
        var category_menu_html=TQ.TabsMenu.category_menu();
        $('#category_menu_html').html(category_menu_html).show();
    });

    //1级菜单内容
    $(document).on('click','.tabmenu_left_ajax_btn',function(){
        TQ.TabsMenu.isSearch=false;
        //切换按钮时候清空关键词
        $('#search_keywords').val('');
        TQ.TabsMenu.tag_keywords='';
        var display_status=$(this).attr('display_status');
        TQ.TabsMenu.tag_type=$(this).attr('tag_type');
        $('#idNo').trigger('click')

        //如果当前的cateid==之前的cateid
        if(TQ.TabsMenu.tabs_menu_id==$(this).attr('cate_id')){
            if(TQ.TabsMenu.current_page==undefined ||TQ.TabsMenu.current_page==1){
                TQ.TabsMenu.current_page=1;
            }else{
                if(TQ.TabsMenu.tabs_menu_text!=''){
                    $('#category_menu_all').html(TQ.TabsMenu.tabs_menu_text);
                }
            }
        }else{
            TQ.TabsMenu.current_page=1;
            $('#category_menu_all').html(TQ.Dictionary.Label_allcategory);
        }

        var etype=$(this).find('a').attr('etype');
        TQ.TabsMenu.etype=etype;
        //当第二次点击时候先全部关闭，然后重新判断
        $('.tabmenu_left_ajax_btn').attr('display_status','0');
        if(display_status==undefined || display_status==0){
            $(this).attr('display_status',1);
            TQ.TabsMenu.openDiv();
            $('#category_menu_html').css('display','none');
            if(TQ.TabsMenu.catepid!=$(this).attr('cate_id')){
                //当打开不是当前分类的时候，清空所有本地存储
                //storedb('TabsMenuContent').remove()
                TQ.TabsMenu.cateid=$(this).attr('cate_id');
            }
            TQ.TabsMenu.catepid=$(this).attr('cate_id');
            TQ.TabsMenu.tabs_menu_id=$(this).attr('cate_id');

            var category_content=TQ.TabsMenu.category_content();
            $('#category_content').html(category_content);
            TQ.TabsMenu.category_menu($(this).attr('cate_id'));

        }else{
            TQ.TabsMenu.closeDiv();
        }
    });

    //二级菜单内容
    $(document).on('click','.tabmenuajax_btn',function(){
        TQ.TabsMenu.isSearch=false;
        TQ.TabsMenu.openDiv();
        $('#category_menu_html').css('display','none');//显示全部菜单
        $('#category_menu_all').html($(this).text());
        TQ.TabsMenu.tabs_menu_text=$(this).text();
        TQ.TabsMenu.cateid=$(this).attr('cate_id');
        TQ.TabsMenu.current_page=1;
        var category_content=TQ.TabsMenu.category_content();
        $('#category_content').html(category_content);
        TQ.TabsMenu.category_menu();
    });
    //分页
    $(document).on('click','#page_next',function(){
        $('#category_menu_html').css('display','none');
        TQ.TabsMenu.current_page=parseInt(TQ.TabsMenu.current_page)+1;
        if(TQ.TabsMenu.current_page>=TQ.TabsMenu.page_all){
            TQ.TabsMenu.current_page=TQ.TabsMenu.page_all;
        }
        var category_content=TQ.TabsMenu.category_content();
        $('#category_content').html(category_content);
    });
    $(document).on('click','#page_up',function(){
        $('#category_menu_html').css('display','none');
        TQ.TabsMenu.current_page=parseInt(TQ.TabsMenu.current_page)-1;
        if(TQ.TabsMenu.current_page<1){
            TQ.TabsMenu.current_page=1;
        }
        var category_content=TQ.TabsMenu.category_content();
        $('#category_content').html(category_content);
    });

    //发布
    $('#publish').click(function(){
       TQ.Init.publish();
    });
    //关闭弹窗
    $(document).on('click','#alert_div #alert_div_nobtn',function(){
        var status=$(this).attr('status');
        if(status=='' || status==undefined){
            easyDialog.close();
        }
    });

    $(document).on('change','#mc_type',function(){
        var parent_id=$(this).find("option:selected").attr('pid');
        TQ.Init.change_save_category(parent_id,'#cate_1','#cate_2','#cate_3')
    });

    //默认保存分类
    $(document).on('change','#mc_type2',function(){
        var f=new Object();
        var parent_pid=$(this).find("option:selected").attr('pid');
        var url='http://'+TQ.Config.API_DOMAIN_NAME+'/category/children/'+parent_pid;
        var result_msg=MYJS.ajax_obj.get(f,url,'json');
        result_msg.success(function(msg){
            var cate_html='<option value="">'+TQ.Dictionary.Label_selectText+'</option>';
            if(msg.total>0){
                var msg_list=msg.list;
                for(i=0;i<msg.total;i++){
                    if(msg_list[i].id!=68){
                        //声音不出现在元件里
                        cate_html+='<option value="'+msg_list[i].id+'">'+msg_list[i].name+'</option>';
                    }
                }
                $('#cate_1').html(cate_html);
            }else{
                $('#cate_1').html('');
            }
            $('#cate_2').html('');
            $('#cate_3').html('');
        });
    })


    //指引
    $(document).on('click','.tutorials_btn',function(){
        var next_tutorials_div=$(this).attr('next_tutorials_div');
        var f=new Object();
        f.uid=TQ.Init.uid;
        f.type=$(this).attr('tutorials_type');
        var result_msg=MYJS.ajax_obj.get(f,'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/tutorials/isRead.json','json');
        result_msg.success(function(msg){
            if(msg.status==1){
                $('#tutorials_div_'+msg.type).remove();
                if(next_tutorials_div!=''){
                    $('#'+next_tutorials_div).css('display','block');
                }
            }
        });
    });

    //选中左侧图片，添加到画布
    $(document).on('click','.img_div',function(){
        TQ.TabsMenu.img_click($(this));
        //左侧菜单状态
        if(TQ.Init.tuding==1){
            //kaiqi
        }else{
            //guanbi
            TQ.TabsMenu.closeDiv();
        }

    });

    //声音添加
    $(document).on('click','.sound_click',function(){
        TQ.Sound.sound_click($(this));
        TQ.TabsMenu.closeDiv();
    });
    //删除声音
    $(document).on('click','.sound_del',function(){
        TQ.Sound.sound_del($(this));
    });
    //点击声音图标打开声音
    $(document).on('click','#sound_btn',function(){
        if($(this).attr('display_status')==1){
            $('#sound_div').hide();
            $(this).attr('display_status',0)
        }else{
            $('#sound_div').show();
            $(this).attr('display_status',1)
        }
    });
    //全局放大
    $("#fangda_slider .jdt-progress").slider({
        range: "min",
        value: 1,
        min: 1,
        max: 10,
        create: function( event, ui ) {
            $('#fangda_slider .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        },
        slide: function(event, ui) {
            var pd=ui.value;
            $("dt").css("paddingLeft",pd);
            $('#fangda_slider .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        }
    });
    //动作的开始按钮
    $(document).on('change','#action_start_val',function(){
        TQ.action.startVal=$('#action_start_val').val();
        $("#action_start_btn").slider( "value",TQ.action.startVal);
    });

    $("#action_start_btn").slider({
        range: "min",
        value: TQ.action.startVal,
        min: TQ.action.minVal,
        max: TQ.action.maxVal,
        create: function( event, ui ) {
            $('#action_start_btn .ui-slider-handle').attr('class','ui-slider-f60 ks')
            $('#action_start_btn').attr('num_val',1);
            $('#action_start_val').val(1);
        },
        slide: function(event, ui) {
            var pd=ui.value;
            $("dt").css("paddingLeft",pd);
            $("#action_start_btn").attr('num_val',pd);
            $('#action_start_btn .ui-slider-handle').attr('class','ui-slider-f60 ks')
            $('#action_start_val').val(pd);
        }
    });
    //动作的结束按钮
    $(document).on('change','#action_end_val',function(){
        TQ.action.endVal=$('#action_end_val').val();
        $("#action_end_btn").slider( "value",TQ.action.endVal);
    });

    $("#action_end_btn").slider({
        range: "min",
        value: TQ.action.endVal,
        min: TQ.action.minVal,
        max: TQ.action.maxVal,
        create: function( event, ui ) {
            $('#action_end_btn .ui-slider-handle').attr('class','ui-slider-f60 jc')
            $('#action_end_btn').attr('num_val',30);
            $('#action_end_val').val(30);
        },
        slide: function(event, ui) {
            var pd=ui.value;
            $('#action_end_val').val(pd);
            $("dt").css("paddingLeft",pd);
            $("#action_end_btn").attr('num_val',pd);
            $('#action_end_btn .ui-slider-handle').attr('class','ui-slider-f60 jc')
        }
    });

    //点击动作图片更换
    $(document).on('click','#show_upload_action_img_file',function(){
        $('#easydialog_win #action_img_file').show();
    })
    $(document).on('change','#action_img_file',function(){
        var myFile = document.getElementById('action_img_file');
        var image = new Image();
        var fileReader = new FileReader();
        var f = myFile.files[0];
        fileReader.readAsDataURL(f);
        image.onload = function() {
            //    alert(this.width);
        }
        fileReader.onload = function() {
            $('#easydialog_win #action_btn_win_action_img').attr('src',this.result);
        }
    });


    //左侧默认按钮，不执行查询
    $(document).on('click','.tabmenu_left_defult_btn',function(){
        TQ.TabsMenu.openDiv();
        $('#page_nav').css('display','none')
        $('#hudong').css('display','block')
    });
    //搜索
    $('#search_btn').click(function(){
        var tag_keywords=$('#search_keywords').val();
        if(tag_keywords!=''){
            TQ.TabsMenu.isSearch=true;
            TQ.TabsMenu.tag_keywords=tag_keywords;
            var category_content=TQ.TabsMenu.category_content();
            $('#category_content').html(category_content);
        }
    });
    //动作播放
    $(document).on('click','.action_method_btn',function(){
        var action_name=$(this).attr('action_name');
        var element_obj=TQ.WCY.getCurrentElement();
        //添加互动按钮事件
        var hudong_add_btn_display_status=$('#hudong_add_btn').attr('display_status');
        if(hudong_add_btn_display_status==1){
            TQ.displayUI.currentObject.addAction(element_obj,action_name);
            $('#hudong_add_btn').trigger('click').hide();
            $('#action_btn').trigger('click');
        }
        element_obj.playAction(action_name);

    });
    //添加动作的弹窗
    $(document).on('change','#action_btn_win_action_selectname',function(){
        var tmpname_val=$(this).val();
        $('#action_btn_win_action_img').attr('src',tmpname_val);
    });
    //添加动作提交按钮
    $(document).on('click','#easydialog_win #yesbtn',function(){
        var addActionFlag=false;
        var ele=TQ.WCY.getCurrentElement();
        if (ele) {
            var f=new Object();
            f.name=$('#action_btn_win_action_name').val();
            var result_msg=MYJS.ajax_obj.get(f,'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/actions/getActionFirst.json','json');
            var action_id='';
            result_msg.success(function(msg){
                if(msg.status==1){
                    action_id=msg.result.id;
                }else{
                    addActionFlag=true;
                }
            });
            var f=new FormData();
            f.append('name', $('#action_btn_win_action_name').val());
            f.append('file', $(':file')[0].files[0]);
            var attr_action_id=$(this).attr('action_id');
            if(attr_action_id!=''){
                action_id=attr_action_id;
            }
            f.append('id', action_id);

            if(action_id!=''){
                //检测是否存在，true是存在，false不存在
                var status=ele.hasAction(action_id);
                if(status==true){
                    $('#easyDialogBox').css('z-index',500);
                    MYJS.alert_obj.alert(TQ.Dictionary.save_win_1,2,'yes',function(){
                        TQ.funcAction.add(f,ele,true);
                        $('#easyDialogBox').css('z-index',10000);
                        MYJS.alert_obj.close(2);
                    },'no');

                }else{
                    addActionFlag=true;
                }
            }

            if(addActionFlag==true){
                TQ.funcAction.add(f,ele,false);

            }

        }
    });
    //编辑动作
    $(document).on('click',' .action_img',function(){
        var action_id=$(this).attr('action_id');
        var ele=TQ.WCY.getCurrentElement();
        if (ele) {
            //读取当前元素的所有动作
            var action_all=ele.getActionSet();
            if(action_all.length>0){
                for(i=0;i<action_all.length;i++){
                    if(action_all[i].name==action_id){
                        var f=new Object();
                        f.id=action_id;
                        var result_msg=MYJS.ajax_obj.get(f,'http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/actions/getActionFirst.json','json');
                        result_msg.success(function(msg){
                            if(msg.status==1){
                                $('#easydialog_win #action_btn_win_action_name').val(msg.result.name);
                                $('#easydialog_win #yesbtn').attr('action_id',msg.result.id);
                            }
                        });
                        var timestamp =Date.parse(new Date());
                        $('#easydialog_win #action_btn_win_action_img').attr('src',$(this).find('img').attr('src'));
                        $('#easydialog_win #action_start_val').val(action_all[i].fs);
                        $('#easydialog_win #action_end_val').val(parseInt(action_all[i].fs) + parseInt(action_all[i].F));
                        $("#easydialog_win #action_btn_win_style_repeat option[value='"+action_all[i].style+"']").attr("selected","selected");
                    }
                }
            }
        }

    });
    //删除动作
    $(document).on('click','.action_del_btn',function(){
        var action_name=$(this).attr('action_name');
        var ele=TQ.WCY.getCurrentElement();
        if (ele) {
            var action_all=ele.getActionSet();
            var action_all_length=action_all.length;
            ele.deleteAction(action_name);
            $(this).parent().remove();
        }
    });
    //魔幻按钮点击
    $(document).on('click','.mohuan_btn',function(){
        $('#mohuan_slider_div').show();
        var mohuan_wcyid=$(this).attr('wcyid');
        TQ.mohuan.start(mohuan_wcyid);
        //左侧菜单状态
        if(TQ.Init.tuding==1){
            //kaiqi
        }else{
            //guanbi
            TQ.TabsMenu.closeDiv();
        }
    });
    //魔幻按钮进度条
    //大小
    $("#mohuan_slider_daxiao .jdt-progress").slider({
        range: "min",
        value: TQ.mohuan.default_size,
        min: 1,
        max: 15,
        create: function( event, ui ) {
            $('#mohuan_slider_daxiao .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        },
        slide: function(event, ui) {
            var pd=ui.value;
            TQ.mohuan.size=pd;
            TQ.mohuan.change(TQ.mohuan.size,TQ.mohuan.direction,TQ.mohuan.density);
            $("dt").css("paddingLeft",pd);
            $('#mohuan_slider_daxiao .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        }
    });
    //密度
    $("#mohuan_slider_midu .jdt-progress").slider({
        range: "min",
        value: TQ.mohuan.default_direction,
        min: 1,
        max: 10,
        create: function( event, ui ) {
            $('#mohuan_slider_midu .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        },
        slide: function(event, ui) {
            var pd=ui.value;
            TQ.mohuan.density=pd;
            TQ.mohuan.change(TQ.mohuan.size,TQ.mohuan.direction,TQ.mohuan.density);
            $("dt").css("paddingLeft",pd);
            $('#mohuan_slider_midu .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        }
    });
    //方向
    $("#mohuan_slider_fangxiang .jdt-progress").slider({
        range: "min",
        value: TQ.mohuan.default_density,
        min: 1,
        max: 10,
        create: function( event, ui ) {
            $('#mohuan_slider_fangxiang .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        },
        slide: function(event, ui) {
            var pd=ui.value;
            TQ.mohuan.direction=pd;
            TQ.mohuan.change(TQ.mohuan.size,TQ.mohuan.direction,TQ.mohuan.density);
            $("dt").css("paddingLeft",pd);
            $('#mohuan_slider_fangxiang .jdt-progress .ui-slider-handle').attr('class','jdt-slider-handle')
        }
    });
    //关闭魔幻按钮
    $(document).on('click','#mohuan_div_close_btn',function(){
        $('#mohuan_slider_div').hide();
    });
    //魔幻按钮停止
    $(document).on('click','#mohuan_stop_btn',function(){
        TQ.mohuan.stop(TQ.mohuan.current_type);
        $(this).hide();
        $('#mohuan_start_btn').show();
    });
    //魔幻按钮开始
    $(document).on('click','#mohuan_start_btn',function(){
        TQ.mohuan.start(TQ.mohuan.current_type);
        $(this).hide();
        $('#mohuan_stop_btn').show();
    });

    //试听声音
    $(document).on('click','.start_sound',function(){
        TQ.Sound.sound_start($(this));
    });
    //关闭动作弹窗
    $(document).on('click','#easydialog_win .close_btn',function(){
        $('#action_add_btn').trigger('click');
    });
    $(document).on('change','#timeValueInput',function(){
        var t=$('#timeValueInput').val();
        TQ.TimerUI.t=t;
        TQ.TimerUI.body.slider( "value",TQ.TimerUI.t);
        TQ.TimerUI.onMouseStop();
    });
    //图钉按钮
    $(document).on('click','#tuding_btn',function(){
        var this_obj=$(this);
        if(this_obj.attr('display_status')==undefined || this_obj.attr('display_status')==0){
            TQ.Init.tuding=1;
            this_obj.attr('display_status',TQ.Init.tuding).attr('class','tuding dingzhu');
        }else{
            TQ.Init.tuding=0;
            this_obj.attr('display_status',TQ.Init.tuding).attr('class','tuding');
        }
    });

    //清除编辑器默认文字
    $(document).on('click','#textEditBoxDiv #textEditBox',function(){
        var str=$(this).val();
        if(str!='' && str==TQ.Dictionary.defaultText){
            $(this).val('');
        }
    });

    $("#floatToolbarDiv").draggable();

     $(document).on('click touchmove touchstart touchend taphold hold tap release mouseover',function(evt){
    //    console.log("mc:" + evt.type);
    });

    //场景排序
    $('#scenesOrderDiv').draggable();
    $(document).on('click','#scenesOrderBtn',function(){

        var html='';
        //从0开始
        var scenesNum=TQ.WCY.getLevelNum();
        for(i=1;i<=scenesNum;i++){
            html+='场景'+i+'：<input id="" type="text" name="" maxlength="3" size="3" class="orderList" scenesNum="'+i+'"></br>';
        }
         $('#scenesOrderDiv #scenesOrderDivHtml').html(html);


        easyDialog.open({
            container : 'scenesOrderDiv',
            overlay : false
        });
    });
    //场景排序确认
     $(document).on('click','#scenesOrderDiv #yesBtn',function(){
         TQ.WCY.moveTo(0,2)
         console.log(22)
        /* $('#scenesOrderDiv .orderList').each(function(i){
            console.log($(this).val())
        }) */
         //var temp=TQ.WCY.getLevelNum()+1;

    });
    //场景排序取消
     $(document).on('click','#scenesOrderDiv #noBtn',function(){
         easyDialog.close()
    });
    //编辑器文字颜色选择
        /*
    $('#fontcolor').colpick({
        layout:'hex',
        onSubmit:function(hsb,hex,rgb,el) {
            $(el).css('background-color', '#'+hex);
            $(el).colpickHide();
        },
        onChange:function(hsb,hex,rgb,el,bySetColor) {
            TQ.TextEditor.setFontColor('#'+hex);
            $(el).css('border-color','#'+hex);
            if(!bySetColor) $(el).val(hex);
        }
    });
    */
});
//定时保存,
setInterval('TQ.Init.saveLocalWcy()', 30000);

//ToDo:AZ mobile
/*
ifvisible.idle(function(){
    if($('#play').is(':visible')==true){
        //不是播放状态
        TQ.Init.saveServerWcy();
    }
});
ifvisible.setIdleDuration(30); //30秒内没任何动作执行
*/
