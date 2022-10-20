// 实用函数库
var __enable_debug_trsa = false;

function throb(element) {
  $(element).animate({opacity:1.0},250,function(){$(this).animate({opacity:0.5},2000);});
}

function restoreTestSubjects() {
  $('.testSubject,.testSubject *').removeAttr('style');
}

// 总是当做字符串来输出， 即使是HTML，XML， JSON， 也不做任何解析，只是当做普通子串显示出来
function displayInfo2(msg)
{
  $('#testLabelInfo').text(msg);
}

// 总是当做字符串来输出， 即使是HTML，XML， JSON， 也不做任何解析，只是当做普通子串显示出来
function displayInfo3(msg)
{
  TQ.MessageBubble.counter ++;
  TQ.MessageBubble.addMessage(msg);
  if (TQ.MessageBubble.counter >= 2) { //  在保存文件的时候， 总共显示两次返回的信息，完成之后才能关闭
    TQ.MessageBubble.close();
  }
}

function displayJSON(data)
{
  var jsonResultFromJQueryAjax = data;
  var msg = JSON.stringify(jsonResultFromJQueryAjax);
  displayInfo2(msg);
}

function isObject(obj){
  if (obj == null) {return false;}
  return (typeof(obj)=='object') && (obj.constructor==Object);
}

function isFunction(obj){
  if (obj == null) {return false;}
  return (typeof(obj)=='function') && (obj.constructor==Function);
}

function dumpObject(obj) {
  //variable to save the html content
  var html="<table border=\"1px\"><tr><th>name</th><th>type</th><th>value</th><th>dump</th></tr>";

  //list all sub objects
  for (var e in obj) {
    var value = obj[e];
    if (isFunction(value)) continue;
    if (isObject(value))  {
      dumpObject(value);
      continue;
    }

    html+="<tr>";

    //get name
    html+="<td>"+e+"</td>";
    //get type
    html+="<td>"+(typeof(value))+"</td>";
    //get value
    // html+="<td>"+(isFunction(value)||isObject(value)?'':value)+"</td>";
    html+="<td>"+(isFunction(value)||isObject(value)?'Error':value)+"</td>";

    //dump the sub object
    html+="<td>"+(isObject(value)?dumpObject(value):'')+"</td>";

    html+="</tr>";
  }

  html+="</table>";
  $('#infoRegion').html(html);
  //return html;
}
