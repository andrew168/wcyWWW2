window.TQ= window.TQ || {};
$(function(){
  /**
   * wd_menu
   *
   */
  function TabsMenu(){

  }
  TabsMenu.current_page=1;//当前页
  TabsMenu.cateid;//当前分类id
  TabsMenu.catepid;//当前分类id
  TabsMenu.page_all;//一共多少页
  TabsMenu.page_size=12;
  TabsMenu.tag_keywords='';
  TabsMenu.tag_type='';
  TabsMenu.etype='';
  TabsMenu.tabs_menu_id='';
  TabsMenu.tabs_menu_text='';
  TabsMenu.isSearch=false;
  //分类菜单
  TabsMenu.category_menu=function(){
      if(TabsMenu.catepid==68){
          var url2='http://'+TQ.Config.API_DOMAIN_NAME+'/category/children/'+TabsMenu.catepid+'/1';
      }else{
          var url2='http://'+TQ.Config.API_DOMAIN_NAME+'/category/children/'+TabsMenu.catepid;
      }

    var category_menu_html='';
    var msg_data='';
    var json_data='';
      //存储到本地
    storedb('TabsMenuCategory').find({"key":TabsMenu.catepid},function(err,result){
        if(!err){
            json_data=result;
        }
    })
    if(json_data!=''){
        msg_data=json_data[0].content;
    }else{
        var f=new Object();
        var result_msg=MYJS.ajax_obj.get(f,url2,'json');
        result_msg.success(function(msg){
            msg_data=msg;
            storedb('TabsMenuCategory').insert({"key":TabsMenu.catepid,"content":msg},function(err){
            });
        });
    }
 
    if(msg_data.list.length>0){
        for(j=0;j<msg_data.list.length;j++){
            category_menu_html+='<li><a href="javascript:void(0)" cate_id="'+msg_data.list[j].id+'" class="tabmenuajax_btn">'+msg_data.list[j].name+'</a></li>';
        }
    }
    category_menu_html="<ul>"+category_menu_html+"</ul>";
    return category_menu_html;
  }

  //点击菜单后的内容
  TabsMenu.category_content=function(){
    var cate_id=TQ.TabsMenu.cateid;
    var f=new Object();
    var s_html='';
    var is_sounds=false;
    var page=TabsMenu.current_page;
    //?category_id=my&category_pid=my&etype=&page=1&psize=12&uid=1
    var url='http://'+TQ.Config.API_DOMAIN_NAME+'/sucaisearch/';
    $('#category_menu_all').css('display','block')
    $('#page_nav').css('display','block')
    //根据catepid判断访问的url
    if(TabsMenu.catepid=='hudong'){
      url+='special/?';
      $('#page_nav').css('display','none')
    }else if(TabsMenu.catepid=='mohuan'){
      url+='special?';
      $('#category_menu_all').css('display','none')
      $('#page_nav').css('display','none')
    }else if(TabsMenu.isSearch==true){
      /* if(cate_id=='my'){
          url+='index?uid='+TQ.Init.uid+'&tag_keywords='+TabsMenu.tag_keywords+'&tag_type='+TabsMenu.tag_type;
      }else{
       url+='index?tag_keywords='+TabsMenu.tag_keywords+'&tag_type='+TabsMenu.tag_type;
      } */
    }else if(TabsMenu.catepid=='my'){
       url+='index?&uid='+TQ.Init.uid;
    }else{
       url+='index?';
    }
    url+='&page='+page+'&category_id='+cate_id+'&category_pid='+TabsMenu.catepid+'&etype='+TQ.TabsMenu.etype+'&psize=12';

    var result_total=0;//总数量
    var msg_data='';//返回的数据
    var json_data='';
    //存储到本地
    storedb('TabsMenuContent').find({"key":TabsMenu.catepid+"_"+cate_id+"_"+page+"_"+TabsMenu.tag_keywords},function(err,result){
        if(!err){
            json_data=result;
        }
    })
    if(json_data!=''){
        msg_data=json_data[0].content;
        dataToMenu(msg_data);
    }else{
        var result_msg=MYJS.ajax_obj.get(f,url,'json');
        result_msg.success(function(result){
            msg_data=result;
            storedb('TabsMenuContent').insert({"key":TabsMenu.catepid+"_"+cate_id+"_"+page+"_"+TabsMenu.tag_keywords,"content":result},function(err){
            });
            dataToMenu(msg_data);
        });
    }
  };

  //显示内容缩略图
  var dataToMenu = function(msg_data) {
      if(msg_data.list.length>0){
          var data =msg_data;
          if(TabsMenu.catepid=='mohuan'){
              var tpl =$('#category_content_mohuan_ul_html').html();
              //}else if(cate_id==68 || cate_id==93 ||cate_id==94 ||cate_id==95){
          }else if(TabsMenu.catepid==68 && TabsMenu.cateid!=101){
              var tpl =$('#category_content_sound_ul_html').html();
          }else{
              var tpl =$('#category_content_img_ul_html').html();
          }
          s_html = Mustache.render(tpl, data);
          $('#category_content').html(s_html);
      }else{
          $('#category_content').html('');
      }
      result_total=msg_data.total;
      //分页
      TabsMenu.page_all=Math.ceil(result_total/TabsMenu.page_size);
      TQ.TabsMenu.page_nav();
  };

  //分页
  TabsMenu.page_nav=function(){
    $('#page_nav').hide();
    if(TabsMenu.page_all>0){
      $('#page_nav').show();
      if(TabsMenu.current_page<=1){
        $('#page_up').removeClass('up-valid')
      }else{
        $('#page_up').addClass('up-valid')
        //$('#page_up').css('display','block')
      }
      if(TabsMenu.page_all==1){
        $('#page_next').removeClass('next-valid').addClass('next-invalid');
        //$('#page_next').css('display','none')
      }else{
        $('#page_next').addClass('next-valid').removeClass('next-invalid');
        //$('#page_next').css('display','block')
      }
      if(TabsMenu.current_page>=TabsMenu.page_all){
          TQ.TabsMenu.current_page=TabsMenu.page_all
          $('#page_next').unbind('click');
          $('#page_next').removeClass('next-valid').addClass('next-invalid');
        //$('#page_next').css('display','none')
      }else{
          $('#page_next').addClass('next-valid').removeClass('next-invalid');
        //$('#page_next').css('display','block')
      }
      $('#page_html').html(TabsMenu.current_page+'/'+TabsMenu.page_all);
    }else{
      $('#page_html').html('1/1');
    }
  };

  TabsMenu.searchMore=function(){
      var f=new Object();
      f.keywords=TabsMenu.tag_keywords;
      var url='http://'+TQ.Config.DOMAIN_NAME+'/index.php/api/wcy/searchMore.json';
      var result_msg=MYJS.ajax_obj.get(f,url,'json');
      result_msg.success(function(result){
          if(result.list.length>0){
              var data =result;
              var tpl =$('#category_content_img_ul_html').html();
              s_html = Mustache.render(tpl, data);
          }
          //分页
          TabsMenu.page_all=Math.ceil(result.total/TabsMenu.page_size);
          TQ.TabsMenu.page_nav();
      });
      return s_html;
  }

  //选中左侧图片，出现在右侧画布区
  TabsMenu.img_click=function(this_obj){
    var obj=this_obj.find('.thumb_div .image_click');
    if(TabsMenu.cateid=='my_video' || TabsMenu.cateid==101){
        //var src=obj.attr('src').replace('mcThumbs','mcvideos');
        var src=obj.attr('src').replace('mcThumbs','mcImages');
        src=src.replace('png','mp4');
    }else{
        var src=obj.attr('src');
    }
    var html="<div src='"+src+"' eType='"+obj.attr('etype')+"' Type='"+obj.attr('type')+"' title='"+obj.attr('title')+"' wcyid='"+obj.attr('wcyid')+"'/>"
    this_obj.addClass('thumb_div_click');
    TQ.WCY.addResToStageCenter($(html));
  };
  
  /**
  * @brief 左侧菜单开启
  */
  TabsMenu.openDiv=function(){
      $('#category_menu_div').css('display','block');//全部
      $('#category_content').css('display','block');//内容
  };
 /**
  * @brief 左侧菜单关闭
  */
  TabsMenu.closeDiv=function(){
      $('#category_menu_div').css('display','none');
      $('.tabmenu_left_ajax_btn').attr('display_status','0');
  };

  TQ.TabsMenu=TabsMenu;
}());

