/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

/// 所有中文信息的唯一来源
(function () {
  function Dictionary() {
  }
  var f=new Object();
  //var result_msg=MYJS.ajax_obj.get(f,'http://'+window.location.host+'/index.php/api/lang/lang.json','json');

  var host=window.location.host;
  status=host.indexOf("udoido.cn");
  var api_domain='';
  if(status!='-1'){
    api_domain='api.udoido.cn';
  }else{
    api_domain='api.udoido.com';
  }

  status=host.indexOf("test.udoido.cn");
  if(status!='-1'){
    api_domain='testapi.udoido.cn';
  }
  var api_domain=api_domain+'/'+getcookie('select_lang');
  var result_msg=MYJS.ajax_obj.get(f,'http://'+api_domain+'/translation','json');
  var Dictionary=new Array();
  result_msg.success(function(msg){
    for(var i in msg){
      Dictionary[i]=msg[i];
    }
  })
  eval(Dictionary)
  TQ.Dictionary = Dictionary;
}());

function getcookie(objname){//获取指定名称的cookie的值
  var arrstr = document.cookie.split("; ");
  for(var i = 0;i < arrstr.length;i ++){
    var temp = arrstr[i].split("=");
    if(temp[0] == objname) return unescape(temp[1]);
  }
}
