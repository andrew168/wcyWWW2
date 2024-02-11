window.TQ = window.TQ || {};
(function() {
  var FileDialog = {};
  var cate_id = "";
  FileDialog.visible = false;
  FileDialog.keywords = TQ.Utility.readLocalStorage("keywords", TQ.Dictionary.MiniAnime); // 字串, 不是数组
  FileDialog.initialize = function() {
    // 在 mcDeferLoad.html 中定义，由mc中的mcDeferLoad 统一加载；
    // 把小资源文件合并成大文件，提高加载速度
    $("#save-file").hide();
    $("#GetTextInput").hide();
  };

  FileDialog.getFilename = function(defaultvalue, closeCallback) {
    var name = $("#name");
    // keywordsEle = $("#keywords"),
    var keywordsEle = $("#mc_type");
    allFields = $([]).add(name),
    myDialog = $("#save-file");
    function onEnter(baseKeywords) {
      if (!FileDialog.visible) { return ""; }
      var bValid = false;
      var __filename = $.trim(name.val());
      if ((__filename != "") && // 不能为空
          (__filename.lastIndexOf(" ") < 0) && // 不能包含空格，
        (__filename.lastIndexOf(TQ.Config.DEMO_SCENE_NAME) < 0) && // 不能覆盖系统的演示文件
        (__filename.lastIndexOf(TQ.Config.UNNAMED_SCENE) < 0)) { // 不能每名称
        bValid = true;
      } else {
        bValid = false;
      }

      // var regexp = new RegExp(/[\"\/\\<>\?\*]/); //非法字符集
      /* var regexp = new RegExp(/[\/\\<>\?\*]/); //非法字符集
        bValid = bValid && ( !regexp.test( __filename ));
        if (!bValid) {
          alert(TQ.Dictionary.INVALID_FILENAME);
          return "";
        } */

      FileDialog.visible = false;
      allFields.removeClass("ui-state-error");
      FileDialog.keywords = $.trim(keywordsEle.attr("cate_id"));
      if (FileDialog.keywords.indexOf(TQ.Dictionary.CommaCh) >= 0) {
        FileDialog.keywords = FileDialog.keywords.replace(TQ.Dictionary.CommaCh, ",");
      }

      if (FileDialog.keywords.indexOf(baseKeywords) < 0) {
        FileDialog.keywords_type = baseKeywords + "," + FileDialog.keywords; // 提交到from的
        FileDialog.keywords = FileDialog.keywords; // 自动添加 “微动漫” 或“元件”,显示出来的
      }

      if (bValid) {
        /* myDialog.dialog( "close" ); */
        __filename = TQ.Utility.forceExt(__filename);
        if (closeCallback !== null) {
          closeCallback(__filename, FileDialog.keywords_type);
        }
      }
      return __filename;
    }

    var save_flag = false;
    var save_error_msg = "";
    // 把初始值赋给 input区域
    name.val(defaultvalue);
    keywordsEle.attr("cate_id", FileDialog.keywords); // 上一次使用的值；
    $("#close_save").click(function() { $.fancybox({ closeClick: true }); });
    $(".save_mc").unbind("click"); // 解除绑定

    var mc_type_str = "";
    $(".save_mc").click(function() {
      var name_val = $("#name").val();
      var f = new Object();
      var mc_type = $("#mc_type").val();
      var cate_3 = $("#cate_3").val();
      var cate_2 = $("#cate_2").val();
      var cate_1 = $("#cate_1").val();
      if (cate_1 != "" && cate_1 != undefined) {
        cate_id = cate_1;
      }
      if (cate_2 != "" && cate_2 != undefined) {
        cate_id = cate_2;
      }
      if (cate_3 != "" && cate_3 != undefined) {
        cate_id = cate_3;
      }
      $("#mc_type").attr("cate_id", cate_id);

      var save_error_msg = "";
      if (mc_type == "mc") {
        mc_type_str = "微动漫";
      } else if (mc_type == "element") {
        mc_type_str = "元件";
      }
      // 判断
      if (mc_type_str == "") {
        save_error_msg = "请选择保存的类型！";
      } else if (name_val == "") {
        save_error_msg = "请输入名称！";
      } else if (cate_id == "" || cate_id == null) {
        save_error_msg = "请选择完整的分类！";
      }
      if (save_error_msg != "") {
        $("#global_div .global_div_content").html(save_error_msg);
        easyDialog.open({
          container: "global_div",
          fixed: false
        });
      } else {
        save_flag = true;
      }

      // 如果选择了完整的分类
      if (save_flag == true) {
        f.name = name_val;
        f.cate_id = cate_id;
        f.mc_type = mc_type_str;
        f.uid = $(".user_true").attr("uid");
        var result_msg = MYJS.ajax_obj.post(f, "Weidongman/wfile/netSearch.php", "html");
        result_msg.success(function(msg) {
          if (msg == "success") {
            FileDialog.visible = true; myDialog.keypress(TQ.TextEditor.onEnter); onEnter(mc_type_str);
            $.fancybox({ closeClick: true });
          } else {
            $("#change_save_div .change_save_div_content").html("文件已经存在！确认要替换？");
            easyDialog.open({
              container: "change_save_div",
              fixed: false
            });
          }
        });
      }
    });
    // 保存替换
    $(document).on("click", "#change_save_div_yesbtn", function() {
      FileDialog.visible = true; myDialog.keypress(TQ.TextEditor.onEnter); onEnter(mc_type_str);
      easyDialog.close();
      $.fancybox({ closeClick: true });
    });
    // 关闭
    $(document).on("click", "#change_save_div_nobtn", function() {
      easyDialog.close();
    });

    $.fancybox({
      href: "#save-file",
      closeBtn: false,
      helpers: {
        overlay: { closeClick: false }
      }
    });
  };
  TQ.FileDialog = FileDialog;
}());

