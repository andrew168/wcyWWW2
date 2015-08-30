/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-13 下午7:16
 */
window.TQ = window.TQ || {};

(function () {
    function DitherRemover () {
    }
    var p = DitherRemover;
    p._LENGTH = 20; //N点加权平均法消除抖动
    p.buffer = [];
    p._on = false;
    p.enabled = false;
    p.start = function(xx, yy) {
        p.buffer.splice(0);
        p.buffer.push({x:xx, y:yy});
        p._on = true;
        return p.buffer[0];
    };

    p.close = function() {
        p.buffer.splice(0);
        p._on = false;
    };

    // 添加1个新的点, 获取消抖处理后的点
    p.smooth = function(xx,yy) {
        if (p.enabled) {
            if (!p._on)  {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
                return p.start(xx, yy);
            }
            if (__user_level == 8) {
                console.log(xx + ", " + yy);
            }
            if (p.buffer.length >= p._LENGTH) {
                p.buffer.shift();
            }
            p.buffer.push({x:xx, y:yy});
            xx = 0;
            yy = 0;
            var num = p.buffer.length;
            for (var i = 0; i < num; i++) {
                xx += p.buffer[i].x / num;
                yy += p.buffer[i].y / num;
            }
        }
        return {x:xx, y:yy};
    };

    p.isOn = function() { return p._on; };

    TQ.DitherRemover = DitherRemover;
}());
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

var value = 0;

function initWorkingArea() {
    allowDroppable();
    $('div#tab_right_panel img').draggable({helper: 'clone'}); // .rotate(30);
}

function allowDroppable()
{
    var options = {
        // activeClass: "ui-state-hover",   // 只用于调试，
        // hoverClass: "ui-state-active"    // 只用于调试，
    };

    options.drop = function(event,info){
        displayInfo2("x=" + info.offset.left +  "y= " + info.offset.top);
        var res = $(info.draggable);
        var target = stage.getObjectsUnderPointer2(event); // 选中物体
        var x0 = screenToRegionX(pivotToCenterX(info.offset.left));
        var y0 = screenToRegionY(pivotToCenterY(info.offset.top));
        var z0 = TQ.Utility.getMaxZ() + 1;
        _addResToStage(res, target, x0, y0, z0);
    };

    $('#workingarea').droppable(options);
}

function _addResToStage(res, target, x0, y0, z0, levelID, _t0)
{
    if (res == null) {
        return;
    }

    if (_t0 == undefined) {
        _t0 = TQ.FrameCounter.t();
    }
    var imageSrc = res.attr('src');
    var resType = res.attr('type');
    var eleType = res.attr('eType');
    var resAlias = res.attr('title');

    if ((!imageSrc) || (!resType) ||(!eleType)) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER + "src, tyep or eType", imageSrc && resType && eleType);
        return;
    }

    var RES_TYPE_WCY = "1",
        RES_TYPE_PICTURE = "2",
        RES_TYPE_COMPONENT = "3",
        RES_TYPE_BUTTON = "4",
        RES_TYPE_AUDIO = "11";

    var ELE_TYPE_BACKGROUND = "1",
        ELE_TYPE_PROP = "2",
        ELE_TYPE_CHARACTER = "3",
        ELE_TYPE_TEXT = "4",
        ELE_TYPE_EFFECT = "5",
        ELE_TYPE_BUTTON = "6",
        ELE_TYPE_AUDIO = "7";

    if (eleType != undefined) {
        if (eleType == ELE_TYPE_BUTTON) {
            resType = RES_TYPE_BUTTON;
        }
    }

    var type = null, resName = null;

    //ToDo：去除src开头的"/."
    imageSrc = imageSrc.replace("/.", "");

    if ( !((imageSrc == undefined) || (imageSrc == null)) ) {  // 阻止非Image的 HTML元素
        if (resType == RES_TYPE_WCY) {
            return openScene(TQ.Utility.getSceneByThumbnail(imageSrc));
        } else {
            switch (resType) {
                case RES_TYPE_AUDIO:
                    type = "SOUND";
                    var soundSrc = res.attr('soundsrc'); //与属性名称的大小写无关，因为浏览器把元素的属性名称全转为小写。
                    resName = TQ.Utility.getAudioByThumbnail(soundSrc);
                    if (!target) {
                        displayInfo2("请把声音拖放到合适的物体上！");
                    } else {
                        TQ.SelectSet.getSelectedElement();
                        displayInfo2(target.toString());
                    }
                    break;

                case RES_TYPE_COMPONENT:
                    type = "GroupFile";
                    x0 = 0;
                    y0 = TQ.Config.workingRegionHeight;
                    //元件的插入点， 改为屏幕的左下角，以保持元件保存时的屏幕位置。
                    resName = TQ.Utility.getComponentByThumbnail(imageSrc);
                    // resName = "/mcAssets/" + resName + ".wdm";
                    break;

                case RES_TYPE_BUTTON:
                    type = "BUTTON";
                    resName = TQ.Utility.getImageByThumbnail(imageSrc);
                    break;

                case RES_TYPE_PICTURE:
                default:
                    if (resType != RES_TYPE_PICTURE) {
                        assertTrue(TQ.Dictionary.INVALID_PARAMETER, 0);  // 非法， 当做图片处理
                    }
                    type = "Bitmap";
                    resName = TQ.Utility.getImageByThumbnail(imageSrc);
                    break;
            }

            //所有的资源，包括声音，都是通过此处加入到舞台中的，并且加上时间标记
            var desc = {src:resName, alias:resAlias, type:type, eType: eleType, x: x0, y:TQ.Utility.toWorldCoord(y0), zIndex: z0, t0:_t0};
            if (levelID != undefined) { // 支持跨场景的元素插入
                desc.levelID = levelID;
            }

            return addImage(desc);
        }
    }
}

/*
 添加资源到舞台的正中央, res是资源区的一个资源，采用JQuery形式表示。
 */
function addResToStageCenter(res, levelID, t0) {
    var target = TQ.SelectSet.peek(); // 选中物体
    var x0 = TQ.Config.workingRegionWidth / 2;
    var y0 = TQ.Config.workingRegionHeight / 2;
    var z0 = TQ.Utility.getMaxZ() + 1;
    return _addResToStage(res, target, x0, y0, z0, levelID, t0);
}

// 界面布局变了 (去除了顶部的文字菜单区),所以 从屏幕坐标到绘图区坐标的变换也要变
function screenToRegionX(screenX)
{
    return (screenX - TQ.Config.workingRegionX0);
}

function screenToRegionY(screenY)
{
    return (screenY - TQ.Config.workingRegionY0);
}

function pivotToCenterX(regionX) {
    return (regionX + TQ.Config.THUMBNAIL_WIDTH/2);
}

function pivotToCenterY(regionY) {
    return (regionY + TQ.Config.THUMBNAIL_HEIGHT/2);
}

/**
 * save and open through internet
 * 都是JSON数据
 */

var NET_IO_DATA_TYPE = 'text';
function zipBlob(filename, blob, callback) {
    // use a zip.BlobWriter object to write zipped data into a Blob object
    zip.createWriter(new zip.BlobWriter("application/zip"), function(zipWriter) {
        // use a BlobReader object to read the data stored into blob variable
        zipWriter.add(filename, new zip.BlobReader(blob), function() {
            // close the writer and calls callback function
            zipWriter.close(callback);
        });
    }, onerror);
}


function netSave(filename, dataBuffer,keywords,otherObj)
{
    var f=new FormData();
    var flag=false;
    //是否是定时保存
    if(otherObj==null || otherObj.isTimeSaveWcy==false){
        $('#messagediv_content').html(TQ.Dictionary.IS_SAVING);
        easyDialog.open({
            container : 'messagediv'
        });
        flag=true;
    }else{
        //定时保存需要转成json
        dataBuffer=JSON.parse(dataBuffer);
        flag=false;
    }
    f.append('filename',filename);
    f.append('userID',localStorage.getItem("userID"));
    f.append('publish_v',$('#save-file #publish').val());
    f.append('keywords',keywords);
    f.append('wdmFile',JSON.stringify(dataBuffer));

    $.ajax({
        url: 'http://'+TQ.Config.DOMAIN_NAME+'/wcy/save',
        type: "post",
        contentType: false, //必须
        processData: false, //必须
        data:f
    })
    .done(function(msg){
        msg=JSON.parse(msg);
        if(msg.name!=undefined && msg.name!=''){
            TQ.Init.wcyTempName=msg.name;
        }
        if(flag){
            displayInfo3();
        }
        NET_IO_DATA_TYPE
    })
    .done(function(){
        TQ.Init.saveServerWcyProcess=0;
    })
}

function netOpen(filename, callback)
{
    var para = "filename="+filename;
    $.get('http://'+TQ.Config.DOMAIN_NAME+'/wcy/wdmOpen',para, callback, NET_IO_DATA_TYPE);
}

function onDelete(msg) {
    displayInfo2(msg);
    if (msg.indexOf(TQ.Dictionary.FAILED) < 0) { // 不成功
        localStorage.setItem("sceneName", "");
        $("#newScene").click();
    }
}

/*
function netDelete(wcyID)
{
    var para = "&userID=" + localStorage.getItem("userID");
    $.post('http://'+TQ.Config.DOMAIN_NAME+'/Weidongman/wfile/netDelete.php?wcyID='+wcyID + para, null, onDelete, NET_IO_DATA_TYPE);
}
*/

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

/**
 * JS编程的基本工具
 */


window.TQ = window.TQ || {};
TQ = TQ || {};

/**
 * 通用函数：用于定义namespace命名空间
 * @param ns：命名空间字符串， 用句点分割，例如： TQ.Element
 * @return {*}
 */
TQ.namespace = function(ns) {
    var parts = ns.split('.'),
        parent = TQ,
        i;
    if (parts[0] === "TQ") {
        parts = parts.slice(1);
    }

    for (i = 0; i < parts.length; i++) {
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }

    return parent;
};

/**
 * 类定义的实用函数， 用例见： CompositeCommand的定义
 * @type {*}
 */
var inherit = (function() {
    var F = function() {};
    return function(C, P) {
        F.prototype = P.prototype;
        C.prototype = new F();
        C.uber = P.prototype;
        C.prototype.constructor = C;
    }
}());


// 保留6位小数
Math.truncate6 = function(f) {
    return Math.floor(f * 1000000) / 1000000;
};


//定义常用的宏，     避免使用数字常量
TQ.ERROR = -1;
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

/// 所有中文信息的唯一来源
(function () {
    function Dictionary() {
    }
    Dictionary.LoginPlease = "请先登录！";
    Dictionary.fontFace = "隶书";
    Dictionary.defaultText = "用克隆键C批量添加文字更快捷";
    Dictionary.OK = "确定";
    Dictionary.Return = "返回";
    Dictionary.Cancel = "取消";
    Dictionary.CommaCh = "，";
    Dictionary.Save = "保存";
    Dictionary.Component = "元件";
    Dictionary.MiniAnime = "微动漫";
    Dictionary.PleaseSelectText = "应该先选中字符串";
    Dictionary.PleaseSelectHost = "请先选择主物体";
    Dictionary.PleaseSelectOne = "必须有一个选中点";
    Dictionary.CanntReentry = "不能重复进入";
    Dictionary.TextEditor = "文字编辑";
    Dictionary.SelectColor = "选择字体颜色";
    Dictionary.Selected = "选中";
    Dictionary.isDepreciated = "是否已经废弃?, 只是和保钓兼容???";
    Dictionary.ParentMatrixFromLastIteration = "父矩阵是上一个迭代计算的";
    Dictionary.MustBeBatchMode = "必须是BatchMode";
    Dictionary.CurrentState = "当前状态:";
    Dictionary.CounterValidation = "计数器合法值 > 0";
    Dictionary.FoundNull = "发现Null,或者未定义的对象";
    Dictionary.Load = "调入";
    Dictionary.Frame = "帧";
    Dictionary.ShareTitle = '让生活享受动漫！---- 图强微创意引擎支持';
    Dictionary.ShareSummary = '我的创意，送给你！';
    Dictionary.CanntDelete = '系统保留文件,不能删除！';
    Dictionary.INVALID_FILENAME = "非法的文件名";
    Dictionary.INVALID_LOGIC="非法逻辑";
    Dictionary.INVALID_PARAMETER="非法参数值，数值出界或为空";
    Dictionary.SAME_TYPE_SKIN="只有相同类别的元素能够换皮肤";
    Dictionary.Locked="物体已经锁定,如需操作,请先解锁";

    // 菜单部分
    Dictionary.MenuNewScene = "创建新的微创意";
    Dictionary.MenuSave = "保存微创意, 保存元件";
    Dictionary.MenuUndo = "撤销(Ctrl + Z)";
    Dictionary.MenuRedo = "重做(Ctrl + Y)";
    Dictionary.MenuDelete = "删除当前微创意";
    Dictionary.MenuDeleteElements = "删除选中的元素";
    Dictionary.MenuNewLevel = "插入新场景";
    Dictionary.MenuInsertText = "插入文本";
    Dictionary.MenuSkinning = "换皮肤";
    Dictionary.MenuJoint = "加关节";
    Dictionary.MenuMinJointAngle = "设置关节的最小位置";
    Dictionary.MenuMaxJointAngle = "设置关节的最大位置";
    Dictionary.MenuKeyUnjoint = "去关节";
    Dictionary.MenuSetStageSize = "设置舞台的大小";
    Dictionary.MenuLockIt = "锁定物体,防止误操作";
    Dictionary.MenuUploadImage = "上传图片";
    Dictionary.MenuPreviousLevel = "上一场景";
    Dictionary.MenuNextLevel = "下一场景";
    Dictionary.MenuAnimation = "动作表";
    Dictionary.Menu3Dfy = "打包成3D元素";
    Dictionary.MenuGroup =  "打包成复合大物体";
    Dictionary.MenuKeyUngroup = "拆散复合物体";
    Dictionary.MenuBeginning = "开头";
    Dictionary.MenuEnd = "结尾";
    Dictionary.MenuSubElement = "进入/退出零件编辑模式";
    Dictionary.MenuLinearMode = "进入/退出连续动画模式";
    Dictionary.MenuStop = "停止";
    Dictionary.MenuPlay = "播放动画";
    Dictionary.MenuKeyMove = "平移";
    Dictionary.MenuKeyScale = "缩放";
    Dictionary.MenuKeyRotate = "旋转";
    Dictionary.MenuKeyShift = "上下";

    Dictionary.MenuKeyHideShow = "隐藏/显示";
    Dictionary.MenuKeyRemoveTrack = "消除所选对象的动画";

    Dictionary.NAME_EXIST = "名字已经存在";
    Dictionary.NAME_NOT_EXIST = "名字不存在";


    // 文件保存， 删除， 打开
    Dictionary.IS_SAVING = "正在保存，请勿关闭页面！";
    Dictionary.FAILED = "不成功";
    Dictionary.SaveItPlease = "当前文件已经修改， 要保存吗？";
    Dictionary.Yes = "是";
    Dictionary.No = "不";
    Dictionary.IS_PROCESSING = "正在处理，请稍后......";
    TQ.Dictionary = Dictionary;
}());
/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午12:42
 */
window.TQ = window.TQ || {};

(function () {
    function Config() {
    }
    //Config.DOMAIN_NAME="localhost";
     Config.DOMAIN_NAME=window.location.host;
    Config.EXTENSION = "";  // JS 不要后缀, 只有PHP自添加后缀
    Config.color = "#0000FF";
    Config.fontFace = window.TQ.Dictionary.fontFace;
    Config.fontSize = "36"; // px是合成函数自动加的
    Config.BACKGROUND_COLOR = "#FFF"; // HTML5的#系列颜色只有#FFF,不是#FFFFFF.
    Config.workingRegionX0 = 160; // ToDo: 1)初始化, 按照分辨率来. 2)响应窗口尺寸变化 (window.screen.width - 960) /2;
    Config.workingRegionY0 = 63;
    Config.workingRegionWidth = 662;
    Config.workingRegionHeight = 485;
    Config.zoomX = 1; // 缩放系数
    Config.zoomY = 1;
    Config.validPageWidth = 960;
    Config.MouseSensitivity = 10;  // 10个像素Z向移动一个层次。
    Config.RotateSensitivity = 2;  // 2个像素Z向移动一个层次。
    Config.pivotX = 0.5;  // 图像缺省: Pivot在(0.5, 0.5)
    Config.pivotY = 0.5;
    Config.TEXT_PIVOT_X = 0.0;
    Config.TEXT_PIVOT_Y = Config.pivotY;
    Config.DISPLAY_CLIPS = false;
    Config.THUMBNAIL_WIDTH = 175;
    Config.THUMBNAIL_HEIGHT = 128;
    Config.RESOURCE_PAGE_SIZE = 15;
    Config.IK_ITERATE_TIME = 1;
    Config.DEMO_SCENE_NAME="SystemDemo1";
    Config.UNNAMED_SCENE = "wcy01";
    Config.THUMBS_CORE_PATH = "mcThumbs/";
    Config.IMAGES_CORE_PATH = "mcImages/";
    Config.SCENES_CORE_PATH = "mcAssets/";
    Config.SOUNDS_PATH ="mcSounds/"; //从 localhost的根目录开始, 不是 E盘的根目录
    Config.SOUND_PLUGIN_PATH = "../soundjs/";
    Config.DefaultUserID = 10000;

    // utilities tools
    Config.REMOVE_EMPTY_LEVEL_ON = true;

    //以下调试开关,默认值都是release版. 禁止把修改值上传到代码库(代码库是可以发布的版本, 不是调试版).
    Config.IS_DEBUG = false;
    Config.LOG_LEVEL = 2;  // release 版 为 0,完全没有,输出, 内部release为 1,不用动程序, 也能够看到错误;
    Config.AutoPlay = true;  // release 版 为 false, 第一次打开网址, 就自动播放;
    window.TQ.Config = Config;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    var Log =function () {
    };

    Log.CLOSE = 0;
    Log.CRITICAL_LEVEL = 1;
    Log.ERROR_LEVEL = 2; // 代替 assert 的throw
    Log.WARN_LEVEL = 5;
    Log.INFO_LEVEL = 7; // 用于 跟踪调试, 查看软件的执行过程
    Log.level = TQ.Config.LOG_LEVEL;
    Log.open = function () { Log.level = Log.INFO_LEVEL;};
    Log.close = function () {Log.level = Log.CLOSE;};
    Log.setLevel = function(level) { Log.level = level;};
    Log.trace = function (str) {  //  只用于跟踪调试, (改info为trace), 不能直接出现在 release版中,
      console.log(str);
    };

    Log.criticalError = function (str) {
        if (Log.level >= Log.CRITICAL_LEVEL) console.log(str);
    };

    Log.error = function (str) {
        if (Log.level >= Log.ERROR_LEVEL) console.log(str);
    };

    Log.warn = function (str) {
        if (Log.level >= Log.WARN_LEVEL) console.log(str);
    };

    if (Log.level >= Log.INFO_LEVEL) {
        Log.info = Log.out = function(str) {
            console.log(str);
        };
    } else {
        Log.info = Log.out = function() {};
    }

    TQ.Log = Log;
}) ();

/*
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
function expectAsserts(count) {
  jstestdriver.expectedAssertCount = count;
}
function jstestdriver() {}

jstestdriver.assertCount = 0;
jstestdriver.jQuery = jQuery;

var fail = function fail(msg) {
  var err = new Error(msg);
  err.name = 'AssertError';

  if (!err.message) {
    err.message = msg;
  }

  if (TQ.Config.IS_DEBUG) {
    throw err;
  } else {
    TQ.Log.criticalError(err.name + ": " + msg);
  }
};

function isBoolean_(bool) {
  if (typeof(bool) != 'boolean') {
    fail('Not a boolean: ' + prettyPrintEntity_(bool));
  }
}


var isElement_ = (function () {
  var div = document.createElement('div');

  function isNode(obj) {
    try {
      div.appendChild(obj);
      div.removeChild(obj);
    } catch (e) {
      return false;
    }

    return true;
  }

  return function isElement(obj) {
    return obj && obj.nodeType === 1 && isNode(obj);
  };
}());


function formatElement_(el) {
  var tagName;

  try {
    tagName = el.tagName.toLowerCase();
    var str = '<' + tagName;
    var attrs = el.attributes, attribute;

    for (var i = 0, l = attrs.length; i < l; i++) {
      attribute = attrs.item(i);

      if (!!attribute.nodeValue) {
        str += ' ' + attribute.nodeName + '=\"' + attribute.nodeValue + '\"';
      }
    }

    return str + '>...</' + tagName + '>';
  } catch (e) {
    return '[Element]' + (!!tagName ? ' ' + tagName : '');
  }
}


function prettyPrintEntity_(entity) {
  if (isElement_(entity)) {
    return formatElement_(entity);
  }

  var str;

  if (typeof entity == 'function') {
    try {
      str = entity.toString().match(/(function [^\(]+\(\))/)[1];
    } catch (e) {}

    return str || '[function]';
  }

  try {
    str = JSON.stringify(entity);
  } catch (e) {}

  return str || '[' + typeof entity + ']';
}


function argsWithOptionalMsg_(args, length) {
  var copyOfArgs = [];
  // make copy because it's bad practice to change a passed in mutable
  // And to ensure we aren't working with an arguments array. IE gets bitchy.
  for(var i = 0; i < args.length; i++) {
    copyOfArgs.push(args[i]);
  }
  var min = length - 1;

  if (args.length < min) {
    fail('expected at least ' + min + ' arguments, got ' + args.length);
  } else if (args.length == length) {
    copyOfArgs[0] += ' ';
  } else {
    copyOfArgs.unshift('');
  }
  return copyOfArgs;
}


function assertTrue(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  isBoolean_(args[1]);
  if (args[1] != true) {
    fail(args[0] + 'expected true but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertFalse(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  isBoolean_(args[1]);
  if (args[1] != false) {
    fail(args[0] + 'expected false but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertEquals(msg, expected, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;
  msg = args[0];
  expected = args[1];
  actual = args[2];

  if (!compare_(expected, actual)) {
    fail(msg + 'expected ' + prettyPrintEntity_(expected) + ' but was ' +
        prettyPrintEntity_(actual) + '');
  }
  return true;
}


function compare_(expected, actual) {
  if (expected === actual) {
    return true;
  }

  if (typeof expected != 'object' ||
      typeof actual != 'object' ||
      !expected || !actual) {
    return expected == actual;
  }

  if (isElement_(expected) || isElement_(actual)) {
    return false;
  }

  var key = null;
  var actualLength   = 0;
  var expectedLength = 0;

  try {
    // If an array is expected the length of actual should be simple to
    // determine. If it is not it is undefined.
    if (jstestdriver.jQuery.isArray(actual)) {
      actualLength = actual.length;
    } else {
      // In case it is an object it is a little bit more complicated to
      // get the length.
      for (key in actual) {
        if (actual.hasOwnProperty(key)) {
          ++actualLength;
        }
      }
    }

    // Arguments object
    if (actualLength == 0 && typeof actual.length == 'number') {
      actualLength = actual.length;

      for (var i = 0, l = actualLength; i < l; i++) {
        if (!(i in actual)) {
          actualLength = 0;
          break;
        }
      }
    }

    for (key in expected) {
      if (expected.hasOwnProperty(key)) {
        if (!compare_(expected[key], actual[key])) {
          return false;
        }

        ++expectedLength;
      }
    }

    if (expectedLength != actualLength) {
      return false;
    }

    return expectedLength == 0 ? expected.toString() == actual.toString() : true;
  } catch (e) {
    return false;
  }
}


function assertNotEquals(msg, expected, actual) {
  try {
    assertEquals.apply(this, arguments);
  } catch (e) {
    if (e.name == 'AssertError') {
      return true;
    }

    throw e;
  }

  var args = argsWithOptionalMsg_(arguments, 3);

  fail(args[0] + 'expected ' + prettyPrintEntity_(args[1]) +
      ' not to be equal to ' + prettyPrintEntity_(args[2]));
}


function assertSame(msg, expected, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (!isSame_(args[2], args[1])) {
    fail(args[0] + 'expected ' + prettyPrintEntity_(args[1]) + ' but was ' +
        prettyPrintEntity_(args[2]));
  }
  return true;
}


function assertNotSame(msg, expected, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (isSame_(args[2], args[1])) {
    fail(args[0] + 'expected not same as ' + prettyPrintEntity_(args[1]) +
        ' but was ' + prettyPrintEntity_(args[2]));
  }
  return true;
}


function isSame_(expected, actual) {
  return actual === expected;
}


function assertNull(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (args[1] !== null) {
    fail(args[0] + 'expected null but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertNotNull(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (args[1] === null) {
    fail(args[0] + 'expected not null but was null');
  }

  return true;
}


function assertUndefined(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (typeof args[1] != 'undefined') {
    fail(args[2] + 'expected undefined but was ' + prettyPrintEntity_(args[1]));
  }
  return true;
}


function assertNotUndefined(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (typeof args[1] == 'undefined') {
    fail(args[0] + 'expected not undefined but was undefined');
  }
  return true;
}


function assertNaN(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (!isNaN(args[1])) {
    fail(args[0] + 'expected to be NaN but was ' + args[1]);
  }

  return true;
}


function assertNotNaN(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (isNaN(args[1])) {
    fail(args[0] + 'expected not to be NaN');
  }

  return true;
}


function assertException(msg, callback, error) {
  if (arguments.length == 1) {
    // assertThrows(callback)
    callback = msg;
    msg = '';
  } else if (arguments.length == 2) {
    if (typeof callback != 'function') {
      // assertThrows(callback, type)
      error = callback;
      callback = msg;
      msg = '';
    } else {
      // assertThrows(msg, callback)
      msg += ' ';
    }
  } else {
    // assertThrows(msg, callback, type)
    msg += ' ';
  }

  jstestdriver.assertCount++;

  try {
    callback();
  } catch(e) {
    if (e.name == 'AssertError') {
      throw e;
    }

    if (error && e.name != error) {
      fail(msg + 'expected to throw ' + error + ' but threw ' + e.name);
    }

    return true;
  }

  fail(msg + 'expected to throw exception');
}


function assertNoException(msg, callback) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  try {
    args[1]();
  } catch(e) {
    fail(args[0] + 'expected not to throw exception, but threw ' + e.name +
        ' (' + e.message + ')');
  }
}


function assertArray(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  jstestdriver.assertCount++;

  if (!jstestdriver.jQuery.isArray(args[1])) {
    fail(args[0] + 'expected to be array, but was ' +
        prettyPrintEntity_(args[1]));
  }
}


function assertTypeOf(msg, expected, value) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;
  var actual = typeof args[2];

  if (actual != args[1]) {
    fail(args[0] + 'expected to be ' + args[1] + ' but was ' + actual);
  }

  return true;
}


function assertBoolean(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'boolean', args[1]);
}


function assertFunction(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'function', args[1]);
}


function assertObject(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'object', args[1]);
}


function assertNumber(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'number', args[1]);
}


function assertString(msg, actual) {
  var args = argsWithOptionalMsg_(arguments, 2);
  return assertTypeOf(args[0], 'string', args[1]);
}


function assertMatch(msg, regexp, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var isUndef = typeof args[2] == 'undefined';
  jstestdriver.assertCount++;
  var _undef;

  if (isUndef || !args[1].test(args[2])) {
    actual = (isUndef ? _undef : prettyPrintEntity_(args[2]));
    fail(args[0] + 'expected ' + actual + ' to match ' + args[1]);
  }

  return true;
}


function assertNoMatch(msg, regexp, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (args[1].test(args[2])) {
    fail(args[0] + 'expected ' + prettyPrintEntity_(args[2]) +
        ' not to match ' + args[1]);
  }

  return true;
}


function assertTagName(msg, tagName, element) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var actual = args[2] && args[2].tagName;

  if (String(actual).toUpperCase() != args[1].toUpperCase()) {
    fail(args[0] + 'expected tagName to be ' + args[1] + ' but was ' + actual);
  }
  return true;
}


function assertClassName(msg, className, element) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var actual = args[2] && args[2].className;
  var regexp = new RegExp('(^|\\s)' + args[1] + '(\\s|$)');

  try {
    assertMatch(args[0], regexp, actual);
  } catch (e) {
    actual = prettyPrintEntity_(actual);
    fail(args[0] + 'expected class name to include ' +
        prettyPrintEntity_(args[1]) + ' but was ' + actual);
  }

  return true;
}


function assertElementId(msg, id, element) {
  var args = argsWithOptionalMsg_(arguments, 3);
  var actual = args[2] && args[2].id;
  jstestdriver.assertCount++;

  if (actual !== args[1]) {
    fail(args[0] + 'expected id to be ' + args[1] + ' but was ' + actual);
  }

  return true;
}


function assertInstanceOf(msg, constructor, actual) {
  jstestdriver.assertCount++;
  var args = argsWithOptionalMsg_(arguments, 3);
  var pretty = prettyPrintEntity_(args[2]);
  var expected = args[1] && args[1].name || args[1];

  if (args[2] == null) {
    fail(args[0] + 'expected ' + pretty + ' to be instance of ' + expected);
  }

  if (!(Object(args[2]) instanceof args[1])) {
    fail(args[0] + 'expected ' + pretty + ' to be instance of ' + expected);
  }

  return true;
}


function assertNotInstanceOf(msg, constructor, actual) {
  var args = argsWithOptionalMsg_(arguments, 3);
  jstestdriver.assertCount++;

  if (Object(args[2]) instanceof args[1]) {
    var expected = args[1] && args[1].name || args[1];
    var pretty = prettyPrintEntity_(args[2]);
    fail(args[0] + 'expected ' + pretty + ' not to be instance of ' + expected);
  }

  return true;
}

/**
 * Asserts that two doubles, or the elements of two arrays of doubles,
 * are equal to within a positive delta.
 */
function assertEqualsDelta(msg, expected, actual, epsilon) {
  var args = this.argsWithOptionalMsg_(arguments, 4);
  jstestdriver.assertCount++;
  msg = args[0];
  expected = args[1];
  actual = args[2];
  epsilon = args[3];

  if (!compareDelta_(expected, actual, epsilon)) {
    this.fail(msg + 'expected ' + epsilon + ' within ' +
              this.prettyPrintEntity_(expected) +
              ' but was ' + this.prettyPrintEntity_(actual) + '');
  }
  return true;
};

function compareDelta_(expected, actual, epsilon) {
  var compareDouble = function(e,a,d) {
    return Math.abs(e - a) <= d;
  }
  if (expected === actual) {
    return true;
  }

  if (typeof expected == "number" ||
      typeof actual == "number" ||
      !expected || !actual) {
    return compareDouble(expected, actual, epsilon);
  }

  if (isElement_(expected) || isElement_(actual)) {
    return false;
  }

  var key = null;
  var actualLength   = 0;
  var expectedLength = 0;

  try {
    // If an array is expected the length of actual should be simple to
    // determine. If it is not it is undefined.
    if (jstestdriver.jQuery.isArray(actual)) {
      actualLength = actual.length;
    } else {
      // In case it is an object it is a little bit more complicated to
      // get the length.
      for (key in actual) {
        if (actual.hasOwnProperty(key)) {
          ++actualLength;
        }
      }
    }

    // Arguments object
    if (actualLength == 0 && typeof actual.length == "number") {
      actualLength = actual.length;

      for (var i = 0, l = actualLength; i < l; i++) {
        if (!(i in actual)) {
          actualLength = 0;
          break;
        }
      }
    }

    for (key in expected) {
      if (expected.hasOwnProperty(key)) {
        if (!compareDelta_(expected[key], actual[key], epsilon)) {
          return false;
        }

        ++expectedLength;
      }
    }

    if (expectedLength != actualLength) {
      return false;
    }

    return expectedLength == 0 ? expected.toString() == actual.toString() : true;
  } catch (e) {
    return false;
  }
};

var assert = assertTrue;

/*
 * 对 谷歌 assert的扩充， 适合于 jsTestDriver
 * 可以比较任意的对象，数组对象， 等等
 * */
// 比较任意的对象，
function assertEqualsObject(msg, expected, actual) {
    var v1 = prettyPrintEntity_(expected);
    var v2 = prettyPrintEntity_(actual);
    return assertEquals(msg, v1, v2);
}

function assertNotEqualsObject(msg, expected, actual) {
    var v1 = prettyPrintEntity_(expected);
    var v2 = prettyPrintEntity_(actual);
    return assertNotEquals(msg, v1, v2);
}

function assertEqualsMatrix(msg, expected, actual) {
    var v1 = prettyPrintEntity_(expected.multiply(100));  // 放大100倍，否则精度不够，不相等
    var v2 = prettyPrintEntity_(actual.multiply(100));
    return assertEquals(msg, v1, v2);
}

function assertNotEqualsMatrix(msg, expected, actual) {
    var v1 = prettyPrintEntity_(expected.multiply(100));  // 放大100倍，否则精度不够，不相等
    var v2 = prettyPrintEntity_(actual.multiply(100));
    return assertNotEquals(msg, v1, v2);
}

function assertNotHere(msg) {
    return assertTrue(TQ.Dictionary.INVALID_LOGIC + ", " + msg, false);
}

function assertValid(msg, obj)
{
    assertNotUndefined(TQ.Dictionary.FoundNull + ": " + msg, obj);
    assertNotNull(msg +"null", obj);
}

function assertDepreciated(msg)
{
    assertTrue(msg, false);
}
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Math库的扩充
 */

window.TQ = window.TQ || {};

(function MathExt() {
    function MathExt() {

    }

    MathExt.range = function(v, vmin, vmax) {
        if (v <= vmin) return vmin;
        if (v >= vmax) return vmax;
        return v;
    };

    // 把1-10的规范数字映射到[vmin,vmax]区间，
    MathExt.unifyValue10 = function(v, vmin, vmax) {
        var result = (vmin + v * (vmax-vmin)/10);
        result = MathExt.range(result, vmin, vmax);
        return result;
    };


    MathExt.minZIndex = function (upperEle, ele, z) {
        if ((!ele) || (!ele.hasFlag(TQ.Element.IN_STAGE))) return upperEle;
        if (ele.jsonObj.zIndex >= z) {
            if (!upperEle) {
                upperEle = ele;
            } else if (upperEle.jsonObj.zIndex >= ele.jsonObj.zIndex) {
                upperEle = ele;
            }
        }

        return upperEle;
    };

    MathExt.findUpperBoundary = function (elements, z) {
        var upperEle = null;
        var ele = null;
        for (var i = 0; i < elements.length; i++) {
            ele = elements[i];
            upperEle = MathExt.minZIndex(upperEle, ele, z);
            if (ele.children && (ele.children.length > 0)) {
                var temp = MathExt.findUpperBoundary(ele.children, z);
                upperEle = MathExt.minZIndex(upperEle, temp, z);
            }
        }
        return upperEle;
    };

    /*
    去小数点后面3位有效数字
     */
    MathExt.round2 = function(f) {
        return Math.round(f*100)/100;
    }

    MathExt.DEG_TO_RAD = Math.PI/180;
    MathExt.RAD_TO_DEG = 180/Math.PI;
    TQ.MathExt = MathExt;
}) ();
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    // 这个构造函数， 应该很少被外面直接调用， 因为是其中的值是没有初始化的。
    //  替代地， 应该用create函数, 直接构造有变换的矩阵
    function Vector2D() {
    }

    var p = Vector2D.prototype = $V([  1,  0]);

    Vector2D.create = function(elements) {
        var M = new Vector2D();
        return M.setElements(elements);
    };

    p.angle360 = function() {
        assertFalse("vector  not 0", ((this.elements[0] == 0) && (this.elements[1] == 0)));

        var angle = this.angleFrom($V([1, 0])) * TQ.MathExt.RAD_TO_DEG;

        var x = this.elements[0];
        var y = this.elements[1];

        if (y >0) {
            return angle;
        } else if (y < 0) {
            return (360 - angle);
        }
        else {
            if (x > 0 ) {
                return angle;
            } else if (x < 0) {
                return 180;
            }
            assertTrue("vector is 0, has no angle", false);
            return 0; // 即使有错, 也应该返回一个值, 不能悬空; 要纠错,尽可能让程序可以执行.
        }
    };

    p.signFrom = function(vFrom) {
      var A = $V([vFrom.elements[0], vFrom.elements[1], 0])
      var B = $V([this.elements[0], this.elements[1], 0]);
      var normal = A.cross(B);
      var z = normal.elements[2];
      // sign
      return (z > 0) ? 1 : -1;
    };

    p.angle360From = function(vFrom) {
      // 扩充： 原库是用acos计算角度， 所以， 在[0,180)范围取值。没有负值。i.e. 只管角度的大小，不管方向。
      // 这里用 方向来扩充到 （-180， 180）
      return this.signFrom(vFrom) * TQ.MathExt.RAD_TO_DEG * this.angleFrom(vFrom);
    };

    TQ.Vector2D = Vector2D;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    // 这个构造函数， 应该很少被外面直接调用， 因为是其中的值是没有初始化的。
    //  替代地， 应该用create函数, 直接构造有变换的矩阵
    function Matrix2D() {
    }

    var p = Matrix2D.prototype = $M(
        [  1,  0,  0 ],
        [  0,  1,  0 ],
        [  0,  0,  1 ]);
    Matrix2D.DEG_TO_RAD = Math.PI/180;
    Matrix2D.create = function(elements) {
        var M = new Matrix2D();
        return M.setElements(elements);
    };

    // 主要函数及其用法：
    //   矩阵相乘， M3 = M1.multiply(M2);
    //   坐标变换： v3  = M1.multiply(v1);
    //   设置参数： 转动thita角的矩阵：  M =Sylvester.Matrix.rotateZ(thita);
    Matrix2D.I = function() {
        return Matrix2D.create([
            [  1,  0,  0 ],
            [  0,  1,  0 ],
            [  0,  0,  1 ]
        ]);
    };

    Matrix2D.translation = function(tx, ty) {
        return Matrix2D.create([
            [  1,  0,  tx ],
            [  0,  1,  ty ],
            [  0,  0,  1 ]
        ]);
    };

    Matrix2D.scale = function(sx, sy) {
        return Matrix2D.create([
            [  sx,  0,  0 ],
            [  0,  sy,  0 ],
            [  0,   0,  1 ]
        ]);
    };

    Matrix2D.rotation = function(thita) {
        var radian = (thita == null) ? 0: (thita * Matrix2D.DEG_TO_RAD);
        var c = Math.cos(radian), s = Math.sin(radian);
        return Matrix2D.create([
            [  c, -s,  0 ],
            [  s,  c,  0 ],
            [  0,  0,  1 ]
        ]);
    };

    Matrix2D.transformation = function(tx, ty, thita, sx, sy) {
        // 这个复合矩阵是按照先比例，再旋转， 最后再平移的顺序推导出来的。 顺序不能变
        // M = Mt * Mr * Ms
        // 理论： 在显示物体的时候， 先把物体在物体坐标系里面缩放，再旋转，最后再平移到世界坐标系里面。
        tx = (tx == null) ? 0: tx;
        ty = (ty == null) ? 0: ty;
        sx = (sx == null) ? 1: sx;
        sy = (sy == null) ? 1: sy;
        var radian = (thita == null) ? 0: (thita * Matrix2D.DEG_TO_RAD);
        var c = Math.cos(radian), s = Math.sin(radian);
        return Matrix2D.create([
            [  c*sx, -s*sy,  tx ],
            [  s*sx,  c*sy,  ty ],
            [  0,     0,      1 ]
        ]);
    };

    TQ.Matrix2D = Matrix2D;
}());

/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-13 下午7:16
 */
window.TQ = window.TQ || {};

(function () {

    function Utility () {

    }

    Utility.toCssFont = function(size, face) {
      return (size + "px " + face);
    };

    // 从text的HTML字串中获取tag标签中 attr属性的值
    Utility.extractAttr = function (tag, attr, str, defaultValue) {
      var reg1 =new RegExp("<" + tag + "[^<>]*?\\s" + attr + "=['\"]?(.*?)['\"]?\\s.*?>(.*?)</" +tag +">");
      var reg2 =new RegExp("<" + tag + "[^<>]*?\\s" + attr + "=['\"]?(.*?)['\"]>(.*?)</" +tag +">");
      try {
        var values = reg1.exec(str);
        if (values != null) {
          var result = null;
          if (values.length >= 2) result = values[1];
        }

        if ((result == null) || (result == "")) {
          values = reg2.exec(str);
          if (values != null) {
            result = ( (values.length >= 2) ? values[1] : defaultValue);
          } else {
            result = defaultValue;
          }
        }
      } catch (e)
      {
      }
      return result;
    };

    // 从text的HTML字串中获取tag标签的值
    Utility.extractTag = function (tag, str, defaultValue) {
      var reg =new RegExp("<" + tag + "[^<>]*?>(.*?)</" + tag +">");
      try {
        var values = reg.exec(str);
        if (values != null) {
          return ( (values.length >= 2) ? values[1] : defaultValue);
        }
      } catch (e)
      {
      }
      return defaultValue;
    };

    Utility.forceExt = function (str) {
        if  (str.indexOf('.') > 0) {
            str =  (str.substr(0, str.indexOf('.')) + TQ.Config.EXTENSION);
        } else {
            str =  (str + TQ.Config.EXTENSION);
        }
        return str;
    };

    Utility.getAudioByThumbnail = function(soundSrc) {
        //ToDo：去除src开头的"."
        soundSrc = soundSrc.replace("./", "/");
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, soundSrc.lastIndexOf("\\") <=0 ); // 没有DOS路径符号\\
        var shortName = soundSrc.replace("http://" + TQ.Config.DOMAIN_NAME + "/","");
        return "http://"+ TQ.Config.DOMAIN_NAME+"/"+shortName;
    };

    Utility.getImageByThumbnail = function(thumbnail) {
        var pathToOriginalImg = "mcImages/";
        var pathToThumbnail = "mcThumbs/";
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, thumbnail.lastIndexOf("\\") <=0 ); // 没有DOS路径符号\\
        thumbnail = thumbnail.replace("http://" + TQ.Config.DOMAIN_NAME,"");
        return thumbnail.replace(pathToThumbnail,pathToOriginalImg);
    };

    Utility.getComponentByThumbnail = function(thumbnail) {
        var pathToThumbnail = "mcThumbs/";
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, thumbnail.lastIndexOf("\\") <=0 ); // 没有DOS路径符号\\
        thumbnail = thumbnail.replace("http://" + TQ.Config.DOMAIN_NAME,"");
        var pos = thumbnail.indexOf(pathToThumbnail) + pathToThumbnail.length;
        var newName = thumbnail.substr(pos);
        var end = newName.lastIndexOf('.');
        if (end <= 0) { // 防止它本身没有带后缀
            end = newName.length;
        }
        return newName.substring(0, end) + TQ.Config.EXTENSION;
    };

    Utility.getSceneByThumbnail = function(thumbnail) {
      return Utility.getComponentByThumbnail(thumbnail);
    };

    Utility.isComponent = function() {
        return ($("#tab_right_panel").tabs( "option", "active" ) == 1 );
    };
    
    Utility.isScene = function() { return ($("#tab_right_panel").tabs( "option", "active" ) == 0 );};
    Utility.getEmptyScene = function () {
      return {"levels":[{"jsonElements":null, "FPS":20, "elements":null, "name":"0"}],
        "overlay":null, "currentLevelId":0, "currentLevel":null};
    };

    // @@ToDo: 显示表达式的字串， 和 文件的行号，
    Utility.assertValid = function(obj)
    {
        assertNotUndefined(TQ.Dictionary.FoundNull, obj);
        assertNotNull(TQ.Dictionary.FoundNull, obj);
    };

    // adm: animation for dong man 超市
    Utility.isAnimationDesc = function (url) {
        return (url.lastIndexOf(".adm") > 0 );
    };

    Utility.isSoundResource = function (url) {
      var soundExtension = [".wav", ".mp3", ".ogg"];
      for (var i=0; i<soundExtension.length; i++) {
        if (url.lastIndexOf(soundExtension[i]) > 0) return true;
      }
      return false;
    };

    Utility.isImage = function (url) {
        var str = url.toLowerCase();
        var formats = [".png", ".jpg", ".bmp", ".gif"];
        for (var i = 0; i < formats.length; i++) {
            if ((str.lastIndexOf(formats[i]) >0 ) ) {
                return true;
            }
        }
        return false;
    };

    Utility.isJSON = function (desc) {
        if (!((desc == undefined) || (desc == null))) {
            if (! ((desc.type == undefined) || (desc.type == null))) {
                return true;
            } else if (! ((desc.src == undefined) || (desc.src == null))) {
                return true;
            }
        }
        return false;
    };

    Utility.deltaYinWorld = function(target, offset, event)
    {
      var deltaYinDevice = (event.stageY + offset.y)  - target.y;
      return -deltaYinDevice; // 转到世界坐标系空间。
    };

    Utility.deviceToWorld = function (xDevice, yDevice)
    {
      return {x: xDevice, y: Utility.toWorldCoord(yDevice)};
    };

    Utility.worldToDevioce = function (xWorld, yWorld)
    {
      return {x: xWorld, y: Utility.toDeviceCoord(yWorld)};
    };

    Utility.toDeviceCoord = function(worldY)
    {
        return TQ.Config.workingRegionHeight - worldY;
    };

    Utility.toDeviceRotation = function(worldRotation)
    {
        return - worldRotation;
    };

    Utility.toWorldCoord = function(deviceY)
    {
        return TQ.Config.workingRegionHeight - deviceY;
    };

    Utility.canvas2WindowX = function(x)
    {
        return window.canvas.offsetLeft + x;
    };

    Utility.canvas2WindowY = function(y)
    {
        return window.canvas.offsetTop + y;
    };

    Utility.toDevicePivot = function(pivotY)
        // 用户坐标系下（左下角为0,0）的Pivot定义，转为Device坐标系（top, left) 下的pivot 定义
    {
        return 1- pivotY;
    };

    Utility.readLocalStorage = function (varName, defaultValue) {
        var realValue = localStorage.getItem(varName);
        if ((realValue == "") ||  // Firefox, 没有找到， 就返回"",
            (realValue == "null") ) { // Chrome, 没有找到， 就返回"null",
            realValue = defaultValue;
        }

        return realValue;
    };

    Utility.writeLocalStorage = function (varName, value) {
        return localStorage.setItem(varName, value);
    };

    Utility.getUrlParam = function(param) {
        var request = {
            QueryString : function(val) {
                var uri = window.location.search;
                var re = new RegExp("" + val + "=([^&?]*)", "ig");
                try {
                    var value = ((uri.match(re)) ? (decodeURIComponent(uri.match(re)[0]
                        .substr(val.length + 1))) : '');
                } catch (e) {
                    TQ.Log.criticalError("Error in URL Parameter:" + uri +":" + e.toString());
                    value = "";
                }
                return value;
            }
        };
        return request.QueryString(param);
    };

    Utility.getUserID = function () {
        var userID=TQ.Init.uid;
        if (userID == "") {
            var userID2 = Utility.readLocalStorage("userID", "");
            if (userID2 != "") {
                userID = userID2;
            } else {
                userID = TQ.Config.DefaultUserID; // 系统用户
            }
        } else {
            localStorage.setItem("userID", userID);
        }
        return userID;
    };
    Utility.DEV_PC = 0x0001;
    Utility.DEV_PAD = 0x0002;
    Utility.DEV_MOBILE = 0x0004;

    Utility.OS_ANDROID = 0x0010;
    Utility.OS_IPHONE = 0x0020;
    Utility.OS_WINDOWS = 0x0040;
    Utility.OS_MAC = 0x0080;
    Utility.BR_FIREFOX = 0x00100;
    Utility.BR_CHROME = 0x00200;
    Utility.BR_SAFARI = 0x00400;
    Utility.env = 0;
    Utility.setEnv = function (flag) { Utility.env |= flag; };
    Utility.clearEnv = function (flag) { Utility.env &= ~flag; };
    Utility.hasEnv = function (flag) { return Utility.env & flag; };

    Utility.isSupportedEnvironment = function () {
        var getBrowserInfo = ("" != TQ.Utility.getUrlParam("B")); // &B=0;
        var supported = false;
        if (getBrowserInfo) {
            alert(navigator.userAgent);
        }

        if (navigator.userAgent.match(/(Android)/i)) {
            Utility.setEnv(Utility.DEV_MOBILE);
            Utility.setEnv(Utility.OS_ANDROID);
        } else {
            Utility.setEnv(Utility.DEV_PC);
            Utility.setEnv(Utility.OS_WINDOWS);
        }

        if (navigator.userAgent.indexOf("Chrome") > 0) {
            Utility.setEnv(Utility.BR_CHROME);
            supported = true;
        } else if (navigator.userAgent.indexOf("Firefox") > 0) {
            Utility.setEnv(Utility.BR_FIREFOX);
            supported = true;
        } else if (navigator.userAgent.indexOf("Safari") > 0) {
            Utility.setEnv(Utility.BR_SAFARI);
            supported = true;
        }

        if (!supported) {
            if (Utility.hasEnv(Utility.DEV_PC)) {
                window.location="ShowBrowsers.php";
            } else {
                window.location="MobileBrowsers.php";
            }
        }

        return supported;
    };

    Utility.CheckUserRight = function() {
        var userID = Utility.getUserID();
        // ToDo: 使用数据库
        if ((userID == 10000) ||(userID == 10001) || (userID == 10011) || (userID == 10012)) {
          //  $("#tbDelete").button("enable");
        }
    };

    // Utility2:  使用了全局变量
    Utility.getMaxZ = function() {
        // 踩实在
        assertNotNull(currScene, TQ.Dictionary.FoundNull);
        assertNotNull(currScene.currentLevel, TQ.Dictionary.FoundNull);
        if ((!currScene) || (!currScene.currentLevel)) return 0;
        currScene.currentLevel.persist();
        return stage.getNumChildren();
    };

    /*
    touch事件处理
     */
    Utility.isTouchEvent = function(e) {
        var e0 = e.nativeEvent;
        return ((e0.touches != null) && (e0.changedTouches != null));
    };

    Utility.isMultiTouchEvent = function(e) {
        return (Utility.isTouchEvent(e) && (e.nativeEvent.touches.length >=2));
    };

    var __isTouchDevice = -1;
    Utility.isTouchScreen = function() {
        if (__isTouchDevice == -1) {
            var deviceAgent = navigator.userAgent.toLowerCase();
            __isTouchDevice = Modernizr.touch ||
                (deviceAgent.match(/(iphone|ipod|ipad)/) ||
                    deviceAgent.match(/(android)/)  ||
                    deviceAgent.match(/(iemobile)/) ||
                    deviceAgent.match(/iphone/i) ||
                    deviceAgent.match(/ipad/i) ||
                    deviceAgent.match(/ipod/i) ||
                    deviceAgent.match(/blackberry/i) ||
                    deviceAgent.match(/bada/i));
        }

        return __isTouchDevice;
    };


    Utility.getOffsetTop = function (item) {
        if (item.offsetParent)  {
            return item.offsetTop + Utility.getOffsetTop(item.offsetParent);
        }
        return item.offsetTop;
    };

    Utility.getOffsetLeft = function (item) {
        if (item.offsetParent)  {
            return item.offsetLeft + Utility.getOffsetLeft(item.offsetParent);
        }
        return item.offsetLeft;
    };

    Utility.getDefultActionIcon = function() {
        var DEFAULT_ACTION_ICON = 100; // ToDo： 修改此值，根据实际缺省ICON的ID
        return DEFAULT_ACTION_ICON;
    };

    TQ.Utility = Utility;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

//存放全局的API， 需要在所有模块都调入之后， 才能够执行， 否则没有函数。
(function () {
    function TouchMgr() {
    }
    var __debugOn = false;
    var __useTouchMgr = false;
    TouchMgr.initialize = function() {
        if (__useTouchMgr) {
            /*单指拖动*/
            var obj = document.getElementById('touchPic');
            // TouchMgr.addTouchHandler(obj);
            TouchMgr.addTouchHandler(document);
        }
    };

    TouchMgr.addTouchHandler = function (obj) {
        if (obj != null) {
            obj.addEventListener("touchstart", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("touchend", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("touchmove", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("touchcancel", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("gesturestart", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("gestureend", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("gesturechange", TouchMgr.handleTouchEvent, false);
            obj.addEventListener("onscroll", TouchMgr.handleTouchEvent, false);
        }
    }

    TouchMgr.handleTouchEvent = function (ev) {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, ev.touches);
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, ev.changedTouches);
        //只跟踪一次触摸
        var numTouches = ev.touches.length,
            numChanges = ev.changedTouches.length;

        var output = document.getElementById("testLabelInfo");
        var xx = 0, yy = 0, xChanged = 0, yChanged = 0;
        var paras = ev.type + ":" + numTouches + "," + numChanges;
        if (ev.scale != null) {
            paras += ", " + TQ.MathExt.round2(ev.scale);
        } else {
            paras += ", " + 0;
        }

        if (ev.rotation != null) {
            paras += ", " + TQ.MathExt.round2(ev.rotation);
        } else {
            paras += ", " + 0;
        }
        var num = Math.max(numTouches, numChanges);
        for (var i=0; i < num; i++)
        {
            xx = 0, yy = 0, xChanged = 0, yChanged = 0;
            if (numTouches > i) {
                xx = ev.touches[i].clientX;
                yy = ev.touches[i].clientY;
            }

            if (numChanges > i) {
                xChanged = ev.changedTouches[i].clientX;
                yChanged = ev.changedTouches[i].clientY;
            }
            paras += ",(" + xx + "," + yy + ") (" + xChanged + ", " + yChanged + ")";
        }

        if ((numTouches >= 1) || (numChanges >= 1)) {
            switch (ev.type) {
                case "touchstart":
                    // ev.preventDefault(); // 不能阻止， 否则菜单操作不了
                    paras = "<br><br>Touch started: " + paras;
                    break;
                case "touchend":
                    // ev.preventDefault(); // 不能阻止， 否则菜单操作不了
                    paras = "<br>Touch ended: " + paras;
                    break;
                case "touchmove":
                    ev.preventDefault(); //阻止滚动, 必须的
                    paras = "<br>Touch moved :" + paras;
                    break;
                case "touchcancel":
                    ev.preventDefault(); //阻止滚动
                    paras = "<br>Touch cancel: " + paras;
                    break;

                case "gesturestart":
                    ev.preventDefault();
                    paras = "<br><br>Gesture started :" + paras;
                    break;
                case "gestureend":
                    ev.preventDefault();
                    paras = "<br>Gesture ended : " + paras;
                    break;

                case "gesturechange":
                    ev.preventDefault();
                    paras = "<br>Gesture changed :" + paras;
                    break;

                case "onscroll":
                    ev.preventDefault();
                    paras = "<br>onscroll :" + paras;
                    break;
                default:
                    paras = "<br>unknown event : " + paras;
            }

        } else {
            paras = "<br>有事件， 但是touches为空)：" + paras;
        }

        if (__debugOn) {
            if (output != null) {
                output.innerHTML += paras;
            } else {
                console.log(paras);
            }
        }
    };

    TQ.TouchMgr = TouchMgr;
}());

TQ = TQ || {};
(function () {

    /***
     * 通用的事件处理机制， 可以添加任意事件的处理函数， 可以附加到任何class上，使其立即具有事件处理能力
     * @constructor
     */
    function EventHandler() {
    }
    var p = EventHandler.prototype;
    
    EventHandler.initialize = function(target) {
        target.addHandler = p.addHandler;
        target.removeHandler = p.removeHandler;
        target.removeAllHandlers = p.removeAllHandlers;
        target.hasHandler = p.hasHandler;
        target.handleEvent = p.handleEvent;
    };

// constructor:

    p._handlers = null;
    p._captureHandlers = null;
    p.initialize = function() {};

// public methods:
    p.handleEvent = function(eventName) {
        if (!this._handlers) return;
        var arr = this._handlers[eventName];
        if (arr) {
            for (var i = 0, num = arr.length; i < num; i++) {
               var fn1 = arr[i];
                if (fn1) fn1();
            }
        }
    };

    p.addHandler = function(type, handler, useCapture) {
        var handlers;
        if (useCapture) {
            handlers = this._captureHandlers = this._captureHandlers||{};
        } else {
            handlers = this._handlers = this._handlers||{};
        }
        var arr = handlers[type];
        if (arr) { this.removeHandler(type, handler, useCapture); } // 确保同一个函数，对每一个事件都不能重复使用。
        arr = handlers[type]; // remove may have deleted the array
        if (!arr) { handlers[type] = [handler];  }
        else { arr.push(handler); }
        return handler;
    };

    p.removeHandler = function(type, handler, useCapture) {
        var handlers = useCapture ? this._captureHandlers : this._handlers;
        if (!handlers) { return; }
        var arr = handlers[type];
        if (!arr) { return; }
        for (var i=0,l=arr.length; i<l; i++) {
            if (arr[i] == handler) {
                if (l==1) { delete(handlers[type]); } // allows for faster checks.
                else { arr.splice(i,1); }
                break;
            }
        }
    };

    p.removeAllHandlers = function(type) {
        if (!type) { this._handlers = this._captureHandlers = null; }
        else {
            if (this._handlers) { delete(this._handlers[type]); }
            if (this._captureHandlers) { delete(this._captureHandlers[type]); }
        }
    };

    p.hasHandler = function(type) {
        var handlers = this._handlers, captureListeners = this._captureHandlers;
        return !!((handlers && handlers[type]) || (captureListeners && captureListeners[type]));
    };



    TQ.EventHandler = EventHandler;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
this.TQ = this.TQ || {};

(function () {
    // ToDo: RM内部只保存相对路径， 外部使用全路径。
    //      内部全部使用fullPath， 只有在保存文件的时候， 才使用相对路径， 既便于移植到不同的环节， 又能够唯一化代码
    // ToDo: 避免重复加入到Queue中，在addItem的时候， 如果已经在Queue中， 也不要加入，只处理其callback，
    // ToDo: 处理错误， 如果文件不存在， 则用"NoSound.wav" 或者“NoRes.png" 来替代。并执行其callback
    // ToDo: 加引用次数, 在内存不足的时候， 释放没有引用的资源
    // 资源管理器设计目标：
    //  * 预先加载资源，画面更流程，
    //  * 唯一化ID，避免重复加载:
    //  ** 一个资源，只加载1次，多次使用，在多个位置，多个角度
    //  ** 已经加载的资源， 用ID获取内容， 直接使用；
    //  ** 未加载的资源， 支持一对一的回调
    //  * 第一个Level加载完成之后， 马上开始播放该level， 同时， 继续加载后续的Level
    //  ** 如果当前Level加载没有完成， 则显示等待画面；
    //
    // 结构设计：
    // 1）level的资源， 及其回调函数（设置：dataReady）
    // 2）逐个加载每一个level，并且调用其回调函数，
    //
    // 已知的问题：
    //  1) preloadJS中的XHLLoader 会两次通过network加载同一资源， 只是第二次总是从cache中获取（从谷歌调试的network页面中看到）。
    //
    //

    function ResourceManager() {
    }

    var RM = ResourceManager;
    RM.NOSOUND = "/mcSounds/p1.wav";
    RM.NOPIC = "/mcImages/p1.png";
    RM.BASE_PATH = null;
    RM.isEmpty = true;
    RM.items = [];
    RM.preloader = {};
    RM.callbackList = [];
    RM.dataReady = false;
    RM.completeOnceHandlers = [];
    RM.initialize = function() {
        if (!!RM._hasCreated) { // 确保只创建一次
            return;
        }

        RM._hasCreated = true;
        RM.hasDefaultResource = false;
        RM.BASE_PATH = "http://" + TQ.Config.DOMAIN_NAME;
        RM.NOPIC = RM.toFullPath(RM.NOPIC);
        RM.NOSOUND = RM.toFullPath(RM.NOSOUND);
        createjs.FlashPlugin.swfPath = "../src/soundjs/"; // Initialize the base path from this document to the Flash Plugin
        if (createjs.Sound.BrowserDetect.isChrome ||  // Chrome, Safari, IOS移动版 都支持MP3
            createjs.Sound.BrowserDetect.isIOS) {
            createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);
        } else { // Firefox只在vista以上OS中支持MP3，且自动加载MP3尚未实现， 所以用flash
            createjs.Sound.registerPlugins([createjs.WebAudioPlugin, createjs.HTMLAudioPlugin, createjs.FlashPlugin]);

//            createjs.Sound.registerPlugins([createjs.FlashPlugin, createjs.WebAudioPlugin, createjs.HTMLAudioPlugin]); // need this so it doesn't default to Web Audio
            // 在Firefox下， 如果只加Flash声音， 则 无法预先加载WAV
        }

		// Instantiate a queue.
        RM.preloader = new createjs.LoadQueue(true); // , "assets/");
        RM.preloader.installPlugin(createjs.Sound);
        RM.setupListeners();
    };

    RM.setupDefaultResource = function() {
        RM.hasDefaultResource = true;
        RM.addItem(RM.NOPIC);
        RM.addItem(RM.NOSOUND);
    };

    RM.setupListeners = function() {
        //Available PreloadJS callbacks
        RM.preloader.on("fileload", function(event) {
            var resID = event.item.id;
            var result = event.result;
            //ToDo: 唯一化断言
            RM.items[resID] = { ID: resID, res:result, type:event.item.type};
            console.log(event.toString() +": " + event.item.id);
            RM.onFileLoad(resID, result, event);
        });

        RM.preloader.addEventListener("complete",  function(event) {
            console.log(event.toString());
            RM.dataReady = true;
            var num = RM.completeOnceHandlers.length; // 防止动态添加的函数
            for (; num > 0; num --) {
                var handler = RM.completeOnceHandlers.shift();
                handler(event);
            }
            RM.isEmpty = true;
        });

        RM.preloader.addEventListener("error",  function(event) {
            console.log(event.item.src + ": " + event.toString() );
            var resID = event.item.id;
            var result = null;
            var altResID = null;

            switch (event.item.type) {
                case createjs.LoadQueue.IMAGE:
                    altResID = RM.toFullPath(RM.NOPIC);
                    break;

                case createjs.LoadQueue.SOUND:
                    altResID = RM.toFullPath(RM.NOSOUND);
                    break;

                case createjs.LoadQueue.TEXT: // 元件的文件
                    break;

                default :
                    console.log(event.item.type +": 未处理的资源类型!");
            }

            if ((altResID != null) && (!!RM.items[altResID])) {
                result = RM.items[altResID].res;
            } else {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            }

            RM.items[resID] = { ID: resID, res:result, type:event.item.type};
            if (result == null) {
                RM.addItem(altResID, function() {
                    RM.items[resID].res = RM.items[altResID].res;
                    RM.items[resID].altResID = RM.items[altResID].ID;
                });

                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            } else {
                RM.items[resID].altResID = RM.items[altResID].ID;
                RM.onFileLoad(resID, result, null);
            }
        });

        RM.preloader.addEventListener("progress",  function(event) {
            // console.log("." + event.toString() + ": " + event.loaded);
        });
        RM.dataReady = false;
    };

    RM.onFileLoad = function(resID, result, event) {
        //check for callback
        for (var i = 0; i < RM.callbackList.length; i++) {
            if (RM.callbackList[i].ID == resID) {
                console.log("find immediate call back to do");
                var item = RM.callbackList.splice(i, 1);
                item[0].func(event);
                i--;
            }
        }
    };

    RM.getID = function(item) {
        if (!item.altResID) {
            return item.ID;
        } else {
            return item.altResID;
        }
    };

    // 清除所有的资源，准备开始新的微创意
    RM.reset = function() {
        RM.completeOnceHandlers.splice(0);
        RM.preloader.removeAllEventListeners();
        RM.preloader.reset();
        RM.preloader.removeAll();
        RM.setupListeners();
        RM.isEmpry = true;
    };

    // 信号：暂停预加载，以便于处理时间敏感的判定， 必须是短时间
    RM.setPaused = function(value)
    {
        RM.preloader.setPaused(value);
    };

    // 完成加载的顺序与开始加载顺序无关。 最先开始加载的资源， 如果很大，最后才加载完成。 如果后开始加载的资源下。
    // 只有遍历
    RM.on = function(eventName, callback) {
        RM.preloader.addEventListener(eventName,  callback);
    };

    RM.onCompleteOnce = function(callback) {
        RM.completeOnceHandlers.push(callback);
    };

    RM.removeEventListener = function(eventName, callback) {
        RM.preloader.removeEventListener(eventName,  callback);
    };

    RM.addItem = function(resourceID, _callback) {
        if (!RM.hasDefaultResource) {
            RM.setupDefaultResource();
        }
        resourceID = RM.toFullPath(resourceID);
        if (this.hasResource(resourceID)) return;
        // 添加Item 到预加载队列中， 并启动运行预加载（如果没有运行的话）

        if (!!_callback) {
            RM.callbackList.push({ID:resourceID, func:_callback});
        }

        // RM.preloader.loadFile("assets/image0.jpg");
        RM.dataReady = false;
         RM.preloader.loadManifest([{
            src : resourceID,
            id : resourceID,   // Sound资源的id是字符串, 不是数字
            data : 3  // 本资源最大允许同时播放N=3个instance。（主要是针对声音）
        }]);

        RM.isEmpty = false;
    };

    /*
     如果成功地送到RM， 则返回true；对于有多个资源的情况，只有送入1个就返回true。
     如果没有送入RM， （比如:RM中已经有了）， 则 返回false
     */
    RM.addElementDesc = function(desc, callback) {
        if (!desc) return false;

        var result  = false;
        if (!!desc.children) {  // 先调入子孙的资源， 以便于执行callback
            for (var i = 0; i < desc.children.length; i++) {
                if (RM.addElementDesc(desc.children[i])) {
                    result = true;
                }
            }
        }

        //
        if (desc.type === "Group") {
            return result;
        }

        if (!!desc.src) {  // 处理自己的资源
            var resName = RM.toRelative(desc.src);
            resName.trim();
            if (resName.length > 0) {
                if (!RM.hasResource(resName)) {
                    RM.addItem(resName, callback);
                    result = true;
                } else if (!!callback) {
                    callback();
                }
            }
        }

        return result;
    };

    /*
     只要差一个资源未调入RM， 都必须返回false，
     */
    RM.hasElementDesc = function(desc) {
        if (!desc) return true;
        var result = true;

        if (!!desc.children) {  // 先调入子孙的资源， 以便于执行callback
            for (var i = 0; i < desc.children.length; i++) {
                if (RM.addElementDesc(desc.children[i])) {
                    result = false;
                }
            }
        }

        if (!!desc.src) {  // 处理自己的资源
            var resName = RM.toRelative(desc.src);
            resName.trim();
            if (resName.length > 0) {
                if (!RM.hasResource(resName)) result = false;
            }
        }

        return result;
    };

    RM.hasResource = function(id) {
        return !(!RM.items[RM.toFullPath(id)]);
    };

    RM.getResource = function(id) {
        id = RM.toFullPath(id);
        if (!RM.items[id]) {// 没有发现， 需要调入
            console.log(id + ": 没有此资源, 需要加载, 如果需要回调函数，用 addItem 替代 getResource");
            // 添加到预加载列表中
            // 设置回调函数
            return null;
        }

        return RM.items[id];
    };

    var stage;
    var canvas;

    var bar;
    var loaderWidth = 300;

    // bar
    function barInitialize() {

        var x0 = canvas.width - loaderWidth>>1;
        var y0 = canvas.height - barHeight>>1;
        var barHeight = 20;

        var loaderColor = createjs.Graphics.getRGB(247,247,247);
        var loaderBar = new createjs.Container();

        bar = new createjs.Shape();
        bar.graphics.beginFill(loaderColor).drawRect(0, 0, 1, barHeight).endFill();

        var bgBar = new createjs.Shape();
        var padding = 3;
        bgBar.graphics.setStrokeStyle(1).beginStroke(loaderColor).drawRect(-padding/2, -padding/2, loaderWidth+padding, barHeight+padding);
        loaderBar.x = x0;
        loaderBar.y = y0;
        loaderBar.addChild(bar, bgBar);
        stage.addChild(loaderBar);
    }

    function handleProgress(event) {
        console.log(event.loaded);
        // bar.scaleX = event.loaded * loaderWidth;
    }

    RM.toRelative = function(str) {
        var newStr = str.replace("http://" + TQ.Config.DOMAIN_NAME + "/", "");

        // 防止此前旧文件中存在的其它域名
        newStr = newStr.replace("http://", "");
        newStr = newStr.replace("test.udoido.cn", "");
        newStr = newStr.replace("www.udoido.cn", "");
        return newStr;
    };

    RM._isFullPath = function(name) {
        return (name.indexOf(RM.BASE_PATH) >= 0);
    };

    RM.toFullPath = function(name) {
        if (RM._isFullPath(name)) {
            return name;
        }

        if (name[0] =='/') {
            return (RM.BASE_PATH + name);
        }

        return (RM.BASE_PATH + "/" + name);
    };

    TQ.RM = RM;
    TQ.ResourceManager = RM;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};
(function() {
    /**
     * GarbageCollector, 回收被deleted的元素，
     * 支持undelete
     * @class GarbageCollector
     * @static
     **/
    var GarbageCollector = function() {
        throw "GarbageCollector cannot be instantiated";
    };
    GarbageCollector._members = [];

    GarbageCollector.initialize = function () {
        GarbageCollector.clear();
    };

    GarbageCollector.add = function(ele) {
        GarbageCollector._members.push(ele);
    };

    GarbageCollector.remove = function(ele) {
        if (!ele) return;
        var id = GarbageCollector._members.indexOf(ele);
        if (id >= 0) GarbageCollector._members.splice(id, 1);
        return ele;
    };

    GarbageCollector.clear = function() {
        for (var i = 0; i< GarbageCollector._members.length; i++) {
            var ele = GarbageCollector._members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            GarbageCollector._members.splice(i, 1);
            ele.destroy();
        }

        GarbageCollector._members.splice  (0); // 删除全部选中的物体;
    };

    TQ.GarbageCollector = GarbageCollector;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};
(function () {
    /** 内部类,记录和执行一条命令
     **/
    function Command(f, params, path) {
        this.f = f;
        this.params = params;
        this.path = path==null ? true : path;
    }

    Command.prototype.exec = function(scope) { this.f.apply(scope, this.params); };

    var TaskMgr = {};
    TaskMgr.queue = [];
    TaskMgr.preferredQueue = [];
    TaskMgr.isWorking = false;
    TaskMgr._timerID = -1;
    TaskMgr.initialize = function() {
        TaskMgr.queue = [];
        TaskMgr.preferredQueue = [];
    };

    TaskMgr.invoke = function () {
        TaskMgr._timerID = setTimeout(function() { TaskMgr._runOnce(); }, 0);
    };

    TaskMgr.stop = function() {
        if (TaskMgr._timerID >=0 ) clearTimeout(TaskMgr._timerID);
        TaskMgr._timerID = -1;
    };

    TaskMgr.addTask = function(func, params, topPriority) {
        if (topPriority) {
            TaskMgr.preferredQueue.push(new Command(func, params, null));
        } else {
            TaskMgr.queue.push(new Command(func, params, null));
        }

        if (!TaskMgr.isWorking) {
            TaskMgr.invoke();
        }
    };

    TaskMgr._getTask = function() {
        // 1) 每一次获取任务的时候, 都先检查高优先级的任务.
        // ToDo: 实现跳帧, 在绘制时间长的情况下, 只移动time, 不update和Render,直接绘制最新的帧.
        var task = TaskMgr.preferredQueue.shift();
        if (task == null) {
            return TaskMgr.queue.shift();
        }

        return task;
    };

    TaskMgr._runOnce = function () {
        TaskMgr.isWorking = true;

        for (var task = TaskMgr._getTask(); task != null;  task = TaskMgr._getTask()) {
            task.exec(TaskMgr);
        }

        TaskMgr.isWorking = false;
    };

    TQ.TaskMgr = TaskMgr;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};

(function () {
    /**
     * 抽象命令类， 定义命令的接口
     * @constructor
     */
    function AbstractCommand() {
    }

    //定义一个变量p代表该类的原型，以方便为其添加函数。
    var p = AbstractCommand.prototype;
    p.do = function() {};
    p.undo = function() {};
    p.redo = function() {};
    //以下内容支持 复合命令
    p.addCommand = function(cmd) {return cmd;};
    p.removeCommand = function(cmd) {return cmd;};
    p.getCommand = function(id) {return id;};

    /**
     * 复合命令
     * @constructor
     */
    function CompositeCommand() {
        this.commands = [];
    }

    inherit(CompositeCommand, AbstractCommand);
    CompositeCommand.prototype.do = function() {
        for (var i=0; i < this.commands.length; i++) {
            this.commands[i].do();
        }
    };

    CompositeCommand.prototype.redo = function() {
        for (var i=0; i < this.commands.length; i++) {
            this.commands[i].redo();
        }
    };

    CompositeCommand.prototype.undo = function() {
        for (var i=this.commands.length-1; i >= 0; i--) {
            this.commands[i].undo();
        }
    };

    CompositeCommand.prototype.addCommand = function(cmd) {
        this.commands.push(cmd);
    };

    CompositeCommand.prototype.removeCommand = function(cmd) {
        var i = this.commands.indexOf(cmd);
        if (i < 0) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }
        return (null != this.commands.splice(i,1));
    };

    CompositeCommand.prototype.getCommand = function(id) {
        if (this.commands.length == 0) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return null;
        }

        if (id < this.commands.length) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, false);
            id = 0;
        }
        return this.commands[id];
    };

    // 以下open和close是为了让 Joint的移动可以快速undo
    CompositeCommand.open = function() {
        if (!CommandMgr.__openedComposite) {
            CommandMgr.__openedComposite = new CompositeCommand();
            $(document).mouseup(CompositeCommand.close);
        }
    };

    CompositeCommand.close = function() {
        if (!CommandMgr.__openedComposite) {
            return;
        }
        CommandMgr.addToUndoStack(CommandMgr.__openedComposite);
        CommandMgr.__openedComposite = null;
    };

    function RotateCommand(ele, angle) {
        this.receiver = ele;
        this.newValue = Math.truncate6(angle);
        this.oldValue = Math.truncate6(ele.jsonObj.rotation);
    }

    inherit(RotateCommand, AbstractCommand);

    RotateCommand.prototype.do = function() {
        this.receiver.rotateTo(this.newValue);
        return("rotate" + this.receiver);
    };

    RotateCommand.prototype.undo = function() {
        this.receiver.rotateTo(this.oldValue);
        return("undo rotate" + this.receiver);
    };

    RotateCommand.prototype.redo = function() {
        this.receiver.rotateTo(this.newValue);
        return("redo rotate" + this.receiver);
    };

    function MoveCommand(ele, pos) {
        this.receiver = ele;
        this.oldValue = {x: ele.jsonObj.x, y:ele.jsonObj.y};
        this.newValue = pos;
    }

    inherit(MoveCommand, AbstractCommand);

    MoveCommand.prototype.do = function() {
        this.receiver.moveTo(this.newValue);
        return("move" + this.receiver);
    };

    MoveCommand.prototype.undo = function() {
        this.receiver.moveTo(this.oldValue);
        return("undo move" + this.receiver);
    };

    MoveCommand.prototype.redo = function() {
        this.receiver.moveTo(this.newValue);
        return("redo move" + this.receiver);
    };

    function MovePivotCommand(ele, pivot, pos, marker) {
        this.receiver = ele;
        this.receiver2 = marker;
        var oldPivot = {pivotX: Math.truncate6(ele.jsonObj.pivotX), pivotY:Math.truncate6(ele.jsonObj.pivotY)};
        var oldPos = {x: Math.truncate6(ele.jsonObj.x), y:Math.truncate6(ele.jsonObj.y)};
        this.oldValue = {pivot: oldPivot, pos:oldPos};
        pivot.pivotX = Math.truncate6(pivot.pivotX);
        pivot.pivotY = Math.truncate6(pivot.pivotY);
        pos.x = Math.truncate6(pos.x);
        pos.y = Math.truncate6(pos.y);
        this.newValue = {pivot:pivot, pos:pos};
    }

    inherit(MovePivotCommand, AbstractCommand);

    MovePivotCommand.prototype.do = function() {
        this.receiver.movePivot(this.newValue.pivot, this.newValue.pos, this.receiver2);
        return(this.name + this.receiver);
    };

    MovePivotCommand.prototype.undo = function() {
        this.receiver.movePivot(this.oldValue.pivot, this.oldValue.pos, this.receiver2);
        return("undo move" + this.receiver);
    };

    MovePivotCommand.prototype.redo = MovePivotCommand.prototype.do;

    function SetTimeCommand(v) {
        this.receiver = TQ.FrameCounter;
        this.oldValue = TQ.FrameCounter.v;
        this.newValue = v;
    }

    inherit(SetTimeCommand, AbstractCommand);

    SetTimeCommand.prototype.do = function() {
        this.receiver.gotoFrame(this.newValue);
    };

    SetTimeCommand.prototype.undo = function() {
        this.receiver.gotoFrame(this.oldValue);
    };

    SetTimeCommand.prototype.redo = SetTimeCommand.prototype.do;

    function DeleteEleCommand(scene, ele) {
        this.receiver = scene;
        if (ele.parent != null) {
            this.receiver2 = ele.parent;
        } else {
            this.receiver2 = null;
        }
        this.oldValue = ele;
        this.newValue = ele;
    }

    inherit(DeleteEleCommand, AbstractCommand);

    DeleteEleCommand.prototype.do = function() {
        this.receiver.deleteElement(this.newValue);
    };

    DeleteEleCommand.prototype.undo = function() {
        if (this.receiver2 != null)  {
            this.receiver2.undeleteChild(this.oldValue);
        } else {
            this.receiver.undeleteElement(this.oldValue);
        }
    };

    DeleteEleCommand.prototype.redo = DeleteEleCommand.prototype.do;

    /**
     * 命令的管理者类， 包括：
     *   1. 命令的Queue，优先Queue（不需要undo），
     *   2. 命令的undo堆栈， redo堆栈
     *   3. 添加命令到Que， do，undo和redo函数
     *
     * @type {Object}
     */

    var CommandMgr = {};

    CommandMgr.queue = [];
    CommandMgr.preferredQueue = [];
    CommandMgr.MAX_UNDO_STEP = 100;
    CommandMgr.lastCmd = null;
    CommandMgr.undoStack = [];
    CommandMgr.redoStack = [];
    CommandMgr.preferredQueue = [];
    CommandMgr.isWorking = false;
    CommandMgr._timerID = -1;
    CommandMgr._cmdGroupID = 0;
    CommandMgr._lastCmdGroupID = 0;
    CommandMgr.invoke = function () {
        CommandMgr._timerID = setTimeout(function() { CommandMgr._runOnce(); }, 0);
    };

    CommandMgr.stop = function() {
        if (CommandMgr._timerID >=0 ) clearTimeout(CommandMgr._timerID);
        CommandMgr._timerID = -1;
    };

    CommandMgr.addCommand = function(cmd, topPriority) {
        if (topPriority) {
            CommandMgr.preferredQueue.push(cmd);
        } else {
            CommandMgr.queue.push(cmd);
        }

        if (!CommandMgr.isWorking) {
            CommandMgr.invoke();
        }
    };

    CommandMgr._getCommand = function() {
        // 1) 每一次获取任务的时候, 都先检查高优先级的任务.
        // ToDo: 实现跳帧, 在绘制时间长的情况下, 只移动time, 不update和Render,直接绘制最新的帧.
        var cmd = CommandMgr.preferredQueue.shift();
        if (cmd == null) {
            return CommandMgr.queue.shift();
        }

        return cmd;
    };

    CommandMgr.addToUndoStack = function(cmd) {
        while (CommandMgr.undoStack.length > CommandMgr.MAX_UNDO_STEP) {
            CommandMgr.undoStack.shift();
        }

        var mergedCmd;
        if ((mergedCmd = CommandMgr.mergeCommand(CommandMgr.lastCmd, cmd)) != null ) {
            CommandMgr.undoStack.pop();
            cmd = mergedCmd;
        }

        CommandMgr.undoStack.push(cmd);
        CommandMgr.lastCmd = cmd;
        CommandMgr._lastCmdGroupID = CommandMgr._cmdGroupID;
    };

    CommandMgr.mergeCommand = function(last, cmd) {
        if ((last != null) &&
            (CommandMgr._lastCmdGroupID == CommandMgr._cmdGroupID) &&
            (last.constructor.name == cmd.constructor.name)) {
            if ((last.constructor.name == "DeleteEleCommand") ||
                (last.constructor.name == "CompositeCommand")) {
                return null;
            } else if (JSON.stringify(last.newValue) == JSON.stringify(cmd.oldValue)) {
                cmd.oldValue = last.oldValue;
                return cmd;
            }
        }

        return null;
    };

    CommandMgr.addToRedoStack = function(cmd) {
        while (CommandMgr.redoStack.length > CommandMgr.MAX_UNDO_STEP) {
            CommandMgr.redoStack.shift();
        }

        CommandMgr.redoStack.push(cmd);
    };

    CommandMgr.directDo = function(cmd) {
        cmd.do();
        if (cmd.constructor.name == "CompositeCommand") {
            assertTrue(TQ.Dictionary.INVALID_LOGIC,cmd.commands.length > 0);
        }
        if (!CommandMgr.__openedComposite) {
            CommandMgr.addToUndoStack(cmd);
        } else {
            CommandMgr.__openedComposite.addCommand(cmd);
        }
    };

    CommandMgr._runOnce = function () {
        CommandMgr.isWorking = true;

        for (var cmd = CommandMgr._getCommand(); cmd != null;  cmd = CommandMgr._getCommand()) {
            CommandMgr.directDo(cmd);
        }

        CommandMgr.isWorking = false;
    };

    CommandMgr.undo = function() {
        if (CommandMgr.undoStack.length >= 1) {
            var cmd = CommandMgr.undoStack.pop();
            var result = cmd.undo();
            CommandMgr.addToRedoStack(cmd);
            return result;
        }
        return null;
    };

    CommandMgr.redo = function() {
        if (CommandMgr.redoStack.length >= 1) {
            var cmd = CommandMgr.redoStack.pop();
            var result = cmd.redo();
            CommandMgr.addToUndoStack(cmd);
            return result;
        }

        return null;
    };

    CommandMgr.clear = function() {
        CommandMgr.stop();
        CommandMgr.undoStack.splice(0);
        CommandMgr.redoStack.splice(0);
        CommandMgr.queue.splice(0);
        CommandMgr.preferredQueue.splice(0);
        CommandMgr.isWorking = false;
        CommandMgr._cmdGroupID = 0;
    };

    CommandMgr.initialize = function() {
        CommandMgr.clear();
        $(document).mousedown(function() {
            CommandMgr._cmdGroupID ++; // 开始一组新命令， 与前一组不能合并同类命令
        });

        TQ.InputMap.registerAction(TQ.InputMap.Z|TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.undo);
        TQ.InputMap.registerAction(TQ.InputMap.Y|TQ.InputMap.LEFT_CTRL_FLAG, CommandMgr.redo);
    };

    TQ.CommandMgr = CommandMgr;
    TQ.AbstractCommand = AbstractCommand;
    TQ.CompositeCommand = CompositeCommand;
    TQ.MoveCommand = MoveCommand;
    TQ.MovePivotCommand = MovePivotCommand;
    TQ.RotateCommand = RotateCommand;
    TQ.SetTimeCommand = SetTimeCommand;
    TQ.DeleteEleCommand = DeleteEleCommand;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

window.TQ = window.TQ || {};

(function () {

    var fns = null;
    function GenCommand(CMD_SCALE, ele, newValue, oldValue) {
        if (!fns) {
            GenCommand.initialize();
        }
        this.receiver = ele;
        this.newValue = newValue;
        this.oldValue = oldValue;
        this.dofn = fns[CMD_SCALE].dofn;
        this.undofn = fns[CMD_SCALE].undofn;
    }
    GenCommand.SCALE = "cmd_scale";
    GenCommand.MIN_JOINT_ANGLE = "cmd_min_joint_angle";
    GenCommand.MAX_JOINT_ANGLE = "cmd_max_joint_angle";
    GenCommand.CHANGE_LAYER = "cmd_change_layer";
    GenCommand.SET_3D_OBJ = "cmd_set_3D_obj";
    GenCommand.ADD_ITEM = "cmd_add_item";

    GenCommand.initialize = function () {
        fns = [];
        fns[GenCommand.SCALE] = {dofn: "scaleTo",  undofn: "scaleTo"};
        fns[GenCommand.MIN_JOINT_ANGLE] = {dofn: "setMinAngle",  undofn: "setMinAngle"};
        fns[GenCommand.MAX_JOINT_ANGLE] = {dofn: "setMaxAngle",  undofn: "setMaxAngle"};
        fns[GenCommand.CHANGE_LAYER] = {dofn: "moveZ",  undofn: " moveToZ"};
        fns[GenCommand.SET_3D_OBJ] = {dofn: "attachTo",  undofn: "detach"};
        fns[GenCommand.ADD_ITEM] = {dofn: "addElementDirect",  undofn: "deleteElement"};
    };
    inherit(GenCommand, TQ.AbstractCommand);

    GenCommand.prototype.do = function() {
        eval("this.receiver." + this.dofn + "(this.newValue)");
    };

    GenCommand.prototype.undo = function() {
        eval("this.receiver." + this.undofn +"(this.oldValue)");
    };

    GenCommand.prototype.redo = GenCommand.prototype.do;

    TQ.GenCommand = GenCommand;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};
(function() {
  /**
   * TraceMgr, 负责Trace的增删改查/显示/Fixup/Save/Open等操作,
   * * 只显示当前Level的 trace, 不显示其余level的.
   * * 任何一个物体都可以显示Trace, 或者不显示. (但是整体的, 不能指定显示A到B时间段的Trace)
   * * 任何一个子物体, 都可以.
   * * 不保存到Scene文件, 而是临时生成的
   * * 它的目的是查看运动轨迹, 便于修改; 不同于: 按照预设轨迹的运动, 先绘制路径, 再按照轨迹来运动.
   * @class TraceMgr
   * @static
   **/
  var TraceMgr = function() {
    throw "TraceMgr cannot be instantiated";
  };

  TraceMgr.initialize = function () {
  };

  TraceMgr.addNewPosition = function(ele) {
    var pDevice = TQ.Utility.worldToDevioce(ele.jsonObj.x, ele.jsonObj.y);
    if (!ele.trace) {
      ele.trace = new Trace("#0000FF", 2);
    }
    ele.trace.add(pDevice);
  };

  TraceMgr.removeFromStage = function(ele) {
    if (!ele.trace) return;
    ele.trace.removeFromStage();
  };

  TraceMgr.delete = function(ele) {
    if (!ele.trace) return;
    TraceMgr.removeFromStage(ele);
    ele.trace = null;
  };

  // Trace 类
  var Trace = function(color, thickness) {
    this.color = color;
    this.thickness = thickness;
    this.shape = new createjs.Shape();
    this.addToStage();
    this.shape.x = 0;
    this.graphics = this.shape.graphics;
    this.graphics.setStrokeStyle(this.thickness, "round", null, null).beginStroke(this.color);
    this.lastPt = null;
    this.shape.uncache();
    this.points = [];
  };

  Trace.prototype.add = function (pDevice) {
    //ToDo: 小线段,丢弃.
    if (!this.lastPt) {
      this.lastPt = pDevice;
      return;
    }
    this.graphics.moveTo(this.lastPt.x, this.lastPt.y);
    this.lastPt = pDevice;
    this.graphics.lineTo(this.lastPt.x, this.lastPt.y);
    this.points.push(pDevice);
  };

  Trace.prototype.addToStage = function() {
    stage.addChild(this.shape);
  };


  Trace.prototype.removeFromStage = function() {
    stage.removeChild(this.shape);
  };

  Trace.prototype.destory = function() {
    stage.removeChild(this.shape);
    this.shape = null;
    this.graphics = null;
  };

  Trace.prototype.toJSON = function() {
    return {color: this.color, thickness: this.thickness, points: this.points};
  };

  // static 函数
  Trace.build = function(desc) {
    if (!desc.points) {
      return null;
    }

    var trace = new Trace(desc.color, desc.thickness);
    for (var i = 0; i < desc.points.length; i++) {
      trace.add(desc.points[i]);
    }
    desc.points = null;

    return trace;
  };

  TQ.TraceMgr = TraceMgr;
  TQ.Trace = Trace;
}());
/**
 * 图强动漫引擎, 专利产品, 让生活动漫起来.
 * 强大的创意动力源泉
 * 微创意拍摄和播放专用的Timer,(实际上在内部就是 Framer Counter, 对外,为了用户方便, 按照当前FPS转为时间),
 * FrameCounter记录实际拍摄的时刻(帧编号), 而不是日历时长. 时间轴的0点在片头, 终点在片尾..
 * 例如: 假设每秒20帧: FPS = 20; i.e. 一帧的对应1/20 秒, == 0.05秒.
 * 片子的第一个画面(帧): FrameCounter =0, 第二个画面(帧): FrameCounter = 1, 或0.05秒, 依次类推,
 * 第100帧, FrameCounter = 100, 或5秒.
 * 在一个Scene内如此,
 * 在一个Level内部,也如此. Level 1里面有Frame 0, Level 2 里面也有. 各是各的.
 */

window.TQ = window.TQ || {};

(function (){
    function FrameCounter()
    {
        assertNotHere(TQ.Dictionary.INVALID_LOGIC); // Singleton, 禁止调用
    }

    // ToDo:
    FrameCounter.GO = 1; // 调在使用之前, 常量在使用之前必须先定义(包括初始化,例如下面给_state赋值)
    FrameCounter.STOP = 0;
    FrameCounter.isNew = true;  // 新的时刻, 需要更新数据
    FrameCounter.v = 0;
    FrameCounter.defaultFPS = 20;
    FrameCounter.max = 120 * FrameCounter.defaultFPS; // 空白带子, 长度为 30秒 * 每秒20帧,  600
    FrameCounter._FPS = FrameCounter.defaultFPS;  // 下划线是内部变量, 禁止外面引用
    FrameCounter.BASE_STEP = 1;
    FrameCounter._step = FrameCounter.BASE_STEP;
    FrameCounter._state = (TQ.Config.AutoPlay ? FrameCounter.GO : FrameCounter.STOP);
    FrameCounter._requestState = null;
    FrameCounter._autoRewind = false;
    FrameCounter._level = null;

    /*  FrameCounter 是一个控制器, 不是存储器, 所以它不保留任何值,
     * 也不复制这些值, 以避免数据的不一致.
     * 而Level是存储器, (也可能带有执行器的功能, 复合型的), 保有 FPS, fileLength等值.
     * */
    FrameCounter.initialize = function (t0, FPS, level) {
        //ToDo: 要 最大长度吗? 要, 而且是当前level的实实在在的max
        assertNotNull(TQ.Dictionary.FoundNull, t0); //必须强制调用者遵从, 以简化程序,  因为此部分与用户的任意性无关
        assertNotNull(TQ.Dictionary.FoundNull, FPS);
        assertNotNull(TQ.Dictionary.FoundNull, level);
        FrameCounter.v = t0 * FPS;
        FrameCounter._FPS = FPS;
        FrameCounter._level = level;
        FrameCounter.max = level.getTime();
        TQ.InputMap.registerAction(TQ.InputMap.LAST_FRAME_KEY,
            function () {
                level.setTime(FrameCounter.v);
                FrameCounter.max = FrameCounter.v;
            }
        );
    };

    FrameCounter.t = function ()
    {
        return FrameCounter.v / FrameCounter._FPS;
    };

    FrameCounter.f2t = function(frameNumber) {
        return (frameNumber / FrameCounter._FPS);
    };

    FrameCounter.t2f = function(t) {
        return (t * FrameCounter._FPS);
    };

    FrameCounter.forward = function ()
    {
        FrameCounter._step = 2 * FrameCounter.BASE_STEP;
        FrameCounter._state = FrameCounter.GO;
    };

    FrameCounter.backward = function () {
        FrameCounter._step = -2 * FrameCounter.BASE_STEP;
        FrameCounter._state = FrameCounter.GO;
    };

    FrameCounter.gotoBeginning = function() {
        FrameCounter.gotoFrame(0);
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(FrameCounter.v));
    };

    FrameCounter.gotoEnd = function() {
        FrameCounter.gotoFrame(FrameCounter.max);
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(FrameCounter.v));
    };

    FrameCounter.gotoFrame = function(v) {
        FrameCounter.v = v;
        TQ.FrameCounter.isNew = true;
    };

    FrameCounter.goto = function(t) {
        FrameCounter.gotoFrame(t * FrameCounter._FPS);
    };

    // 前进一个delta. (delta是负值, 即为倒带)
    FrameCounter.update = function () {
        FrameCounter.updateState();
        if (!(FrameCounter._state == FrameCounter.GO)) {
            return ;
        }

        if (FrameCounter.hasUIData) {
            FrameCounter.hasUIData = false;
            return;
        }

        var delta = FrameCounter._step;
        FrameCounter.v = FrameCounter.v + delta;
        if(FrameCounter.v > FrameCounter.max) {
            FrameCounter.v = FrameCounter.max;
        }

        if(FrameCounter.v < 0) {
            if (FrameCounter._autoRewind) {
                FrameCounter.v = FrameCounter.max;
            } else {
                FrameCounter.v = 0;
            }
        }

        TQ.FrameCounter.isNew = true;
        assertTrue(TQ.Dictionary.CounterValidation, FrameCounter.v >= 0);
    };

    FrameCounter.updateState = function() {
        switch (FrameCounter._requestState) {
            case null: break;
            case FrameCounter.GO : {
                FrameCounter._step = FrameCounter.BASE_STEP;
                FrameCounter._state = FrameCounter.GO;
                break;
            }
            case FrameCounter.STOP: {
                FrameCounter._state = FrameCounter.STOP;
                break;
            }
        }
        FrameCounter._requestState = null;
    };

    // state: 不能由外部改变, 必须是update自己改变, 以保持其唯一性
    FrameCounter.play = function ()
    {
        FrameCounter._requestState = FrameCounter.GO;
        //ToDo: 暂时关闭GIF文件的生成
        /* if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL])
        {
            canvas.width = 180;
            canvas.height = 180;
            $("#testCanvas").hide();
            TQ.GifManager.begin();
        }
        */
    };

    FrameCounter.stop = function ()
    {
        FrameCounter._requestState = FrameCounter.STOP;
        TQ.CommandMgr.directDo(new TQ.SetTimeCommand(FrameCounter.v));
        if (TQ.GifManager.isOpen) {
            TQ.GifManager.end();
            canvas.width = TQ.Config.workingRegionWidth;
            canvas.height = TQ.Config.workingRegionHeight;
            $("#testCanvas").show();
        }
    };

    FrameCounter.autoRewind = function () {
        FrameCounter._autoRewind = !FrameCounter._autoRewind;
    };

    FrameCounter.isInverse = function () { return FrameCounter._step < 0;};
    FrameCounter.isPlaying = function () { return (FrameCounter._state == FrameCounter.GO); };
    FrameCounter.isRequestedToStop = function () { return (FrameCounter._requestState == FrameCounter.STOP); };
    FrameCounter.finished = function () { return (FrameCounter.v >= FrameCounter.max); };
    FrameCounter.isAutoRewind = function () { return FrameCounter._autoRewind; };

    FrameCounter.maxTime = function () {
        return FrameCounter.max / FrameCounter._FPS;
    };

    FrameCounter.reset = function () {
        FrameCounter._requestState = null;
        FrameCounter.v = 0;
        FrameCounter._state = (TQ.Config.AutoPlay ? FrameCounter.GO : FrameCounter.STOP);
    };

    TQ.FrameCounter = FrameCounter;
}());
/**
 * 图强动漫引擎, 专利产品, 动画化的课件，一幅图胜过前言万语.
 * 强大的创意动力源泉
 * Begin, End,
 */

window.TQ = window.TQ || {};
var __gGifGenerator = null;

(function (){
    function GifManager()
    {
        assertNotHere(TQ.Dictionary.INVALID_LOGIC); // Singleton, 禁止调用
    }
    GifManager.isWorking = false;
    GifManager.isOpen = false;

    GifManager.begin = function ()
    {
        if (GifManager.isWorking) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return;
        }

        if (!__gGifGenerator) {
            __gGifGenerator = new GIF({
                workers:'4',
                quality:'90',
                repeat:'0',
                background:'#000000',
                width:'180',
                height:'180'
            });
        }
        GifManager.isWorking = true;
        GifManager.isOpen = true;
    };

    GifManager.end = function () {
        if (!GifManager.isOpen) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return;
        }

        if (__gGifGenerator) {
            __gGifGenerator.on('finished', function (blob) {
                if (TQ.Utility.hasEnv(TQ.Utility.BR_CHROME)) {
                    window.open(window.webkitURL.createObjectURL(blob));
                } else {
                    window.open(window.URL.createObjectURL(blob));  // FireFox
                }
                __gGifGenerator = null;
                GifManager.isWorking = false;
                TQ.MessageBubble.close();
            });
            __gGifGenerator.render();
            GifManager.isOpen = false;
            TQ.MessageBubble.show(TQ.Dictionary.IS_PROCESSING);
        }
    };

    GifManager.addFrame = function () {
        if ((!GifManager.isOpen) || (!__gGifGenerator)) {
            return;
        }
        __gGifGenerator.addFrame(canvas, {copy: true, delay: 20});
    };

    TQ.GifManager = GifManager;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Input map , 映射输入的键盘和鼠标信息， 到一个内部数据，
 * 在每一个cycle， 清理一次
 * 静态变量
 */

TQ = TQ || {};
var TOUCH_MOVING_FLAG = 999;

(function () {
    var InputMap = {};
    InputMap.isPresseds = [];
    InputMap.lastPresseds = [];
    InputMap.DELETE_KEY = 46;
    InputMap.ERASE_KEY = InputMap.R = 82;
    InputMap.SHOW_ALL_HIDEN_OBJECT_KEY = InputMap.A = 65;
    InputMap.CLONE_Key = InputMap.C = 67;
    InputMap.TEXT_EDIT_KEY = InputMap.E = 69;
    InputMap.GRID_ON_OFF_KEY = InputMap.G = 71;
    InputMap.HIDE_KEY = InputMap.H = 72;
    InputMap.SHOW_KEY = InputMap.S = 83;
    InputMap.ROTATE_KEY = InputMap.Z = 90;
    InputMap.ROTATE_KEY = InputMap.Y = 89;
    InputMap.PLAY_STOP_KEY = InputMap.SPACE = 32;
    InputMap.LAST_FRAME_KEY = InputMap.F7 = 118;
    InputMap.LEFT_SHIFT=16;
    InputMap.LEFT_CTRL=17;
    InputMap.LEFT_ALT=18;
    InputMap.EMPTY_SELECTOR = 27; //ESCAPE;
    InputMap.D0 = 48;
    InputMap.D1 = 49;
    InputMap.D2 = 50;
    InputMap.D3 = 51;
    InputMap.D4 = 52;
    InputMap.D5 = 53;
    InputMap.D6 = 54;
    InputMap.D7 = 55;
    InputMap.D8 = 56;
    InputMap.D9 = 57;
    InputMap.LEFT_ARROW = 39;
    InputMap.RIGHT_ARROW = 37;

    // 支持组合键
    InputMap.LEFT_SHIFT_FLAG = 0x1000;
    InputMap.LEFT_CTRL_FLAG = 0x2000;
    InputMap.LEFT_ALT_FLAG = 0x4000;

    InputMap.isMouseDown=false;
    InputMap.isTouchMoving = false;
    InputMap.toolbarState = InputMap.NO_TOOLBAR_ACTION = null;

    // 私有变量， 用下划线开头， 放在公共变量的后面，必须在所有函数的前面，
    InputMap._on = true;  //  true, 由它处理键盘； false: 不.

    InputMap.setToolbarState = function(buttonIDString) {
        assertNotNull(TQ.Dictionary.FoundNull, buttonIDString);
        InputMap.toolbarState = buttonIDString;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_TOOLBAR);
    };
    
    InputMap.IsOperating = function() {
        return ((InputMap.isTouchMoving || InputMap.isMouseDown) && (InputMap.toolbarState == null));
    };

    InputMap.maps = [];
    InputMap.registerAction = function (key, action){
        // key可以是组合键, 例如:
        // key = InputMap.DELETE_KEY | InputMap.LEFT_SHIFT_FLAG;        
		InputMap.maps[key] = action;
    };

    InputMap.restart= function () {
        InputMap.mouseMoving = false;
        InputMap.toolbarState = InputMap.NO_TOOLBAR_ACTION;
        InputMap.lastPresseds = InputMap.isPresseds;
        InputMap.isPresseds = [];
        // 复制长效键:
        InputMap.isPresseds[InputMap.Z] = InputMap.lastPresseds[InputMap.Z]; // 旋转
        InputMap.isPresseds[InputMap.LEFT_SHIFT] = InputMap.lastPresseds[InputMap.LEFT_SHIFT];
        InputMap.isPresseds[InputMap.LEFT_CTRL] = InputMap.lastPresseds[InputMap.LEFT_CTRL];
        InputMap.isPresseds[InputMap.LEFT_ALT] = InputMap.lastPresseds[InputMap.LEFT_ALT];
    };

    $(document).bind('mousemove touchmove touchcancel', function(e) {
        TQ.Log.info("which:" + e.which + "mousedown:" + InputMap.isMouseDown + " type:" + e.type + "(x,y):" + e.screenX +"," + e.screenY);
        InputMap.mouseMoving = true;
        InputMap.updateSpecialKey(e);
    });

    $(document).bind('mouseup touchend', function(e) {
        InputMap._updateMouse(e, false);
        InputMap.updateSpecialKey(e);
    });

    $(document).bind('mousedown touchstart', function(e) {
        InputMap._updateMouse(e, true);
        InputMap.updateSpecialKey(e);
    });

    $(document).keydown(function (e) {
        if (!InputMap._on){ return;}
        InputMap.updateSpecialKey(e);
        var action = InputMap.maps[InputMap.getCombination(e)];
        if ( (action != null) && (!InputMap.isPresseds[e.which])) { // 有action, 而且首次按下
            // 一对down和up,复制一份, 持续按住不放, 只算一次.
            e.stopPropagation();
            e.preventDefault();
            TQ.TaskMgr.addTask(action, []);
        }

        InputMap._updateKey(e, true);
    });

    $(document).keyup(function (e) {
        if (!InputMap._on) { return;}
        InputMap.updateSpecialKey(e);
        InputMap._updateKey(e, false);
    });

    InputMap._updateKey = function (e, isDown) {
        InputMap.isPresseds[e.which] = isDown;
        // displayInfo2(e.which);
    };

    InputMap._updateMouse = function (e, isDown) {
        InputMap.isMouseDown = isDown;
        // displayInfo2(e.which);
    };

    InputMap.getCombination = function (e) {
        var result = e.which;
        if (InputMap.isPresseds[InputMap.LEFT_CTRL]) result |= InputMap.LEFT_CTRL_FLAG;
        if (InputMap.isPresseds[InputMap.LEFT_SHIFT]) result |= InputMap.LEFT_SHIFT_FLAG;
        if (InputMap.isPresseds[InputMap.LEFT_ALT]) result |= InputMap.LEFT_ALT_FLAG;
        return result;
    };

    InputMap.updateSpecialKey = function(e){
        // 在复合键(例如：alt + Delete 放开的时候, 只有一次keyUp事件, 所有alt键放开的信息丢失了, 所以,需要下面的更新方法)
        InputMap.isPresseds[InputMap.LEFT_CTRL] = e.ctrlKey;
        InputMap.isPresseds[InputMap.LEFT_SHIFT] = e.shiftKey;
        InputMap.isPresseds[InputMap.LEFT_ALT] = e.altKey;
        InputMap.isMouseDown = e.which;

        InputMap.updateTouch(e);
    };

    InputMap.updateTouch = function(e) {
        switch (e.type) {
            case 'touchmove': InputMap.isTouchMoving = true; break;
            case 'touchstart': InputMap.isTouchMoving = true; break;
            case 'touchend' : break;
            default : InputMap.isTouchMoving = false;
        }
    };

    InputMap.turnOn = function() {
        TQ.InputMap._on = true;
    };

    InputMap.turnOff = function() {
        TQ.InputMap._on = false;
    };

    TQ.InputMap = InputMap;
}());
/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * 创建了 一个 静态的 常量，类， State， 用于记录 Level的状态。
 * Created at : 12-11-14 下午4:06
 */

window.TQBase = window.TQBase || {};

(function () {
    function LevelState() {
    }

    LevelState.NOT_INIT = 0;
    LevelState.ISLOADING = 1; // 只是load，不能立即加入Stage
    LevelState.LOADED = 2;
    LevelState.INITING = 3;
    LevelState.RUNNING = 4;
    LevelState.EDITING = 5;
    LevelState.EXIT = 6;
    LevelState.SHOOTING = 16;
    LevelState.PLAYING = 17;
    LevelState.PAUSE = 18;

    LevelState.operation = 0;
    LevelState.OP_TIMER_UI = 0x101;
    LevelState.OP_TOOLBAR = 0x103;
    LevelState.OP_TABS = 0x107;
    LevelState.OP_CANVAS = 0x10F; //  具体的操作, 及其元素, 见Element
    LevelState.OP_FLOATTOOLBAR = 0x11F;
    LevelState.saveOperation = function (op) { LevelState.operation = op; };
    LevelState.isOperatingCanvas = function () {return (LevelState.operation == LevelState.OP_CANVAS); };
    LevelState.isOperatingTimerUI = function () {return (LevelState.operation == LevelState.OP_TIMER_UI); }

    TQBase.LevelState = LevelState;
}());
/**
 * Tuqiang Game Engine
 * Copyright Tuqiang Tech
 * Created at : 12-11-14 下午4:06
 */

window.TQBase = window.TQBase || {};

(function () {
    function Trsa() {
    }

    Trsa.lastOperationFlag = 0;
    // 功能单一化:
    // 1) 只是 生成新的世界坐标.
    // 2) 不绘制了(不修改displayObj的值), 留给element.update 统一做
    //
    // 但是, 提供自己的状态, 供外界查询
    Trsa.do = function (element, thisLevel, offset, ev, item) {
        var target = element.displayObj;
        if (element.isPinned()) {
            displayInfo2(TQ.Dictionary.Locked);
            return;
        }
        if (target == null) {
            displayInfo2("empty object or deleted, element.TBD = " +  element.TBD);
            return;
        }

        currScene.isSaved = false;
        TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
        if ( (TQ.SkinningCtrl.hasNew) )
        { // 它们可能删除了当前选中的物体;
        } else if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_SHIFT] || TQ.InputCtrl.vkeyLift) {
            element.setFlag(TQ.Element.ZING);
            TQ.MoveCtrl.moveZ(element, offset, ev);
        } else if (element.isJoint() && !TQ.InputCtrl.inSubobjectMode) {
            element.setFlag(TQ.Element.TRANSLATING);
            element.setFlag(TQ.Element.ROTATING);
            Trsa.lastOperationFlag = element.getOperationFlags();
            TQ.CompositeCommand.open();
            TQ.IKCtrl.do(element, offset, ev, false);
        } else {
            if (TQ.InputMap.isPresseds[TQ.InputMap.Z] || TQ.InputCtrl.vkeyRotate) {
                element.setFlag(TQ.Element.ROTATING);
                Trsa.lastOperationFlag = element.getOperationFlags();
                TQ.IKCtrl.do(element, offset, ev, true);
            } else if (TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyScale) {
                element.setFlag(TQ.Element.SCALING);
                TQ.InputCtrl.scale(element, target, offset, ev);
            } else if (TQ.Utility.isMultiTouchEvent(ev) && ev.nativeEvent.scale) { // nativeEvent.scale在Win7触屏笔记本上不存在
                var scale = 1 + (ev.nativeEvent.scale - 1) * 0.5; // 减慢速度， 太快了
                TQ.InputCtrl.doScale(element, scale, scale);
            }   else {
                element.setFlag(TQ.Element.TRANSLATING);
                this._move(element, thisLevel, offset, ev);
                if (target.isClipPoint) {
                    this._calculateScale(target, thisLevel, offset, ev, item);
                }

                if (!target.isClipPoint) {
                    Trsa.displayClips(target);
                } else {
                    Trsa.displayClips(item);
                }
            }
        }

        Trsa.lastOperationFlag = element.getOperationFlags();
        TQ.Log.out("OP: " + Trsa.lastOperationFlag);
        element.dirty = true;
        element.dirty2 = true;
        element.isOperating = true;
        // indicate that the stage should be updated on the next tick:
        thisLevel.dirty = true;
    };

    Trsa._move = function (element, thisLevel, offset, ev) {
        // offsetY 是device下的， 必须转为jsonObj所用的World坐标系或用户坐标系，才能赋给jsonObj
        var rDeviceX = ev.stageX + offset.x;
        var rDeviceY = ev.stageY + offset.y;
        TQ.CommandMgr.directDo(new TQ.MoveCommand(element, {x:rDeviceX, y:TQ.Utility.toWorldCoord(rDeviceY)}));
        if (TQ.InputCtrl.leaveTraceOn) {
          TQ.TraceMgr.addNewPosition(element);
        }
    };

    /***
     *   ---> y
     *   |     0    7    6
     *   V
     *         1         5
     *
     *         2    3    4
     *
     * @param target
     */
    Trsa.displayClips = function (target) {
        if (!TQ.Config.DISPLAY_CLIPS) {
          return ;
        }

        const CLIP_WIDTH_HALF = 16 / 2;
        if ((Trsa.clipPoints == undefined) || (Trsa.clipPoints == null)
            ||(Trsa.clipPoints[0] == undefined)) {
            Trsa.generateClips();
        }

        if (target.isClipPoint) {
            return;
        }

        var h = target.getHeight();
        var w = target.getWidth();

        var offsets = [
            {"x":0, "y":0},
            {"x":0, "y":h / 2},
            {"x":0, "y":h},
            {"x":w / 2, "y":h},
            {"x":w, "y":h},
            {"x":w, "y":h / 2},
            {"x":w, "y":0},
            {"x":w / 2, "y":0},
            {"x":0, "y":0}
        ];

        for (var i = 0; i < 8; i++) {
            Trsa.positionIt(Trsa.clipPoints[i], target.x + offsets[i].x - CLIP_WIDTH_HALF, target.y + offsets[i].y - CLIP_WIDTH_HALF);
        }
    };

    Trsa.positionIt = function (jsonObj, x, y) {
        if (jsonObj.displayObj == undefined) {
            return;
        }

        jsonObj.x = jsonObj.displayObj.x = x;
        jsonObj.y = jsonObj.displayObj.y = y;
    };

    Trsa.clipPoints = null;
    Trsa.generateClips = function () {
        var jsonObjs = [
            {isVis:1, x:10.0, y:11.0, ID:0, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:20.0, y:11.0, ID:1, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:30.0, y:11.0, ID:2, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:40.0, y:11.0, ID:3, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:50.0, y:11.0, ID:4, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:60.0, y:11.0, ID:5, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:70.0, y:11.0, ID:6, isClipPoint:true, src:"sysImages/dragpoint.jpg"},
            {isVis:1, x:80.0, y:11.0, ID:7, isClipPoint:true, src:"sysImages/dragpoint.jpg"}
        ];
        Trsa.clipPoints = new Array(8);
        for (var i = 0; i < 8; i++) {
            Trsa.clipPoints[i] = currScene.addItem(jsonObjs[i], jsonObjs[i].x, jsonObjs[i].y, 1);
        }
    };

    Trsa.getClipID = function (clip) {
        return clip.jsonObj.ID;
    };

    Trsa._calculateScale = function (target, thisLevel, offset, ev, item) {
        var sx = (target.x - item.getCenterX()) * 2 / item.naturalWidth();
        var sy = (target.y - item.getCenterY()) * 2 / item.naturalHeight();

        var clipID = this.getClipID(target);
        switch (clipID) {
            case 3:
                item.scaleY = sy;
                break;
            case 4:
                item.scaleX = sx;
                item.scaleY = sy;
                break;
            case 5:
                item.scaleX = sx;
                break;
            default:
                assertNotHere(TQ.Dictionary.INVALID_PARAMETER); //夹点ID不对
        }

        item.jsonObj.scaleX = item.scaleX;
        item.jsonObj.scaleY = item.scaleY;
    };
    TQBase.Trsa = Trsa;
}());
TQ = TQ || {};
(function () {

    function Scene() {
        this.levels = [];
        this.onsceneload = null;     // 不能使用系统 的函数名称，比如： onload， 这样会是混淆
        this.version = Scene.VER2;
    }
    Scene.VER1 = "V1";
    Scene.VER2 = "V2";
    var p = Scene.prototype;
    TQ.EventHandler.initialize(p); // 为它添加事件处理能力
    p.filename = null; // filename是文件名， 仅仅只是机器自动生成的唯一编号
    p.title = null;  // title是微创意的标题，
    p.isPreloading = false;
    p.currentLevelId = 0;
    p.currentLevel = null;
    p.overlay = null;
    p.stage = null;
    p.isSaved = false; // 用于提醒是否保存修改的内容，在close之前。
    p.state = TQBase.LevelState.NOT_INIT;
    p.shooting = function ()
    {
        this.state = TQBase.LevelState.SHOOTING;
    };

    p.isUpdating = false;
    // 这是scene的主控程序
    p.tick = function () {
        var _this = this;
        TQ.TaskMgr.addTask(function () {_this.onTick();}, null);
    };

    p.onTick = function() {
        if (this.state <= TQBase.LevelState.INITING) {
          this.update(0); // 只更新状态,
        }

        if (this.state < TQBase.LevelState.RUNNING) { // Running 之前, 包括:init, loading等等, 不适合update
           return;
        }

        if (this.isUpdating) {   // 避免重复进入
            return;
        }

        this.isUpdating = true;
        TQ.FrameCounter.update();  // 前进一帧, 只有play和播放的时候, 才移动Frame
        TQ.TimerUI.update();  // 必须先更新数据, 在更新UI
        this.update(TQ.FrameCounter.t());
        if (this.overlay) {this.overlay.update(TQ.FrameCounter.t());}

        this.render();
        if (TQ.GifManager.isOpen) {
            TQ.GifManager.addFrame();
        }
        TQ.InputMap.restart(); // 必须是Game Cycle中最后一个, 因为JustPressed依赖于它
        TQ.FrameCounter.isNew = false;
        this.isUpdating = false;
    };

    p.update = function(t) {
        TQ.SceneEditor.updateMode();
        // 谁都可以 要求Update， 不只是Player
        if (this.currentLevel != null) {
            this.currentLevel.update(t);
            if (this.version >= Scene.VER2) { // ToDo: 只在录制状态下才更新， 或者，初次运行的时候的时候才更新
                this.updateTimeTable();
            }
            if (TQ.FrameCounter.finished() && TQ.FrameCounter.isPlaying()) {
                if  (this.isLastLevel()) {
                    if (!TQ.FrameCounter.isAutoRewind()) {
                        $("#stop").click();
                    } else if (!TQ.FrameCounter.isInverse()) {
                        Scene.doReplay();
                    }
                } else {
                    this.nextLevel();
                }
            }
        }
    };

    p.updateTimeTable = function() {
        // update 当前level的时间
        if (TQ.SceneEditor.isEditMode()) {  //录制的时候， 自动延长 本场景的时间长度
            var BLOCK_SIZE = 100;
            var LOWER_SIZE = 10;
            if ((TQ.FrameCounter.v + LOWER_SIZE) > TQ.FrameCounter.max) {
                TQ.FrameCounter.max += BLOCK_SIZE;
                this.currentLevel.setTime(TQ.FrameCounter.v);
                $('#maxTimeValue').text(TQ.FrameCounter.max);
                TQ.TimerUI.body.slider("option", "max", TQ.FrameCounter.max);
            } // 同时也要更新计时器的最大值
        } else {
            TQ.FrameCounter.max = this.currentLevel.getTime();
        }

        // update 其它level的 相对时间点
        var t = 0;
        for (var i = 0; i< this.levels.length; i++) {
            this.levels[i].setT0(t);
            t += TQ.FrameCounter.t2f(this.levels[i].getTime());
        }
    };

    Scene.doReplay = function()
    {
        if (!currScene) { return; }
        currScene.stop();
        currScene.gotoLevel(0);
        TQ.FrameCounter.gotoBeginning();
        currScene.play();
    };

    p.render = function() {
        stage.update();
    };

    p.showLevel = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.currentLevelId < this.levelNum() ); //level ID 超界
        this.currentLevelId = (this.currentLevelId < this.levelNum()) ? this.currentLevelId : 0 ;
        this.selectLevel(this.currentLevelId);
        this.currentLevel.show();
    };

    p.selectLevel = function (id) {
        this.currentLevelId = id;
        this.currentLevel = this.getLevel(this.currentLevelId);
        assertNotNull(TQ.Dictionary.INVALID_LOGIC, this.currentLevel);
        this.currentLevel.onSelected();
        var thisScene = this;
        this.currentLevel.onLevelRunning = function () { 
            thisScene.state = TQBase.LevelState.RUNNING;
            thisScene.handleEvent("sceneReady");
        }
    };

    p.joint = function (elements, hasUnJointFlag) {
        if (hasUnJointFlag) {
            this.currentLevel.unJoint(elements);
        } else {
            if (!TQ.InputCtrl.inSubobjectMode) { // 必须在零件模式下, 才能让录制系统更新子物体的坐标为相对坐标.
                $("#subElementMode").click();
            }
            this.currentLevel.joint(elements);
            clearSubjectModeAndMultiSelect()
        }

        this.isSaved = false;
    };

    p.groupIt = function (elements, hasUnGroupFlag) {
        if (hasUnGroupFlag) {
            this.currentLevel.unGroup(elements);
        } else {
            this.currentLevel.groupIt(elements);
            clearSubjectModeAndMultiSelect();
        }
        this.isSaved = false;
    };

    p.skinning = function (parent, child) {
        this.currentLevel.skinning(parent, child);
        this.isSaved = false;
    };

    // for both image and animation
    p.addItem = function(desc) {
        this.isSaved = false;
        var level = this.currentLevel;
        if ((desc.toOverlay == undefined) || (desc.toOverlay == null))
        {
            if (desc.levelID != undefined) {
                level = this.getLevel(desc.levelID);
            }
        } else {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER + ": " + desc.toOverlay, (desc.toOverlay == 1)); //overlay参数有误
            assertTrue("is empty? ", this.overlay);
            if (this.overlay) {
                level = this.overlay;
            }
        }

        var ele = TQ.Element.build(level, desc);
        assertTrue(TQ.INVALID_LOGIC, ele.level == level);
        ele.level = level;
        var thisScene = this;
        TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.ADD_ITEM,
            thisScene, ele, ele));

        return ele;
    };

    p.undeleteElement = function(ele) {
        TQ.GarbageCollector.remove(ele);
        ele.level = this.currentLevel;
        this.addElementDirect(ele);
    };

    p.addElementDirect = function(ele) {
        var level = ele.level;
        level.addElementDirect(ele);
        if (ele.hasFlag(TQ.Element.LOADED)) {
            ele.addItemToStage();
        }
    };

    p.addText = function(desc) {
        this.isSaved = false;
        return this.currentLevel.addElement(desc);
    };

    p.deleteElement = function(ele)
    {
        this.isSaved = false;
        assertNotNull(TQ.Dictionary.PleaseSelectOne, ele);
        if (ele != null) {
            this.currentLevel.deleteElement(ele);
            if (ele.isSound()) {
                TQ.SoundMgr.deleteItem(ele);
            }
        }
    };

    p.preLevel = function () {
        if (this.currentLevelId > 0) {
            this.gotoLevel(this.currentLevelId - 1);
        }
    };

    p.nextLevel = function () {
        if (!this.isLastLevel()) {
            this.gotoLevel(this.currentLevelId + 1);
        }
    };

    p.isLastLevel = function () {
        return ((this.currentLevelId + 1)>= this.levelNum());
    };

    p.gotoLevel = function (id)
    {
        id = (id >= this.levelNum()) ? (this.levelNum() - 1) : id;
        id = (id < 0) ? 0: id;
        if (this.currentLevel != null)
        {
            TQ.floatToolbar.show(false);
            this.currentLevel.exit();
            this.currentLevelId = id;
        }

        this.showLevel();
    };

    p.open = function(fileInfo) {
        $('#stop').trigger('click');
        this.setEditor();
        this.isSaved = true;  //只是打开旧的文件， 没有尚未修改
        initMenu(); // 重新设置菜单
        if (TQ.SceneEditor.isEditMode()) {
            this.reset();
        }
        // close current if  has one;
        if (!((this.currentLevel == undefined) || (this.currentLevel == null))) {
            Scene.stopAux();
            this.close();
        }
        this.filename = fileInfo.name;
        this.title = null;
        // 删除 旧的Levels。
        this.onsceneload = this.showLevel;

        if (!fileInfo.content &&
            (fileInfo.name === TQ.Config.UNNAMED_SCENE)) {
            fileInfo.content = Scene.getEmptySceneJSON();
        }

        if (!fileInfo.content) {
            this.loadFromJson(fileInfo.name, 'gameScenes');
        } else {
            this._jsonStrToScene(this, fileInfo.content, 'gameScene');
        }
        if (null == this.overlay) {
            this.overlay = new TQ.Overlay({});
        }
    };

    p.reset = function() { // 打开文件，或者创建新文件的时候， 重新设置环境
        Scene.stopAux();
        TQ.FrameCounter.gotoBeginning();
        if (TQ.FrameCounter.isAutoRewind()) {
            $("#rewind").click();
        }
        if (TQ.TrackRecorder.style == TQ.TrackDecoder.JUMP_INTERPOLATION) {
            $("#linearMode").click();
        }
    };

    p.getLevel = function (id) {
        if (id < this.levels.length) {
            return this.levels[id];
        }
        return null;
    };

    p.getElement = function (id) {
        assertValid("this.currentLevel",this.currentLevel);
        return this.currentLevel.getElement(id);
    };

    p.getAllSounds = function() { // 只返回当前场景的声音， 不能跨场景操作其它场景里面的声音
        if (this.currentLevel) {
            var result = this.currentLevel.getSounds();
        } else {
            result = [];
        }
        return result;
    };

    p.findAtom = function(displayObj) {
        assertValid("this.currentLevel",this.currentLevel);
        return this.currentLevel.findAtom(displayObj);
    };

    p.getSelectedElement = function() {assertTrue(TQ.Dictionary.isDepreciated, false); };

    p.levelNum = function () {
        return this.levels.length;
    };

    /*
     插入第id(id >=0）个场景， 如果该位置已经有场景， 把原来的场景向后顺延。
     如果id超出下边界（id < 0), 则等价于id =0;.
     如果id 超出上边界， 则自动在末尾添加一个场景
     如果id没有定义，则自动在末尾添加一个场景
     返回值是最大level编号
     */
    p.addLevel = function (id, levelContent) {
        var levelNum = this.levelNum();
        if (id === undefined) {
            id = levelNum;
        }
        id  = TQ.MathExt.range(id, 0, levelNum);
        this.isSaved = false;
        if (!levelContent) {
            var levelName = levelNum; // levelNum只是一个流水号， 暂时没有其它用途
            levelContent = new TQ.Level({name: levelName});
        }
        this.levels.splice(id, 0, levelContent);
        return this.levelNum() - 1;
    };

    /*
     删除第id(id >=0）个场景， 并且把此后的场景前移。
     如果id超出边界（id < 0)，则忽略
     */
    p.deleteLevel = function (id) {
        if ((id < 0) || (id >= this.levelNum())) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, false);
            return;
        }
        this.isSaved = false;
        var deleted = this.levels.splice(id, 1);
        return deleted;
    };

    /*
     移动序号为srcId的场景，并插入到序号dstId的场景之前，
     注意：srcId和dstId都是在执行此函数之前， 按照场景的顺序来编号的。
     用户不需要关心
     */
    p.moveTo = function(srcId, dstId) {
        var content = this.deleteLevel(srcId);
        if (srcId < dstId) {
            dstId--;
        }
        this.addLevel(dstId, content);
    };

    /*
    复制序号为srcId的场景的内容，并插入到序号dstId的场景之前，
     */
    p.copyTo = function(srcId, dstId) {
        var content = this.levels[srcId];
        return this.addLevel(dstId, content);
    };

    // !!! can not recover, be careful!
    // empty the current scene
    p.forceToRemoveAll = function() {
        this.stop();
        this.close();
        while (this.levelNum() > 0) {
            this.deleteLevel(0);
        }
        this.addLevel(); // all one empty level
        this.selectLevel(0);
        this.currentLevel.state = TQBase.LevelState.INITING;
        this.currentLevel.onLevelCreated();
        this.title = TQ.Config.UNNAMED_SCENE;
        // this.state = TQBase.LevelState.INITING;
        this.state = TQBase.LevelState.NOT_INIT
        this.isSaved = true;
    };

    // JQuery Ajax version
    p.loadFromJson = function (filename, alias) {
        (function (pt) {
        netOpen(filename, function (jqResponse) {
            pt._jsonStrToScene(pt, jqResponse, alias);
        });
        })(this);
    };

    p._jsonStrToScene = function(pt, jsonStr, alias)
    {
        try {
          jsonStr = TQ.Element.upgrade(jsonStr);
          var objJson = JSON.parse(jsonStr);
        } catch (e) {
          displayInfo2(jsonStr);
          TQ.Log.error(jsonStr + ". "+ e.toString());
          // 给一个空白文件， 确保可可持续进行
          objJson = TQ.Utility.getEmptyScene();
        }
        objJson.alias = (alias == null) ? 'none' : alias;
        objJson.remote = true;
        pt._fixedUp(objJson);
    };

    Scene.removeEmptyLevel = function(jsonObj) {
      for (var i = jsonObj.levels.length - 1; i >=0; i--) {
        var desc = jsonObj.levels[i];
        if ((desc.elements == null) || (desc.elements.length <=0)) {
          if ((i!=0) || (jsonObj.levels.length > 1)) { //至少保留一个level, 不论空白与否。
              this.isSaved = false;
              jsonObj.levels.splice(i,1);
          }
        }
      }
    };

    p._fixedUp = function (objJson) {
        if (TQ.Config.REMOVE_EMPTY_LEVEL_ON) {
          Scene.removeEmptyLevel(objJson);
        }

        if (objJson.currentLevelId >= objJson.levels.length) {
          objJson.currentLevelId = 0;
        }

        if (!objJson.version) {
            if (this.filename == TQ.Config.UNNAMED_SCENE) {
                this.version = Scene.VER2;  // 创建一个新版作品
            } else {
                this.version = Scene.VER1;  // 升级旧版的作品， 添加其版本号
            }
        } else {
            this.version = objJson.version;
        }

        //initialize with defaults
        objJson.currentLevelId = (objJson.currentLevelId == undefined) ? 0: objJson.currentLevelId;
        this.currentLevelId = objJson.currentLevelId;
        this.currentLevelId = 0; //ToDo: 迫使系统总是打开第一个场景
        this.title = (!objJson.title)? null : objJson.title;

        if (this.title == null) {
            this.title = this.filename;
        }

        // create levels
        var num = objJson.levels.length;
        for (var i = 0; i < num; i++) {
            var desc = objJson.levels[i];
            if (desc.name == null) {
              desc.name = i.toString();
            }
            this.levels[i] = new TQ.Level(desc);
            if (i == 0) {
                (function (pt){
                    pt.startPreloader(pt, 0, num);
                }) (this);
            }
        }

        if (num === 0) { // 纠错
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            var desc = null;
            this.levels[0] = new TQ.Level(desc);
        }

        if (objJson.remote) {
            console.info(objJson.alias + ' has been added to the scene [Remote]');
        } else {
            console.info(objJson.alias + ' has been added to the scene [Local]');
        }

        if ((this.onsceneload != undefined) && (this.onsceneload != null)) {
            this.onsceneload();
        }

        displayInfo2(TQ.Dictionary.Load + "<" + this.title +">.");
    };

    p.setEditor = function() {
        if (TQ.SceneEditor.isEditMode()) {
            $('#playRecord').click();
        } else if (TQ.SceneEditor.isPlayMode()) {
            if (TQ.WCY.isPlayOnly) {
                TQ.WCY.doStopRecord();
            } else {
                $('#stopRecord').click();
            }
        } else {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
        }
    };

    p.startPreloader = function(pt, i, num) {
        if (i < num) {
            pt.levels[i].setupPreloader();
            // 本level加载完成之后， 就设置本Level的resourceReady标志
            TQ.RM.onCompleteOnce(function() {
                pt.levels[i].resourceReady = true;
                console.log(i + " level resource OK!");
                i++;
                if (i < num) {
                    pt.startPreloader(pt, i, num);
                }
            });
        }
    };

    p.save = function(title, keywords) {
        // 必须预处理， 切断反向的link，以避免出现Circle，无法生成JSON字串
        Scene.stopAux();
        this.currentLevel.exit();  // 先退出, 保存之后, 再次进入
        var bak_currentLevel = this.currentLevel;
        var bak_overlay = this.overlay;
        this.currentLevel = null;
        this.overlay = null;
        for (var i = 0; i < this.levelNum(); i++)
        {
            this.levels[i].prepareForJSONOut();
        }
        this.title = title;
        TQ.MessageBubble.counter = 0;
        netSave(this.title, this,keywords);
        TQ.ScreenShot.SaveScreen(this.title, keywords);

        this.currentLevel = bak_currentLevel;
        this.overlay = bak_overlay;
        this.afterToJSON();
        this.showLevel();
        this.isSaved = true;
    };

    p.afterToJSON = function ()
    {
        for (var i = 0; i < this.levelNum(); i++)
        {
            this.levels[i].afterToJSON();
        }
    };

    p.toJSON = function() {
        var scene2 = {};
        scene2.levels = this.levels;
        scene2.version = this.version;
        scene2.currentLevelId = this.currentLevelId;
        scene2.title = this.title;
        return scene2;
    };

    p.getData = function() {
        for (var i = 0; i < this.levelNum(); i++)
        {
            this.levels[i].prepareForJSONOut();
        }
        var data = JSON.stringify(this);
        this.afterToJSON();
        return data;
    };

    /// close current scene
    p.close = function() {
        if (this.isSaved)  {
            if (this.currentLevel != null) {
                TQ.RM.reset(); // 必须先停止RM，否则其中的callback如果引用了Level对象就会出错
                TQ.SoundMgr.close();
                TQ.TextEditor.onNo();
                this.currentLevel.exit();
                this.currentLevel.delete();
                this.currentLevel = null;
            }
            this.levels = [];  // 释放原来的数据
            this.currentLevel = null;
            this.currentLevelId = 0;
            this.onsceneload = null;
            return true;
        }

        return false;
    };

    p.toGlobalTime = function (t)
    {
        if (!this.currentLevel) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return t;
        }
        return (t + this.currentLevel.getT0());
    };

    p.stop = function () {
        if (this.currentLevel) {
            this.currentLevel.stop();
        }
        TQ.FrameCounter.stop();
        TQ.SoundMgr.pause();
        TQ.SnowEffect.stop();
        TQ.RainEffect.stop();
    };

    p.play = function() {
        TQ.floatToolbar.show(false);
        TQ.FrameCounter.play();
        TQ.SoundMgr.resume();
        if (this.currentLevel) {
            this.currentLevel.play();
        }
    };

    Scene.stopAux = function() {
      if (TQ.FrameCounter.isPlaying()) {
          $("#stop").click();
      }
    };

    Scene.getEmptySceneJSON = function() {
        // this equals to the WCY01.WDM
        // it is provided to prevent loading WCY01.WDM from server
        var empty = {"levels": [
            {"jsonElements": null, "FPS": 20, "_t": 0, "elements": null, "name": "0", "itemCounter": 8, "dataReady": true, "state": 6, "isWaitingForShow": false, "isDirty": false, "dirty": true}
        ], "overlay": null, "currentLevelId": 0, "currentLevel": null, "state": 4, "isUpdating": false};

        return JSON.stringify(empty);
    };

    TQ.Scene = Scene;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function Level(description) {
        this.latestElement = null; // 最新生成的复合物体
        this.tMaxFrame = 200; // 该level的最后一帧动画的时间(单位是: 帧), 以该Level的头为0帧.
        this.t0 = 0;
        this.resourceReady = false;
        this.initialize(description);
    }

    var p = Level.prototype;
    p.isDirty = false;  //  变量赋值应该放在最前面, 确保在使用之前已经赋值. 小函数放在最后, 很少看.
    p.isPreloading = false;

    p.initialize = function (description) {
        //initialize with defaults
        // 防止没有数据
        description = (!description) ? {} :description;
        description.elements = (!description.elements) ? [] : description.elements;
        this.elements = description.elements;
        this.FPS = (!description.FPS) ? TQ.FrameCounter.defaultFPS : description.FPS;
        this.tMaxFrame = (!description.tMaxFrame)? this.tMaxFrame : description.tMaxFrame;
        this._t = (!description._t) ? 0 : description._t;
        this.setupTimer();
        assertNotNull(TQ.Dictionary.FoundNull, description.name);
        this.name = description.name;
        this.itemCounter = 0;
        this.dataReady = false;
        this.state = TQBase.LevelState.NOT_INIT;
        this.isWaitingForShow = false;
        this.dirtyZ = false;
    };

    p.onSelected = function()
    {
        TQ.FrameCounter.initialize(this._t, this.FPS, this);
        TQ.TimerUI.initialize();
    };

    p.itemNum = function() {
        assertDepreciated(TQ.Dictionary.isDepreciated);
        return this.elements.length;
    };

    p.atomNum = function() {
        var sum = 0;
        for (var i=0; i< this.elements.length; i ++ ) {
            assertNotNull(TQ.Dictionary.FoundNull, this.elements[i]);
            sum += this.elements[i].atomNum();
        }
        return sum;
    };

    p.joint = function(elements) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode); // jointIt 必须运行在零件模式下!!!
        if (elements.length < 2)  return null;
        var parent = elements[0];
        if (!parent.isJoint()) { // 对于已经是关键链的一部分的，不能设置为Root， 以避免多个Root
            parent.setFlag(TQ.Element.ROOT_JOINT); // 设置为关节链的根部
        }
        for (var i = 1; i < elements.length; i++) {
            this.pickOffChild(elements[i]);
            parent.addJoint(elements[i]);
            parent = elements[i];
        }
    };

    /*
    打散本元件所在的关节链（整条链， 不是一个关节）
     */
    p.unJoint = function(elements) {
        for (var i=0; i < elements.length; i++) {
            // 先切断与 parent的联系（只有第一个元素有）， 再切断与孩子的联系
            var ele = elements[i];
            var parent = ele.parent;
            if (parent != null) {
                assertTrue(TQ.Dictionary.INVALID_PARAMETER, parent != null);
                parent.removeChild(ele);
                ele.clearFlag(TQ.Element.JOINTED);
                this.addElementDirect(ele);
            }
            var num = ele.children.length;
            for (var j = 0; j < num; j++) { //  动态地改变数组的尺寸， 所有num要先记录下来
                var child = ele.removeChild(ele.children[0]);
                this.addElementDirect(child);
                this.unJoint([child]);
            }
            ele.clearFlag(TQ.Element.JOINTED);
            ele.clearFlag(TQ.Element.ROOT_JOINT);
        }
    };

    p.groupIt = function(elements) {
        TQ.Log.out("Group it");
        // 以第一个物体的参数, 为主, 建立Group元素.
        var desc = {x: elements[0].jsonObj.x, y: elements[0].jsonObj.y, type:"Group" };
        var ele = this.addElement(desc); //ToDo:
        ele.update(TQ.FrameCounter.t());
        for (var i = 0; i < elements.length; i++) {
            this.pickOffChild(elements[i]);
            ele.addChild(elements[i]);
        }

        this.latestElement = ele;
        this.dirtyZ = true;
    };

    p.unGroup = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            var ele = elements[i];
            if (ele.isJoint() || ele.hasFlag(TQ.Element.ROOT_JOINT)) {
                continue;
            }
            if (!ele.isVirtualObject())  {
                ele = ele.parent;
            }
            if (ele == null) continue;
            if (ele.isVirtualObject()) {
                while (ele.children.length > 0) {
                    var child = ele.removeChild(ele.children[0]);
                    this.addElementDirect(child);
                }

                this.deleteElement(ele);
            }
        }

        this.dirtyZ = true;
    };

    p.cloneElement = function(elements) {
        for (var i = 0; i < elements.length; i++) {
            // var marker = elements[i].detachDecoration();
            elements[i].persist(); // 记录zIndex, 就在此层次clone, 把原来的物体抬高1个层次.
            var desc = JSON.parse(JSON.stringify(elements[i].jsonObj));
            Level.removeMarker(desc);
            if (elements[i].parent == null) {
                this.addElementDirect(TQ.Element.build(this, desc));
            } else {
                elements[i].parent.addChild(desc);
            }
        }
        this.dirtyZ = true;
    };

    Level.removeMarker = function(desc) {
        if (!desc.children) return;
        for (var i= 0; i < desc.children.length; i++) { // 去除Marker部分
            if (desc.children[i].type == "JointMarker") {
                desc.children.splice(i,1);
                break;
            }
        }
    };

    p.skinning = function (hostElement, skinElement) {
        assertNotNull(TQ.Dictionary.FoundNull, hostElement);
        assertNotNull(TQ.Dictionary.FoundNull, skinElement);
        hostElement.skinning(skinElement);
    };

    // 在整体模式下, 找到根物体； 在零件模式下， 返回子物体本身
    p.findAtom = function (displayObj) {
        // atom: 包括 元素element, 和 子元素subelement
        var result = null;
        for (var i = 0; i < this.elements.length; i++) {
            // 是结构性的虚拟物体, 例如Group的节点
            if ( (this.elements[i].displayObj != null)
                && (this.elements[i].displayObj.id != undefined)
                && (this.elements[i].displayObj.id == displayObj.id)) {
                return (result = this.elements[i]);
            } else {
                result = this.elements[i].findChild(displayObj);
                if (result != null ) {
                    if ((!TQ.InputCtrl.inSubobjectMode) && (!result.isJoint())) result = this.elements[i];
                    break;
                }
            }
        }
        return result;
    };

    p.pickOffChild = function(ele) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, ele);
        var id = this.elements.indexOf(ele);
        if (id >=0) {
            this.removeElementAt(id);
        } else {
            var parent = ele.parent;
            assertTrue(TQ.Dictionary.FoundNull, parent != null); // 应该有父元素
            if (parent) {
                parent.removeChild(ele);
            }
        }
        return ele;
    };

    p.addElement = function  (desc) {
        var newItem = TQ.Element.build(this, desc);
        return this.addElementDirect(newItem);
    };

    p.addElementDirect = function(ele)
    {
      assertNotNull(TQ.Dictionary.FoundNull, ele);
      // 记录新创建的元素到elements
      this.elements.push(ele);
      this.isDirty = true;
      // ToDo: 暂时关闭， 还需要多调试
      // if (! (ele.isSound() || ele.isGroupFile() || ele.isButton()) ) {
      //    TQ.SelectSet.add(ele);
      // }
      return ele;
    };

    /* 区别 delete 和 remove：
       remove: 只是移动， 从一个地方， 移到另外一个地方，比如： 在打包的时候， 从level下移到 复合体的下面。
       delete：包括了remove， 但是， 移到了 垃圾箱trash之中, 当undelete的时候， 可以恢复
    */
    p.deleteElementAt = function(i) {
        var ele = this.removeElementAt(i);
        if (ele != null) {
			ele.removeFromStage();
        	TQ.GarbageCollector.add(ele);
		}
        return ele;
    };

    p.removeElementAt = function(i) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, (i >=0) && (i < this.elements.length) ); // 数组超界
        return (this.elements.splice(i, 1))[0];
    };

    p.getElement = function (id) {
        if (this.elements.length <= 0) {
            assertFalse(TQ.Dictionary.INVALID_LOGIC, false);
            return null;
        }

        assertTrue("id < (this.elements.length)", id < (this.elements.length));
        id = (id < 0) ? 0: id;
        id = (id >= (this.elements.length -1)) ? (this.elements.length -1): id;
        return this.elements[id];
    };

    p.getSounds = function() {
        var result = [];
        if (this.resourceReady) {
            var num = this.elements.length;
            for (var i = 0; i < num; i++) {
                if (!this.elements[i].isSound) break;
                if (this.elements[i].isSound()) {
                    result.push(this.elements[i]);
                }
            }
        }

        return result;
    };

    p.setDisplaceX = function () {
        assertNotHere(TQ.Dictionary.isDepreciated); // "xxx0 已经被取代, 该函数将被取消"
    };

    p.onLoaded = function () {
        this.state = TQBase.LevelState.LOADED;
        this.build();  // 从Resource 到 canvas
        if (this.isWaitingForShow) {
          TQ.Log.info("onLoaded" + this.name);
          this.show();
        }
    };

    p.show = function () {
        TQ.Log.info("show level :" + this.name);
        if (this.dataReady) {
            TQ.Log.info("data ready");
            this.isWaitingForShow = false;
            this.onLevelCreated();
        } else {
            TQ.Log.info("data ready: NO");
            this.isWaitingForShow = true;
        }
    };

    p.build = function () {
        // 避免重复进入：
        if (this.dataReady) {
            return;
        }

        this.itemCounter = 0;
        var jsonElements = this.elements;
        this.elements = [];
        for (var i = 0; i < ((jsonElements != null) && (jsonElements.length)); i++) {
            if (!!jsonElements[i]) {
                this.addElementDirect(TQ.Element.build(this, jsonElements[i]));
            }
        }
        this.state = TQBase.LevelState.INITING;
        // ToDo: 是否应该分多个level, 来启动?
        TQ.SoundMgr.start();
        jsonElements = null;
        this.dataReady = true;
    };

    p.fixupButtons = function() {
        for (var i = 0; i < (this.elements.length); i++) {
            var ele = this.elements[i];
            if ((ele.isButton != undefined) && ele.isButton()) {
                ele.buildLinks();
            }
        }
    };

    p.findByDescID = function(descID) {
        for (var i = 0; i < (this.elements.length); i++) {
            var ele = this.elements[i];
            if (ele.jsonObj.id == descID) return ele;
        }

        return null;
    };

    p.setupPreloader = function () {
        // send to RM
        // 避免重复进入：
        if (!this.hasSentToRM) {
            this.hasSentToRM = true;
        } else {
            return;
        }

        var jsonElements = this.elements;
        for (var i = 0; i < ((jsonElements != null) && (jsonElements.length)); i++) {
            TQ.RM.addElementDesc(jsonElements[i]);
        }
    };

    p.addAllItems = function () {
        // add到stage， == 显示，show
        TQ.StageBuffer.open();
        var num = this.elements.length;
        for (var i = 0; i < num; i++) {
            this.elements[i].addItemToStage();
        }
        TQ.StageBuffer.close();
        this.state = TQ.SceneEditor.getMode();
    };

    p.addLastItems = function () {
        // add到stage， == 显示，show
        assertDepreciated(TQ.Dictionary.isDepreciated);
        assertTrue(TQ.Dictionary.isDepreciated, false); // "应该只在临时添加的时候, 才调用"
    };

    p.hitTest = function () {
        for (var i = 0; i < this.itemNum(); i++) {
            var displayObj = this.elements[i].displayObj;
            if (displayObj.hitTest(stage.mouseX, stage.mouseY)) {
                displayObj.alpha = 0.5;  // 加框子
                stage.update();
            }
        }
    };

    p.onLevelRunning  = null;
    p.onLevelCreated = function () {
        if ((this.state == TQBase.LevelState.INITING) ||
            (this.state == TQBase.LevelState.LOADED) ||
            (this.state == TQBase.LevelState.EXIT)) {
			 //后续场景loaded是通过RM完成的， 所以可能还是INITING状态
            this.setupTimer();
            // add all item to stage
            this.addAllItems();
            this.update(this._t);
            stage.update();
            this.watchRestart();
            this.state = TQ.SceneEditor.getMode();
            if (this.onLevelRunning != null) this.onLevelRunning();
        } else {
            assertNotHere(TQ.Dictionary.CurrentState + this.state);
        }
    };

    p.watchRestart = function () {
        // draw all elements to the canvas:
        stage.update();
    };

    p.update = function (t) {
        this.updateState();
        if (!this.dataReady) return;

        this._t = t; // 临时存储,供保留现场, 不对外
        // 如果是播放状态，
        for (var i = 0; i < this.elements.length; ++i) {
            if (!this.elements[i].TBD) {
                this.elements[i].update(t);
            } else {
                var thisEle = this.elements[i];
                this.elements[i].TBD = undefined;
                TQ.CommandMgr.directDo(new TQ.DeleteEleCommand(currScene, thisEle));
                i--;
            }
        }

        // 非播放状态
        if (this.isDirty) {
            stage.update();
        }
        if (this.dirtyZ) {
            this.persist();
        }
        this.dirtyZ = false;
        this.isDirty = false;
    };

    p.updateState = function () {
      TQ.Log.info("update state");
      if (this.state <= TQBase.LevelState.INITING) {
        if (this.resourceReady || TQ.RM.isEmpty){
          this.onLoaded();
        }
      }
    };

    p._removeAllItems = function () {
        // remove 从stage， 只是不显示， 数据还在
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].removeFromStage();
        }
    };

    p.delete = function () {
        // 如果是EXIT， 则已经被exit()函数处理过了，
        if ((this.state === TQBase.LevelState.EDITING) ||
            (this.state === TQBase.LevelState.RUNNING)) {
            this._removeAllItems();
        }
    };

    p.deleteElement  = function (ele) {
        // 删除数据， 真删除
        var found = false;
        for (var i = 0; i < this.elements.length; i++) {
            if (this.elements[i] == ele) {
                this.deleteElementAt(i);
                found = true;
                break;
            }

            // 检查是否子物体
            if  (this.elements[i].deleteChild(ele) == true) {
                found = true;
                break;
            }
        }
        if (found) {
            this.isDirty = true;
            return true;
        }
        assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
        return false;
    };

    /*
    stop sound, video, animations, etc.
     */
    p.stop = function() {
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].stop();
        }
    };

    p.play = function() {
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].play();
        }
    };

    p.exit = function () {
        TQ.SelectSet.clear();
        if ((this.state === TQBase.LevelState.EDITING) ||
            (this.state === TQBase.LevelState.RUNNING)) {
            this.sort(); // 退出本层之前, 必须保存 Z可见性顺序.
            this._removeAllItems();
        } else {
            // is loading
            console.log("is loading, or not loaded!");
        }
        TQ.SoundMgr.removeAll();
        this.state = TQBase.LevelState.EXIT;
    };

    p.prepareForJSONOut = function () { };

    p.afterToJSON = function () {
        if (this.dataReady) { // 只对load的 level做这个操作
          for (var i = 0; i < this.elements.length; i++) {
              this.elements[i].afterToJSON();
          }
        }
    };

    p.persist = function() {
        for (var i = 0; i < this.elements.length; i++) {  //持久化zIndex, 只在退出时, 而不是每一个Cycle, 以节约时间
            this.elements[i].persist();
        }
    };

    p.sort = function()
    {
        // 按照当前物体在显示列表中的顺序, 重新排列elements的数据.
        assertNotNull(this.elements);
        this.persist();
        this.elements.sort(TQ.Element.compare);
        for (var i = 0; i < this.elements.length; i++) {
            this.elements[i].sort();
        }
    };

    p.onItemLoaded = function (item) {
        this.itemCounter++;
        if ((this.state == TQBase.LevelState.EDITING) ||
            (this.state == TQBase.LevelState.RUNNING)) {
            TQ.Log.out(TQ.Dictionary.isDepreciated); // level.onItemLoaded: 应该只在临时添加的时候, 才调用
            // assertTrue("应该只在临时添加的时候, 才调用", false);
            item.addItemToStage();
        } else {
            // 正在 loading, 或者fixup, 由update来控制状态
        }
    };

    p.setupTimer = function () {
        if (TQ.FrameCounter.isPlaying()) {
            this._t = 0;
            TQ.FrameCounter.gotoBeginning();
        }
    };

    // 自动拓展微动漫的时间
    p.calculateLastFrame = function() {
        if (!this.dataReady) return this.tMaxFrame;
        // 在退出本level的时候才调用，以更新时间，
        //  ToDo: ?? 在编辑本Level的时候， 这个值基本上是没有用的
        var lastFrame = 0;
        for (var i=0; i< this.elements.length; i ++ ) {
            assertNotNull(TQ.Dictionary.FoundNull, this.elements[i]);
            if (!this.elements[i].calculateLastFrame) {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            } else {
                lastFrame = Math.max(lastFrame, this.elements[i].calculateLastFrame());
            }
        }
        this.tMaxFrame = lastFrame * 20; // 每秒20帧
        return lastFrame;
    };

    p.setTime = function (t) { this.tMaxFrame = t;};
    p.getTime = function() { return this.tMaxFrame;};
    p.setT0 = function(t0) { this.t0 = t0;};
    p.getT0 = function(t0) { return this.t0;};

    TQ.Level = Level;
}());

/**
 *  Overlay 存放的是系统用的咨询， 与用户创造的数据无关。
 *  所以， 程序启动之后， 初始化一次就够了，
 *  不需要在每次open/save/new文件的时候重新初始化。
 * */
window.TQ = window.TQ || {};

(function () {
    function Overlay(description) {
        this.initialize(description);
    }

    var p =Overlay.prototype = new TQ.Level();
    p.Level_update = p.update;
    p.Level_initialize = p.initialize;
    p.initialize = function (desc) {
        this.Level_initialize(desc);
        this.show();
    };

    p.update = function(deltaT) {
        this.Level_update(deltaT);
        if (null == stage.selectedItem)
        {
            this.hideClipPoint( true);
        } else {
            this.hideClipPoint(false);
        }
    };

    p.hideClipPoint = function(isVisible) {
        for (var i = 0; i < this.elements.length; ++i) {
            if (this.elements[i].isClipPoint() && (this.elements[i].displayObj != undefined )) {
                this.elements[i].show(isVisible);
            }
        }
    };

    TQ.Overlay = Overlay;
}());

/**
 * Tuqiang Game Engine
 * Copy right Tuqiang Tech
 * Created at : 12-11-12 下午4:38
 */

window.TQ = window.TQ || {};
(function () {

    function MessageBox(canvas) {
        this.messageField = new createjs.Text("", "bold 24px Arial", "#FF0000");
        this.messageField.maxWidth = 1000;
        this.messageField.textAlign = "center";
        this.messageField.x = canvas.width / 3;
        this.messageField.y = canvas.height / 3;
        this.messageField.visible = false;
        stage.addChild(this.messageField);
        // messageField.text = "开始载入。。。";
    }

    MessageBox.prototype.show = function(str) {
        if (!stage.contains(this.messageField)) {
            stage.addChild(this.messageField);
        }

        this.messageField.text = str;
        if (!this.messageField.visible) {
            this.messageField.visible = true;
        }
    };

    MessageBox.prototype.hide = function() {
        this.messageField.visible = false;
        stage.removeChild(this.messageField);
    };

    TQ.MessageBox = MessageBox;
} ());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Sound的Manager, 负责Sound的preload, play, stop, 等一系列工作.
 * 是singleton
 */
TQ = TQ || {};
(function () {
    function SoundMgr() {
    }

    SoundMgr.started = false;
    SoundMgr.isSupported = false;
    SoundMgr.items = [];
    SoundMgr.initialize = function() {
        SoundMgr.isSupported = true;
    };

    SoundMgr.start = function ()
    {
        if (!SoundMgr.isSupported) return;

        // ToDo: 不重复 start ??
        SoundMgr.started = true;
     };

    /*
      专门用于试听声音，同时只允许播放1个。 试听新的必须关闭旧的。
     播放声音文件，id就是fileName，是声音文件的路径和名称， （从服务器的根目录计算， 不带域名)，
     例如： "mcSounds/test1.mp3"
     */
    SoundMgr._auditioningInstance = null;
    SoundMgr.isPlaying = function (soundInstance) {
        if (!soundInstance) return false;
        return (soundInstance.playState == createjs.Sound.PLAY_SUCCEEDED); // 包括paused， 不包括已经播完的
    };
    SoundMgr.play = function(id) {
        if (!SoundMgr.isSupported) return;
        TQ.Log.info("start to play " + id);
        var item = TQ.RM.getResource(id);
        if (item) {
            if (!!SoundMgr._auditioningInstance) {
                if (SoundMgr.isPlaying(SoundMgr._auditioningInstance)) {
                    SoundMgr._auditioningInstance.stop();
                }
            }
            SoundMgr._auditioningInstance = createjs.Sound.play(TQ.RM.getID(item)); // 用Sound.play, 可以播放多个instance， 声音只用ID， 不要resouce data
        } else {
            TQ.RM.addItem(id, function() {SoundMgr.play(id);});
        }
    };

    SoundMgr.stop = function(id) {  createjs.Sound.stop(id); };
    SoundMgr.addItem =function(ele) {
        if (SoundMgr.items.indexOf(ele) >=0) { // 避免同一个元素（跨场景的），重复插入
            return;
        }
        SoundMgr.items.push(ele);
    };

    SoundMgr.deleteItem = function(ele) {
        var id = SoundMgr.items.indexOf(ele);
        if (id >= 0) {
            SoundMgr.items.splice(id, 1);
        }
    };

    SoundMgr.pause = function () {
        for (var i = SoundMgr.items.length; i--; ) {
            SoundMgr.items[i].pause();
        }
    };

    SoundMgr.resume = function () {
        var t = TQ.FrameCounter.t();
        for (var i = 0; i < SoundMgr.items.length; i++) {
            var ele = SoundMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
            if (ele.isMultiScene) {
        		var tt = currScene.toGlobalTime(t);
                ele.resume(tt);
            } else {
                ele.resume(t);
            }
        }
    };

    SoundMgr.stopAll = function() {
        for (var i = 0; i < SoundMgr.items.length; i++) {
            var ele = SoundMgr.items[i];  //保留下来，避免正在resume的时候， 播完了， 被remove
            ele.stop();
        }
        if (!!SoundMgr._auditioningInstance) {
            SoundMgr._auditioningInstance.stop();
        }
    };

    SoundMgr.removeAll = function()
    {
        // 只删除那些不跨场景的
        for (var i = SoundMgr.items.length - 1; i >=0; i--) {
            var ele = SoundMgr.items[i];
            if (ele.isMultiScene) continue;
            SoundMgr.items.splice(i,1);
        }
    };

    SoundMgr.close = function() {
        if (!SoundMgr.isSupported) return;
        SoundMgr.stopAll();
        // createjs.Sound.stop();  // 应该已经被stopAll取代了
        SoundMgr.removeAll();
        SoundMgr.items.splice(0); //在退出微创意的时候，清除跨场景声音
        SoundMgr.started = false;
    };

    TQ.SoundMgr = SoundMgr;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    var StageBuffer =function () {
    };
    StageBuffer.isBatchMode = true;
    StageBuffer.members = [];
    StageBuffer.open = function () { StageBuffer.isBatchMode = true;};
    StageBuffer.close = function () {
        StageBuffer.flush();
        StageBuffer.isBatchMode = false;
    };

    /*
    求上边界： 即: 在zIndex > z的范围中， 求最小的zIndex（在上边最靠近z）。
     */
    StageBuffer.findUpperBoundary = function(z) {
        if ((!currScene) || (!currScene.currentLevel) ||(!currScene.currentLevel.elements)) {
            return null;
        }
        if (z == -1) { // group 物体， 不需要进入stage
            return null;
        }
         return TQ.MathExt.findUpperBoundary(currScene.currentLevel.elements, z);
    };

    StageBuffer.add = function (ele) {
        if (StageBuffer.isBatchMode) {
            StageBuffer.members.push(ele);
        } else {
            var upperEle = StageBuffer.findUpperBoundary(ele.jsonObj.zIndex);
            ele._doAddItemToStage(upperEle);
        }
    };

    StageBuffer.flush = function () {
        assertTrue(TQ.Dictionary.MustBeBatchMode, StageBuffer.isBatchMode);
        StageBuffer.members.sort(TQ.Element.compare);
        for (var i = 0; i < StageBuffer.members.length; i++) {
            var ele = StageBuffer.members[i];
            var upperEle = StageBuffer.findUpperBoundary(ele.jsonObj.zIndex);
            ele._doAddItemToStage(upperEle);
        }
        StageBuffer.members.splice(0);
    };

    TQ.StageBuffer = StageBuffer;
}) ();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    var _rootBoneDefault = {};
    _rootBoneDefault.x = 0;
    _rootBoneDefault.y = 0;
    _rootBoneDefault.sx = 1;
    _rootBoneDefault.sy = 1;
    _rootBoneDefault.rotation = 0;
    _rootBoneDefault.M = TQ.Matrix2D.I();
    _rootBoneDefault.IM = TQ.Matrix2D.I();   // Inverse Matrix, 逆矩阵

    var poseDefault = {};
    function Pose () {}
    Pose.x = poseDefault.x = 0;
    Pose.y = poseDefault.y = 0;
    Pose.rotation = poseDefault.rotation = 0;
    Pose.sx = poseDefault.sx = 1;
    Pose.sy = poseDefault.sy = 1;
    Pose.visible = poseDefault.visible = 1;
    Pose.action = poseDefault.action = "idle";
    Pose._parentPoseWorld = null;

    Pose._toWorldCoordinate = function(poseWorld, parentPoseWorld) {
        // 物体坐标 ===>到 世界坐标下
        if (parentPoseWorld == null) {
            parentPoseWorld = _rootBoneDefault;
        }
        var M = TQ.Matrix2D.transformation(Pose.x, Pose.y, Pose.rotation, Pose.sx, Pose.sy);
        poseWorld.M = parentPoseWorld.M.multiply(M);
        poseWorld.IM = null;   // 必须清除上一个时刻的 IM,因为M变了,IM过时了, 但是, 不要计算, 等到用时再算.
        var Vjw = parentPoseWorld.M.multiply($V([Pose.x, Pose.y, 1]));
        poseWorld.x = Vjw.elements[0];
        poseWorld.y = Vjw.elements[1];
        if ((Vjw.elements[2]< 0.99) || (Vjw.elements[2]> 1.01) )
        {
            assertEqualsDelta(TQ.Dictionary.INVALID_PARAMETER, 1, Vjw.elements[2], 0.01); //齐次分量应该近似为1
        }
        poseWorld.rotation = parentPoseWorld.rotation + Pose.rotation;
        poseWorld.sx = parentPoseWorld.sx * Pose.sx;
        poseWorld.sy = parentPoseWorld.sy * Pose.sy;
        poseWorld.isVis = Pose.visible;
    };

    Pose.worldToObject = function(poseWorld, parentPoseWorld) {
        // 这是反变换:  世界坐标  ==> 物体坐标. 用于拍摄记录物体的操作, 不是播放.
        // 其中, 世界坐标中的参数, 必须完整.
        //   例如: 如果是平移变换, 那么只有平移变换的值是有意义的.
        //  其余参数, 如: 角度, 比例, 等等, 都是由以前的动画轨迹计算得来的, 保持不变即可.
        //   所以可以做到: 有选择地拍摄, 录制.

        // Pose 是一个公共的地方, 你不赋值, 它就是上一个elemenet留下的.
        if (parentPoseWorld == null) {
            parentPoseWorld = _rootBoneDefault;
        }
        if (parentPoseWorld.IM == undefined) {
            // 父矩阵是上一个迭代计算的, 对应拍摄的第一时刻, 没有.
            // 而且, 在播放的时候, 会生成新的M, 并清除上一个时刻的IM
            // ToDo:优化 如果正在拍摄, 可以直接利用拍摄的计算结果, 少算一次变换和矩阵.
            assertValid(TQ.Dictionary.ParentMatrixFromLastIteration, parentPoseWorld.M);
            parentPoseWorld.IM = parentPoseWorld.M.inverse();
        }
        assertValid(TQ.Dictionary.ParentMatrixFromLastIteration, parentPoseWorld.IM);
        var V = parentPoseWorld.IM.multiply($V([poseWorld.x, poseWorld.y, 1]));
        Pose.x = V.elements[0];
        Pose.y = V.elements[1];
        if ((V.elements[2]< 0.99) || (V.elements[2]> 1.01) )
        {
            assertEqualsDelta(TQ.Dictionary.INVALID_PARAMETER, 1, V.elements[2], 0.01);  //齐次分量应该近似为1
        }
        Pose._parentPoseWorld = parentPoseWorld;  //  保留， 因为后面的函数也要使用。
    };

    Pose.worldToObjectExt = function(poseWorld, parentPoseWorld) {
        Pose.worldToObject(poseWorld, parentPoseWorld);
        parentPoseWorld = Pose._parentPoseWorld; // 获取上个函数的修改（改 null为有意义的值）
        Pose.rotation = poseWorld.rotation - parentPoseWorld.rotation;
        Pose.sx = poseWorld.sx / parentPoseWorld.sx;
        Pose.sy = poseWorld.sy / parentPoseWorld.sy;

        // 维护矩阵, 供子孙使用
        var M = TQ.Matrix2D.transformation(Pose.x, Pose.y, Pose.rotation, Pose.sx, Pose.sy);
        poseWorld.M = parentPoseWorld.M.multiply(M);
        poseWorld.IM = poseWorld.M.inverse();
        assertNotNull(poseWorld.IM);  // 好习惯, 检查重要数据的出口, 确保是合格的

        Pose.visible = poseWorld.isVis;
    };

    TQ.poseDefault = poseDefault;
    TQ.Pose = Pose;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
window.TQ = window.TQ || {};

(function () {
    function OneTrack(value) {
        if ((value == undefined) || (value == null))
        {
            value = 0;
        }

        this.initialize(value);
    }

    var p = OneTrack.prototype;
    p.t = [];
    p.value = [];
    p.c = [];
    p.initialize = function (value) {
        var t = TQ.FrameCounter.t();
        if ((value.value == undefined) || (value.value == null)){
            this.t = [t];  // 只有一帧, 不能搞出来2
            this.value = [value];
            this.c = [1];
        } else {
            this.t = value.t;
            this.value = value.value;
            this.c = value.c;
        }
        this.tid1 = (value.tid1 == undefined) ? 0: value.tid1;
        this.tid2 = (value.tid2 == undefined) ? 0: value.tid2;
    };

    p.erase = function () {
        assertEqualsDelta("t == 0", 0, TQ.FrameCounter.t(), 0.001);
        this.initialize(this.value[0]);  // 简单地丢弃原来的轨迹数组, 重新建立一个新的
    };

    p.reset = function() {
        this.t = [this.t[0]];  // 只有一帧, 不能搞出来2
        this.value = [this.value[0]];
        this.c = [1];
        this.tid1 = 0;
        this.tid2 = 0;
    };

    TQ.OneTrack = OneTrack;
})();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
TQ = TQ || {};

(function () {
    function AnimeTrack (desc) {
        this.initialize(desc);
    }
    var p = AnimeTrack.prototype;
    p.erase = function(track) {
        if (this.x) this.x.erase();
        if (this.y) this.y.erase();
        if (this.rotation) this.rotation.erase();
        if (this.sx) this.sx.erase();
        if (this.sy) this.sy.erase();
        if (this.visible) this.visible.erase();
    };

    p.initialize = function(desc)
    {
        assertNotNull(TQ.Dictionary.FoundNull, desc); // 应该在element已经验证了, 补全了
        assertNotNull(TQ.Dictionary.FoundNull, desc.x);
        assertNotNull(TQ.Dictionary.FoundNull, desc.y);
        assertNotNull(TQ.Dictionary.FoundNull, desc.rotation);
        assertNotNull(TQ.Dictionary.FoundNull, desc.sx);
        assertNotNull(TQ.Dictionary.FoundNull, desc.sy);
        if ((desc.animeTrack == undefined) || (desc.animeTrack == null)
            || (desc.animeTrack.x == undefined) || (desc.animeTrack.x == null)) {
            this.x = new TQ.OneTrack(desc.x);
        } else {
            this.x = new TQ.OneTrack(desc.animeTrack.x);
        }

        if ((desc.animeTrack == undefined) || (desc.animeTrack == null)
            || (desc.animeTrack.y == undefined) || (desc.animeTrack.y == null)) {
            this.y = new TQ.OneTrack(desc.y);
        } else {
            this.y = new TQ.OneTrack(desc.animeTrack.y);
        }

        if ((desc.animeTrack == undefined) || (desc.animeTrack == null)
            || (desc.animeTrack.rotation == undefined) || (desc.animeTrack.rotation == null)) {
            this.rotation = new TQ.OneTrack(desc.rotation);
        } else {
            this.rotation = new TQ.OneTrack(desc.animeTrack.rotation);
        }

        if ((desc.animeTrack == undefined) || (desc.animeTrack == null)
            || (desc.animeTrack.sx == undefined) || (desc.animeTrack.sx == null)) {
            this.sx = new TQ.OneTrack(desc.sx);
        } else {
            this.sx = new TQ.OneTrack(desc.animeTrack.sx);
        }

        if ((desc.animeTrack == undefined) || (desc.animeTrack == null)
            || (desc.animeTrack.sy == undefined) || (desc.animeTrack.sy == null)) {
            this.sy = new TQ.OneTrack(desc.sy);
        } else {
            this.sy = new TQ.OneTrack(desc.animeTrack.sy);
        }

        if ((desc.animeTrack == undefined) || (desc.animeTrack == null)
            || (desc.animeTrack.visible == undefined) || (desc.animeTrack.visible == null)) {
            this.visible = new TQ.OneTrack(desc.isVis);
        } else {
            this.visible = new TQ.OneTrack(desc.animeTrack.visible);
        }

        // action, 如果有，则建立它； 如果没有， 不补充；
        if ((desc.animeTrack) && (desc.animeTrack.action)) {
            this.action = new TQ.OneTrack(desc.animeTrack.action);
        }
    };

    AnimeTrack.validate = function(tracks) {
        AnimeTrack._validateOne(tracks.x);
        AnimeTrack._validateOne(tracks.y);
        AnimeTrack._validateOne(tracks.rotation);
        AnimeTrack._validateOne(tracks.sx);
        AnimeTrack._validateOne(tracks.sy);
        AnimeTrack._validateOne(tracks.visible);
    };

    AnimeTrack._validateOne = function(track) {
        track.tid1 = (track.tid1 == undefined) ? 0: track.tid1;
        track.tid2 = (track.tid2 == undefined) ? 0: track.tid2;
    };

    AnimeTrack.calculateLastFrame = function(track) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, !!track);
        var tMax = 0;
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.x));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.y));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.sx));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.sy));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.rotation));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.visible));
        return tMax;
    };

    AnimeTrack.hideToNow = function(ele, t) {
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, 0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t, true, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    AnimeTrack.hide = function(ele, t) {
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, 0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    AnimeTrack.unHide = function(ele, t) {
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, 0, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t, true, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    AnimeTrack.setButton = function(ele, t) {
        var lifeTime = 3/20; // 3 frame;
        // var currentTime = TQ.FrameCounter.t();
        ele.animeTrack.visible.reset();
        AnimeTrack.hideToNow(ele, t);
        TQ.TrackRecorder.recordOneTrack(ele.animeTrack.visible, t + lifeTime, false, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    TQ.AnimeTrack = AnimeTrack;
})();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  解释动画轨迹的数据， 计算每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function TrackDecoder()
    {

    }
    TrackDecoder.LINE_INTERPOLATION = 1;
    TrackDecoder.JUMP_INTERPOLATION = 0;
    /*  animeTrack(Object coordinate) ==> World coordinate
     *  插值t时刻的轨迹，并保存到时间坐标系（jsonObj）之中，供绘制
     *  animeTrack: 保存关节点的运动数据，是在父物体坐标系下， 而且是经过关节点改进的父物体坐标系）。
     *  jsonObj 是世界坐标系下的绝对运动数据，（可以直接送给绘图设备变换系统）
     *
     */
    TrackDecoder.calculate = function (track, jsonObj, t) {
        // 计算本物体坐标系下的值
        TQ.Pose.rotation = ((track.rotation == undefined) || (track.rotation == null)) ?
            TQ.poseDefault.rotation : TrackDecoder.calOneTrack(track.rotation, t);

        TQ.Pose.x = ((track.x == undefined) || (track.x == null)) ?
            TQ.poseDefault.x : TrackDecoder.calOneTrack(track.x, t);

        TQ.Pose.y = ((track.y == undefined) || (track.y == null)) ?
            TQ.poseDefault.y : TrackDecoder.calOneTrack(track.y, t);

        TQ.Pose.sx = ((track.sx == undefined) || (track.sx == null)) ?
            TQ.poseDefault.sx : TrackDecoder.calOneTrack(track.sx, t);

        TQ.Pose.sy = ((track.sy == undefined) || (track.sy == null)) ?
            TQ.poseDefault.sy : TrackDecoder.calOneTrack(track.sy, t);

        TQ.Pose.visible = ((track.visible == undefined) || (track.visible == null)) ?
            TQ.poseDefault.visible : TrackDecoder.calOneTrack(track.visible, t);
    };

    TrackDecoder.calOneTrack = function (track, t) {
        TrackDecoder.searchInterval(t, track);
        if (track.tid1 == track.tid2) {
            // assertTrue("只有1帧或者时间出现负增长, ",track.tid1 == 0 );
            // track.tid1 = 0;
            return track.value[track.tid1];
        }
        var t1 = track.t[track.tid1];
        var t2 = track.t[track.tid2];
        var v1 = track.value[track.tid1];
        var v2 = track.value[track.tid2];
        var v = v1; //不插补， 脉冲替换, 适用于 正向播放， 不是倒放

        if (t1 > t2) {  // 容错, 发现错误的轨迹数据
            TQ.Log.out("Data Error, Skip t=" + t + " t1=" + t1 +" t2 = " + t2 +" id1=" +track.tid1 + " tid2=" + track.tid2);
            return v1;
        }

        if (t <= t1) {  // 下超界
            v = v1;
        } else if (t >= t2) { //  上超界，
            v = v2;
        } else {
            if (track.c[track.tid2] == TrackDecoder.LINE_INTERPOLATION) { // 0： interpolation
                v = ((t - t1) * (v1 - v2) / (t1 - t2)) + v1;
            } else {
                v = v1;
            }
        }
        return v;
    };

    TrackDecoder.searchInterval = function(t, track)
    {
        assertValid(TQ.Dictionary.INVALID_PARAMETER, track.tid1);  //"有效的数组下标"
        // 处理特殊情况, 只有1帧:
        if (track.t.length<=1) {
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, track.tid1 == 0 ); //只有1帧
            track.tid1 = track.tid2 = 0;
            return;
        }

        // 确定下边界: t1, 比 t小
        var tid1 = track.tid1;
        if (t < track.t[tid1]) {
            for (; t <= track.t[tid1]; tid1--) {
                if (tid1 <= 0) {
                    tid1 = 0;
                    break;
                }
            }
        }
        var tid2 = TQ.MathExt.range(tid1 + 1, 0, (track.t.length -1));

        // 确定上边界: t2, 比 t大, 同时,容错, 跳过错误的轨迹数据, 在中间的
        if ( t > track.t[tid2]) {  //  1) 下边界太小了, 不是真正的下边界; 2) 在录制时间段之外;
            for (; t > track.t[tid2]; tid2++) {
                if ( track.t[tid1] >  track.t[tid2]) {
                    //TQ.Log.out("data error, skip t=" + t + " t1=" + track.t[tid1] +" t2 = " + track.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
                }
                if (tid2 >= (track.t.length -1)) {
                    tid2 = track.t.length -1;
                    break;
                }
            }
        }

        tid1 = TQ.MathExt.range(tid2 - 1, 0, (track.t.length -1));
        if (track.t[tid1] > track.t[tid2]) {  // 容错, 发现错误的轨迹数据, 在末尾
            // TQ.Log.out("data error, skip t=" + t + " t1=" + track.t[tid1] +" t2 = " + track.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
            tid2 = tid1;
        }
        track.tid1 = tid1;
        track.tid2 = tid2;
    };

    TrackDecoder.calculateLastFrame = function(track) {
        var tMax = 0;
        if ( (!track) || (!track.t)) {return tMax;}
        var num = track.t.length;
		tMax = track.t[0];
        if (num > 1) { // 数据合理性检查
            for (var i = 1; i < num; i++) {
                assertTrue(TQ.Dictionary.INVALID_LOGIC, tMax <= track.t[i]);
                tMax = Math.max(tMax, track.t[i]);
            }
        }

        tMax = track.t[num - 1];
        return tMax;
    };
    TQ.TrackDecoder = TrackDecoder;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  记录每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function TrackRecorder()
    {

    }
    TrackRecorder.style = TQ.TrackDecoder.LINE_INTERPOLATION;
    TrackRecorder.initialize = function () {};

    // 参见: Decorder的说明
    TrackRecorder.record = function (element, t) {
        var track = element.animeTrack;
        var jsonObj = element.jsonObj;
        // TQ.Pose 中已经是物体空间的值(在Update中调用的), 如果是成组的或者Bone运动,则是父物体坐标系下的值.
        // ToDo: 2 记录单个的操作, 而不是每次都记录所有的轨道

        // 记录本物体坐标系下的值
        if ((track == undefined) || (track == null)) {
            // 第一次动画记录, 需要先初始化动画轨迹
            track = element.animeTrack = new TQ.AnimeTrack(jsonObj);
            assertNotUndefined(TQ.Dictionary.FoundNull, track);
        }
        if ((track.rotation == undefined) || (track.rotation == null)) {
            assertNotUndefined(TQ.Dictionary.FoundNull, track.tid1);
        }

        if ((track.rotation == undefined) || (track.rotation == null)) {
            track.rotation =new TQ.OneTrack(TQ.Pose.rotation);
        } else {
            if (element.hasFlag(TQ.Element.ROTATING)) {
                TrackRecorder.recordOneTrack(track.rotation, t, TQ.Pose.rotation, TrackRecorder.style);
            }
        }

        if ((track.x == undefined) || (track.x == null)) {
            new TQ.OneTrack(TQ.Pose.x);
        } else {
            if (element.hasFlag(TQ.Element.TRANSLATING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.x, t, TQ.Pose.x, TrackRecorder.style);
                }
            }
        }

        if  ((track.y == undefined) || (track.y == null)) {
            new TQ.OneTrack(TQ.Pose.y);
        } else {
            if (element.hasFlag(TQ.Element.TRANSLATING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.y, t, TQ.Pose.y, TrackRecorder.style);
                }
            }
        }

        if ((track.sx == undefined) || (track.sx == null)) {
            track.sx =  new TQ.OneTrack(TQ.Pose.sx);
        } else {
            if (element.hasFlag(TQ.Element.SCALING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.sx, t, TQ.Pose.sx, TrackRecorder.style);
                }
            }
        }

        if ((track.sy == undefined) || (track.sy == null)) {
            track.sy =  new TQ.OneTrack(TQ.Pose.sy);
        } else {
            if (element.hasFlag(TQ.Element.SCALING)) {
                if (!element.isJoint() || TQ.InputCtrl.inSubobjectMode) {
                    TrackRecorder.recordOneTrack(track.sy, t, TQ.Pose.sy, TrackRecorder.style);
                }
            }
        }

        if ((track.visible == undefined) || (track.visible == null)) {
            track.visible =  new TQ.OneTrack(TQ.Pose.visible);
        } else {
            if (element.hasFlag(TQ.Element.VISIBLE_CHANGED)) { // 允许改变关节物体各个关节的可见性
                TrackRecorder.recordOneTrack(track.visible, t, TQ.Pose.visible, TQ.TrackDecoder.JUMP_INTERPOLATION);
                element.clearFlag(TQ.Element.VISIBLE_CHANGED);
            }
        }

        element.clearFlag(TQ.Element.TRANSLATING | TQ.Element.ROTATING | TQ.Element.SCALING
            | TQ.Element.ALPHAING | TQ.Element.ZING | TQ.Element.VISIBLE_CHANGED);
    };

    TrackRecorder.erase = function (element) {
        element.animeTrack.erase();
    };

    TrackRecorder.recordOneTrack = function (track, t, v, interpolationMethod) {
        assertNotNull(TQ.Dictionary.FoundNull, track);
        assertNotUndefined(TQ.Dictionary.FoundNull, track.tid1);
        assertNotNull(TQ.Dictionary.FoundNull,track.tid1);
        interpolationMethod = (interpolationMethod==null)? TQ.TrackDecoder.LINE_INTERPOLATION : interpolationMethod;
        TQ.TrackDecoder.searchInterval(t, track);
        var tid1 = track.tid1;
        var tid2 = track.tid2;

        // 相等的情况, 只修改原来帧的值, 不增加新的帧
        var EPSILON = 0.01;
        var rewrite = false;
        if ( Math.abs(t - track.t[tid1]) < EPSILON ) {
            id = tid1;
            rewrite = true;
        } else if ( Math.abs(t - track.t[tid2]) < EPSILON ) {
            id = tid2;
            rewrite = true;
        }

        if (rewrite) {
            track.value[id] = v;
            track.c[id] = interpolationMethod;
            return v;
        }

		    // 以下添加新的帧
        var id = tid2;      // 在tid2位置插入: 正好查到区间内 [t1, t, t2]
        if (t >= track.t[tid2]) { // 在末尾插入 [t1, t2, t]
            id = tid2+1;
        } else if (t < track.t[tid1]) { // 在前面插入 [t, t1, t2]
            id = tid1;
        }

        // 直接记录, 不优化
        track.t.splice(id, 0, t);
        track.c.splice(id, 0, interpolationMethod);
        track.value.splice(id, 0, v);
        return v;
    };

    TQ.TrackRecorder = TrackRecorder;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  解释动画轨迹的数据， 计算每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function ActionDecoder()
    {

    }

    ActionDecoder.calculate = function (track, t) {
        TQ.Pose.action = (!track.action) ?
            TQ.poseDefault.action : TQ.TrackDecoder.calOneTrack(track.action, t);

        if (!TQ.Pose.action) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.Pose.action);
            TQ.Pose.action = ActionDecoder._findValidName(track.action.value);
        }
        return TQ.Pose.action;
    };

    ActionDecoder._findValidName = function(names) {
        for (var i = 0; i < names.length; i++) {
            if (!names[i]) continue;
            return names[i];
        }
    };

    TQ.ActionDecoder = ActionDecoder;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  记录每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

    function ActionRecorder()
    {

    }
    ActionRecorder.style = TQ.TrackDecoder.LINE_INTERPOLATION;
    ActionRecorder.initialize = function () {};

    // 参见: Decorder的说明
    ActionRecorder.record = function (element, actionName, t) {
        var track = element.animeTrack;
        var jsonObj = element.jsonObj;

        if (!actionName) {
            assertFalse(TQ.Dictionary.INVALID_LOGIC, !actionName);
            return;
        }

        // 记录本物体坐标系下的值
        if ((track == undefined) || (track == null)) {
            // 第一次动画记录, 需要先初始化动画轨迹
            track = element.animeTrack = new TQ.AnimeTrack(jsonObj);
            assertNotUndefined(TQ.Dictionary.FoundNull, track);
        }

        if (!track.action) {
            track.action =  new TQ.OneTrack(actionName);
        } else {
            if (element.hasFlag(TQ.Element.ACTION_CHANGED)) { // 允许改变关节物体各个关节的可见性
                TQ.TrackRecorder.recordOneTrack(track.action, t, actionName, TQ.TrackDecoder.JUMP_INTERPOLATION);
                element.clearFlag(TQ.Element.ACTION_CHANGED);
            }
        }
    };

    TQ.ActionRecorder = ActionRecorder;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

// ToDo: 暂停期间 的时间，要去除， 确保， resume之后 的动作与pause时候的动作是连续播放的，
(function () {
     /**
     * Action: 动作， 表示一个动作的名称， 起始帧，结束帧，循环方式
     * 循环方式： -1： 无限循环， 0： 单帧， 1： 只播放1次， N： 播放N次。
     * @param name
     * @param startFrame
     * @param endFrame
     * @param repeatStyle
     * @param gifIconID
     * @constructor
     */
    function Action(name, startFrame, endFrame, repeatStyle, gifIconID) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, endFrame >= startFrame);
        assertFalse(TQ.Dictionary.INVALID_PARAMETER, !gifIconID);
        this.name = name;
        this.fs = startFrame;  //  该动作 从 [ts, te]
        this.F = endFrame - startFrame;  // 命令的时长,周长是 T
        this.n = 0; // 第一次播放，
        this.style = repeatStyle;
        this.state = Action.STOP;
        this.gifIconID = gifIconID;
        // this.initialize(jsonObj);
    }
    Action.STOP = 0;
    Action.PLAYING = 1;

    Action.STYLE_REPEAT = -1;
    Action.STYLE_1 = 1;   //     只播放1次
    var p = Action.prototype;
    p.play = function (t) {
        this.tc = t;  // 发布命令command的时间是 tc
        this.state = Action.PLAYING;
        this.T = TQ.FrameCounter.f2t(this.F);
        this.ts = TQ.FrameCounter.f2t(this.fs);
        this.tcn = this.tc + (this.n * this.T);   // tcn 是周期性的tc， 第n次播放时的相对起点
        this.te = this.tcn + this.T;
    };

    p.tMapping = function(t) {
        if ((t < this.tcn) || (t > this.te)) { // 配合倒退， 重播，等, 确保 t 在区间[tcn, te]内
            if (this.style == Action.STYLE_REPEAT) {  // 循环者， 修改tcn,te, n
                if (this.T > 0) {
                    this.n = Math.floor((t - this.tc)/ this.T);
                    if (t < this.tc) {
                        this.n -= 1;
                    }
                    this.tcn = this.tc + (this.n * this.T);
                    this.te = this.tcn + this.T;
                } else {
                    this.tcn = t;
                    this.te = t;
                }
            } else {  // 非循环者， 不修改tcn,te, n， 只限制t值在范围内
                t = TQ.MathExt.range(t, this.tcn, this.te);
            }
        }

        assertTrue(TQ.Dictionary.INVALID_PARAMETER, t >= this.tcn);
        return (this.ts + (t - this.tcn));
    };

    p.stop = function () {
        this.state = Action.STOP;
    };

    p.isPlaying = function() {
        return (this.state == Action.PLAYING);
    };

    TQ.Action = Action;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    /**
     * Animation, 是带有多个action的动作集合， Element是最多只有一个动作的元素。
     * @param jsonObj
     * @constructor
     */
    function Animation(jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string');
        this.currentAction = null;
        this.actionTable = [];
        this.fixedUp(jsonObj);  //用于从数据文件建立动画
    }

    var p = Animation.prototype;
    Animation.unitTest = function(ele) {
        ele.addAction("idle", 1, 50, TQ.Action.STYLE_REPEAT);
        ele.addAction("work", 60, 120, TQ.Action.STYLE_REPEAT);
        ele.addAction("run", 130, 150, TQ.Action.STYLE_REPEAT);
        ele.addAction("smile", 160, 180, TQ.Action.STYLE_1);
        ele.addAction("stand", 181, 200, TQ.Action.STYLE_1);
    };

    /*
    用于从数据文件建立动画
     */
    p.fixedUp = function(jsonObj) {
        if ((jsonObj != null) && (jsonObj.actionTable != null)) {
            for (var i = 0; i < jsonObj.actionTable.length; i++) {
                var actionJson = jsonObj.actionTable[i];
                var fs = Number(actionJson.fs);
                var fe = fs + Number(actionJson.F);
                if (!actionJson.gifIconID) {
                    actionJson.gifIconID = TQ.Utility.getDefultActionIcon();
                }
                this.addAction(new TQ.Action(actionJson.name, fs, fe, actionJson.style, actionJson.gifIconID));
            }
        }
    };

    p.play = function (actionName) {
        this.currentAction = this._findAction(actionName);
        if (this.currentAction == TQ.ERROR) {
            TQ.MessageBubble.show(TQ.Dictionary.NAME_NOT_EXIST);
            if (actionName != "idle") {
                this.play("idle");
            }
        } else {
            this.currentAction.play(TQ.FrameCounter.t());
        }
    };

    p.pause = function () {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, this.currentAction);
        if (this.currentAction != null) {
            this.currentAction.stop();
        }
    };

    p.resume = function() {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, this.currentAction);
        if (this.currentAction != null) {
            this.currentAction.resume();
        }
    };

    p.stop = function () {
        assertNotNull(TQ.Dictionary.INVALID_PARAMETER, this.currentAction);
        if (this.currentAction != null) {
            this.currentAction.stop();
            this.currentAction = null;
        }
    };

    p.addAction = function(action, forceToUpdate) {
        var id  = this._findActionID(action.name);
        if (id != TQ.ERROR) { // 避免重复同名的动作, （如果已经有同名的， 则替换之）
            if (!forceToUpdate) {
                return false;
            }
            this.actionTable[id] = action;
        } else {
            this.actionTable.push(action);
        }
        return true;
    };

    p.deleteAction = function(name) {
        var id = this._findActionID(name);
        if (id == TQ.ERROR) {
            TQ.MessageBubble.show(TQ.Dictionary.INVALID_PARAMETER + name);
        } else {
            this.actionTable.splice(id, 1);
        }
    };

    // private function
    p._findActionID = function(actionName) {
        for (var i = 0; i < this.actionTable.length; i++) {
            if (this.actionTable[i].name == actionName) {
                return i;
            }
        }

        return TQ.ERROR; // !!!不能是null, 因为它和[0]元素是一样的。
    };

    p._findAction = function(actionName) {
        var id = this._findActionID(actionName);
        if (id != TQ.ERROR) {
            return this.actionTable[id];
        }
        return TQ.ERROR; // !!!不能是null, 因为它和[0]元素是一样的。
    };

    p.isAnimation = function() { return true; };
    p.isPlaying = function() { return ((this.currentAction != null) && (this.currentAction.isPlaying())); };
    p.hasAction = function(actionName) {
        return ((this._findAction(actionName) == TQ.ERROR) ? false :  true);
    };

    TQ.Animation = Animation;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    /**
     * MultiView, 是带有多个view的元素集合， 模仿3D物体， 同时只能有一个元素可见。
     * @param jsonObj
     * @constructor
     */
    function MultiView(jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string');
        this.viewID = 0; // 默认显示第一个视图的元素
        this.fixedUp(jsonObj);  //用于从数据文件建立动画
    }

    var p = MultiView.prototype;

    p.fixedUp = function(jsonObj) {
        if ((jsonObj != null) && (jsonObj.viewID != null)) {
            this.viewID = jsonObj.viewID;
        }
    };

    p.setupView = function() {
        TQ.InputMap.registerAction(TQ.InputMap.LEFT_ARROW, function() {
            var ele = TQ.SelectSet.peek();
            if ((ele != null) && (ele.viewCtrl != null)) {
                ele.viewCtrl.changeView(-1);
            }
        });
        TQ.InputMap.registerAction(TQ.InputMap.RIGHT_ARROW, function() {
            var ele = TQ.SelectSet.peek();
            if ((ele != null) && (ele.viewCtrl != null)) {
                ele.viewCtrl.changeView(1);
            }
        });
    };

    p.changeView = function(adjust) {
        if (this.parent == null)  return;

        this.viewID += adjust;
        var num = this.parent.children.length;
        this.viewID  = TQ.MathExt.range(this.viewID, 0, num-1 );
        for (var i = 0; i < num; i++) {
            var e = this.parent.children[i];
            e.show(i == this.viewID);
        }
    };

    p.hideView = function() {
        if ((!this.parent) || (!this.parent.children)) return;

        var t = TQ.FrameCounter.t();
        var num = this.parent.children.length;
        for (var i = 0; i < num; i++) {
            var e = this.parent.children[i];
            TQ.AnimeTrack.hide(e, t);
        }
    };

    p.unHideView = function() {
        var t = TQ.FrameCounter.t();
        var num = this.parent.children.length;
        for (var i = 0; i < num; i++) {
            var e = this.parent.children[i];
            TQ.AnimeTrack.unHide(e, t);
        }
    };

    p.attachTo = function(host) {
        if (host != null) {
            this.parent = host;
            host.viewCtrl = this;
            this.setupView();
            this.hideView();
            this.changeView(0);
        }
    };

    p.detach = function(host) {
        if (host != null) {
            this.unHideView();
            this.parent = null;
            host.viewCtrl = null;
        }
    };

    p.toJSON = function()
    {
        return this.viewID;
    };

    p.isMultiView = function() { return true; };

    TQ.MultiView = MultiView;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function Element(level, desc) {
        if (level != null) {  // 适用于 子类的定义, 不做任何初始化,只需要prototype
            this.level = level;
            this.children = [];
            this.decorations = null;
            this._isNewSkin = false;
            this._isHighlighting = false;
            this.animeCtrl = null;
            this.viewCtrl = null;
            this.state = (desc.state == undefined) ? 0 : desc.state;
            this.dirty = this.dirty2 = false;
            this.initialize(desc);
        }
    }

    Element.VER1 = "V1";
    Element.VER2 = "V2"; // 从2014-3-2日开始使用

    // 0x01--0x1F是固定结构部分，    需要保存到WDM文件中；之后的高位是动态的
    Element.JOINTED = 0x02;     // 关节体中的所有子物体,不包括根关节自己.
    Element.ROOT_JOINT = 0x04;  // 根关节自己, 版本V2开始添加
    Element.BROKEN = 0x10; // 相对运动: 子物体可以独立运动,也随父物体移动(布局用).绝对运动: 只能整体运动, 或者IK运动.

    // 以下是操作, 对应于唯一的动画track
    Element.TRANSLATING = 0x20; // 被操作之后, 马上值为真, 以便于拍摄记录
    Element.ROTATING = 0x40;
    Element.SCALING = 0x80;
    Element.ALPHAING = 0x100;
    Element.ZING = 0x200;
    Element.VISIBLE_CHANGED = 0x400;
    Element.ACTION_CHANGED = 0x800;

    // 元素的类别
    Element.ETYPE_BACKGROUND = 1; //1 背景，
    Element.ETYPE_PROP = 2; // 道具
    Element.ETYPE_CHARACTER = 3; // 人物
    Element.ETYPE_TEXT = 4; // 文字
    Element.ETYPE_EFFECT = 5; //5 特效，
    Element.ETYPE_BUTTON = 6; //按钮
    Element.ETYPE_AUDIO = 7; // 声音
    Element.ETYPE_PART = 8; // 零件

    // 元素的类别资源类别
    Element.TYPE_BITMAP = 2; // 图片
    Element.TYPE_COMPONENT = 3; // 元件
    Element.TYPE_BUTTON = 4; // 按钮
    Element.TYPE_AUDIO = 11; // 声音

    Element.TO_RELATIVE_POSE = (Element.TRANSLATING | Element.ROTATING | Element.SCALING
        | Element.ZING | Element.ALPHAING);  //  在组成Group, Joint, 显示 Pivot Marker的时候需要.
    Element.CLEAR_ANIMATATION = 0x8000; //清除全部track, 重新记录;
    Element.IN_STAGE = 0x10000; // 加入到了Stage;
    Element.LOADED = 0x20000; //

    Element.showHidenObjectFlag = false;  //  个人的state由个人记录, 上级可以控制
    var p = Element.prototype;
    p.loaded = false;
    p.jsonObj = null;
    p.displayObj = null;
    p.parent = null;
    p.children = [];  //  注意： 缺省是空数组， 不是null， 确保每一个参数都有缺省值！！！
    p.animeTrack = {}; // 只是数组指针, 和jsonObj 共用数据, 没有重复

    p.show = function (isVisible) {
        if (this.displayObj == undefined) return;
        this.jsonObj.isVis = isVisible;
        if (this.jsonObj.isVis && !this.hasFlag(Element.IN_STAGE)) {
            TQ.Log.out(TQ.Dictionary.INVALID_LOGIC); // show + _doAddItemToStage 飞线, 适用于: 1) load之时不可见的元素, 2) marker初次创建时, 不可见
            TQ.StageBuffer.add(this);
        }
        //ToDo: 留给显示函数做, 不能一竿子插到底,  this.displayObj.visible = isVisible;
        this.dirty2 = true;
        this.setFlag(Element.VISIBLE_CHANGED);

        // show命令， 只是改变这个实体本身的可见性标志，不能直接传遍所有孩子。
        // 其孩子的实际可见性 = 父物体实际可见性 && 孩子的可见性标志 ，
        // 详细见： setTRSAVZ() 和 isVisible()
    };

    p.toggleVisibility = function () {
        this.show(!this.jsonObj.isVis);
    };

    // Add image item
    p.initialize = function (desc) {
        this.id = createjs.UID.get();
        if ((this.level.state == TQBase.LevelState.EDITING) ||
            (this.level.state == TQBase.LevelState.RUNNING)) {
            // 如果所需资源都在RM， 则直接init， 否则，sent到RM， 要求调入。完成后， 再init
            if (((desc.type == "SOUND") || (desc.type == "Bitmap") || (desc.type == "BUTTON"))
                && (!TQ.RM.hasElementDesc(desc))) {
                TQ.RM.addElementDesc(desc);
                (function (pt) {
                    TQ.RM.setPaused(true);
                    if (!TQ.RM.isEmpty) {
                        TQ.RM.onCompleteOnce(function () {
                            pt.initialize(desc);
                        });
                    }
                    TQ.RM.setPaused(false);
                })(this);
                return this;
            }
        }

        this.dirty = false;
        this.dirty2 = false;  // 仅当需要在game循环之外调用element.update强制"拍摄"的时候令它为true
        this.version = desc.version;
        desc.x = (desc.x == null) ? 0 : desc.x;
        desc.y = (desc.y == null) ? 0 : desc.y;
        this.jsonObj = this.fillGap(desc);
        switch (desc.type) {
            case "GroupFile" :
                this._addComponent(desc);
                break;
            case "Text" :
                this.load(desc);
                break;
            case "Group" :
                this.load(desc);
                break;
            case "Bitmap":
                this.load(desc);
                break;
            case "SOUND" :
                this.load(desc);
                break;
            case "BitmapAnimation":
                this._addActorByUrl(desc, null);
                break;
            default:
                this.load(desc);
        }

        /// assertTrue("错误的元素信息: " + JSON.stringify(itemURL), false);
        return null;
    };

    p._initializeComponent = function (desc) {
        TQ.StageBuffer.open();
        this.initialize(desc);
        TQ.StageBuffer.close();
    };

    p._addComponent = function (jsonFiledesc) {
        this.children = [];
        // 调入 json文件, 取其中的 elements
        (function (pt) {
            netOpen(jsonFiledesc.src, function (jqResponse) {
                try {
                    var desc = JSON.parse(jqResponse);
                } catch (e) {
                    displayInfo2(jqResponse);
                    TQ.Log.error(jqResponse + ". " + e.toString());
                    // 给一个空白文件， 确保可可持续进行
                    desc = TQ.Utility.getEmptyScene();
                }

                desc = pt._extractComponent(desc, jsonFiledesc.x, jsonFiledesc.y, jsonFiledesc.zIndex);
                desc.t0 = jsonFiledesc.t0;

                TQ.RM.setPaused(true);
                if (!TQ.RM.isEmpty) {
                    TQ.RM.onCompleteOnce(function () {
                        pt._initializeComponent(desc);
                        TQ.SelectSet.add(pt);
                    });
                    TQ.RM.setPaused(false);
                } else { // 资源都已经装入了，
                    TQ.RM.setPaused(false);
                    pt._initializeComponent(desc);
                }
            });
        })(this);

        // 对元件文件, 生成了一个Group，他们也需要 一个 animeTrack
        this.animeTrack = this.jsonObj.animeTrack;
    };

    p._loadComponent = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并
        // 建立空的 displayObj 以容纳设备空间的参数
        this.displayObj = {};
        this.loaded = true;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    Element.liftZ = function (jsonObj, zBase) {
        if (jsonObj.zIndex != -1) { // Group物体的zIndex，总是-1
            jsonObj.zIndex += zBase;
        }
        if (jsonObj.children) {
            for (var i = 0; i < jsonObj.children.length; i++) {
                Element.liftZ(jsonObj.children[i], zBase);
            }
        }
    };

    p._extractComponent = function (objJson, x, y, zMax) {
        if (!this.jsonObj) {
            this.jsonObj = {};
        }

        if (!this.jsonObj.children) {
            this.jsonObj.children = [];
        }

        // 选取 元件中的所有元素, 作为当前元素的子元素, 如果有多个level, 则合并到一个Level
        for (var i = 0; i < objJson.levels.length; i++) {
            var level = objJson.levels[i];
            if ((level.elements != null ) && (level.elements.length > 0)) {
                for (var j = 0; j < level.elements.length; j++) {
                    // 元件的zIndex要升高，使他置于top，可见
                    Element.liftZ(level.elements[j], zMax);
                    this.jsonObj.children.push(level.elements[j]);
                    TQ.RM.addElementDesc(level.elements[j]);
                }
            }
        }

        this.jsonObj.type = "Group";  // 不论是单个物体还是多个物体,总是建立虚拟物体group， 以保留其原有的动画
        this.jsonObj.x = x;
        this.jsonObj.y = y;
        this.jsonObj.zIndex = zMax;
        return this.jsonObj;
    };

    p._addActorByUrl = function (desc, alias) {
        // 先读入Description文件， 再读入图像。
        var request = new XMLHttpRequest();
        console.info('Requesting ' + desc.src);
        request.open("GET", desc.src);

        (function (parentObj) {
            request.onreadystatechange = function () {
                if (request.readyState == 4) {
                    if (request.status == 404) {
                        console.info(desc.src + ' does not exist');
                    }
                    else {
                        var o = JSON.parse(request.responseText);
                        o.alias = (alias == null) ? 'none' : alias;
                        o.remote = true;
                        if (!o.type) {
                            o.type = "BitmapAnimation";
                        }
                        o.x = (o.x == undefined) ? desc.x : o.x;
                        o.y = (o.y == undefined) ? desc.y : o.y;
                        o.PivotX = (o.PivotX == undefined) ? TQ.Config.pivotX : o.PivotX;
                        o.PivotY = (o.PivotY == undefined) ? TQ.Config.pivotY : o.PivotY;
                        parentObj.load(o);
                    }
                }
            };
        })(this);
        request.send();
    };

    // 补全所缺少的数据
    p.fillGap = function (desc) {
        // 所有元素， 在add之后， 都需要经过load， 从资源中调进来。
        if (desc.type == undefined) {
            desc.type = "Bitmap";
        }

        if (desc.eType == undefined) {
            desc.eType = Element.type2eType(desc.type);
        }

        if (desc.state == undefined) {
            desc.state = 0;
        }

        if (desc.isVis == undefined) {
            desc.isVis = true;
        }

        if (desc.isClipPoint == undefined) {
            desc.isClipPoint = false;
        }

        if (desc.x == undefined) { // 区别： 如果 desc.x 是 0， 则不会重新被赋值
            desc.x = 100;
        }

        if (desc.y == undefined) {
            desc.y = 200;
        }

        if (desc.zIndex == undefined) {
            desc.zIndex = 0;
        }
        if (desc.type == "Text") {
            desc.pivotX = (desc.pivotX == undefined) ? TQ.Config.TEXT_PIVOT_X : desc.pivotX;
            desc.pivotY = (desc.pivotY == undefined) ? TQ.Config.TEXT_PIVOT_Y : desc.pivotY;
            if (desc.font) {
                this.upgradeFont(desc);
            }
            if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
            if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
            if (!desc.color)  desc.color = TQ.Config.color;
        } else {
            desc.pivotX = (desc.pivotX == undefined) ? TQ.Config.pivotX : desc.pivotX;
            desc.pivotY = (desc.pivotY == undefined) ? TQ.Config.pivotY : desc.pivotY;
        }

        if (desc.sx == undefined) {
            desc.sx = 1;
        }

        if (desc.sy == undefined) {
            desc.sy = 1;
        }

        if (desc.rotation == undefined) {
            desc.rotation = 0;
        }

        // 清除M和IM, 过去的版本中,可能输出了这些数值.
        // 他们如果没有 对象化, 就会阻碍 Matrix.multiply()
        desc.IM = desc.M = null;

        // 强制补全动画轨迹, 应为这是存放物体坐标的地方.!!! 2013-3-1
        desc.animeTrack = new TQ.AnimeTrack(desc);
        TQ.AnimeTrack.validate(desc.animeTrack);
        return desc;
    };

    Element.type2eType = function (type) {
        switch (type) {
            case "Text":
                return 4;
            case "SOUND":
                return  7;
            case "Group":
                return 2;
            case "Bitmap":
                return 1;
            default:
                return 1;
        }
        return 1;
    };

    p.load = function () {
        // 记录到element中
        if ((this.jsonObj.src != undefined) && (this.jsonObj.src != null)) {
            this.jsonObj.src = Element.upgrade(this.jsonObj.src);
        }

        var desc = this.jsonObj;
        switch (desc.type) {
            case "BitmapAnimation":
                this._loadActor();
                break;
            case "Group":
                this._loadComponent();
                break;
            case "JointMarker":
                this._loadMarker();
                break;
            case "Text":
            case "SOUND":
            case "Bitmap":
            default :
                this._doLoad();
                break;
        }

        if (desc.trace) {
            this.trace = TQ.Trace.build(desc.trace);
        }

        if (desc.animeCtrl != null) {
            this.animeCtrl = new TQ.Animation(desc.animeCtrl);
        }

        if (desc.viewCtrl != null) {
            this.viewCtrl = new TQ.MultiView(desc.viewCtrl);
        }

        this.setupChildren();
        return desc;
    };

    p.setupChildren = function () {
        if (!(!this.jsonObj.children)) {
            for (var i = 0; i < this.jsonObj.children.length; i++) {
                this.addChild(this.jsonObj.children[i]);
            }
        }
    };

    p.findChild = function (childDisplayObj) {
        if (this.children == null) {
            return null;
        }

        var result = null;
        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].displayObj != null) {
                if (this.children[i].displayObj.id == childDisplayObj.id) {
                    return this.children[i];
                }
            }

            result = this.children[i].findChild(childDisplayObj);
            if (result != null) break;
        }

        return result;
    };

    p.addJoint = function (ele) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode); //在零件模式下
        if (ele.state == undefined) {
            ele.state = 0;
        }

        ele.setFlag(Element.JOINTED);
        this.addChild(ele);
        this.dirty2 = true;
    };

    p.addChild = function (desc) {
        if (desc.displayObj != null) { // 在group或者joint物体的时候,出现
            var child = desc; // 已经是物体了, 不用创建了. 但是,需要衔接jsonObj
            //从世界坐标, 变换到父物体坐标系: 由Update来做
            var t = TQ.FrameCounter.t();
            child.update(t);
            var p = {};
            p.t = t;
            Element.copyWorldData(p, child.jsonObj);
            var worldData = [];
            this.saveWorldDataAll(worldData, child);
            child.parent = this;
            child.animeTrack = null;
            this.children.push(child);
            this.toRelative(worldData, child);
            Element.copyWorldData(child.jsonObj, p);
            if (!this.jsonObj.children) {
                this.jsonObj.children = [];
            }
            this.jsonObj.children.push(child.jsonObj);

            child.dirty2 = this.dirty2 = this.dirty = true;  // 迫使系统更新child的位置数据位相对坐标
            child.setFlag(Element.TO_RELATIVE_POSE);

        } else {
            child = Element.build(this.level, desc);
            this.addChildDirect(child);
        }
        return child;
    };

    /*
     child 必须已经是 元素， 而且， 不需要经过相对化坐标变换
     */
    p.addChildDirect = function (child) {
        child.parent = this;
        if (!this.children) {
            this.children = [];
        }
        this.children.push(child);
    };

    p.undeleteChild = function (child) {
        this.addChildDirect(child);
        child.addItemToStage();
    };

    Element.copyWorldData = function (a, b) {
        a.x = b.x;
        a.y = b.y;
        a.sx = b.sx;
        a.sy = b.sy;
        a.rotation = b.rotation;
        a.isVis = b.isVis;
    };

    p.saveWorldDataAll = function (worldData, child) {
        // 计算当前的世界坐标，并且保存,并且记录轨道的类别
        if (child.animeTrack.x) child.saveWorldData(worldData, child.animeTrack.x, Element.TRANSLATING);
        if (child.animeTrack.sx) child.saveWorldData(worldData, child.animeTrack.sx, Element.SCALING);
        if (child.animeTrack.rotation) child.saveWorldData(worldData, child.animeTrack.rotation, Element.ROTATING);
        if (child.animeTrack.visible) child.saveWorldData(worldData, child.animeTrack.visible, Element.VISIBLE_CHANGED);
    };

    p.toRelative = function (worldData, child) {
        // 计算相对坐标， 并且录制。
        for (var i = 0; i < worldData.length; i++) {
            var p = worldData[i];
            child.dirty2 = this.dirty2 = this.dirty = true;  // 迫使系统更新child的位置数据位相对坐标
            child.setFlag(p.type);
            Element.copyWorldData(child.jsonObj, p);
            this.update(p.t);
        }
    };

    p.saveWorldData = function (worldData, track, type) {
        //ToDo: 先计算所有parent的pose，再计算它的pose
        for (var i = 0; i < track.t.length; i++) {
            var t = track.t[i];
            this.update(t);
            var p = {};
            p.t = t;
            p.type = type;
            Element.copyWorldData(p, this.jsonObj);
            worldData.push(p);
        }
    };

    p.removeChild = function (child) {
        assertNotNull(TQ.Dictionary.FoundNull, this.children); // "应该有孩子"
        var id = this.children.indexOf(child);
        assertTrue(TQ.Dictionary.INVALID_LOGIC, id >= 0); //"应该能够找到孩子"
        if (id >= 0) {
            child = (this.children.splice(id, 1))[0];
            id = this.jsonObj.children.indexOf(child.jsonObj);
            this.jsonObj.children.splice(id, 1);
            child.parent = null;
        }

        //迫使元素回到世界坐标系标示
        child.dirty2 = this.dirty2 = this.dirty = true;  // 迫使系统更新child的位置数据位相对坐标
        child.setFlag(Element.TO_RELATIVE_POSE);
        var t = TQ.FrameCounter.t();
        child.update(t);
        return child;
    };

    p.atomNum = function () {
        var sum = 1;
        for (var i = 0; i < this.children.length; i++) {
            sum += this.children[i].atomNum();
        }
        return sum;
    };

    p.skinning = function (skin) {
        var hostType = this.getType();
        if (hostType == "BUTTON") {
            hostType = "Bitmap";
        }
        if (hostType != skin.getType()) {
            TQ.MessageBubble.show(TQ.Dictionary.SAME_TYPE_SKIN + skin.getType(), false);
            return;
        }

        // 必须是相同的类别，才能够换皮肤
        // 暂存 Z可见性 和 新皮肤的名称,
        this.persist();
        if (this.isText()) {
            this.jsonObj.text = skin.jsonObj.text;
            this.jsonObj.fontSize = skin.jsonObj.fontSize;
            this.jsonObj.fontFace = skin.jsonObj.fontFace;
            this.jsonObj.color = skin.jsonObj.color;
        } else {
            this.jsonObj.src = skin.jsonObj.src;
        }
        this._doRemoveFromStage();
        this._isNewSkin = true;
        this._doLoad();
        skin.TBD = true;
    };

    p.attachDecoration = function (decs) {
        this.decorations = decs;
        // ToDo: 处理每一个Marker
        var marker = this.decorations[0];
        marker.host = this;
        marker.level = this.level;
        marker.attach();
        marker.createImage();
        this.dirty2 = marker.dirty2 = true;
        marker.setFlag(Element.TO_RELATIVE_POSE | Element.CLEAR_ANIMATATION); // 迫使他记录所有的track,
        this.addChild(marker);
        marker.show(true);
        marker.moveToTop();
    };

    p.detachDecoration = function () {
        if (!this.decorations) {
            return null;
        }
        var decorations = this.decorations;
        this.decorations = null;
        assertNotNull(TQ.Dictionary.FoundNull, decorations);
        for (var i = 0; i < decorations.length; i++) {
            var marker = decorations[i];
            marker.show(false);
            marker.displayObj.visible = false;
            marker.host = null;
            marker.level = null;
            this.removeChild(marker);
        }
        return decorations;
    };

    p.getImageResource = function(item, jsonObj) {
        if (item) {
            return item.res;
        }
        return jsonObj.img;
    };

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var jsonObj = this.jsonObj;
        var item = TQ.RM.getResource(jsonObj.src);
        if (!item) {
            var img3 = new Image();   // 由他调入图像资源！！
            (function (pt) {
                img3.onload = function () {
                    // 创建Bitmap
                    pt.loaded = true;
                    var resource = pt.getImageResource(item, jsonObj);
                    pt.displayObj = new createjs.Bitmap(resource);
                    jsonObj.img = null;
                    pt._afterItemLoaded();
                    pt.setTRSAVZ();
                }
            })(this);

            // 为了在callback中引用父容器，临时增加一个属性， 记录当前class的指针，
            // img3.obj = jsonObj;
            img3.src = jsonObj.src;
            jsonObj.img = img3;
        } else {
            this.loaded = true;
            var resource = this.getImageResource(item, jsonObj);
            this.displayObj = new createjs.Bitmap(resource);
            this._afterItemLoaded();
            this.setTRSAVZ();
        }
    };

    p.setTRSAVZ = function () {
        var jsonObj = this.jsonObj;
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //"世界坐标值jsonOb不能为空"
        if (!this.isSound()) { //"显示对象displayObj不能为空"
            assertNotNull(TQ.Dictionary.FoundNull, this.displayObj);
        }
        if (jsonObj.isVis && !this.isVirtualObject() && !this.hasFlag(Element.IN_STAGE)) {
            TQ.Log.out(TQ.Dictionary.INVALID_LOGIC + this.jsonObj.src); //飞线: 谁在使用这种情况?, 顶多在Show的时候检查"
            // this._doAddItemToStage();
        }

        // 可见性由父子共同决定：
        //  如果父物体为空， 该物体的可见性由自己的标志完全决定
        //  如果父物体非空：
        //      父亲实际不可见，则都不可见（一票否决制）；
        //      父亲实际可见，则孩子自己决定
        //
        //   物体的实际可见性就是 displayObj.visible,
        //          如果displayObj为空，用临时标志： visibleTemp,
        //
        var visSum = false;
        if (!this.parent) {
            visSum = jsonObj.isVis;
        } else {
            visSum = this.parent.isVisible() && jsonObj.isVis;
        }
        visSum = visSum || Element.showHidenObjectFlag;
        this.doShow(visSum);
    };

    p.doShow = function (visSum) {
        if (!this.displayObj) {
            this.visibleTemp = visSum;
        } else {
            this.displayObj.visible = visSum;
            this.toDeviceCoord(this.displayObj, this.jsonObj);
        }
    };

    p.toDeviceCoord = function (displayObj, jsonObj) {
        assertValid(TQ.Dictionary.FoundNull, displayObj); // "应有显示数据
        assertValid(TQ.Dictionary.FoundNull, jsonObj); // 应有显示数据
        //从 用户使用的世界坐标和物体坐标，转换为可以绘制用的设备坐标
        if (!displayObj) {
            return;
        }
        displayObj.x = TQ.Config.zoomX * jsonObj.x;
        displayObj.y = TQ.Utility.toDeviceCoord(TQ.Config.zoomY * jsonObj.y);
        if (this.isMarker() || this.isSound()) { // marker 永远是一样的大小, 圆的, 没有旋转, 定位在圆心.
            displayObj.scaleX = displayObj.scaleY = 1;
            displayObj.regX = displayObj.regY = 0;
            displayObj.rotation = 0;
            return;
        }
        if (!this.isMarker()) {
            displayObj.regX = jsonObj.pivotX * this.getWidth();
            displayObj.regY = TQ.Utility.toDevicePivot(jsonObj.pivotY) * this.getHeight();
        } else {
            displayObj.regX = 0;
            displayObj.regY = 0
        }

        displayObj.rotation = TQ.Utility.toDeviceRotation(jsonObj.rotation);
        displayObj.scaleX = TQ.Config.zoomX * jsonObj.sx;
        displayObj.scaleY = TQ.Config.zoomY * jsonObj.sy;
    };

    p._loadActor = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var spriteSheet = this.jsonObj;
        // 这里应该再有一个callback， 因为动画的图像需要花时间调入
        var ss = new createjs.SpriteSheet(spriteSheet);
        var anima = new createjs.Sprite(ss);
        this.loaded = true;

        // Set up looping
        ss.getAnimation("run").next = "run";
        ss.getAnimation("jump").next = "run";
        anima.gotoAndPlay("jump");
        this.displayObj = anima;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.removeFromStage = function () {
        this._doRemoveFromStage();
        for (var i = 0; i < this.children.length; i++) {
            var child = this.children[i];
            child.removeFromStage();
        }
    };

    p._doRemoveFromStage = function () {
        TQ.TraceMgr.removeFromStage(this);
        if (this.displayObj) {
            stage.removeChild(this.displayObj);
        }
        this.clearFlag(Element.IN_STAGE);
    };

    p.persist = function () {
        // 记录当前数据到 json, 以便于存盘和再次切入该场景
        if (!this.jsonObj) {
            return;
        }
        if (!this.displayObj) {
            this.jsonObj.zIndex = -1;
        } else {
            this.jsonObj.zIndex = stage.getChildIndex(this.displayObj);
        }
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].persist();
        }
    };

    p.destroy = function () {
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].destroy();
            }
        }

        this.destroyDisplayObj();
        // 切断联系,以方便系统收回内存资源
        this.children = null;
        this.jsonObj = null;
        this.animeTrack = null;
    };

    p.destroyDisplayObj = function () {
        // 从stage中移除当前的 皮肤,(不再显示),
        // 同时,重置回调函数,阻止用户操作; 切断指针以便于释放内容,
        this._doRemoveFromStage();
        if (this.displayObj != null) {
            this.displayObj.jsobObj = null;
            this.displayObj.onPress = null;
            this.displayObj.onMouseOver = null;
            this.displayObj.onMouseOut = null;
            this.displayObj = null;
        }
    };

    p.eraseAnimeTrack = function () {
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].eraseAnimeTrack();
            }
        }

        TQ.TrackRecorder.erase(this);
    };

    p.deleteChild = function (ele) {
        if (this.children == null) {
            return false;
        }

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i] == ele) {
                this.children[i]._doRemoveFromStage();
                this.children.splice(i, 1);
                this.jsonObj.children.splice(i, 1);
                return true;
            }

            if (this.children[i].deleteChild(ele) == true) return true;
        }

        return false;
    };

    p.addItemToStage = function () {
        TQ.StageBuffer.add(this);
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                child.addItemToStage();
            }
        }
    };

    p._doAddItemToStage = function (upperEle) {
        // 只需要加入一次， 之后， 都是自动更新坐标，角度等等， 不需要反复加入
        // 他们的坐标都控制在 displayObj中，
        if (( null == this.displayObj) || this.isVirtualObject()) { // group物体的虚根
            return;
        }

        if (this.jsonObj.zIndex == -1) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false); // -1, group物体应该在isVirtualObject中处理
        }
        var thislevel = this.level;
        var item = this.displayObj;
        assertNotNull(TQ.Dictionary.FoundNull, this.displayObj); // 必须有显示体
        item.jsonObj = this.jsonObj;  // 需要临时建立关系， 因为在NetIO时候可能破坏了。
        item.ele = this;
        { // 不论是否可见， 都添加到stage中， 有visible来控制可见性， 确保层次关系是正确的
            this.setFlag(Element.IN_STAGE);
            if ((!upperEle) || (!upperEle.displayObj)) { // 没有在我之上的， 我就是top
                stage.addChild(item);
            } else {
                var z = stage.getChildIndex(upperEle.displayObj);
                if (z < 0) { // 是 group， 或者其它不可显示的物体
                    stage.addChild(item);
                } else {
                    assertTrue(TQ.Dictionary.INVALID_PARAMETER, z >= 0); // 第一个元素的z = 0
                    assertTrue(TQ.Dictionary.INVALID_PARAMETER, z < stage.getNumChildren());
                    stage.addChildAt(item, z);  // 把upperEle 顶起来
                }
            }

            if (this.trace) {
                this.trace.addToStage();
            }

            // wrapper function to provide scope for the event handlers:
            (function (ele) {
                var showFloatToolbar = function (evt) {
                    if ((TQ.floatToolbar != undefined) && TQ.floatToolbar.setPosition && TQ.floatToolbar.show) {
                        TQ.floatToolbar.setPosition(evt.stageX, evt.stageY);
                        TQ.floatToolbar.show(true);
                    }
                };

                item.onPress = function (evt) {
                    if (TQ.SceneEditor.isPlayMode()) {
                        return;
                    }
                    var ele2 = TQ.SelectSet.getEditableEle(ele);
                    TQ.SelectSet.add(ele2);
                    var target = ele2.displayObj;
                    if (target == null) return; // 防止 刚刚被删除的物体.
                    var offset = {x: target.x - evt.stageX, y: target.y - evt.stageY, firstTime: true};
                    // add a handler to the event object's onMouseMove callback
                    // this will be active until the user releases the mouse button:
                    showFloatToolbar(evt);
                    TQBase.LevelState.saveOperation(TQBase.LevelState.OP_CANVAS);
                    evt.onMouseMove = function (ev) {
                        if (TQ.SceneEditor.isPlayMode()) {
                            return;
                        }
                        TQ.floatToolbar.show(false);
                        TQBase.Trsa.do(ele2, thislevel, offset, ev, stage.selectedItem);
                    };
                    evt.onMouseUp = function (evt) {
                        showFloatToolbar(evt);
                        evt.onMouseUp = null;
                    };

                    if (TQ.displayUI && TQ.displayUI.displayMenu && TQ.displayUI.displayActionSet) {
                        TQ.displayUI.displayMenu(ele2, ele2.geteType());
                        TQ.displayUI.displayActionSet(ele2, ele2.geteType());
                    }
                };
                item.onMouseOver = function () {
                    ele.highlight(true);
                    thislevel.dirty = true;
                };
                item.onMouseOut = function () {
                    if (!TQ.SelectSet.isSelected(ele)) {
                        ele.highlight(false);
                    }
                }
            })(this);
        }
    };

    p.highlight = function (enable) {
        if (this.isSound() || this.isGroupFile() || this.isButton()) return;
        assertNotNull(TQ.Dictionary.FoundNull, this.displayObj);
        if (!this.displayObj) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }
        if (this._isHighlighting == enable) return;

        this._isHighlighting = enable;
        if (this._isHighlighting) {
            this.displayObj.shadow = Element.getShadow();
        } else {
            this.displayObj.shadow = null;
        }
    };

    p.pinIt = function () {
        if (!this.jsonObj.isPinned) {
            this.jsonObj.isPinned = true;
        } else {
            this.jsonObj.isPinned = false;
        }

        if (this.jsonObj.type == "Group") {
            for (var i = 0; i < this.children.length; i++) {
                var ele = this.children[i];
                if (!ele.isJoint()) ele.pinIt(); // 钉住Group， 但是， 不要钉住关节物体
            }
        }
    };

    Element.getShadow = function () {
        if (!Element._shadow) {
            Element._shadow = new createjs.Shadow('#000000', 1, 1, 10);
        }
        return Element._shadow;
    };

    p._afterItemLoaded = function () {
        if (this.displayObj) { //声音元素， 没有displayObj
            this.displayObj.isClipPoint = this.jsonObj.isClipPoint;
        }
        this.animeTrack = this.jsonObj.animeTrack;
        if ((this.level.state == TQBase.LevelState.EDITING) ||
            (this.level.state == TQBase.LevelState.RUNNING)) {
            if (this.jsonObj.t0 != undefined) { // 必须是在 立即插入模式
                if (!this.jsonObj.isVis) {
                    TQ.AnimeTrack.hide(this, this.jsonObj.t0); // 适合于3D视图，长期隐藏
                } else {
                    TQ.AnimeTrack.hideToNow(this, this.jsonObj.t0);
                }
            }
        }

        if ((this._isNewSkin)) { // 编程哲学: 多少 是, 少用 非, 复合一般人的思维逻辑, 通顺.
            TQ.Log.out("element._afterItemLoaded"); // , 应该只在临时添加的时候, 才调用
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false); // 应该只在临时添加的时候, 才调用
            TQ.StageBuffer.add(this); // 统一进入 stage的渠道.
            if ((this.jsonObj.zIndex != null) && (this.jsonObj.zIndex >= 0)) { // 原来是group, 没有皮肤, 所以是-1;
                stage.setChildIndex(this.displayObj, this.jsonObj.zIndex + 1); //ToDo: 为什么要加1 组合体才正确?
            }
            this._isNewSkin = false;
        } else {
            this.level.onItemLoaded(this);
        }
        this.setFlag(Element.LOADED);
    };

    Element.compare = function (e1, e2) {
        assertNotNull(e1);
        assertNotNull(e2);
        var id1 = e1.jsonObj.zIndex;
        var id2 = e2.jsonObj.zIndex;
        // 凡是出错的地方, 加一道检查,让它主动报错
        assertTrue(TQ.Dictionary.INVALID_LOGIC, id1 >= -1); // group元素, 没有显示物, 所以是-1,
        assertTrue(TQ.Dictionary.INVALID_LOGIC, id2 >= -1); // 元素的可见性顺序 >= -1
        return id1 - id2;
    };

    p.sort = function () {
        this.children.sort(TQ.Element.compare);
    };

    p._removeM = function () {
        this.jsonObj.IM = null;
        this.jsonObj.M = null;
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i]._removeM();
            }
        }
    };

    p.toJSON = function () {
        //备注：displayObj 本身里面有Cycle， 无法消除。所以必须让他null。
        // JQuery 调用的toJSON， 只需要这个字段即可， 一定不要在这里调用stringify！
        this.highlight(false);
        this.jsonObj.displayObj = null;
        this.jsonObj.animeTrack = this.animeTrack;
        this.jsonObj.animeCtrl = this.animeCtrl;
        this.jsonObj.viewCtrl = this.viewCtrl;
        this.jsonObj.state = (this.state & 0x1F); // 去除高位的动态的flag，不会永久存储到wdm文件中。

        // 保存为相对路径
        if (!!this.jsonObj.src) {
            this.jsonObj.src = TQ.RM.toRelative(this.jsonObj.src);
        }

        this._removeM();
        this.parent = null;
        if (this.trace) {
            this.jsonObj.trace = this.trace;
        }

        //输出孩子的资源
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.jsonObj.children[i] = this.children[i].toJSON();
            }
        }

        // 如果要输出多个字段， 可以采用下面的方式： 不带字段名称， 用数组； 用{}可以自定义字段显示名称
        // [this.jsonObj, this.animeTrack];
        // {"jsonObj":this.jsonObj, "animeTrack": this.animeTrack};
        return this.jsonObj;
    };

    p.afterToJSON = function () {
        //  只是为了输出, 才临时赋值给它, 现在收回.
        this.jsonObj.animeTrack = null;
        this.jsonObj.animeCtrl = null;
        this.jsonObj.viewCtrl = null;

        // rebuild 关系
        if (this.children != null) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].parent = this;
                this.children[i].afterToJSON();
            }
        }
    };

    p.isUserControlling = function () {
        // 鼠标右键按下, 就是操作 (不论是否move.
        // 注意: Mousemove事件只在鼠标移动时候发出.  不移动就不发出, 即使 鼠标一直按住该物体.
        return (TQ.InputMap.IsOperating() && TQ.SelectSet.isSelected(this));
    };

    p.attachCtrl = function (controller) {
        this.animeCtrl = controller;
        this.animeCtrl.play("idle");  // 设置缺省的 动作
    };

    p.addAction = function (name, startFrame, endFrame, repeatStyle, gifIconID, forceToUpdate) {
        if (!this.animeCtrl) {
            this.animeCtrl = new TQ.Animation(null);
        }
        var action = new TQ.Action(name, parseInt(startFrame), parseInt(endFrame), repeatStyle, parseInt(gifIconID));
        return this.animeCtrl.addAction(action, forceToUpdate);
    };

    p.deleteAction = function (name) {
        if (!this.animeCtrl) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, this.animeCtrl);
            return;
        }

        this.animeCtrl.deleteAction(name);
    };

    p.hasAction = function (actionName) {
        if (!this.animeCtrl) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, this.animeCtrl);
            return false;
        }

        return this.animeCtrl.hasAction(actionName);
    };

    p.stop = function() {
        if (this.animeCtrl) {
            this.animeCtrl.stop();
        }
        // do no thing for bitmap
    };

    p.play = function() {
    };

    p.playAction = function (name, playByUpdate) {
        if (!this._controlerInst) {
            this._controlerInst = this.getFirstAnimeCtrl();
        }
        if (!this._controlerInst) return;
        this._controlerInst.play(name);
        if (!playByUpdate) {
            this.setFlag(TQ.Element.ACTION_CHANGED);
            TQ.ActionRecorder.record(this, name, TQ.FrameCounter.t());
            if (!TQ.FrameCounter.isPlaying()) {
                $('#play').click();
            }
        }
    };

    p.getActionSet = function () {
        var controller = this.getFirstAnimeCtrl();
        if (controller != null) {
            return controller.actionTable;
        }

        return null;
    };

    //ToDo: 这里假设一个元件中, 只有一个animeCtrl. 这是一个限制, 以后需要支持多个
    p.getFirstAnimeCtrl = function () {
        if (!!this.animeCtrl) {
            return this.animeCtrl;
        }

        var result = null;
        if (!!this.children) {
            for (var i = 0; i < this.children.length; i++) {
                result = this.children[i].getFirstAnimeCtrl();
                if (!result) continue;
                break;
            }
        }

        return result;
    };

    p.updateAction = function (t) {
        if (!this.hasActionTrack()) return;

        //ToDo: 可以解除限制， 支持多套动作， 例如： 脸部动作， 肢体动作， 嘴巴动作等
        // 方法是： 每套动作， 对应一个animeTrack和一个Controller，i.e. 把下面的内容归到各个controller
        var newName = TQ.ActionDecoder.calculate(this.animeTrack, t);
        var isNewAction = false;
        if (!this.currentActionName) {
            this.currentActionName = newName;
            isNewAction = true;
        } else if (this.currentActionName != newName) {
            this.currentActionName = newName;
            isNewAction = true;
        }

        if (isNewAction) {
            this.playAction(this.currentActionName, true);
        }
    };

    p.update = function (t) {
        var justRecorded = false;
        if (!this.isLoaded()) return;

        if (this.hasActionTrack()) { // 更新使用者的动作track，
            this.updateAction(t);
        }

        if (this.animeCtrl) { // 更新 拥有者的 时间
            if (this.animeCtrl.currentAction) {
                t = this.animeCtrl.currentAction.tMapping(t);
            }
        }

        this.updateDecorations(t); //根据Marker，移动Pivot点
        // 如果有拍摄, 先拍摄
        var parentPose = (null == this.parent) ? null : this.parent.jsonObj;
        var motionType = 0; // 没有变化, 使用上一个时刻的 世界坐标
        if (!TQBase.LevelState.isOperatingTimerUI()) {
            if (this.dirty2 || this.isUserControlling()) {
                // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag);
                if (!this.getOperationFlags()) {  // 鼠标按住, 但是 没有移动, 单独确定操作状态
                    this.setFlag(TQBase.Trsa.lastOperationFlag);
                    // TQ.Log.out("操作: " + TQBase.Trsa.lastOperationFlag +"last");
                }
                //  不能在此记录, 因为, Move, Rotate操作的时候, 不调用它update
                TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
                // 记录修改值
                TQ.TrackRecorder.record(this, t);
                justRecorded = true;
                motionType += 0x02;
            }
        }

        // 播放过程:
        // 1) 生成世界坐标:
        parentPose = (null == this.parent) ? null : this.parent.jsonObj;
        if (this.hasAnimation()) { //  动画物体
            // 即使是 用户操作的物体, 也需要重新生成, 因为用户只操作了其中的几个轨道,
            //  而其余的轨道, 仍然需要使用原来的数据,
            // 当然, 此刻的计算,一是为此刻的显示, 二是为下一时刻的修改. 两用的.
            // 1.1A) 从动画轨迹 到物体坐标
            // 如果有动画数据, 才需要解码,生成新的 世界坐标. 否则,跳过
            // 先生成新的 物体坐标(TQ.Pose), 再转化到世界坐标系
            var tt = t;
            if (justRecorded && (TQ.TrackRecorder.style == TQ.TrackDecoder.JUMP_INTERPOLATION)) {
                tt = t + 0.01; // 在脉冲运动下，迫使系统采用最新的位置
            }
            if (this.isSound() && this.isMultiScene) {//支持跨场景的声音
                tt = currScene.toGlobalTime(tt);
            }
            TQ.TrackDecoder.calculate(this.animeTrack, this.jsonObj, tt);
            // 1.1B): 从物体坐标 TQ.Pose. 到世界坐标
            TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
            motionType += 0x04;
        } else if ((motionType == 0) && this.dirty) {
            // 1.2) 但是, 如果父物体移动了, 它也被动地被要更新
            TQ.Pose.worldToObjectExt(this.jsonObj, parentPose);
            TQ.Pose._toWorldCoordinate(this.jsonObj, parentPose);
        }

        // 1.3) 没有动画的物体, 也没有被操作,被移动, jsonObj 已经是世界坐标

        // 2) 从世界坐标 到 设备坐标
        this.setTRSAVZ();
        this.applyToDecorations();
        var debugON = false;
        if (debugON) {
            if ((stage.selectedItem != null) && (stage.selectedItem.id == this.displayObj.id)) {
                var sels = TQ.Dictionary.Selected + stage.selectedItem.id;
                //  值显示选中的物体:
                displayInfo2(sels + "本物体id:" + this.displayObj.id + "motionType: " + motionType + " Pose: " + TQ.Pose.x + "," + TQ.Pose.y + "," +
                        "jsonObjXY:" + this.jsonObj.x + ", " + this.jsonObj.y +
                        "displayObjXY:" + this.displayObj.x + ", " + this.displayObj.y
                );
            }
        }

        if (this.jsonObj.isClipPoint == false) {
            assertArray(TQ.Dictionary.INVALID_LOGIC, this.children); // "children可以是空数组[], 但不能为null，或undefined"
            for (var i = 0; i < this.children.length; i++) {
                // 传播dirty标志, 迫使child更新; dirty2的子关节不记录track
                if (this.dirty || this.dirty2) this.children[i].dirty = true;
                if (!(this.isMarker() && this.children[i].isUserControlling())) {
                    this.children[i].update(t);
                }
            }
        }

        this.dirty = this.dirty2 = false;
    };

    // Marker 专用部分
    p.calPivot = function (xObjectSpace, yObjectSpace) {
        //  由于缩放系数， 物体空间的坐标被等比缩放了
        // 所以， 应该获取原始的 宽度和 高度， 在物体空间（也是原始的），来计算pivot值
        var dPivotX = xObjectSpace / this.getWidth();
        var dPivotY = yObjectSpace / this.getHeight();
        return {pivotX: this.jsonObj.pivotX + dPivotX, pivotY: this.jsonObj.pivotY + dPivotY};
    };

    p.getWidth = function () {
        if (this.isVirtualObject()) {// 对于Group物体
            var w = 100;
        } else {
            w = this.displayObj.getWidth(true);
        }

        return w;
    };

    p.getHeight = function () {
        if (this.isVirtualObject()) {// 对于Group物体
            var h = 100;
        } else {
            h = this.displayObj.getHeight(true);
        }
        return h;
    };

    p.movePivot = function (pivot, pos, marker) {
        this.jsonObj.pivotX = pivot.pivotX;
        this.jsonObj.pivotY = pivot.pivotY;
        this.moveTo(pos);

        // marker.moveTo(0, 0);
        marker.jsonObj.x = 0;
        marker.jsonObj.y = 0;
        marker.setFlag(Element.TRANSLATING); // 要求重新记录新的（x,y), 而不是用老的值计算
        marker.dirty = true;
        // marker.dirty2 = true; // 不能设dirty2！！
    };

    p._move_TBD_NOT_USED = function (dx, dy) {
        this.jsonObj.x += dx;
        this.jsonObj.y += dy;
        this.setFlag(Element.TRANSLATING);
    };

    p.moveTo = function (point) {
        this.jsonObj.x = point.x;
        this.jsonObj.y = point.y;
        this.setFlag(Element.TRANSLATING);
        this.dirty = true;
        this.dirty2 = true;
    };

    p.getScale = function () {
        return {sx: this.jsonObj.sx, sy: this.jsonObj.sy};
    };

    p.getRotation = function () {
        return this.jsonObj.rotation;
    };

    p.rotateTo = function (angle) {
        this.jsonObj.rotation = angle;
        this.setFlag(Element.ROTATING);
        this.dirty = true;
        this.dirty2 = true;
    };

    p.scaleTo = function (scale) {
        this.jsonObj.sx = scale.sx;
        this.jsonObj.sy = scale.sy;
        this.setFlag(Element.SCALING);
        this.dirty = true;
        this.dirty2 = true;
    };

    p.scale = function (scale) {
        var scaleTo = {};
        scaleTo.sx = scale * this.jsonObj.sx;
        scaleTo.sy = scale * this.jsonObj.sy;
        this.scaleTo(scaleTo);
    };

    p.updateDecorations = function (t) {
        if (!this.decorations) {
            return; // 例如: 本身是decoration, 没有其他decoration
        }
        for (var i = 0; i < this.decorations.length; i++) {
            var dec = this.decorations[i];
            if (!dec) continue;
            dec.update2(t);
        }
    };

    p.applyToDecorations = function () {
        if (!this.decorations) {
            return; // 例如: 本身是decoration, 没有其他decoration
        }
        for (var i = 0; i < this.decorations.length; i++) {
            var dec = this.decorations[i];
            if ((dec != null) && dec.isUserControlling()) { // 迫使Market重新计算， Marker没有动画, 永远都在pivot点
                dec.apply(this);
            }
        }
    };

    p.calculateLastFrame = function () {
        var tMax = 0;
        if (!!this.animeTrack) {
            tMax = Math.max(tMax, TQ.AnimeTrack.calculateLastFrame(this.animeTrack));
        }

        if (!!p.children) {
            for (var i = 0; i < p.children.length; i++) {
                tMax = Math.max(tMax, p.children[i].calculateLastFrame());
            }
        }

        return tMax
    };

    // upgrade 工具：
    Element.upgrade = function (jsonStr) {
        //资源路径的变换：2013.3.30: 合并到 yt360
        // "assets/" 为"mcAssets/"
        // "sounds/" 为"mcSound/"
        // "images/" ==》 ”mcImages";
        if (jsonStr.indexOf("images/") >= 0) {
            jsonStr = jsonStr.replace("images/", TQ.Config.IMAGES_CORE_PATH);
        }

        if (jsonStr.indexOf('assets/') >= 0) {
            jsonStr = jsonStr.replace('assets/', TQ.Config.SCENES_CORE_PATH);
        }

        if (jsonStr.indexOf("thumbs/") >= 0) {
            jsonStr.replace("thumbs/", TQ.Config.THUMBS_CORE_PATH);
        }

        //改相对路径：2013.5.14, 支持U盘版本
        return TQ.RM.toRelative(jsonStr);
    };

    p.upgradeFont = function (desc) { // R308引入，
        var str = desc.font.replace("px", "");
        var arr = str.split(" ");
        if (arr.length >= 1) {
            if (!desc.fontFace)  desc.fontFace = arr[1];
            if (!desc.fontSize)  desc.fontSize = arr[0];
        }
        if (!desc.fontFace)  desc.fontFace = TQ.Config.fontFace;
        if (!desc.fontSize)  desc.fontSize = TQ.Config.fontSize;
        if (!desc.color)  desc.color = TQ.Config.color;
    };

    // 小函数区域: has, is, 这些函数容易理解, 放到最后, 让重要的函数, 需要经常看的函数,放到前面
    p.setText = function (htmlStr) {
        assertDepreciated(TQ.Dictionary.isDepreciated);
    };

    p.setText = function (str, fontFamily, fontSize, fontColor) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText()); //应该是Text元素
        // 此处不用再检验, 因为他不直接对用户, 只要那些直接对用户的函数, 把好关就行.
        // 但是一定要断言, 确信: 外围站岗的尽责了.
        if (this.displayObj != null) {
            this.displayObj.text = this.jsonObj.text = str;
            this.displayObj.color = this.jsonObj.color = fontColor;
            this.jsonObj.fontSize = fontSize;
            this.jsonObj.fontFace = fontFamily;
            this.displayObj.font = TQ.Utility.toCssFont(this.jsonObj.fontSize, this.jsonObj.fontFace);
        }
    };

    p.hasAnimation = function () {
        return (!((this.animeTrack == undefined) || (this.animeTrack == null)));
    };

    p.isLoaded = function () {
        return this.loaded;
    };

    // 样例： <font color="#f74107" size="6" face="隶书">用克隆键</font>
    p.toHtmlStr = function () {
        return '<font color="' + this.jsonObj.color + '" size="' +
            ((this.jsonObj.fontSize - 6) / 5) + '" face="' +
            this.jsonObj.fontFace + '">' +
            this.jsonObj.text + '</font>';
    };

    Element.parseHtmlStr = function (jsonObj, htmlStr) {
        jsonObj.text = TQ.Utility.extractTag("font", htmlStr, jsonObj.text);
        var oldSize = jsonObj.fontSize;
        jsonObj.fontSize = TQ.Utility.extractAttr("font", "size", htmlStr, jsonObj.fontSize);
        if (oldSize != jsonObj.fontSize) {
            jsonObj.fontSize = jsonObj.fontSize * 5 + 6;
        }
        jsonObj.fontFace = TQ.Utility.extractAttr("font", "face", htmlStr, jsonObj.fontFace);
        jsonObj.color = TQ.Utility.extractAttr("font", "color", htmlStr, jsonObj.color);
    };

    p.isClipPoint = function () {
        return this.jsonObj.isClipPoint;
    };
    p.isText = function () {
        return (this.jsonObj.text != undefined);
    };
    p.isSound = function () {
        return (this.jsonObj.type == "SOUND");
    };
    p.isGroupFile = function () {
        return (this.jsonObj.type == "GroupFile");
    };
    p.isButton = function () {
        return false;
    };
    p.getTextHtml = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText());
        return this.toHtmlStr();
    }; // 必须是Text
    p.getFont = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isText());
        return this.jsonObj.font;
    }; //必须是Text
    p.isLeaf = function () {
        return ((this.children == null) || (this.children.length < 1));
    };
    p.isRoot = function () {
        return (this.hasFlag(Element.ROOT_JOINT));
    };
    p.isJoint = function () {
        return ((this.parent != null) && (this.hasFlag(Element.JOINTED)));
    };
    p.isMarker = function () {
        return (this.jsonObj.type == "JointMarker");
    };
    p.isVirtualObject = function () { // 虚拟物体包括： Group(displayObj 非空), 声音(displayObj 为空)，等
        if (!this.displayObj) {
            return this.isSound();
        }
        assertNotNull(TQ.Dictionary.FoundNull, this.displayObj); // 应该有可显示对象
        return ((this.displayObj.image == null) && (this.jsonObj.type == "Group"));
    };
    p.isValid = function () { // 非法的物体包括: 被删除的物体
        return (this.jsonObj || this.displayObj);
    };
    p.isPinned = function () {
        return ( this.jsonObj.isPinned);
    };
    p.isVisible = function () {
        if (!this.displayObj) {
            return this.visibleTemp;
        } else if (!this.displayObj.visible) {
            return this.visibleTemp;
        }
        return this.displayObj.visible;
    };
    p.hasBroken = function () {
        return (this.hasFlag(Element.BROKEN));
    };
    p.isGrouped = function () {
        if (this.children != null) {
            // assertTrue("如果非空, 必须有元素", this.children.length > 0);
        }
        return ((this.parent != null) || (this.children != null));
    };

    p.getRoot = function () {  // 任何时候, 都是root, 唯一化
        if (this.isGrouped()) {
            if (this.parent != null) return this.parent.getRoot();
        }
        return this;
    };

    p.setMinAngle = function (newValue) {
        this.jsonObj.angleMin = newValue;
    };
    p.setMaxAngle = function (newValue) {
        this.jsonObj.angleMax = newValue;
    };
    p.moveZ = function (step) {
        TQ.MoveCtrl.cmdMoveLayer(this, step);
    };
    p.moveToZ = function (newZ) {
        this.moveZ(newZ - this.getZ());
    };
    p.getType = function () {
        return (this.jsonObj.type);
    };
    p.geteType = function () {
        return (this.jsonObj.eType);
    };
    p.setFlag = function (flag) {
        this.state |= flag;
    };
    p.clearFlag = function (flag) {
        this.state &= ~flag;
    };
    p.hasFlag = function (flag) {
        return this.state & flag;
    };
    p.hasActionTrack = function () {
        return (this.animeTrack && this.animeTrack.action);
    };
    p.getOperationFlags = function () {
        return (this.state & 0xFFF0);
    };
    p.getAlias = function () {
        return null;
    };
    p.getZ = function () { //如果是没有Z值的(例如:Group,等), 则返回其首个有Z值孩子的值
        // 只是被 moveLayer命令的undo使用, 没有用于物体顺序的保存
        var target = this.displayObj;
        var z = (!target) ? -1 : stage.getChildIndex(target);
        if (z >= 0) {
            return z
        }
        if (this.children) {
            for (var i = 0; i < this.children.length; i++) {
                z = this.children[i].getZ();
                if (z >= 0) {
                    return z
                }
            }
        }

        assertTrue(TQ.INVALID_LOGIC + "没有可见物体的group", false);
        return z;
    };
    TQ.Element = Element;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: 1) 拖入, 只有声音的 resource 名称,
    //       2) 从scene中读入, 是 JSON
    //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
    function SoundElement(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.instance = null;
        this._isNewSkin = false;
        this.isFirstTimePlay = true;
        if (!!jsonObj.t0) { // 记录声音的插入点， 只在插入点开始播放
            this.t0 = jsonObj.t0;
        } else {
            this.t0 = 0;
        }
        this.isMultiScene = (this.version == TQ.Element.VER2) ? true: false;
        this.initialize(jsonObj);
    }

    SoundElement.srcToObj = function(src) {
        return ({type:"SOUND", src: src, isVis:1});
    };
    var p = SoundElement.prototype = new TQ.Element(null, null, null, null);
    p._parent_doShow = p.doShow;
    p.doShow = function(isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible) this.play();
        else this.stop();
    };

    SoundElement.composeResource = function (res) {
        // wav: 都可以用(似乎IE不行）, 已经被FF24.0，CM29.0， SF5.1.7都支持了！！！
        // MP3: IE, CM, SF： ==》 ogg: 火狐, opera
        var currentBrowser = createjs.Sound.BrowserDetect;
        var newRes = null;
        if (currentBrowser.isFirefox || currentBrowser.isOpera ) {
            newRes = res.replace("mp3", "ogg");
        } else {
            newRes = res.replace("ogg", "mp3");
        }
        return SoundElement._composeFullPath(newRes);
    };

    // 只允许MP3和ogg, 其余的必须转变
    p._doLoad = function () {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.isSound()); // 只用于声音元素
        if (!TQ.SoundMgr.isSupported) return;
        TQ.Log.info("start to play " + this.jsonObj.src);
        var item = TQ.RM.getResource(this.jsonObj.src);
        if (item) {
            this.loaded = true;
            this.instance = createjs.Sound.createInstance(TQ.RM.getID(item)); // 声音只用ID， 不要resouce data
            //ToDo： 需要在这里play吗？
            //this.instance.play(); //interruptValue, delay, offset, loop);
            // this.setTRSAVZ(); 声音元素， 没有平移、比例、旋转等
            this._afterItemLoaded();
            // this.level.onItemLoaded(this);
        } else {
            (function (pt) {
                TQ.RM.addItem(pt.jsonObj.src, function() {pt._doLoad();});
            })(this);
        }
    };

    p._parent_doAddItemToStage = p._doAddItemToStage;
    p._parent_doRemoveFromStage = p._doRemoveFromStage;
    p._doAddItemToStage = function()   // 子类中定义的同名函数, 会覆盖父类, 让所有的兄弟类, 都有使用此函数.
    {
        if (this.isSound()) {
            TQ.SoundMgr.addItem(this);
        } else {
            this._parent_doAddItemToStage();
        }
    };

    p._parent_calculateLastFrame = p.calculateLastFrame;
    p.calculateLastFrame = function() {
        if (!this.instance) return 0;
        if (this.isMultiScene) return 0;  // ToDo: 需要补改变当前的录制长度， （如：200帧的默认值），跨场景的声音， 不能用来计算本场景的最后一帧
        return (this.t0 + this.instance.duration / 1000);
    };

    SoundElement._composeFullPath = function (res) {
        if (res.indexOf(TQ.Config.SOUNDS_PATH) < 0) {
            return TQ.Config.SOUNDS_PATH + res;
        }

        return res;
    };

    p._doRemoveFromStage = function() {
        if (this.isSound()) {
            if (!this.isMultiScene) { // 支持跨场景的声音
                this.stop();
            }
        } else {
            this._parent_doRemoveFromStage();
        }
    };


    p.play = function () {
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            TQ.Log.info(TQ.Dictionary.INVALID_LOGIC + "in SoundElement.resume");
            return;
        }

        if ((!this.visibleTemp)) {
            return; //  不可见； 或者刚才调入， 尚未update生成可见性
        }

        if ((!TQ.FrameCounter.isPlaying() || TQ.FrameCounter.isRequestedToStop())) return;
        if (this.isPaused() || this.isFinished()) { //  在FAILED情况下， 重新开始播放
            var t = TQ.FrameCounter.t();
            if (this.isMultiScene) {
                t = currScene.toGlobalTime(t);
            }
            this.resume(t);
            return;
        }

        if (this.isPlaying()) return;

        if (this.isFirstTimePlay) {
            this.isFirstTimePlay = false;
            if (!this.t0) {
                this.t0 = TQ.FrameCounter.t();   // ToDo:这个t0计算方法有误， 需要根据编辑时插入点的位置， 来计算； 如果播放时，跳开一个位移，则不是播放时的开始位置。
            }
            this.instance.play();
        }
   };

    // 计算元素插入点的绝对时刻（与当前level无关， 只与元素所在level有关），
    p.toGlobalTime = function(t) {
        return (this.level.getT0() + t);
    };

    // t： 对于简单声音，只是本level中的相对时间；
    //     对于跨场景的声音，是全局时间
    p.resume = function(t) { //
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            TQ.Log.info(TQ.Dictionary.INVALID_LOGIC + "in SoundElement.resume");
            return;
        } else {
            if (this.isMultiScene) {
                var ts = this.toGlobalTime(this.t0);  // VER2版本引入的跨场景的声音
            } else {
                var ts = this.t0;  // 兼容VER1版本中的 单一场景的声音。
            }

            if (this.isFirstTimePlay) {
                this.play();
                return;
            }

            var offset = (t - ts) * 1000;
            var SOUND_DATA_BLOCK_SIZE = 1000;
            if ((offset >= 0) && (offset < Math.max(SOUND_DATA_BLOCK_SIZE, this.instance.duration - SOUND_DATA_BLOCK_SIZE))){
                if (this.instance.paused) { // 被暂停的， 可以resume
                    this.instance.resume();
                    this.instance.setPosition(offset); // 必须是先resume， 在setPosition， 不能对pasued声音设置pos
                } else if (this.instance.playState == createjs.Sound.PLAY_FINISHED) { // 不是paused， 则不能resume， 需要重新开始播放
                    // 声音duration剩余1个block的时候， 已经被标记为播放完成了。
                    // 需要重新建立Instance， 丢弃原来的
                    var item = TQ.RM.getResource(this.jsonObj.src);
                    if (item) {
                        this.instance = createjs.Sound.createInstance(TQ.RM.getID(item)); // 声音只用ID， 不要resouce data
                    }

                    var interrupt = createjs.Sound.INTERRUPT_NONE, delay = 0;
                    this.instance.play(interrupt, delay, offset);
                }
            }
        }
    };

    p.pause = function() {
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return;
        }
        this.instance.pause();
    }

    p.isPlaying = function() {
        if (!this.instance) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }

        var state = this.instance.playState;
        if (!state) return false;
        return !((state == createjs.Sound.PLAY_FINISHED) ||
            (state == createjs.Sound.PLAY_INTERRUPTED) ||
            (state == createjs.Sound.PLAY_FAILED))
    };

    p.isPaused = function() {
        if (!this.instance) {
            return false;
        }

        var state = this.instance.playState;
        if (!state) return false;
        return this.instance.paused;
    };

    p.isFinished = function() {
        if (!this.instance) {
            return false;
        }

        var state = this.instance.playState;
        if (!state) return false;
        return state == createjs.Sound.PLAY_FINISHED;
    };

    p.stop = function () {
        if (!!this.instance) {
            if (this.isPlaying() && (!this.instance.paused)) {
                this.instance.stop();
            }
        }
    };

    p.getAlias = function() {
        var result = "声音";
        if (this.jsonObj && this.jsonObj.alias) {
            result = this.jsonObj.alias;
        }
        return result;
    };

    TQ.SoundElement = SoundElement;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: 1) 拖入一个按钮可以换皮肤，可以定义新的动作
    //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
    //  Button的状态：
    //     不可见，
    //      可见（执行可见的action），
    //      被按下，执行（被按下的action），
    //     再次转为不可见，          初始化状态

    function ButtonElement(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.instance = null;
        this._isNewSkin = false;
        this.state2 = ButtonElement.INVISIBLE;
        // 缺省的行为
        this.onVisibleAction = "if (TQ.WCY.isPlayOnly) {TQ.WCY.doStop();}" +
            "else {$('#stop').click();}";
        this.onClickAction = "if (TQ.WCY.isPlayOnly) {TQ.WCY.doPlay();}" +
            "else {$('#play').click();}";
        this.actions = [];
        if (!!jsonObj.t0) { // 记录声音的插入点， 只在插入点开始播放
            this.t0 = jsonObj.t0;
        } else {
            this.t0 = 0;
        }
        this.initialize(jsonObj);
    }

    ButtonElement.INVISIBLE = 0x01;
    ButtonElement.VISIBLE = 0x04;
    ButtonElement.CLICKED = 0x08; //   也可见

    var p = ButtonElement.prototype = new TQ.Element(null, null);

    p._parent_afterItemLoaded = p._afterItemLoaded;
    p._afterItemLoaded = function(desc) {
        this._parent_afterItemLoaded(desc);
        if ((this.level.state == TQBase.LevelState.EDITING) ||
            (this.level.state == TQBase.LevelState.RUNNING)) {
            if (this.jsonObj.t0 != undefined) { // 必须是在 立即插入模式
                TQ.AnimeTrack.setButton(this, this.jsonObj.t0);
            }
        }
        this.buildLinks();
    };

    p._parent_doShow = p.doShow;
    p.doShow = function(isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible) {
            if (this.state2 == ButtonElement.INVISIBLE) { // first time
                this.state2 = ButtonElement.VISIBLE;
                if (TQ.FrameCounter.isPlaying()) {
                    //不能直接用item.onPress = ele.onClick()，因为对象的主题变了。响应的时候，对象是Bitmap，不是按钮元素
                    var item = this.displayObj;
                    (function (ele) {
                        item.onPress = function () {
                            ele.onClick();
                        };
                    })(this);
                }

                TQ.ButtonMgr.addItem(this);
                this.onVisible();
            }
        } else {
            if (this.state2 != ButtonElement.INVISIBLE) {
                this.state2 = ButtonElement.INVISIBLE;
                TQ.ButtonMgr.deleteItem(this);
            }
        }
    };

    p.setButton = function(t) {
        if (TQ.FrameCounter.isPlaying()) {
            TQ.AnimeTrack.setButton(this, t);
        }
    };

    p.onVisible = function() {
        if ((this.level.state == TQBase.LevelState.EDITING) ||
            (this.level.state == TQBase.LevelState.RUNNING)) {
            var t = TQ.FrameCounter.t();
            this.setButton(t);
            eval(this.onVisibleAction);
        }
    };

    p.onClick = function () {
        if (!TQ.SceneEditor.isPlayMode()) return; // 不是播放状态, 不响应click
        if (this.state2 == ButtonElement.VISIBLE) {
            this.state2 = ButtonElement.CLICKED;
            var item = this.displayObj;
            item.onPress = null;
        }

        eval(this.onClickAction);

        for (var i = 0; i < this.actions.length; i++) {
            var act = this.actions[i];
            if ((!act) ||(!act.action)) continue; // 去除空的、被删除的响应,
            act.ele.playAction(act.action, true);
        }
    };

    p.addAction = function(ele, actionName) {
        var id = this._findAction(ele, actionName);
        if (id == TQ.ERROR) {
            this.actions.push({ele:ele, action:actionName});
        } else {
            this.actions[id] = {ele:ele, action:actionName};
        }

        return id;
    };

    p.deleteAction = function(id) {
        if (id < this.actions.length) {
            this.actions[id] = null;
        }
    };

    p.removeAll = function() {
        this.actions.splice(0);
    };

    p._findAction = function(ele, actionName) {
        for (var i = 0; i < this.actions.length; i++) {
            var action = this.actions[i];
            if (!action) {// 被删除了
                continue;
            }
            if ((actionName == action.name) && (action.ele == ele)) {
                return i;
            }
        }

        return TQ.ERROR;
    };

    p.parent_toJSON = p.toJSON;
    p.toJSON = function() {
        this.parent_toJSON();
        if (!!this.actions) {
            this.jsonObj.actions = [];
            for (var i = 0; i < this.actions.length; i++) {
                var act = this.actions[i];
                this.jsonObj.actions.push({elementID: act.ele.id, name: act.name});
            }
        }

        return this.jsonObj;
    };

    p.isButton = function() {return true; };
    p.buildLinks = function() {
        this.actions = [];
        if (!this.jsonObj.actions) return;
        for (var i = 0; i < this.jsonObj.actions.length; i++) {
            var act = this.jsonObj.actions[i];
            if ((!act) ||(!act.action)) continue; // 去除空的、被删除的响应,
            var ele = this.level.findByDescID(act.id);
            if (ele) {
                this.addAction(ele, act.name);
            }
        }
    };
    TQ.ButtonElement = ButtonElement;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * Sound的Manager, 负责Sound的preload, play, stop, 等一系列工作.
 * 是singleton
 */
TQ = TQ || {};
(function () {
    function ButtonMgr() {
    }

    ButtonMgr.items = [];
    ButtonMgr.initialize = function() {
    };

    ButtonMgr.addItem =function(ele) {
        if (ButtonMgr.items.indexOf(ele) >=0) { // 避免同一个元素（跨场景的），重复插入
            return;
        }
        ButtonMgr.items.push(ele);
    };

    ButtonMgr.deleteItem = function(ele) {
        var id = ButtonMgr.items.indexOf(ele);
        if (id >= 0) {
            ButtonMgr.items.splice(id, 1);
        }
    };

    ButtonMgr.removeAll = function()
    {
        for (var i = ButtonMgr.items.length - 1; i >=0; i--) {
            var ele = ButtonMgr.items[i];
            ButtonMgr.items.splice(i,1);
        }
    };

    ButtonMgr.close = function() {
        ButtonMgr.removeAll();
        ButtonMgr.items.splice(0);
    };

    TQ.ButtonMgr = ButtonMgr;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    function TextElement(level, desc) {
      if (level != null ) {  // 适用于 子类的定义, 不做任何初始化,只需要prototype
        this.level = level;
        this.children = [];
        this.decorations = null;
        this._isNewSkin = false;
        this._isHighlighting = false;
        this.animeCtrl = null;
        this.viewCtrl = null;
        this.state = (desc.state == undefined) ? 0 : desc.state;
        this.dirty = this.dirty2 = false;
        this.initialize(desc);
      }
    }

    var p = TextElement.prototype = new TQ.Element(null, null);

    p._doLoad = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); // 合并jsonObj
        var jsonObj = this.jsonObj;
        var txt = new createjs.Text(jsonObj.text, TQ.Utility.toCssFont(jsonObj.fontSize, jsonObj.fontFace), jsonObj.color);
        this.loaded = true;
        if (jsonObj.textAlign == null) {
            txt.textAlign = jsonObj.textAlign;
        } else {
            txt.textAlign = "left";
        }
        this.displayObj = txt;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    TQ.TextElement = TextElement;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function () {
    TQ.Element.upgradeToVer2 = function(desc)
    {
        desc.version = (!desc.version) ? TQ.Element.VER1 : desc.version;
        if (desc.isPinned == undefined) {desc.isPinned = false;}
    };

    // 工厂, 根据数据制作
    TQ.Element.build = function (level, desc) {
        if (!desc) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, !desc);
            return TQ.ERROR;
        }
        // 此处已经组装好了目录
        TQ.Element.upgradeToVer2(desc);
        switch (desc.type) {
            case "SOUND":
                return new TQ.SoundElement(level, desc);
            case "JointMarker":
                return new TQ.Marker(level, desc);
            case "BUTTON":
                return new TQ.ButtonElement(level, desc);
            case "Text" :
                return new TQ.TextElement(level, desc);
            default :
                break;
        }

        if (TQ.Element.isVideo(desc.src)) {
            return new TQ.VideoElement(level, desc);
        }

        return new TQ.Element(level, desc);
    };

    TQ.Element.isVideo = function (filename) {
        if (!filename) {
            return false;
        }

        var videoExtension = ['mp4', 'mov'];
        var ext = "";
        var index = filename.lastIndexOf('.');
        if (index >= 0) {
            ext = filename.substr(index + 1);
            if (videoExtension.indexOf(ext) >= 0) {
                return true;
            }
        }

        return false;
    };

}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    function InputCtrl () {

    }
    InputCtrl._stage = null;
    InputCtrl.MODE_ROTATE = 1;
    InputCtrl.MODE_SCALE = 2;
    InputCtrl.mode = InputCtrl.MODE_ROTATE;
    InputCtrl.inSubobjectMode = false;
    InputCtrl.showMarkerOnly = false; // 在零件模式下， 只是显示marker， 不改变物体选择模式
    InputCtrl.vkeyMove = false;
    InputCtrl.vkeyRotate = false;
    InputCtrl.vkeyScale = false;
    InputCtrl.vkeyLift = false;
    InputCtrl.vkeyCtrl = false;
    InputCtrl.vkeyUnjoint = false;
    InputCtrl.vkeyUngroup = false;
    InputCtrl.clearVkey = function () {
        InputCtrl.vkeyMove = false;
        InputCtrl.vkeyRotate = false;
        InputCtrl.vkeyScale = false;
        InputCtrl.vkeyLift = false;
        InputCtrl.vkeyUnjoint = false;
        InputCtrl.vkeyUngroup = false;
    };

    InputCtrl.leaveTraceOn = false; // 不绘制运动轨迹
    InputCtrl.initialize = function(stage) {
        InputCtrl._stage = stage;
        TQ.InputMap.registerAction(TQ.InputMap.C,  function () {
            currScene.currentLevel.cloneElement(TQ.SelectSet.members);
        });
        TQ.InputMap.registerAction(TQ.InputMap.HIDE_KEY |TQ.InputMap.LEFT_ALT_FLAG,  function() {
            TQ.SelectSet.show(false);
        });
        TQ.InputMap.registerAction(TQ.InputMap.HIDE_KEY,  function() {
            TQ.SelectSet.show(false);
        });
        TQ.InputMap.registerAction(TQ.InputMap.SHOW_KEY,  function() {
            TQ.SelectSet.show(true);
        });
        TQ.InputMap.registerAction(TQ.InputMap.SHOW_KEY | TQ.InputMap.LEFT_ALT_FLAG,  function() {
            TQ.SelectSet.show(true);
        });
        TQ.InputMap.registerAction(TQ.InputMap.SHOW_ALL_HIDEN_OBJECT_KEY,  function() {
            TQ.Element.showHidenObjectFlag = !TQ.Element.showHidenObjectFlag;
        });

        TQ.InputMap.registerAction(TQ.InputMap.PLAY_STOP_KEY,  function() {
            TQ.WCY.doPlayStop();
        });
    };

    // 连续Z向移动， 距离越远， 移动的越多。
    // 与鼠标运动快慢， 一致。
    InputCtrl._accumulateStep = 0;
    InputCtrl._lastItemID = -1;

    $(document).mouseup(function () {
        InputCtrl._accumulateStep = 0;
    });

    InputCtrl.isSameItem = function(target) {
        return (InputCtrl._lastItemID == target.id);
    };

    InputCtrl.getDelta = function (mode, element, target, offset, ev) {
        // offset 是 hit点与图像定位点之间的偏移， 在MouseDown的时候由Element的onPress计算的
        var deltaY = TQ.Utility.deltaYinWorld(target, offset, ev);
        var deltaX = (ev.stageX + offset.x)  - target.x;
        var delta = deltaY + deltaX;
        var sensitivity = (mode == InputCtrl.MODE_ROTATE) ?
            TQ.Config.RotateSensitivity : TQ.Config.MouseSensitivity;
        InputCtrl.step = Math.floor(delta / sensitivity);
        var deltaStep = (InputCtrl.isSameItem(target))? (InputCtrl.step - InputCtrl._accumulateStep) : InputCtrl.step;
        TQ.Log.out("ID:" + InputCtrl._lastItemID + "sum" + InputCtrl._accumulateStep
            +", step: " + InputCtrl.step + ", delta: " + deltaStep);
        if (null != target) {
            InputCtrl._lastItemID = target.id;
        }
        return deltaStep;
    };

    InputCtrl.scale = function (element, target, offset, ev) {
        var deltaStep = InputCtrl.getDelta(InputCtrl.MODE_SCALE, element, target, offset, ev);
        var coefficient = 1;
        if (deltaStep == 0) {
            return ;
        } else if (deltaStep > 0) {
            coefficient = 1.1 * deltaStep;
        } else if (deltaStep < 0) {
            coefficient = 0.9 * (-deltaStep);
        }
        coefficient = TQ.MathExt.range(coefficient, 0.8, 1.2 );
        if (null != target) {
            InputCtrl.doScale(element, coefficient);
            InputCtrl._accumulateStep = InputCtrl.step;
        }

        // displayInfo2("deltaStep: " + deltaStep + " Scale coefficient:" + coefficient);
    };

    /*
    比例变换， 给指定的元素element，放大coefficient倍（ 相对于当前的大小），
     */
    InputCtrl.doScale = function(element, coefficient) {
        assertNotNull(TQ.Dictionary.FoundNull, element);
        if (!element) return;
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, (coefficient > 0)); //比例变换系数应该是正值
        var MIN_SCALE = 0.1, MAX_SCALE = 2;
        coefficient = InputCtrl.limitScale(element.jsonObj.sx, MIN_SCALE, MAX_SCALE, coefficient);
        coefficient = InputCtrl.limitScale(element.jsonObj.sy, MIN_SCALE, MAX_SCALE, coefficient);
        InputCtrl.doScaleCmd(element, {sx: element.jsonObj.sx * coefficient,
                sy: element.jsonObj.sy * coefficient});
    };

    InputCtrl.doScaleCmd = function(ele, newScale) {
        var oldValue = {sx:ele.jsonObj.sx, sy: ele.jsonObj.sy};
        TQ.CommandMgr.directDo(new TQ.GenCommand(TQ.GenCommand.SCALE, ele, newScale, oldValue));
    };

    /*
    镜像变换: 关于X轴镜像，（上下对称）
     */
    InputCtrl.mirrorX = function(element) {
        assertNotNull(TQ.Dictionary.FoundNull, element);
        if (!element) return;
        var coefficientX = -1;
        InputCtrl.doScaleCmd(element,
            {sx: element.jsonObj.sx * coefficientX,
                sy: element.jsonObj.sy});
    };

    /*
     镜像变换: 关于Y轴镜像，（左右对称）
     */
    InputCtrl.mirrorY = function(element) {
        assertNotNull(TQ.Dictionary.FoundNull, element);
        if (!element) return;
        var coefficientY = -1;
        InputCtrl.doScaleCmd(element,
            {sx: element.jsonObj.sx,
                sy: element.jsonObj.sy * coefficientY});
    };

    InputCtrl.limitScale = function(currentScale, minAbsScale, maxAbsScale, coefficient) {
        var newScale =  currentScale * coefficient;
        if (Math.abs(newScale) > maxAbsScale) {
            coefficient = maxAbsScale / currentScale;
        } else if (Math.abs(newScale) < minAbsScale) {
            coefficient = minAbsScale / currentScale;
        }
        return coefficient;
    };

    InputCtrl.setSubobjectMode = function() {
      InputCtrl.inSubobjectMode = true;
      var btns = $("#subElementMode");
      btns[0].checked = true;
      btns.button("refresh");
    };
    TQ.InputCtrl = InputCtrl;
}) ();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 移动操作器
 */

window.TQ = window.TQ || {};

(function () {
    function MoveCtrl () {

    }
    MoveCtrl._stage = null;
    MoveCtrl.initialize = function(stage) {
        MoveCtrl._stage = stage;
        MoveCtrl.queue = [];
        MoveCtrl._direction = 1;
    };

    // 连续Z向移动， 距离越远， 移动的越多。
    // 与鼠标运动快慢， 一致。
    MoveCtrl._accumulateStep = 0;
    MoveCtrl._lastItemID = -1;

    $(document).mouseup(function () {
        MoveCtrl._accumulateStep = 0;
    });

    MoveCtrl.isSameItem = function(target) {
        return (MoveCtrl._lastItemID == target.id);
    };

    MoveCtrl.moveZ = function (ele, offset, ev) {
        var target = ele.displayObj;
        // offset 是 hit点与图像定位点之间的偏移， 在MouseDown的时候由Element的onPress计算的
        var deltaY = TQ.Utility.deltaYinWorld(target, offset, ev);
        var step = Math.floor(deltaY /TQ.Config.MouseSensitivity);
        var deltaStep = (MoveCtrl.isSameItem(target))? (step - MoveCtrl._accumulateStep) : step;
        if (deltaStep != 0) {
            MoveCtrl._accumulateStep = step;
            MoveCtrl._doMoveZ(ele, deltaStep);
            TQ.Log.out("ID:" + MoveCtrl._lastItemID + "sum" + MoveCtrl._accumulateStep
                +", step: " + step + ", delta: " + deltaStep);
        }
    };

    /*
    移动层次，step >= 1： 向上移动1层； step <-1： 向下移动1层
     */
    MoveCtrl.moveLayer = function (ele, step) {
        var oldZ = ele.getZ();
        TQ.CommandMgr.addCommand(new TQ.GenCommand(TQ.GenCommand.CHANGE_LAYER, ele, step, oldZ));
    };

    // 下面的函数只被command所调用, 不会被其它函数调用
    MoveCtrl.cmdMoveLayer = function (ele, step) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        MoveCtrl._openQueue(step);
        MoveCtrl._doMoveZ(ele, step);
        MoveCtrl._flush();
    };

    /*
    移动到最顶层
     */
    MoveCtrl.moveToTop = function (ele) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        MoveCtrl.moveLayer(ele, 99999);
    };

    /*
     移动到最底层
     */
    MoveCtrl.moveToBottom = function (ele) {
        assertNotNull(TQ.Dictionary.FoundNull, ele);
        if (!ele) return;
        MoveCtrl.moveLayer(ele, -99999);
    };

    MoveCtrl._doMoveZ = function (ele, step) {
        var target = ele.displayObj;
        // move up the selected object toward more visible
        if (null != target) {
            MoveCtrl._moveZOne(ele);
            MoveCtrl._lastItemID = target.id;
            if (!!ele.children) {
                for (var i=0; i< ele.children.length; i++) {
                    MoveCtrl._doMoveZ(ele.children[i], step);
                }
            }
        }
    };

    MoveCtrl._moveZOne = function(ele)
    {
        if (!ele.displayObj) return;
        var id = MoveCtrl._stage.getChildIndex(ele.displayObj);
        if (id >= 0) {
            MoveCtrl.queue.push({"id": id, "ele":ele});
        }
    };

    MoveCtrl._openQueue = function(step) {
        MoveCtrl._direction = step;
        MoveCtrl.queue.splice(0);
    };

    MoveCtrl._flush = function() {
        var num = MoveCtrl.queue.length;
        if (num > 0) {
            if (MoveCtrl._direction < 0) {
                MoveCtrl.queue.sort(function(a, b) {return a.id >= b.id;})
            } else {
                MoveCtrl.queue.sort(function(a, b) {return a.id <= b.id;})
            }
            var step = MoveCtrl._direction;
            // 上移一层但是已经到顶，或者下移一层但是已经到底， 就不再操作）
            if ( (step == 1) && ((MoveCtrl._stage.getNumChildren() - 1) == MoveCtrl.queue[0].id)) {return; }
            if ( (step == -1) && (0 == MoveCtrl.queue[0].id)) {return; }
            // 到底、到顶操作：确保各个子元素的移动距离是一样的， 不能都奔到最顶最低
            if (step > 1) {
                step = (MoveCtrl._stage.getNumChildren() - 1) - MoveCtrl.queue[0].id;
            } else if (step < -1) {
                step = - MoveCtrl.queue[0].id;
            }
            if (step == 0) return;
            for (var i = 0; i < num; i ++) {
                var item = MoveCtrl.queue.shift();
                MoveCtrl._doMoveZOne(item.ele, step);
            }
        }
    };

    MoveCtrl._doMoveZOne = function(ele, step)
    {
        var target = ele.displayObj;
        if (!target) return;
        var id = MoveCtrl._stage.getChildIndex(target);
        if (id >= 0) {
            var newID = TQ.MathExt.range(id + step, 0, MoveCtrl._stage.getNumChildren() - 1);
            if (id != newID) {
                if ((step > 1) || (step < -1))  { // move to Top, or Bottom
                    MoveCtrl._stage.setChildIndex(ele.displayObj, newID);
                } else {
                    MoveCtrl._stage.swapChildrenAt(id, newID);
                }
            }
        }
    };

    TQ.MoveCtrl = MoveCtrl;
}) ();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 把A物体连接到B物体上,
 */

window.TQ = window.TQ || {};

(function () {
    function SkinningCtrl () {

    }
    SkinningCtrl.hasNew = false;
    SkinningCtrl._stage = null;
    SkinningCtrl._scene = null;
    SkinningCtrl._hostObj = null;
    SkinningCtrl.isWorking = false;
    SkinningCtrl.initialize = function(stage, scene) {
        SkinningCtrl._stage = stage;
        SkinningCtrl._scene = scene;
    };

    SkinningCtrl.oldSubjectMode = null;
    SkinningCtrl.start = function() {
        SkinningCtrl._hostObj = TQ.SelectSet.peek();
        if (SkinningCtrl._hostObj == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return;
        }
        SkinningCtrl.isWorking = true;
        SkinningCtrl.oldSubjectMode = TQ.InputCtrl.inSubobjectMode;
        TQ.InputCtrl.inSubobjectMode = true;
        TQ.SelectSet.getSelectedElement();
        SkinningCtrl._hostObj = TQ.SelectSet.pop();
        //ToDo: 能够禁止再次进入吗 $("#skinning").button("disable");    
        $(document).bind("mousedown", SkinningCtrl.getSkin);
    };

    SkinningCtrl.getSkin = function () {
        var skin = TQ.SelectSet.pop();
        assertNotNull(TQ.Dictionary.PleaseSelectHost, SkinningCtrl._hostObj);
        if ((skin != null) && (skin.displayObj.id != SkinningCtrl._hostObj.displayObj.id)) {
            SkinningCtrl._scene.skinning(SkinningCtrl._hostObj, skin);
            TQ.SelectSet.clear();
            SkinningCtrl.end();
            // SkinningCtrl.hasNew = true;
        }
    };

    SkinningCtrl.end = function() {
        if (SkinningCtrl.isWorking) {
            SkinningCtrl.isWorking = false;
            if (SkinningCtrl.oldSubjectMode != null){
                TQ.InputCtrl.inSubobjectMode = SkinningCtrl.oldSubjectMode;
            }
            $(document).unbind("mousedown", SkinningCtrl.getSkin);
            //ToDo: 可以吗?  $("#skinning").button("enable");
        }
    };

    TQ.SkinningCtrl = SkinningCtrl;
}) ();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 把A物体连接到B物体上,
 */

window.TQ = window.TQ || {};

(function () {
    function IKCtrl () {

    }
    // 任何时候, 都是IK动画, 除非是 Break it 进入子物体编辑模式. 默认就是最好的状态, 精锐尽出
    IKCtrl._stage = null;
    IKCtrl._scene = null;
    IKCtrl.EObj = null;  // E点在对象空间的坐标值
    IKCtrl.initialize = function(stage, scene) {
        IKCtrl._stage = stage;
        IKCtrl._scene = scene;
    };
    IKCtrl.isSimpleRotationMode = false; // 切换IK模式 和 单一物体的简单旋转模式。
    IKCtrl.angle = function (S, E, A) { //  从SE 转到SA 需要转多少角度？
        var SE = TQ.Vector2D.create([E.x - S.x, E.y - S.y]);
        var SA = TQ.Vector2D.create([A.x - S.x, A.y - S.y]);
        SE.toUnitVector();
        SA.toUnitVector();
        return SA.angle360From(SE);
    };

    IKCtrl.getE = function (targetElement) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, IKCtrl.EObj);
        var EWorld = targetElement.jsonObj.M.multiply($V([IKCtrl.EObj.x, IKCtrl.EObj.y, 1]));
        return {x: EWorld.elements[0], y: EWorld.elements[1]};
    };

    IKCtrl.hasAchieved = function (E, A) {
        var distance = Math.abs(A.x - E.x) + Math.abs(A.y - E.y);
        // TQ.Log.trace("distance = " + distance + " E: " + E.x + ",  " + E.y + "A:" + A.x +", "+ A.y);
        return (distance < 1);
    };

    IKCtrl.applyLimitation = function(child, angle) {
        if ((child.jsonObj.angleMin != null)  || (child.jsonObj.angleMax != null)) {
            var angleMin = child.jsonObj.angleMin, angleMax = child.jsonObj.angleMax;

            var parentAngle = 0;
            if (child.parent != null) {
                parentAngle = child.parent.jsonObj.rotation;
            }
            var relativeAngle = angle - parentAngle;  // relative to parent;
            relativeAngle = TQ.MathExt.range(relativeAngle, angleMin, angleMax);
            angle = relativeAngle + parentAngle;
        }

        return angle;
    };

    /*
    设置关节的运动范围限制，limitation有值， 则用之， 否则，以当前的位置作为界限。
    界限是相对于父物体的，是相对值， 不是绝对值
    type = 0: 设置 最小值；
    tyoe = 1: 其它 设置 最大值;
     */
    IKCtrl.setLimitation = function(type, angle) {
        var child = TQ.SelectSet.peek();
        if (child == null) return;
        if (angle == null) {
            angle = child.jsonObj.rotation;
        }
        var parentAngle = 0;
        if (child.parent != null) {
            parentAngle = child.parent.jsonObj.rotation;
        }
        var relativeAngle = angle - parentAngle;  // relative to parent;

        var oldValue;
        var cmd_type;
        if (type == 0) {
            oldValue = (child.jsonObj.angleMin == undefined) ? null: child.jsonObj.angleMin;
            cmd_type = TQ.GenCommand.MIN_JOINT_ANGLE;
        } else {
            oldValue = (child.jsonObj.angleMax == undefined) ? null: child.jsonObj.angleMax;
            cmd_type = TQ.GenCommand.MAX_JOINT_ANGLE;
        }
        TQ.CommandMgr.directDo(new TQ.GenCommand(cmd_type,
            child, relativeAngle, oldValue));

        //检查合法性
        if ((child.jsonObj.angleMin != null) && (child.jsonObj.angleMax != null)) {
            if (child.jsonObj.angleMin  > child.jsonObj.angleMax) {
                TQ.MessageBubble(TQ.Dictionary.INVALID_PARAMETER);
            }
        }
    };

    IKCtrl.calOneBone = function(child, target, A) {
        // 目的是把E点转动到A点，通过各级bone绕自身轴点S的转动实现
        // S: 转动的支点， 也是当前处理之Bone的pivot点
        // E: 终点， 物体上被鼠标点击的位置，虽然E的物体坐标不变，但其世界坐标在求解过程中是改变的。
        // A: 目的位置， 要把E点移动到A点。
        // child： 当前处理的Bone，
        // target：选中的bone，一般是最末的一个bone。
        var S = child.jsonObj;
        var E = IKCtrl.getE(target);
        if (IKCtrl.hasAchieved(E, A)) return true;
        var angle = IKCtrl.angle(S, E, A);   // 从SE转到SA,
        var operationFlags = child.getOperationFlags();  // 必须保存， 因为 update和record会清除 此标记。
        IKCtrl.rotate(child, angle);
        if (IKCtrl.isSimpleRotationMode) return true;  // 简单旋转， 比不牵涉其它关节，

        if (child.isRoot() || child.parent.isPinned()) { // 如果固定了, 不IK
            return false; // 达到根, 迭代了一遍, 未达到目标,
        }

        assertNotNull(TQ.Dictionary.FoundNull, child.parent); //非root关节,有parent
        child.parent.setFlag(operationFlags);
        return IKCtrl.calOneBone(child.parent, target, A);
    };

    /*
    旋转物体（及其子物体），angle角度， (逆时针为正， 顺时针为负）
     */
    IKCtrl.rotate = function (child, angle) {
        assertNotNull(TQ.Dictionary.FoundNull, child);
        if (!child) return;

        angle = IKCtrl.applyLimitation(child, child.jsonObj.rotation + angle);
        TQ.CommandMgr.directDo(new TQ.RotateCommand(child, angle));
        child.update(TQ.FrameCounter.t()); // 更新本bone以及 所以后续Bone的 物体坐标, 世界坐标
        TQ.Log.info("image: " + child.jsonObj.src + "angle = " + angle);
    };

    IKCtrl.do = function (element, offset, ev, isSimpleRotationMode) {
        IKCtrl.isSimpleRotationMode = isSimpleRotationMode;
        var displayObj  = IKCtrl._stage.selectedItem;
        if (displayObj == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return;
        }

        var target = IKCtrl._scene.findAtom(displayObj);
        if (target == null) {
            displayInfo2(TQ.Dictionary.PleaseSelectOne);
            return;
        }

        var rDeviceX = ev.stageX;
        var rDeviceY = ev.stageY;
        // displayInfo2("ev.stageX,Y=" + rDeviceX +  ", " + rDeviceY);

        var A = TQ.Utility.deviceToWorld(rDeviceX, rDeviceY);
        if (offset.firstTime == true) {
          IKCtrl.EObj = IKCtrl.determineE(element, offset, ev);
          offset.firstTime = false;
        }

        if (!IKCtrl.EObj) {
          displayInfo2(TQ.Dictionary.PleaseSelectOne);
        }

        for (var i =0; i < TQ.Config.IK_ITERATE_TIME; i++) {
            if (IKCtrl.calOneBone(target, target, A)) break;
        }
    };

    IKCtrl.determineE = function(element, offset, ev)
    {
      // 求E点在element元素物体空间的坐标
      // 设备坐标 --》 世界坐标 --》 物体坐标。
      var eDevice = {x: ev.stageX, y: ev.stageY};
      var eWorld = TQ.Utility.deviceToWorld(eDevice.x, eDevice.y);
      var objectSpace = element.jsonObj; // 对象空间的描述，注意: 是element元素自己，不是他的parent !!
      TQ.Pose.worldToObject(eWorld, objectSpace);
      return {x: TQ.Pose.x, y: TQ.Pose.y};
    };

    TQ.IKCtrl = IKCtrl;
}) ();

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    // 用法: Marker是一种修饰品Decoration. 也是Element类的子类.
    function Marker(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.decorations = null;
        this.host = null;
        this._isNewSkin = false;
        this.initialize(jsonObj);
    }

    Marker.RADIUS = 10;

    var p = Marker.prototype = new TQ.Element(null, null, null, null);

    p.attach = function() {
        this.jsonObj.x = this.host.jsonObj.x; // 相同的位置, 没有误差, 才会得到 真正的原点
        this.jsonObj.y = this.host.jsonObj.y;
    };

    p._parent_update = p.update;
    p.update2 = function(t) {
        var ele = this.host;
        this.moveToTop();
        if (this.isUserControlling() && TQ.InputMap.mouseMoving) {
            this._parent_update(t);
            var dwx = this.jsonObj.x - ele.jsonObj.x;
            var dwy = this.jsonObj.y - ele.jsonObj.y;
            TQ.CommandMgr.directDo(new TQ.MovePivotCommand(ele,
                ele.calPivot(TQ.Pose.x, TQ.Pose.y),
                {x:ele.jsonObj.x + dwx,
                 y:ele.jsonObj.y + dwy},
                this));
        }
    };

    p.moveToTop = function() {
        var id = stage.getNumChildren();
        stage.setChildIndex(this.displayObj, id - 1);
    };

    p.createImage = function() {
        var s = this.displayObj;
        if (!s) {
            TQ.Log.criticalError(TQ.Dictionary.FoundNull);
            return;
        }

        s.graphics.clear(); // 清除老的边框
        var radius = Marker.RADIUS;
        s.graphics.ss(radius).beginStroke("#f0f").
            beginRadialGradientFill(["#FFF","#0FF"],[0,1],0,0,0,0,0,radius).
            drawCircle(0,0,radius).endFill();
    };

    p._loadMarker = function () {
        assertNotNull(TQ.Dictionary.FoundNull, this.jsonObj); //合并jsonObj
        var jsonObj = this.jsonObj;
        var s = new createjs.Shape();
        this.loaded = true;
        s.x = jsonObj.x;
        s.y = jsonObj.y;
        this.displayObj = s;
        this._afterItemLoaded();
        this.setTRSAVZ();
    };

    p.apply = function(ele) {
        this.jsonObj.x = ele.jsonObj.x;
        this.jsonObj.y = ele.jsonObj.y;
        this.dirty2 = true;
        this.setFlag(TQ.Element.TRANSLATING);
        if (TQBase.LevelState.isOperatingCanvas()){
            this.createImage();
        }
    };

    TQ.Marker = Marker;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};

(function () {
    var SelectSet = {};
    SelectSet.members = [];
    SelectSet.decorations = [];  //  decorations ready to use
    SelectSet.workingDecorations = []; // decorations is using.
    SelectSet.selectedMarkers = []; // 选中的dec元素的集合(转轴点和夹点都是marker)(一个物体上只能选中一个)
    SelectSet.initialize = function() {
        TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY, function(){
            if ( (!TQ.TextEditor.visible) && (!TQ.FileDialog.visible)) {
                TQ.SelectSet.delete();
            }
        });
        TQ.InputMap.registerAction(TQ.InputMap.DELETE_KEY | TQ.InputMap.LEFT_ALT_FLAG, TQ.SelectSet.eraseAnimeTrack);
        TQ.InputMap.registerAction(TQ.InputMap.EMPTY_SELECTOR, TQ.SelectSet.clear);

        var keyActionPair = {
            1: "idle",
            2: "work",
            3: "run",
            4: "smile",
            5: "stand"
        };
        TQ.InputMap.registerAction(TQ.InputMap.D1, function() { SelectSet.playAnimation(keyActionPair[1]);});
        TQ.InputMap.registerAction(TQ.InputMap.D2, function() { SelectSet.playAnimation(keyActionPair[2]);});
        TQ.InputMap.registerAction(TQ.InputMap.D3, function() { SelectSet.playAnimation(keyActionPair[3]);});
        TQ.InputMap.registerAction(TQ.InputMap.D4, function() { SelectSet.playAnimation(keyActionPair[4]);});
        TQ.InputMap.registerAction(TQ.InputMap.D5, function() { SelectSet.playAnimation(keyActionPair[5]);});
    };

    SelectSet.playAnimation = function(actionName) {
        var ele = SelectSet.peek();
        if (ele != null) {
            ele.playAction(actionName);
        }
    };

    SelectSet.getDecoration = function () {
        var decs = SelectSet.decorations.pop();
        if (decs == null) {
            var ref = TQ.SelectSet.members[0];
            assertNotNull(TQ.Dictionary.PleaseSelectHost, ref);
            //ToDo: 生成所有的夹点, 和 轴心点 图案.
            var ele = TQ.Element.build(ref.level, {isVis: 0, type:"JointMarker"});
            decs = [ele];
        }
        SelectSet.workingDecorations.push(decs);
        return decs;
    };

    SelectSet.recycleDecoration = function(decoration) {
        var id = SelectSet.workingDecorations.indexOf(decoration);
        SelectSet.workingDecorations.splice(id, 1);
        SelectSet.decorations.push(decoration);
    };

    SelectSet.add = function(element) {
        assertNotNull(TQ.Dictionary.PleaseSelectOne, element);
        if ((element == null )) return;
        if (element.isMarker()) { //  Decoration 不能记入选择集
            SelectSet.selectedMarkers.push(element);
            return;
        }

        SelectSet.selectedMarkers.splice(0); // 换了物体， Decoration就可能不被选中了。
        if (!(TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyCtrl)) {
            if (!((SelectSet.members.length == 1) && (SelectSet.members.indexOf(element) ==0))) {
                SelectSet.clear();
            }
        }
        if (SelectSet.members.indexOf(element) < 0) {
            SelectSet.members.push(element);
            element.highlight(true);
            if (TQ.InputCtrl.inSubobjectMode)  SelectSet.attachDecoration(element);

            // 对于关节物体上的子关节，在整体模式下，情况复杂一些：
            //    如果是“移动关节”： 则选中的是子关节
            //    如果是floatToolbar上的操作，缩放、旋转，等， 则是整体
            if (!TQ.InputCtrl.inSubobjectMode && element.isJoint()) {
                TQ.floatToolbar.selectedElement = element;
            } else {
                TQ.floatToolbar.selectedElement = element;
            }
        }
    };

    /*
    删除当前选中的所有元素
     */
    SelectSet.delete = function() {
        SelectSet.clear(true);
    };

    SelectSet.clear = function(withDelete) {
        var cmd;
        if (withDelete) {
            cmd = new TQ.CompositeCommand();
        }

        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            if (ele.isValid()) ele.highlight(false); // 可能已经被前面的父物体一起删除了
            SelectSet.detachDecoration(ele);
            if (withDelete && ele.isValid()) {
                cmd.addCommand(new TQ.DeleteEleCommand(currScene, ele));
            }
        }
        if (withDelete && (cmd.commands.length > 0)) {
            TQ.CommandMgr.directDo(cmd);
        }

        if (SelectSet.getElementUnderMouse() == null) {
            TQ.floatToolbar.show(false);
            if (TQ.TabsMenu.closeDiv) {
                TQ.TabsMenu.closeDiv();
            }
        }

        SelectSet.members.splice(0); // 删除全部选中的物体;
        SelectSet.selectedMarkers.splice(0);
    };

    SelectSet.updateDecorations = function(show) {
        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            if (show) {
                SelectSet.attachDecoration(ele);
            } else {
                SelectSet.detachDecoration(ele);
            }
        }
    };

    SelectSet.groupIt = function() {
        var isUnGroup = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyUngroup;
        if (isUnGroup || (SelectSet.members.length >= 2)) {
            TQ.CommandMgr.directDo(new TQ.GroupCommand(SelectSet.members, isUnGroup));
            SelectSet.clear();
            return true;
        }

        return false;
    };

    SelectSet.jointIt = function() {
        var hasUnjointFlag = TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL] || TQ.InputCtrl.vkeyUnjoint;
        TQ.CommandMgr.directDo(new TQ.JointCommand(SelectSet.members, hasUnjointFlag));
        SelectSet.clear();
    };

    SelectSet.pinIt = function() {
        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            if (ele.isValid()) ele.pinIt();
        }
    };

    SelectSet.show = function(visible) {
        var allowIndividual = TQ.InputCtrl.inSubobjectMode || TQ.InputMap.isPresseds[TQ.InputMap.LEFT_ALT];
        TQ.CommandMgr.directDo(new TQ.HideCommand(SelectSet.members, allowIndividual));
    };

    SelectSet.doShow = function(eles, allowIndividual) {
        var isVisible = false;
        for (var i=0; i< eles.length; i++) {
            var ele = eles[i];
            if (!allowIndividual) {
                while (ele.isJoint() && (ele.parent != null)) { // find root for joints
                    ele = ele.parent;
                }
            }
            isVisible = ele.isVisible();
            ele.toggleVisibility();
        }

        TQ.floatToolbar.show(!isVisible);
    };

    SelectSet.eraseAnimeTrack = function() {
        TQ.FrameCounter.gotoBeginning();
        for (var i = 0; i< SelectSet.members.length; i++) {
            var ele = SelectSet.members[i];
            assertNotNull(TQ.Dictionary.FoundNull, ele);
            if (ele.isValid()) ele.eraseAnimeTrack();
        }
    };

    $(document).mousedown(function(e) {
        if ((e.target) && (e.target.id == "testCanvas")) {
            // 已经在 Element 的onPress中实现了
            if (stage.selectedItem == null) {
                SelectSet.clear();
            }
        } else if ((e.target) && (e.target.tagName == "BODY")) { // 页面的空白处
            SelectSet.clear();
        }
    });

    SelectSet.getElementUnderMouse = function() {
        var target = stage.selectedItem;
        var element = (target == null)? null: currScene.findAtom(target);  //包括点击菜单, 此函数也会响应
        if (element != null) {
            element = SelectSet.getEditableEle(element);
        }

        return element;
    };

    SelectSet.getSelectedElement = function() {
        var element = SelectSet.getElementUnderMouse();
        if (element != null) {
            SelectSet.add(element);
        } else {
            if (!TQ.InputMap.isPresseds[TQ.InputMap.LEFT_CTRL]) {
                SelectSet.clear();
            }
            TQ.floatToolbar.show(false);
        }

        return TQ.SelectSet.peek();
    };

    SelectSet.getEditableEle = function(ele) {  // 获取Group物体在整体操作模式下的可操作对象
        // Jointed 物体： 获取当前的joint
        // Group的物体: 而且没有打散, 则操作其根
        // 3D打包的物体：操作其根
        if (TQ.InputCtrl.showMarkerOnly) { // 在创作复合物体的时候， 如果不在零件模式，也可以只要求显示Marker。
            assertTrue(TQ.Dictionary.INVALID_LOGIC, TQ.InputCtrl.inSubobjectMode);
        }

        if ((!ele.isJoint()) && ele.isGrouped()) {
            if ((!TQ.InputCtrl.inSubobjectMode) || TQ.InputCtrl.showMarkerOnly) {
                if (ele.parent != null) return TQ.SelectSet.getEditableEle(ele.parent);
            }
        }
        return ele;
    };

    SelectSet.isSelected = function(ele) {
        return ((SelectSet.members.indexOf(ele) >= 0) ||
            (SelectSet.selectedMarkers.indexOf(ele) >= 0));
    };

    /*
    返回第一个元素，并且，从选择集中删除它
     */
    SelectSet.pop = function() {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, SelectSet.members.length > 0); //非空集合
        var ele = SelectSet.members.pop();
        SelectSet.detachDecoration(ele);
        return (ele);
    };

    /*
     返回 第一个选中的元素， 但是，仍然保留它在选择集中， 不删除
     */
    SelectSet.peek = function() {
        if (SelectSet.members.length <= 0) {
            return null;
        }
        return (SelectSet.members[0]);
    };

    SelectSet.detachDecoration = function(ele) {
        if (ele.decorations != null) {
            var decoration = ele.detachDecoration();
            SelectSet.recycleDecoration(decoration);
        }
    };

    SelectSet.attachDecoration = function(ele){
        if (!ele.decorations) {
            ele.attachDecoration(SelectSet.getDecoration());
        }
    };

    // 命令：
    function GroupCommand(elements, hasUngroupFlag) {
        this.receiver = [];
        for (var i = 0; i < elements.length; i++) { //需要复制元素， 防止原来的集合被clear清空
            this.receiver.push(elements[i]);
        }
        this.oldValue = !hasUngroupFlag;
        this.newValue = hasUngroupFlag;
    }

    inherit(GroupCommand, TQ.AbstractCommand);

    GroupCommand.prototype.do = function() {
        currScene.groupIt(this.receiver, this.newValue);
        return(this.constructor.name + this.receiver);
    };

    GroupCommand.prototype.undo = function() {
        if (this.oldValue) {  // ungroup 需要这些元素的根（Group元素）， 而不需要这些元素本身
            assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.receiver.length > 0);
            currScene.groupIt([this.receiver[0].parent], this.oldValue);
        }
        return(this.constructor.name + this.receiver);
    };

    GroupCommand.prototype.redo = GroupCommand.prototype.do;

    function JointCommand(elements, hasUnjointFlag) {
        this.receiver = [];
        for (var i = 0; i < elements.length; i++) {
            this.receiver.push(elements[i]);
        }
        this.oldValue = !hasUnjointFlag;
        this.newValue = hasUnjointFlag;
    }

    inherit(JointCommand, TQ.AbstractCommand);

    JointCommand.prototype.do = function() {
        currScene.joint(this.receiver, this.newValue);
        return(this.constructor.name + this.receiver);
    };

    JointCommand.prototype.undo = function() {
        currScene.joint(this.receiver, this.oldValue);
        return(this.constructor.name + this.receiver);
    };

    JointCommand.prototype.redo = JointCommand.prototype.do;

    // 命令：
    function HideCommand(elements, allowIndividual) {
        this.receiver = [];
        for (var i = 0; i < elements.length; i++) { //需要复制元素， 防止原来的集合被clear清空
            this.receiver.push(elements[i]);
        }
        this.oldValue = allowIndividual;
        this.newValue = allowIndividual;
    }

    inherit(HideCommand, TQ.AbstractCommand);

    HideCommand.prototype.do = function() {
        SelectSet.doShow(this.receiver, this.newValue);
        return(this.constructor.name + this.receiver);
    };

    HideCommand.prototype.undo = function() {
        SelectSet.doShow(this.receiver, this.oldValue);
        return(this.constructor.name + this.receiver);
    };

    HideCommand.prototype.redo = HideCommand.prototype.do;

    TQ.GroupCommand = GroupCommand;
    TQ.JointCommand = JointCommand;
    TQ.HideCommand = HideCommand;
    TQ.SelectSet = SelectSet;
}());
/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 文本编辑器, singleton
 */

window.TQ = window.TQ || {};
(function () {
    var TextEditor = {};
    TextEditor.visible = false;
    TextEditor.lastElement = null;
    TextEditor.x0 = 100;
    TextEditor.initialize = function() {
        TextEditor.boxDiv = $("#textEditBoxDiv");
        TextEditor.inputBox = $("#textEditBox");
        TextEditor.boxDiv.hide();
        TQ.InputMap.registerAction(TQ.InputMap.TEXT_EDIT_KEY, function(){
            var ele = TQ.SelectSet.members[0];
            TextEditor.do(ele);
        });
    };

    TextEditor.do = function(ele) {
        if ((ele != null) && ele.isText() && !TextEditor.visible) {
            TextEditor.visible = true;
            TextEditor.lastElement = ele;
            var obj = ele.jsonObj;
            ele.show(false);

            var canvas = document.getElementById("testCanvas");
            canvasLeft = (canvas.offsetLeft + (TQ.Utility.getOffsetLeft(canvas.offsetParent)));
            canvasTop = (canvas.offsetTop + (TQ.Utility.getOffsetTop(canvas.offsetParent)));

            var xx = canvasLeft + ele.displayObj.x;
            var yy = canvasTop + ele.displayObj.y;
            TextEditor.getInput(obj.text, obj.fontFace, obj.fontSize,obj.color, xx - 25, yy - 5);
        }
    };

    TextEditor.addText = function(str) {
        if (TextEditor.visible) return; // 防止重复进入
        TextEditor.isCreating = true;
        TextEditor.lastElement = null;  //  防止在输入新字串的时候, 被close

        var canvas = document.getElementById("testCanvas");
        canvasWidth = (canvas.clientWidth || canvas.body.clientWidth || 0);
        canvasHeight = (canvas.clientHeight || canvas.body.clientHeight || 0);

        var x = TextEditor.x0,
            y = canvasHeight / 2; // z坐标向上。位置靠上一点, 人容易看见

        var _t0 = TQ.FrameCounter.t();
        jsonObj = {type:"Text", isVis:1, x:x, y:y, zIndex:TQ.Utility.getMaxZ(), rotation:0,
            text: str, t0:_t0,
            fontFace: TQ.Config.fontFace, fontSize:TQ.Config.fontSize, color:TQ.Config.color};
        TQ.Element.parseHtmlStr(jsonObj, str);

        TextEditor.do(currScene.addText(jsonObj));
        TextEditor.isCreating = false; // 只是这个创建元素的线程走完， 而编辑字符线程仍然打开。
    };

    TextEditor.yDiff = function(fontSize) {
        return (fontSize - 45)/3 + 19;
    };

    TextEditor.getInput = function (defaultvalue, fontFamily, fontSize, fontColor, x, y)
    {
        TQ.InputMap.turnOff();
        if (x == null) x = 520;
        if (y == null) y = 300;
        TextEditor.xCanvas = x;
        TextEditor.yCanvas = y;
        var width = fontSize * defaultvalue.length;
        TextEditor.setEditor(fontFamily, fontSize, fontColor, x, y, width);
        TextEditor.inputBox.val(defaultvalue); //attr("value")存取的不是真正的值;
        TextEditor.boxDiv.show();
        setSelectorByText("fontFamilySelector", fontFamily);
        setSelectorByText("fontSize", fontSize);
        setSelectorByValue("fontColor", fontColor);
        $( "select, input" ).bind( "click keyup change", TextEditor.realTimeUpdate);
        $( "#idOK" ).bind("click", TextEditor.onOK );
        $( "#idNo" ).bind("click", TextEditor.onNo );
    };

    TextEditor.setEditor = function(fontFamily, fontSize, fontColor, x, y, width) {
        x = TQ.Utility.canvas2WindowX(TextEditor.xCanvas - 4); // 9px,
        y = TQ.Utility.canvas2WindowY(TextEditor.yCanvas - TextEditor.yDiff(fontSize));  // 45px, ==> 19,  30px=>14, 15px, ==> 9;
        TextEditor.boxDiv.css("left", x.toString() + "px");
        TextEditor.boxDiv.css("top", y.toString() + "px");
        TextEditor.inputBox.css("font-family", fontFamily);
        TextEditor.inputBox.css("font-size", fontSize + "px");
        TextEditor.inputBox.css("color", fontColor);
        TextEditor.inputBox.css("opacity", 1); // 0 全透明(不可见了)
        TextEditor.inputBox.css("width", width + "px");
    };

    TextEditor.onOK = function()
    {
        TQ.InputMap.turnOn();
        TextEditor.visible = false;
        TextEditor.boxDiv.hide();
        TextEditor.lastElement.show(true);
    };

    TextEditor.onNo = function()
    {
        TQ.InputMap.turnOn();
        if ( TextEditor.visible) {
            TextEditor.visible = false;
            TextEditor.boxDiv.hide();
        }
    };

    TextEditor.realTimeUpdate = function () {
        assertNotNull(TQ.Dictionary.PleaseSelectText, TextEditor.lastElement);
        if (TextEditor.lastElement != null)
        {
            var str = TextEditor.inputBox.val();
            var fontFamily = $("#fontFamilySelector :selected").val();
            var fontSize = $("#fontSize :selected").val();
            var fontColor = $("#fontColor :selected").val();
            TextEditor.lastElement.setText(str, fontFamily, fontSize, fontColor);
            TextEditor.setEditor(fontFamily, fontSize, fontColor, TextEditor.xCanvas, TextEditor.yCanvas);
        }
    };

    function setSelectorByText (id, text) {
        var selector = $("#"+id).get(0);
        var count=selector.options.length;
        for(var i=0;i<count;i++){
            if(selector.options[i].text == text)
            {
                selector.options[i].selected = true;
                break;
            }
        }
    }

    function setSelectorByValue (id, value) {
        var selector = $("#"+id).get(0);
        var count=selector.options.length;
        for(var i=0;i<count;i++){
            if(selector.options[i].value == value)
            {
                selector.options[i].selected = true;
                break;
            }
        }
    }

    TQ.TextEditor = TextEditor;
}) ();

/*
   浮动工具条
   */
window.TQ = window.TQ || {};

(function () {
    /// 以下是接口部分
    var floatToolbar = {};

    floatToolbar.obj=function(){
        return $('#floatToolbarDiv');
    };
    /*
       初始化工具条
       */
    floatToolbar.initialize = function() {
        TQ.floatToolbar.selectedElement = null;  
        floatToolbar.obj().css('display','none');
        floatToolbar.setupButtons();
    };

    /*
       显示（true）和隐藏（false）此工具条：
       */
    floatToolbar.show = function(flag) {
        var display_str='none';
        if(flag==true){
            display_str='block';
        }
        floatToolbar.obj().css('display',display_str);
    };

    /*
       在位置（x,y) 显示工具条
       */
    floatToolbar.setPosition = function(x,y) {
        floatToolbar.obj().css('left', x - 100).css('top',y + 30);
    };

    /*
       获取工具条的可见性
       */
    floatToolbar.isVisible = function()
    {
        status=floatToolbar.obj().css('display');
        if(status=='block'){
            return true;
        }else{
            return false;
        }
        //return false; // true: 可见， false: 不可见;
    };

    /// 以下是内部代码
    floatToolbar.setupButtons = function() {
        //放大
        $('#doScaleBig').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.doScale(TQ.floatToolbar.selectedElement, 1.2);
        });
        //缩小
        $('#doScaleSmall').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.doScale(TQ.floatToolbar.selectedElement, 0.8);
        });
        //左旋转
        $('#rotateLeft').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.IKCtrl.rotate(TQ.floatToolbar.selectedElement, 10);
        });
        //右旋转
        $('#rotateRight').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.IKCtrl.rotate(TQ.floatToolbar.selectedElement, -10);
        });
        //移动到上一层
        $('#moveLayerPrev').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveLayer(TQ.floatToolbar.selectedElement, 1);
        });
        //移动到下一层
        $('#moveLayerNext').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveLayer(TQ.floatToolbar.selectedElement, -1);
        });
        //移动到最顶
        $('#moveToTop').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveToTop(TQ.floatToolbar.selectedElement);
        });
        //移动到低
        $('#moveToBottom').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.MoveCtrl.moveToBottom(TQ.floatToolbar.selectedElement);
        });
        //删除
        $('#delete').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.SelectSet.delete();
            TQ.floatToolbar.show(false);
        });
        //镜像变换: 关于X轴镜像，（上下对称）
        $('#mirrorX').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.mirrorX(TQ.floatToolbar.selectedElement);
        });
        //镜像变换: 关于Y轴镜像，（左右对称）
        $('#mirrorY').bind('touchstart click', function(evt){
            evt.stopPropagation();
            evt.preventDefault();
            TQBase.LevelState.saveOperation(TQBase.LevelState.OP_FLOATTOOLBAR);
            TQ.InputCtrl.mirrorY(TQ.floatToolbar.selectedElement);
        });
    };

    TQ.floatToolbar = floatToolbar;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

//存放全局的API， 需要在所有模块都调入之后， 才能够执行， 否则没有函数。
(function () {
    function WCY() {

    }
    WCY.isPlayOnly = false;
    WCY.currentScene = null;
    WCY.getCurrentScene = function() {
        return WCY.currentScene;
    };

    WCY.getCurrentElement = function() {
        return TQ.SelectSet.peek();
    };

    /*
    直接跳转到第id个场景 (id >=0)
     */
    WCY.gotoLevel = function(id) {
        id = Number(id);
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return;
        WCY.currentScene.gotoLevel(id);
    };

    /*
     插入第id(id >=0）个场景， 如果该位置已经有场景， 把原来的场景向后顺延。
     如果id < 0, 则令id =0;.
     如果id 超出上边界， 则自动在末尾添加一个场景）
     */
    WCY.addLevelAt = function(id) {
        id = Number(id);
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return;

        WCY.currentScene.addLevel(id);
    };

    /*
     紧跟当前场景的后面，插入1个新场景。
     */
    WCY.addLevel = function() {
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return;
        WCY.currentScene.addLevel(WCY.currentScene.currentLevelId + 1);
    };

    /*
     删除第id(id >=0）个场景， 并且把此后的场景前移。
     如果id超出边界（id < 0)，则忽略
     */
    WCY.deleteLevel = function(id) {
        id = Number(id);
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return;

        WCY.currentScene.deleteLevel(id);
    };
    
    /*
     移动序号为srcId的场景，并插入到序号dstId的场景之前，
     注意：srcId和dstId都是在执行此函数之前， 按照场景的顺序来编号的。
     用户不需要关心
     */
    WCY.moveTo = function(srcId, dstId) {
        srcId = Number(srcId);
        dstId = Number(dstId);
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return;

        WCY.currentScene.moveTo(srcId, dstId);
    };

    /*
     复制序号为srcId的场景的内容，并插入到序号dstId的场景之前，
     */
    WCY.copyTo = function(srcId, dstId) {
        srcId = Number(srcId);
        dstId = Number(dstId);
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return;

        WCY.currentScene.copyTo(srcId, dstId);
    };

    /*
    获取当前微创意的场景（Level）数量
    */
    WCY.getLevelNum = function() {
        assertNotNull(TQ.Dictionary.FoundNull, WCY.currentScene); // 必须在微创意显示之后使用
        if (!WCY.currentScene) return 0;
        return WCY.currentScene.levelNum();
    };

    WCY.doStop = function() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, WCY.currentScene != null);
        if (WCY.currentScene != null) {
            WCY.currentScene.stop();
        }
    };
    WCY.doPlay = function() {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, WCY.currentScene != null);
        if (WCY.currentScene != null) {
            WCY.currentScene.play();
        }
    };
    WCY.doPlayRecord = function() {TQ.SceneEditor.setEditMode(); };
    WCY.doStopRecord = function() {TQ.SceneEditor.setPlayMode(); };
    WCY.emptyScene = function() {TQ.SceneEditor.emptyScene(); };

    WCY.doPlayStop = function() {
        if (WCY.isPlayOnly) {
            if (TQ.FrameCounter.isPlaying()) {
                WCY.doStop();
            } else {
                WCY.doPlay();
            }
        } else {
            if (TQ.FrameCounter.isPlaying()) {
                $("#stop").click();
            } else {
                $("#play").click();
            }
        }
    };

    var canvas;
    // 进入/退出 全屏模式
    WCY.fullscreenPlay = function (width, height){ // 屏幕分辨率的大小
        canvas = document.getElementById("testCanvas");
        canvas.width = width;
        canvas.height = height;

        TQ.Config.zoomX = width / TQ.Config.workingRegionWidth;
        TQ.Config.zoomY = height / TQ.Config.workingRegionHeight;
        TQ.Config.workingRegionWidth = width;
        TQ.Config.workingRegionHeight = height;
        WCY.doPlay();
    };

    WCY.eixtFullscreen = function() {
        canvas.width = TQ.Config.workingRegionWidth;
        canvas.height = TQ.Config.workingRegionHeight;
        TQ.Config.zoomX = TQ.Config.zoomY = 1;
    };

    WCY.deleteElement = function(ele) {
        WCY.currentScene.deleteElement(ele);
    };

    //只用于插入录音，
    //    在开始录音的时候，先记录当时场景的id和当时时间t0，以供本函数使用。
    // 在指定的场景levelID，指定的时间t0，插入所制的声音资源,
    // 如果不指定levelID和t0，则在当前场景的当前时刻插入
    WCY.addResToStageCenter = function(res, levelID, t0) {
        return addResToStageCenter(res, levelID, t0);
    };

    WCY.getCurrentLevelID = function()
    {
      return WCY.currentScene.currentLevelId;
    };

    WCY.getCurrentTime = function()
    {
        return TQ.FrameCounter.t();
    };

    // size: 雪花大小，  默认1,  取值范围1-5.
    // direction:  落雪方向： 0：向下， 取值范围： -15度到15度，
    // density: 密度， 默认1（小雨）取值范围：1-10
    WCY.snow = function(size, direction, density, res, snowFlowerImage) {
        TQ.SnowEffect.set(size, direction, density, res, snowFlowerImage);
    };

    WCY.snowChange = function(size, direction, density) {
        TQ.SnowEffect.set(size, direction, density);
    };

    WCY.snowStop = function() {
        TQ.SnowEffect.stop();
    };

    // size: 雨滴大小，  默认1,  取值范围1-5.
    // direction: 落雨方向： 0：向下， 取值范围： -15度到15度，
    // density: 密度， 默认1（小雨），取值范围：1-10
    WCY.rain = function(size, direction, density, res, dropImage) {
        TQ.RainEffect.set(size, direction, density, res, dropImage);
    };

    WCY.rainChange = function(size, direction, density) {
        TQ.RainEffect.set(size, direction, density);
    };

    WCY.rainStop = function() {
        TQ.RainEffect.stop();
    };

    // type: 烟火的种类，默认1,      系统保留扩展其它取值）
    WCY.firework = function(type) {
        console.log(type);
    };

    //------------- 以下的函数用于配置系统参数 -------------------------
    // 设置零件标志的大小， 默认是10：
    WCY.setMarkerSize = function(radius) {
        TQ.Marker.RADIUS = radius;
    };

    TQ.WCY = WCY;
}());

/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};
(function() {
    /**
     * Grid 负责绘制，显示标尺和grid,
     * * 不保存到Scene文件, 而是临时生成的
     * @class Grid
     * @static
     **/
    var Grid = function() {
        throw "Grid cannot be instantiated";
    };

    Grid._initialized = false;
    Grid._on = false;
    Grid.initialize = function () {
        Grid.M = 100;
        Grid.N = 100;
        Grid.COLOR = "#cbcbcb";//  "#bfbfbf";
        Grid.THICK = 2;
        Grid.THIN = 0.5;
        Grid.grids = [];
        var xMax = canvas.width;
        var yMax = canvas.height;
        var dx = xMax / (Grid.M - 1);
        var dy = yMax / (Grid.N - 1);
        for (var i = 0; i < Grid.M; i++) {
            var thickness = (i % 5) ? Grid.THIN : Grid.THICK;
            var ln1 = new TQ.Trace(Grid.COLOR, thickness);
            ln1.add(TQ.Utility.worldToDevioce(dx * i, 0));
            ln1.add(TQ.Utility.worldToDevioce(dx * i, yMax));
            Grid.grids.push(ln1);
        }
        for (var i = 0; i <Grid.N; i++) {
            thickness = (i % 5) ? Grid.THIN : Grid.THICK;
            ln1 = new TQ.Trace(Grid.COLOR, thickness);
            ln1.add(TQ.Utility.worldToDevioce(0, dy * i));
            ln1.add(TQ.Utility.worldToDevioce(xMax, dy * i));
            Grid.grids.push(ln1);
        }
        Grid._initialized = true;
        Grid.show(false);
    };

    Grid.show = function(flag) {
        if (!Grid._initialized) {
            Grid.initialize();
        }
        var num = Grid.M + Grid.N;
        for (var i = 0; i < num; i++) {
            var ln1 = Grid.grids[i];
            if (!ln1) return;
            if (flag) {
                ln1.addToStage();
            } else {
                ln1.removeFromStage();
            }
        }

        Grid._on = flag;
    };

    TQ.Grid = Grid;

    TQ.InputMap.registerAction(TQ.InputMap.GRID_ON_OFF_KEY,  function() {
        TQ.Grid.show(!Grid._on);
    });

}());
window.TQ = window.TQ || {};


(function () {

    // 场景编辑器,
    function SceneEditor() {
    }

    SceneEditor._mode = TQBase.LevelState.EDITING; // 创作界面的缺省模式是编辑.

    SceneEditor.loadScene = function(fileInfo) {
        // fileInfo.name = getDefaultTitle(fileInfo.name);
        openScene(fileInfo);
    };

    SceneEditor.emptyScene = function() { // empty the current scene
        if (!currScene) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }

        currScene.forceToRemoveAll();
    };

    SceneEditor.getMode = function() {
        if (TQ.WCY.isPlayOnly) {
            return TQBase.LevelState.RUNNING;
        }
        return SceneEditor._mode;
    };

    SceneEditor.setEditMode = function() {
        if (!currScene) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }
        $('#stop').click();
        SceneEditor.setMode(TQBase.LevelState.EDITING);
    };

    SceneEditor.setPlayMode = function() {
        if (!currScene) {
            assertTrue(TQ.Dictionary.INVALID_LOGIC, false);
            return false;
        }
        $('#play').click();
        SceneEditor.setMode(TQBase.LevelState.RUNNING);
    };

    SceneEditor.updateMode = function() {
        if (SceneEditor._requestMode == null) return;
        SceneEditor._mode = SceneEditor._requestMode;
        SceneEditor._requestMode = null;
    };

    SceneEditor.setMode = function(mode) { SceneEditor._requestMode = mode; };
    SceneEditor.isEditMode = function() { return (SceneEditor.getMode() == TQBase.LevelState.EDITING); };
    SceneEditor.isPlayMode = function() { return (SceneEditor.getMode() == TQBase.LevelState.RUNNING); };

    TQ.SceneEditor = SceneEditor;
}());


var canvas;
var messageBoard;
var stage = null;

function init(fileInfo) {
    if ((typeof fileInfo) === "string") {
        fileInfo = {name: fileInfo, content:null};
    }
    canvas = document.getElementById("testCanvas");
    addHammer(canvas);
    // create a new stage and point it at our canvas:
    stage = new createjs.Stage(canvas);
    stage.enableMouseOver();
    messageBoard = new TQ.MessageBox(canvas);
	TQ.SoundMgr.initialize();
    TQ.RM.initialize();
    TQ.SceneEditor.loadScene(fileInfo);
    initializeControllers();
    // messageBoard.show("Loading 。。。");
    createjs.Ticker.setFPS(20);

    // 让Scene来决定处理tick，它可以包括update和render。而stage的自动响应只包括render。
    // createjs.Ticker.addListener(stage, false);
    createjs.Ticker.addListener(currScene, false);

    createjs.Ticker.addListener(window);
}

var currScene = null;

function initializeControllers() {
    TQ.TaskMgr.initialize();
    TQ.GarbageCollector.initialize();
    TQ.CommandMgr.initialize();
    TQ.InputCtrl.initialize(stage);
    TQ.MoveCtrl.initialize(stage);
    TQ.SkinningCtrl.initialize(stage, currScene);
    TQ.IKCtrl.initialize(stage, currScene);
    TQ.TrackRecorder.initialize();
    TQ.ActionRecorder.initialize();
    TQ.SelectSet.initialize();
    TQ.TouchMgr.initialize();
}

function openScene(fileInfo) {
    if ((typeof fileInfo) === "string") {
        fileInfo = {name: fileInfo, content:null};
    }
    if ((!currScene) || (currScene.isSaved)) {
        messageBoard.hide();
        if (!currScene) {
            currScene = new TQ.Scene();
            TQ.WCY.currentScene = currScene;
        } else {
            currScene.close();
        }
        TQ.GarbageCollector.clear();
        currScene.open(fileInfo);
        localStorage.setItem("sceneName", fileInfo.name);
        TQ.FrameCounter.reset();
        TQ.CommandMgr.clear();
        TQ.SkinningCtrl.end();
        TQ.floatToolbar.show(false);
        TQ.WCY.currentScene = currScene;
        if (TQ.displayUI.initialize) {
            TQ.displayUI.initialize();
        }
    } else {
      var filename = localStorage.getItem("sceneName");
      TQ.SceneEditorUI.promptToSave(filename);
    }
    return currScene;
 }

function getDefaultTitle(givenName) {
    var defaultTitle =  ((!currScene) || (!currScene.title)) ?
        givenName: currScene.title;
    if (!defaultTitle) {
        defaultTitle = TQ.Config.UNNAMED_SCENE;
    }

    var id = defaultTitle.lastIndexOf("\\");
    if (id <=0) {
        id = defaultTitle.lastIndexOf("/");
    }

    var shortTitle = (id > 0) ? defaultTitle.substr(id+1) : defaultTitle;
    return TQ.Utility.forceExt(shortTitle);
}

 function save() {
     if (TQ.Utility.getUserID() <= 0) {
         TQ.MessageBubble.show(TQ.Dictionary.LoginPlease);
         return;
     }
     TQ.InputMap.turnOff();
     TQ.FileDialog.getFilename(getDefaultTitle(null), _doSave);
 }

 function deleteScene() {
     var title = currScene.title;
     if ((title.lastIndexOf(TQ.Config.DEMO_SCENE_NAME) < 0) // 不能覆盖系统的演示文件
         && (title != TQ.Config.UNNAMED_SCENE)) { // 不能每名称
         var filename = currScene.filename;
         TQ.TaskMgr.addTask(function () {
                 netDelete(filename);
             },
             null);
     } else {
         displayInfo2("<" + title + ">:" + TQ.Dictionary.CanntDelete);
     }
 }

function _doSave(filename, keywords) {
    TQ.TaskMgr.addTask(function () {
            currScene.save(filename, keywords);
        },

        null);
    TQ.InputMap.turnOn();
    localStorage.setItem("sceneName", filename);
}

function addLevelTest()
{
    var levelId = currScene.addLevel();
    currScene.gotoLevel(levelId);
}

function addImage(desc)
{
    desc.version = TQ.Element.VER2;  // 新增加的元素都是2.0

    // "Groupfile" 暂时还没有纳入RM的管理范畴
    if (((desc.type == "SOUND") ||(desc.type == "Bitmap") || (desc.type == "BUTTON"))
        && (!TQ.RM.hasElementDesc(desc))) {
        TQ.RM.addElementDesc(desc, function() {
            currScene.addItem(desc)
        });

        return null;
    }

    return currScene.addItem(desc);
}

function addAnimationTest()
{
    currScene.addItem({src:TQ.Config.SCENES_CORE_PATH + "AnimationDesc.adm", type:"BitmapAnimation"});
}

function makeAnimationTest() {currScene.shooting(); }

function uploadImageWindow() {
    // 从JS调用PHP, 则PHP的URL 是相对于当前HTML或PHP文件的目录, 而不是JS文件的目录,
    createWindow("Weidongman/src/upload_image.php", 500,400);
}

function createWindow (url, width, height) {
    // Add some pixels to the width and height:
    var borderWidth = 10;
    width = width + borderWidth;
    height = height + borderWidth;

    // If the window is already open,
    // resize it to the new dimensions:
    if (window.popup && !window.popup.closed) {
        window.popup.resizeTo(width, height);
    }

    // Set the window properties:
    var specs = "location=no, scrollbars=no, menubars=no, toolbars=no, resizable=yes, left=0, top=0, width=" + width + ", height=" + height;

    // Create the pop-up window:
    var popup = window.open(url, "ImageWindow", specs);
    popup.focus();

} // End of function.

function addTextTest()
{
    TQ.TextEditor.addText(TQ.Dictionary.defaultText);
}

function backToPreviousLevel()
{
    currScene.preLevel();
}

function advanceToNextLevel()
{
    currScene.nextLevel();
}

function create3DElement() {
    if (TQ.SelectSet.groupIt()) { // 返回false肯定不成功, 不要做后续的
        var ele = currScene.currentLevel.latestElement;
        if (ele != null) {
            if (ele.viewCtrl == null) {
                var ctrl = new TQ.MultiView();
                TQ.CommandMgr.addCommand(new TQ.GenCommand(TQ.GenCommand.SET_3D_OBJ, ctrl, ele, ele));
            }
        }
    }
    clearSubjectModeAndMultiSelect();
}

function editActions()
{
    var ele = TQ.SelectSet.peek();

    if (ele != null) {
        TQ.Animation.unitTest(ele);
    }
}

function RotateCtrl() {}
RotateCtrl.paras = null;
RotateCtrl.timeStamp = 0;
RotateCtrl.target = null;
RotateCtrl.oldAngle = 0;
RotateCtrl.do = function (ev) {
    if (ev.type !== 'rotate') {
        return;
    }

    var ele = null;
    RotateCtrl.paras = RotateCtrl.getParas(ev);
    if (RotateCtrl.paras.isNewCmd) {
        ele = getTarget(ev);
        RotateCtrl.oldAngle = ele.getRotation();
        RotateCtrl.target = ele;
    } else {
        if (!RotateCtrl.target) {
            console.log("error:  it should be a new command. ");
        } else {
            ele = RotateCtrl.target;
        }
    }

    if (ele) {
        if ((RotateCtrl.paras.rotation) && !isNaN(RotateCtrl.paras.rotation)) {
            ele.rotateTo(RotateCtrl.oldAngle - RotateCtrl.paras.rotation);
        }
    }
};

RotateCtrl.getParas = function (ev) {
    if (!RotateCtrl.paras) {
        RotateCtrl.paras = {};
        RotateCtrl.timeStamp = ev.timeStamp;
    }

    RotateCtrl.paras.type = ev.type;
    RotateCtrl.paras.timeDiff = ev.timeStamp - RotateCtrl.timeStamp;
    RotateCtrl.paras.isNewCmd = (RotateCtrl.paras.timeDiff > 100);
    RotateCtrl.paras.rotation = Math.truncate6(ev.rotation);
    RotateCtrl.timeStamp = ev.timeStamp;
    return RotateCtrl.paras;
};

// 只有第一个cmd需要target，其余的只是继续采用就行
var getTarget = function (ev) {
    var o = {x: ev.center.x, y: ev.center.y};
    var displayObj = stage._getObjectsUnderPoint(o.x, o.y, null, true, 1);
    if (!!displayObj) {
        return displayObj.ele || null;
    }
    return null;
};

function ScaleCtrl () {
    RotateCtrl.call();
}

ScaleCtrl.prototype = Object.create(RotateCtrl.prototype);

ScaleCtrl.test = function() {
    ScaleCtrl.oldAngle = 8;
    return true;
};



/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
TQ = TQ || {};

(function () {
    'use strict';
    // 用法: 1) 拖入一个按钮可以换皮肤，可以定义新的动作
    //  必须是用工厂生产这个元素, 因为, 是数据决定元素的类别.
    //  Button的状态：
    //     不可见，
    //      可见（执行可见的action），
    //      被按下，执行（被按下的action），
    //     再次转为不可见，          初始化状态

    function VideoElement(level, jsonObj) {
        assertTrue(TQ.Dictionary.INVALID_PARAMETER, typeof jsonObj !='string'); // 用工厂提前转为JSON OBJ,而且, 填充好Gap
        this.level = level;
        this.children = [];
        this.instance = null;
        this._isNewSkin = false;
        this.state2 = VideoElement.INVISIBLE;
        this.initialize(jsonObj);
    }

    var p = VideoElement.prototype = new TQ.Element(null, null);

    p.getImageResource = function(item, jsonObj) {
        return _createVideoElement(jsonObj.src);
    };

    p._parent_doShow = p.doShow;
    p.doShow = function(isVisible) {
        this._parent_doShow(isVisible);
        if (isVisible && TQ.FrameCounter.isPlaying()) {
            this.play();
        } else {
            this.stop();
        }
    };

    p.stop = function() {
        var video = this.displayObj.image;
        if (!video.paused) {
            // video.currentTime = 0;  //  可以回到 头部
            video.pause();
        }
        // console.log("stop it : " + video.paused);
    };

    p.play = function() {
        var video = this.displayObj.image;
        if (video.paused) {
            video.play();
        }
        // console.log("play it : " + video.paused);
    };

    var _createVideoElement = function(src) {
        var __video = document.createElement('video');
        __video.src = TQ.ResourceManager.toFullPath(src);
        __video.autoplay = false;
        // __video.controls = true;
        __video.setAttribute("controls", "false");
        return __video;
    };

    TQ.VideoElement = VideoElement;
}());

var useHammer = false;
var hammertime = null;
var hammerEle = null;
var addHammerByID = function(htmlEleID) {
    if (!hammertime) {
        var ele = document.getElementById(htmlEleID);
        addHammer(ele);
    }
};

var addHammer = function(ele) {
    if ((!useHammer) || (!!hammertime)) {
        return;
    }

    hammerEle = ele;
    hammertime = new Hammer(ele);
    hammertime.get('pinch').set({ enable: true });
    hammertime.get('rotate').set({ enable: true });
    hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
    hammertime.on('pan pinch rotate swipe', function (ev) {
        if (!RotateCtrl.paras) {
            RotateCtrl.paras = {};
            RotateCtrl.paras.isNewCmd = true;
            RotateCtrl.timeStamp = ev.timeStamp;
        } else {
            RotateCtrl.paras.isNewCmd = (RotateCtrl.paras.type !== ev.type);
        }

        switch (ev.type) {
            case 'pinch':

                // onPinch(ev);
                break;
            case 'rotate':
                return RotateCtrl.do(ev);
                break;
            default:
                console.log(ev.type);
                break;
        }
    });
};

/*
 var onPinch = function (ev) {
 if (ev.type !== 'pinch') {
 return;
 }

 var ele = null;
 var RotateCtrl.paras = RotateCtrl.getParas(ev);
 if (RotateCtrl.paras.isNewCmd) {
 ele = getTarget(ev);
 oldScale = ele.getScale();
 scaleTarget = ele;
 } else {
 ele = scaleTarget;
 }

 if (ele) {
 if ((RotateCtrl.paras.scale) && !isNaN(RotateCtrl.paras.scale)) {
 ele.scaleTo(oldScale * RotateCtrl.paras.scale);
 }
 }
 };
 */
/*
* Filter
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// namespace:
this.createjs = this.createjs || {};

(function () {

    /**
     * Base class that all filters should inherit from. Filters need to be applied to objects that have been cached using
     * the {{#crossLink "DisplayObject/cache"}}{{/crossLink}} method. If an object changes, please cache it again, or use
     * {{#crossLink "DisplayObject/updateCache"}}{{/crossLink}}.
     *
     * <h4>Example</h4>
     *      myInstance.cache(0,0, 100, 100);
     *      myInstance.filters = [
     *          new createjs.ColorFilter(0, 0, 0, 1, 255, 0, 0),
     *          new createjs.BoxBlurFilter(5, 5, 10)
     *      ];
     *
     * <h4>EaselJS Filters</h4>
     * EaselJS comes with a number of pre-built filters. Note that individual filters are not compiled into the minified
     * version of EaselJS. To use them, you must include them manually in the HTML.
     * <ul><li>{{#crossLink "AlphaMapFilter"}}{{/crossLink}} : Map a greyscale image to the alpha channel of a display object</li>
     *      <li>{{#crossLink "AlphaMaskFilter"}}{{/crossLink}}: Map an image's alpha channel to the alpha channel of a display object</li>
     *      <li>{{#crossLink "BoxBlurFilter"}}{{/crossLink}}: Apply vertical and horizontal blur to a display object</li>
     *      <li>{{#crossLink "ColorFilter"}}{{/crossLink}}: Color transform a display object</li>
     *      <li>{{#crossLink "ColorMatrixFilter"}}{{/crossLink}}: Transform an image using a {{#crossLink "ColorMatrix"}}{{/crossLink}}</li>
     * </ul>
     *
     * @class Filter
     * @constructor
     **/
    var Filter = function () {
        this.initialize();
    }
    var p = Filter.prototype;

    // constructor:
    /** 
	 * Initialization method.
	 * @method initialize
	 * @protected
	 **/
    p.initialize = function () { }

    // public methods:
    /**
	 * Returns a rectangle with values indicating the margins required to draw the filter.
	 * For example, a filter that will extend the drawing area 4 pixels to the left, and 7 pixels to the right
	 * (but no pixels up or down) would return a rectangle with (x=-4, y=0, width=11, height=0).
	 * @method getBounds
	 * @return {Rectangle} a rectangle object indicating the margins required to draw the filter.
	 **/
    p.getBounds = function () {
        return new createjs.Rectangle(0, 0, 0, 0);
    }

    /**
	 * Applies the filter to the specified context.
	 * @method applyFilter
	 * @param {CanvasRenderingContext2D} ctx The 2D context to use as the source.
	 * @param {Number} x The x position to use for the source rect.
	 * @param {Number} y The y position to use for the source rect.
	 * @param {Number} width The width to use for the source rect.
	 * @param {Number} height The height to use for the source rect.
	 * @param {CanvasRenderingContext2D} targetCtx Optional. The 2D context to draw the result to. Defaults to the context passed to ctx.
	 * @param {Number} targetX Optional. The x position to draw the result to. Defaults to the value passed to x.
	 * @param {Number} targetY Optional. The y position to draw the result to. Defaults to the value passed to y.
	 * @return {Boolean}
	 **/
    p.applyFilter = function (ctx, x, y, width, height, targetCtx, targetX, targetY) { }

    /**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
    p.toString = function () {
        return "[Filter]";
    }


    /**
	 * Returns a clone of this Filter instance.
	 * @method clone
	 @return {Filter} A clone of the current Filter instance.
	 **/
    p.clone = function () {
        return new Filter();
    }

    createjs.Filter = Filter;
}());

/*
* ColorFilter
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

// namespace:
this.createjs = this.createjs || {};

(function () {

    /**
     * Applies color transforms.
     *
     * See {{#crossLink "Filter"}}{{/crossLink}} for an example of how to apply filters.
     * @class ColorFilter
     * @constructor
     * @extends Filter
     * @param {Number} redMultiplier
     * @param {Number} greenMultiplier
     * @param {Number} blueMultiplier
     * @param {Number} alphaMultiplier
     * @param {Number} redOffset
     * @param {Number} greenOffset
     * @param {Number} blueOffset
     * @param {Number} alphaOffset
     **/
    var ColorFilter = function (redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset) {
        this.initialize(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset);
    }
    var p = ColorFilter.prototype = new createjs.Filter();

    // public properties:
    /**
	 * Red channel multiplier.
	 * @property redMultiplier
	 * @type Number
	 **/
    p.redMultiplier = 1;

    /** 
	 * Green channel multiplier.
	 * @property greenMultiplier
	 * @type Number
	 **/
    p.greenMultiplier = 1;

    /**
	 * Blue channel multiplier.
	 * @property blueMultiplier
	 * @type Number
	 **/
    p.blueMultiplier = 1;

    /**
	 * Alpha channel multiplier.
	 * @property redMultiplier
	 * @type Number
	 **/
    p.alphaMultiplier = 1;

    /**
	 * Red channel offset (added to value).
	 * @property redOffset
	 * @type Number
	 **/
    p.redOffset = 0;

    /**
	 * Green channel offset (added to value).
	 * @property greenOffset
	 * @type Number
	 **/
    p.greenOffset = 0;

    /**
	 * Blue channel offset (added to value).
	 * @property blueOffset
	 * @type Number
	 **/
    p.blueOffset = 0;

    /**
	 * Alpha channel offset (added to value).
	 * @property alphaOffset
	 * @type Number
	 **/
    p.alphaOffset = 0;

    // constructor:
    /**
	 * Initialization method.
	 * @method initialize
	 * @protected
	 **/
    p.initialize = function (redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset) {
        this.redMultiplier = redMultiplier != null ? redMultiplier : 1;
        this.greenMultiplier = greenMultiplier != null ? greenMultiplier : 1;
        this.blueMultiplier = blueMultiplier != null ? blueMultiplier : 1;
        this.alphaMultiplier = alphaMultiplier != null ? alphaMultiplier : 1;
        this.redOffset = redOffset || 0;
        this.greenOffset = greenOffset || 0;
        this.blueOffset = blueOffset || 0;
        this.alphaOffset = alphaOffset || 0;
    }

    // public methods:
    /**
	 * Applies the filter to the specified context.
	 * @method applyFilter
	 * @param {CanvasRenderingContext2D} ctx The 2D context to use as the source.
	 * @param {Number} x The x position to use for the source rect.
	 * @param {Number} y The y position to use for the source rect.
	 * @param {Number} width The width to use for the source rect.
	 * @param {Number} height The height to use for the source rect.
	 * @param {CanvasRenderingContext2D} targetCtx Optional. The 2D context to draw the result to. Defaults to the context passed to ctx.
	 * @param {Number} targetX Optional. The x position to draw the result to. Defaults to the value passed to x.
	 * @param {Number} targetY Optional. The y position to draw the result to. Defaults to the value passed to y.
	 * @return {Boolean}
	 **/
    p.applyFilter = function (ctx, x, y, width, height, targetCtx, targetX, targetY) {
        targetCtx = targetCtx || ctx;
        if (targetX == null) { targetX = x; }
        if (targetY == null) { targetY = y; }
        try {
            var imageData = ctx.getImageData(x, y, width, height);
        } catch (e) {
            //if (!this.suppressCrossDomainErrors) throw new Error("unable to access local image data: " + e);
            return false;
        }
        var data = imageData.data;
        var l = data.length;
        for (var i = 0; i < l; i += 4) {
            data[i] = data[i] * this.redMultiplier + this.redOffset;
            data[i + 1] = data[i + 1] * this.greenMultiplier + this.greenOffset;
            data[i + 2] = data[i + 2] * this.blueMultiplier + this.blueOffset;
            data[i + 3] = data[i + 3] * this.alphaMultiplier + this.alphaOffset;
        }
        imageData.data = data;
        targetCtx.putImageData(imageData, targetX, targetY);
        return true;
    }

    /**
	 * Returns a string representation of this object.
	 * @method toString
	 * @return {String} a string representation of the instance.
	 **/
    p.toString = function () {
        return "[ColorFilter]";
    }


    /**
	 * Returns a clone of this ColorFilter instance.
	 * @method clone
	 * @return {ColorFilter} A clone of the current ColorFilter instance.
	 **/
    p.clone = function () {
        return new ColorFilter(this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier, this.redOffset, this.greenOffset, this.blueOffset, this.alphaOffset);
    }

    createjs.ColorFilter = ColorFilter;
}());

this.createjs = this.createjs || {};

(function () {

    var BaseParticle = function (particleObject) {

        this.initialize(particleObject);
    };
    var p = BaseParticle.prototype;

    // ** PUBLIC PROPERTIES
    p.debugMode = true;
    p.originX = 0;
    p.originY = 0;
    p.velocityX = 0;                //pixels per second
    p.velocityY = 0;                //pixels per second
    p.linearVelocityX = 0;          //pixels per second
    p.linearVelocityY = 0;          //pixels per second
    p.radialVelocity = 0;           //pixels per second, 角速度
    p.tangentalVelocity = 0;        //pixels per second，切线速度， 切线方向随物体的旋转而改变
    p.radialAcceleration = 0;       //pixels per second per second
    p.tangentalAcceleration = 0;    //pixels per second per second
    p.linearAccelerationX = 0;      //pixels per second per second
    p.linearAccelerationY = 0;      //pixels per second per second
    p.particleBaseId = 0;

    // ** PRIVATE PROPERTIES:
    p._lastUpdateTimeMs = 0;

    // ** CONSTRUCTOR:
    p.initialize = function (particleObject) {

        this._particleObject = particleObject;
    };

    // ** PUBLIC METHODS:
    p.initializeProperties = function (id) {
        this.particleBaseId = id;
    };

    p.updateParticle = function (ctx) {

        var currentTimeMs = createjs.Ticker.getTime();

        if (!TQ.FrameCounter.isPlaying()) {
            currentTimeMs = this._lastUpdateTimeMs;
        }

        this.updatePosition(currentTimeMs);
    };

    p.updatePosition = function (currentTimeMs) {

        var diffTimeMs = currentTimeMs - this._lastUpdateTimeMs;
        var fractionTime = diffTimeMs / 1000;

        if (this._lastUpdateTimeMs <= 0) {
            this._lastUpdateTimeMs = currentTimeMs;
            return;
        }

        this.velocityX = 0;
        this.velocityY = 0;

        // Process accelerations
        this._processLinearAcceleration(fractionTime);
        this._processRadialAcceleration(fractionTime);
        this._processTangentalAcceleration(fractionTime);

        // Process velocitys
        this._processLinearVelocity(fractionTime);
        this._processRadialAndTangentalVelocity(fractionTime);

        // Update position
        this._processVelocity();
        this._lastUpdateTimeMs = currentTimeMs;
    };

    // ** PRIVATE METHODS:
    p._processLinearAcceleration = function (fractionTime) {
        var accelerationTickX = this.linearAccelerationX * fractionTime;
        var accelerationTickY = this.linearAccelerationY * fractionTime;

        this.linearVelocityX += accelerationTickX;
        this.linearVelocityY += accelerationTickY;
    };

    p._processRadialAcceleration = function (fractionTime) {
        var radialAceelerationTick = this.radialAcceleration * fractionTime;

        this.radialVelocity += radialAceelerationTick;
    };

    p._processTangentalAcceleration = function (fractionTime) {
        var tangentalAceelerationTick = this.tangentalAcceleration * fractionTime;

        this.tangentalVelocity += tangentalAceelerationTick;
    };

    p._processLinearVelocity = function (fractionTime) {

        var velocityTickY = this.linearVelocityY * fractionTime;
        var velocityTickX = this.linearVelocityX * fractionTime;

        this.velocityX += velocityTickX;
        this.velocityY += velocityTickY;
    };

    p._processRadialAndTangentalVelocity = function (fractionTime) {

        var center = this._getParticleCenter();
        var deltaY = this.originY - center.y;
        var deltaX = this.originX - center.x;
        var angle = Math.atan2(deltaY, deltaX);

        this._processRadialVelocity(fractionTime, angle);
        this._processTangentalVelocity(fractionTime, angle);
    };

    p._processRadialVelocity = function (fractionTime, angle) {

        var velocityTickX = this.radialVelocity * fractionTime * Math.cos(angle);
        var velocityTickY = this.radialVelocity * fractionTime * Math.sin(angle);

        this.velocityX += velocityTickX;
        this.velocityY += velocityTickY;
    };

    p._processTangentalVelocity = function (fractionTime, angle) {

        var velocityTickX = this.tangentalVelocity * fractionTime * Math.cos(angle - (Math.PI / 2));
        var velocityTickY = this.tangentalVelocity * fractionTime * Math.sin(angle - (Math.PI / 2));

        this.velocityX += velocityTickX;
        this.velocityY += velocityTickY;
    };

    p._processVelocity = function () {

        this._particleObject.x += this.velocityX;
        this._particleObject.y += this.velocityY;
    };

    p._getParticleCenter = function () {

        var center = {
            x: this._particleObject.x,
            y: this._particleObject.y
        };

        return center;
    };

    p._debugText = function (text) {
        if (this.debugMode) {
            console.log(text);
        }
    };

    // ** PRIVATE EVENT HANDLERS:

    createjs.BaseParticle = BaseParticle;
}());

// NAMESPACE:
this.createjs = this.createjs || {};

(function () {

    // ** ENUMS


    /**
     * A shape particle
     * @constructor
     * @extends createjs.Bitmap
     */
    var BitmapParticle = function (image) {

        this.initialize(image);
    }
    var p = BitmapParticle.prototype = new createjs.Bitmap();

    // ** BASE METHODS
    p.Bitmap_initialise = p.initialize;
    p.Bitmap_draw = p.draw;
    p.Bitmap_updateContext = p.updateContext;

    // ** PUBLIC PROPERTIES:
    p.particleId = 0;

    // ** PRIVATE PROPERTIES:
    p._baseParticle = null;

    // ** CONSTRUCTOR:
    p.initialize = function (image) {
        this.Bitmap_initialise(image);
        this._baseParticle = new createjs.BaseParticle(this);
    };

    // ** PUBLIC METHODS:
    p.initializeProperties = function (id) {
        this.particleId = id;
        this._baseParticle.initializeProperties(id);
    };

    p.updateContext = function (ctx) {
        this._baseParticle.updateParticle();
        this.Bitmap_updateContext(ctx);

    };

    // ** PRIVATE METHODS:

    // ** PRIVATE EVENT HANDLERS:

    createjs.BitmapParticle = BitmapParticle;
}());

// NAMESPACE:
this.createjs = this.createjs || {};

(function () {

    /**
     * A shape particle
     * @constructor
     * @extends createjs.Shape
     */
    var ShapeParticle = function () {

        this.initialize();
    };
    var p = ShapeParticle.prototype = new createjs.Shape();

    // ** BASE METHODS
    p.Shape_initialise = p.initialize;
    p.Shape_draw = p.draw;
    p.Shape_updateContext = p.updateContext;

    // ** PUBLIC PROPERTIES:
    p.particleId = 0;

    // ** PRIVATE PROPERTIES:
    p._baseParticle = null;

    // ** CONSTRUCTOR:
    p.initialize = function () {
        this.Shape_initialise();
        this._baseParticle = new createjs.BaseParticle(this);
    };

    // ** PUBLIC METHODS:
    p.initializeProperties = function (id) {
        this.particleId = id;
        this._baseParticle.initializeProperties(id);
    };

    p.updateContext = function (ctx) {
        this.Shape_updateContext(ctx);
        this._baseParticle.updateParticle();
    };

    // ** PRIVATE METHODS:

    // ** PRIVATE EVENT HANDLERS:

    createjs.ShapeParticle = ShapeParticle;
}());
/**
 * @module createjs
 */
this.createjs = this.createjs || {};

(function () {
    "use strict"

    /**
     * A Particle Emitter extends DisplayObject and must be added to a Container object. An emitter will emit a stream of particles
     * adhereing to the given configuration.
     * @class ParticleEmitter
     * @constructor
     * @param {Image} [image] The image to use for each particle. If no image is provided then a simple circle will be drawn.
     **/
    var ParticleEmitter = function (image) {

        if (image != null) {
            this.image = image;
        }

        this.initialize();
    }
    var p = ParticleEmitter.prototype = new createjs.DisplayObject();
    ParticleEmitter.stopped = false;
    //#region Enums + Constants

    /**
     * Enum to represent the state of the particle emitter
     **/
    createjs.ParticleEmitterState = {
        "Created": 0,
        "Running": 1,
        "Finished": 2
    }

    /**
     * Enum to represent the type of the particle emitter
     **/
    createjs.ParticleEmitterType = {
        "Emit": 0,
        "OneShot": 1
    }

    // ** CONSTANTS:
    p.REMAIN_UNCHANGED = null;
    p.INFINITE = -1;

    //#endregion

    // ** BASE METHODS
    p.DisplayObject_initialise = p.initialize;
    p.DisplayObject_draw = p.draw;
    p.DisplayObject_updateContext = p.updateContext;

    //#region Public Properties (Emitter specific)

    /**
     * Should the emitter be removed from the parent when finished?
     *
     * @property autoRemoveOnFinished
     * @type {boolean}
     * @default false
     **/
    p.autoRemoveOnFinished = false;

    /**
     * Is debug mode active for this emitter. If so, render debug text.
     *
     * @property debugMode
     * @type {boolean}
     * @default false
     **/
    p.debugMode = false;

    /**
     * The amount of time (milliseconds) that the emitter will last. A value of -1 means that the emitter will
     * last for an infinite amount of time.
     *
     * @property duration
     * @type {number}
     * @default -1
     **/
    p.duration = p.INFINITE;

    /**
     * The type of particle emitter to create
     *
     * @property emitterType
     * @type {ParticleEmitterType}
     * @default ParticleEmitterType.Emit
     **/
    p.emitterType = createjs.ParticleEmitterType.Emit;

    /**
     * The total number of particles that can exist at any one time
     *
     * @property maxParticles
     * @type {number}
     * @default 200
     **/
    p.maxParticles = 200;

    /**
     * The rate at which particles are generated (number of particles per second)
     *
     * @property emissionRate
     * @type {number}
     * @default 1
     **/
    p.emissionRate = 1;

    /**
     * The current state of the particle emitter
     *
     * @property state
     * @type {ParticleEmitterState}
     * @default ParticleEmitterState.Created
     **/
    p.state = createjs.ParticleEmitterState.Created;

    /**
     * The image to show for each particle
     *
     * @property image
     * @type {Image}
     * @default null
     **/
    p.image = null;

    //#endregion
    //#region Public Properties (Particle generation)

    /**
     * The accelerration of each particle in the X axis.
     *
     * @property accelerationX
     * @type {decimal}
     * @default 0
     **/
    p.accelerationX = 0;

    /**
     * The accelerration of each particle in the Y axis. This can be used to simulate forces such as Gravity
     *
     * @property accelerationY
     * @type {decimal}
     * @default 0
     **/
    p.accelerationY = 0;

    /**
     * The angle (degrees) in which to fire the particle from the origin point
     *
     * @property angle
     * @type {number}
     * @default 0
     **/
    p.angle = 0;

    /**
     * The amount of degrees that the angle can vary by
     *
     * @property angleVar
     * @type {number}
     * @default 0
     **/
    p.angleVar = 0;

    /**
     * The end opacity of each particle, where 1 is opaque and 0 is transparent. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endOpacity
     * @type {number}
     * @default null
     **/
    p.endOpacity = p.REMAIN_UNCHANGED;

    /**
     * The end color of each particle [r,g,b]. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endColor
     * @type {[r,g,b]}
     * @default null
     **/
    p.endColor = p.REMAIN_UNCHANGED;

    /**
     * The variance in the end color. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endColorVar
     * @type {[r,g,b]}
     * @default null
     **/
    p.endColorVar = [0, 0, 0];

    /**
     * The end size of each particle, in pixels. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endSize
     * @type {number}
     * @default null
     **/
    p.endSize = p.REMAIN_UNCHANGED;

    /**
     * The variance in end size, in pixels. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endSizeVar
     * @type {number}
     * @default 0
     **/
    p.endSizeVar = 0.0;

    /**
     * The number of degrees to spin each particle per second when each particle is destroyed. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endSpin
     * @type {number}
     * @default null
     **/
    p.endSpin = p.REMAIN_UNCHANGED;

    /**
     * The variance in end spin. A null value signifies that
     * the value will not differ from the start value.
     *
     * @property endSpinVar
     * @type {number}
     * @default 0
     **/
    p.endSpinVar = 0;

    /**
     * The amount of time (milliseconds) that each particle will last before being destroyed
     *
     * @property life
     * @type {number}
     * @default 4000
     **/
    p.life = 4000;

    /**
     * The variance in the amount of life time (milliseconds)
     *
     * @property lifeVar
     * @type {number}
     * @default 0
     **/
    p.lifeVar = 0;

    /**
     * The variance in the x position of emitted particles
     *
     * @property positionVarX
     * @type {number}
     * @default 0
     **/
    p.positionVarX = 0;

    /**
     * The variance in the y position of emitted particles
     *
     * @property positionVarY
     * @type {number}
     * @default 0
     **/
    p.positionVarY = 0;

    /**
     * The radial acceleration of the particle
     *
     * @property radialAcceleration
     * @type {number}
     * @default 0
     **/
    p.radialAcceleration = 0;

    /**
     * The variance of the radial acceleration of the particle
     *
     * @property radialAccelerationVar
     * @type {number}
     * @default 0
     **/
    p.radialAccelerationVar = 0;

    /**
     * The number of pixels per second that the particle will move
     *
     * @property speed
     * @type {number}
     * @default 10
     **/
    p.speed = 10;

    /**
     * The number of pixels per second that the speed can vary by
     *
     * @property speedVar
     * @type {number}
     * @default 0
     **/
    p.speedVar = 0;

    /**
     * The start opacity of each particle, where 1 is opaque and 0 is transparent
     *
     * @property startOpacity
     * @type {number}
     * @default 0
     **/
    p.startOpacity = 1;

    /**
     * The color of each particle [r,g,b] when it is created
     *
     * @property startColor
     * @type {[r,g,b]}
     * @default [255,0,0]
     **/
    p.startColor = [255, 0, 0];

    /**
     * The variance in the start color
     *
     * @property startColorVar
     * @type {[r,g,b]}
     * @default [0,0,0]
     **/
    p.startColorVar = [0, 0, 0];

    /**
     * The start size of each particle, in pixels
     *
     * @property startSize
     * @type {number}
     * @default 20
     **/
    p.startSize = 20;

    /**
     * The variance in start size, in pixels
     *
     * @property startSizeVar
     * @type {number}
     * @default 0
     **/
    p.startSizeVar = 0;

    /**
     * The number of degrees to spin each particle per second when each particle is created
     *
     * @property startSpin
     * @type {number}
     * @default 0
     **/
    p.startSpin = 0;

    /**
     * The variance in start spin
     *
     * @property startSpinVar
     * @type {number}
     * @default 0
     **/
    p.startSpinVar = 0;

    /**
     * The tangental acceleration of the particle
     *
     * @property tangentalAcceleration
     * @type {number}
     * @default 0
     **/
    p.tangentalAcceleration = 0;

    //
    /**
     * The variance in the tangental acceleration of the particle
     *
     * @property tangentalAccelerationVar
     * @type {number}
     * @default 0
     **/
    p.tangentalAccelerationVar = 0;

    //#endregion
    //#region Private Properties

    // The total number of particles emitted by this emitter
    p._totalEmitted = 0;

    // The time the emitter started
    p._timeStarted = 0;

    // The time at which the last particle was emitted
    p._timeLastParticleEmitted = 0;

    // All the particles currently managed by this emitter
    p._particles = new Array();

    //#endregion

    //#region Public Methods

    /**
     * Resets the emitter which removes any active particles before starting all over again.
     *
     * @method reset
     */
    p.reset = function () {

        while (this._particles.length > 0) {
            var particle = this._particles[0];

            if (particle.filters != null) {
                for (var filterIndex in particle.filters) {
                    createjs.Tween.removeTweens(particle.filters[filterIndex]);
                }
            }

            particle.uncache();
            createjs.Tween.removeTweens(particle);

            this._particles.splice(0, 1);
            this.parent.removeChild(particle);
        }

        this._timeLastParticleEmitted = 0;
        this.state = createjs.ParticleEmitterState.Created;
    };

    //#endregion
    //#region Private Methods

    p.initialize = function () {
        this.DisplayObject_initialise();
    };

    p.updateContext = function (ctx) {
        this.DisplayObject_updateContext(ctx);

        var currentTimeMilli = createjs.Ticker.getTime();

        if (!TQ.FrameCounter.isPlaying()) {
            currentTimeMilli = this._lastUpdateTimeMs;
        }

        if (!!ParticleEmitter.stopped) {  // 停止了
            currentTimeMilli = this._lastUpdateTimeMs;
        }

        // Update state
        if (this.state == createjs.ParticleEmitterState.Created) {
            this._timeStarted = currentTimeMilli;
            this.state = createjs.ParticleEmitterState.Running;
        }
        else if (this.duration != this.INFINITE &&
            currentTimeMilli > (this._timeStarted + this.duration)) {
            this.state = createjs.ParticleEmitterState.Finished;
        }

        // If RUNNING, try to generate a particle
        if (this.state == createjs.ParticleEmitterState.Running) {
            switch (this.emitterType) {
                case createjs.ParticleEmitterType.OneShot:
                    this._oneShot(currentTimeMilli);
                    break;
                case createjs.ParticleEmitterType.Emit:
                default:
                    this._emit(currentTimeMilli);
                    break;
            }
        }
        // If FINISHED, remove from parent
        else if (this.state == createjs.ParticleEmitterState.Finished) {
            if (this.autoRemoveOnFinished) {
                this.parent.removeChild(this);
            }
        }

        // Call updateCache if color tweening is required
        // NB. ColorFilter (or any other type of filter) tweening is computationally very expensive.
        // Therefore if you wish to use color tweening, then we recommend trying to minimize:
        //  a) the emission rate, and
        //  b) the start and end size of the particles
        if (this.endColor != p.REMAIN_UNCHANGED) {
            for (var i = 0; i < this._particles.length; i++) {
                this._particles[i].updateCache();
            }
        }
    };

    p._emit = function (currentTimeMilli) {

        var millisecondsPerParticle = 1000 / this.emissionRate;
        if (currentTimeMilli > (this._timeLastParticleEmitted + millisecondsPerParticle)) {
            if (this._particles.length < this.maxParticles) {
                this._generateParticle();
                this._timeLastParticleEmitted = currentTimeMilli;
            }
        }
    };

    p._oneShot = function (currentTimeMilli) {

        if (this._particles.length == 0) {
            for (var i = 0; i < this.maxParticles; i++) {
                this._generateParticle();
            }

            this._timeLastParticleEmitted = currentTimeMilli;
        }
    };

    // Generate a new particle
    p._generateParticle = function () {

        var o = this;
        this._debugText("generateParticle");

        // Get properties
        var startOpacity = this.startOpacity;
        var startColor = this._getColor(this.startColor, this.startColorVar);
        var startSize = this._getVariedValue(this.startSize, this.startSizeVar, true);
        var startSpin = this._getVariedValue(this.startSpin, this.startSpinVar, false);
        var endColor = this.endColor == this.REMAIN_UNCHANGED ? this.startColor : this._getColor(this.endColor, this.endColorVar);
        var endSize = this.endSize == this.REMAIN_UNCHANGED ? this.startSize : this._getVariedValue(this.endSize, this.endSizeVar, true);
        var endSpin = this.endSpin == this.REMAIN_UNCHANGED ? this.startSpin : this._getVariedValue(this.endSpin, this.endSpinVar, true);
        var endOpacity = this.endOpacity == this.REMAIN_UNCHANGED ? this.startOpacity : this.endOpacity;
        var scale = endSize / startSize;
        var speed = this._getVariedValue(this.speed, this.speedVar, true);
        var life = this._getVariedValue(this.life, this.lifeVar, true);
        var angle = this._getAngle(this.angle, this.angleVar);
        var distance = speed * life / 1000;
        var startPos = {
            x: this._getVariedValue(this.position.x, this.positionVarX, false),
            y: this._getVariedValue(this.position.y, this.positionVarY, false)
        };
        var endPos = this._getPositionInDirection(this.position, angle, distance);
        var dx = endPos.x - this.position.x;
        var dy = endPos.y - this.position.y;

        // Create shape
        var shape = this._createParticle(startPos, startColor, startOpacity, startSize, startSpin, life, dx, dy);
        this.parent.addChild(shape);

        // Create color filter
        var colorFilter = this._createColorFilter(shape, startColor);

        // Cache shape
        if (this.image == null) {
            shape.cache(0, 0, startSize, startSize);
        }
        else {
            shape.cache(0, 0, this.image.width, this.image.height, startSize / this.image.width);
        }

        // Animate
        scale = scale * shape.scaleX;
        createjs.Tween.get(shape).to({ scaleX: scale, scaleY: scale, rotation: endSpin, alpha: endOpacity}, life).call(function () {
            o._onParticleFinished(shape)
        });
        createjs.Tween.get(colorFilter).to({ redMultiplier: endColor[0] / 255.0, greenMultiplier: endColor[1] / 255.0, blueMultiplier: endColor[2] / 255.0 }, life);

        // Finalize
        this._particles.push(shape);
        this._totalEmitted++;

        // Write to console
        this._debugText(this._format("Particle [s_x:{0}, s_y:{1}, e_x:{2}, e_y:{3}]", this.position.x, this.position.y, endPos.x, endPos.y));
    };

    p._createColorFilter = function (shape, color) {

        var filter = new createjs.ColorFilter(color[0] / 255.0, color[1] / 255.0, color[2] / 255.0, 1);
        shape.filters = [filter];

        return filter;
    };

    p._createParticle = function (position, color, alpha, size, spin, life, dx, dy) {

        var shape = null;

        if (this.image != null) {
            shape = this._createImageParticle(color, size);
        }
        else {
            shape = this._createCircleParticle(color, size);
        }

        var originalWidth = this.image != null ? this.image.width : size;
        var originalHeight = this.image != null ? this.image.height : size;

        shape._baseParticle.originX = this.position.x;
        shape._baseParticle.originY = this.position.y;
        shape._baseParticle.linearVelocityX = dx / life * 1000;
        shape._baseParticle.linearVelocityY = dy / life * 1000;
        shape._baseParticle.linearAccelerationX = this.accelerationX;
        shape._baseParticle.linearAccelerationY = this.accelerationY;
        shape._baseParticle.radialAcceleration = this._getVariedValue(this.radialAcceleration, this.radialAccelerationVar, false);
        shape._baseParticle.tangentalAcceleration = this._getVariedValue(this.tangentalAcceleration, this.tangentalAccelerationVar, false);

        shape.alpha = alpha;
        shape.rotation = spin;
        shape.x = position.x;
        shape.y = position.y;
        shape.regX = originalWidth / 2;
        shape.regY = originalHeight / 2;

        shape.initializeProperties(this._totalEmitted);

        return shape;
    };

    p._createImageParticle = function (color, size) {
        var bitmap = new createjs.BitmapParticle(this.image);
        bitmap.scaleX = size / this.image.width;
        bitmap.scaleY = bitmap.scaleX;

        return bitmap;
    };

    p._createCircleParticle = function (color, size) {
        var shape = new createjs.ShapeParticle();
        var colorRgb = createjs.Graphics.getRGB(255, 255, 255);
        shape.graphics.beginFill(colorRgb).drawCircle(size / 2, size / 2, size / 2);
        shape.alpha = 255;

        return shape;
    };

    p._debugText = function (text) {
        if (this.debugMode) {
            console.log(text);
        }
    };

    p._getPositionInDirection = function (startPoint, angle, length) {
        var newX = startPoint.x + (this._cosd(angle) * length);
        var newY = startPoint.y + (this._sind(angle) * length);

        return new createjs.Point(newX, newY);
    };

    p._getVariedValue = function (base, variance, applyLowerLimit) {

        var plusOrMinus = this._intRandom(1) == 1 ? 1 : -1;
        var variedValue = base + (this._intRandom(variance) * plusOrMinus);

        if (applyLowerLimit || false) {
            variedValue = this._lowerLimit(variedValue);
        }

        return variedValue;
    };

    p._getAngle = function (base, variance) {

        var unlimited = this._getVariedValue(base, variance);
        unlimited = unlimited < 0 ? 360 + unlimited : unlimited;
        unlimited = unlimited > 360 ? unlimited - 360 : unlimited;
        return unlimited;
    };

    p._getColor = function (base, variance) {

        var r = variance == null ? base[0] : this._getVariedValue(base[0], variance[0]);
        var g = variance == null ? base[1] : this._getVariedValue(base[1], variance[1]);
        var b = variance == null ? base[2] : this._getVariedValue(base[2], variance[2]);

        r = this._rgbLimit(r);
        g = this._rgbLimit(g);
        b = this._rgbLimit(b);

        var color = [r, g, b];

        return color;
    };

    p._rgbLimit = function (unlimitedVal) {
        var limitedVal = this._lowerLimit(unlimitedVal);
        limitedVal = limitedVal > 255 ? 255 : limitedVal;
        return limitedVal;
    };

    p._lowerLimit = function (unlimitedVal) {
        var limitedVal = unlimitedVal < 0 ? 0 : unlimitedVal;
        return limitedVal;
    };

    /*** Generate a random integer between 0-x (inclusive) */
    p._intRandom = function (upperbound) {
        return Math.floor(Math.random() * (upperbound + 1));
    };

    p._sind = function (degrees) {
        return Math.sin(this._toRadians(degrees));
    };

    p._cosd = function (degrees) {
        return Math.cos(this._toRadians(degrees));
    };

    p._toRadians = function (degrees) {
        return degrees * Math.PI / 180;
    };

    p._format = function () {
        var s = arguments[0];
        for (var i = 0; i < arguments.length - 1; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            s = s.replace(reg, arguments[i + 1]);
        }
        return s;
    };

    //#endregion
    //#region Private Event Handlers

    // Called when a particles life is over
    p._onParticleFinished = function (particle) {
        particle.uncache();
        var particleIndex = this._particles.indexOf(particle);
        this._particles.splice(particleIndex, 1);
        this.parent.removeChild(particle);

        if (this._particles.length == 0 && this.state == createjs.ParticleEmitterState.Running && this.emitterType == createjs.ParticleEmitterType.OneShot) {
            this.state = createjs.ParticleEmitterState.Finished;
        }
    };

    //#endregion

    createjs.ParticleEmitter = ParticleEmitter;
}());

this.TQ = this.TQ || {};

(function () {

    /**
     * A shape particle
     * @constructor
     * @extends createjs.Shape
     */
    var RainEffect = function () {
    };
    var p = RainEffect;
    p.initialize = function () {
        RainEffect.loadAsset();
    };

    p.set = function(size, direction, density, res, dropImage) {
        size = TQ.MathExt.unifyValue10(size, 10, 20);
        direction = TQ.MathExt.unifyValue10(direction, 90-15, 90+15);
        density = TQ.MathExt.unifyValue10(density, 30, 40);
        p.rain1 = {density: 40, startSize:10, direction:110,    dy:50, v0:300, endOpacity:-1, endSize:0, endSizeVar:5};
        p.rain2 = {density: 40, startSize:20, direction:110,    dy:10, v0:100, endOpacity:0.1, endSize:-1, endSizeVar:5};
        p.para1 = {density: density, startSize:size, direction:direction,    dy:10, v0:100, endOpacity:0.1, endSize:-1, endSizeVar:5};
        if (!p.emitter) {
            p.para1 = p.rain1;
            p._loadAsset();
        } else {
            p._apply();
        }
        if (!TQ.FrameCounter.isPlaying()) {
            $('#play').click();
        }
        createjs.ParticleEmitter.stopped = false;
    };

    p._apply = function() {
        for (var i=0; i < p.emitters.length; i++) {
            var emitter = p.emitters[i];
            emitter.speed = p.para1.v0; // 粒子的初始速度，
            emitter.positionVarY = p.para1.dy;
            emitter.angle = p.para1.direction;
            emitter.endOpacity = p.para1.endOpacity;
            emitter.startSize = p.para1.startSize;
            emitter.startSizeVar = p.para1.startSize / 2; //10;
            emitter.endSizeVar = p.para1.endSizeVar;
        }
    };

    // 停止下雨
    p.stop = function() {
        createjs.ParticleEmitter.stopped = true;
    };

    p._loadAsset = function() {
        if (!p.particleImage) {
            p.particleImage = new Image();
            p.particleImage.onload = p._initCanvas;
            p.particleImage.src = 'http://'+TQ.Config.DOMAIN_NAME + "/public/mcImages/yudi3.png";
        }
    };

    p._initCanvas = function () {
        if (!canvas) {
            canvas = document.getElementById('testCanvas');
            context = canvas.getContext("2d");
            stage = new createjs.Stage(canvas);
        }

        if (!p.emitter) {
            createjs.Ticker.setFPS(30);
            createjs.Ticker.addListener(update);
            addFPS();
            p._create(p.para1);
            p.created = true;
        } else {
            p._apply(p.para1);
        }
    };

    p._create = function(para) {
        var M = para.density;  // 雪花的密度，
        var N = 1;
        p.emitters = [];
        for (var i =0; i < M; i++) {
            for (var j = 0; j < N; j++) {
                var x = i/M * canvas.width  + canvas.width/10;
                var y = j/N * canvas.height - canvas.height/10;
                para.x = x;
                para.y = y;
                p.emitters.push(p.addParticleEmitter(para));
            }}
    };

    p.addParticleEmitter = function(para) {
        var emitter = new createjs.ParticleEmitter(p.particleImage);
        emitter.position = new createjs.Point(para.x, para.y);
        emitter.emitterType = createjs.ParticleEmitterType.Emit;
        emitter.emissionRate = 2;  // 产生新粒子的速度
        emitter.maxParticles = 2000; // 粒子库的大小
        emitter.life = 9000; // 粒子的寿命长度
        emitter.lifeVar = 500;
        emitter.speed = para.v0; // 粒子的初始速度，
        emitter.speedVar = 20; //
        emitter.positionVarX = 20;
        emitter.positionVarY = para.dy;
        emitter.accelerationX = 0;
        emitter.accelerationY = 0;
        emitter.radialAcceleration = 0;
        emitter.radialAccelerationVar = 0;
        emitter.tangentalAcceleration = 0;
        emitter.tangentalAccelerationVar = 0;
        emitter.angle = para.direction;
        emitter.angleVar = 10;
        emitter.startSpin = 20;
        emitter.startSpinVar = 10;
        emitter.endSpin = null;
        emitter.endSpinVar = null;
        emitter.startColor = [190, 190, 255];
        emitter.startColorVar = [50, 50, 0];
        emitter.startOpacity = 1;
        emitter.endColor = null;
        emitter.endColorVar = null;
        emitter.endOpacity = para.endOpacity;
        emitter.startSize = para.startSize;
        emitter.startSizeVar = para.startSize / 2; //10;
        emitter.endSize = 0;
        emitter.endSizeVar = para.endSizeVar;
        p.emitter = emitter;
        stage.addChild(emitter);
        return emitter;
    };

    TQ.RainEffect = RainEffect;
}());


var stage;          // the createjs stage
// var fpsLabel;       // label to show the current frames per second

function update() {
    // fpsLabel.text = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
    stage.update();
}

function addFPS() {
    // fpsLabel = new createjs.Text("-- fps", "bold 14px Arial", "#BBBBBB");
    // stage.addChild(fpsLabel);
}


this.TQ = this.TQ || {};

(function () {

    /**
     * A shape particle
     * @constructor
     * @extends createjs.Shape
     */
    var SnowEffect = function () {
    };
    var p = SnowEffect;
    p.initialize = function () {
        SnowEffect.loadAsset();
    };

    p.set = function(size, direction, density, res, dropImage) {
        size = TQ.MathExt.unifyValue10(size, 10, 20);
        direction = TQ.MathExt.unifyValue10(direction, 90-15, 90+15);
        density = TQ.MathExt.unifyValue10(density, 30, 40);
        p.rain1 = {density: 40, startSize:10, direction:110,    dy:50, v0:300, endOpacity:-1, endSize:0, endSizeVar:5};
        p.rain2 = {density: 40, startSize:20, direction:110,    dy:10, v0:100, endOpacity:0.1, endSize:-1, endSizeVar:5};
        p.para1 = {density: density, startSize:size, direction:direction,    dy:10, v0:100, endOpacity:0.1, endSize:-1, endSizeVar:5};
        if (!p.emitter) {
            p.para1 = p.rain1;
            p._loadAsset();
        } else {
            p._apply();
        }

        if (!TQ.FrameCounter.isPlaying()) {
            $('#play').click();
        }

        createjs.ParticleEmitter.stopped = false;
    };

    p._apply = function() {
        for (var i=0; i < p.emitters.length; i++) {
            var emitter = p.emitters[i];
            emitter.speed = p.para1.v0; // 粒子的初始速度，
            emitter.positionVarY = p.para1.dy;
            emitter.angle = p.para1.direction;
            emitter.endOpacity = p.para1.endOpacity;
            emitter.startSize = p.para1.startSize;
            emitter.startSizeVar = p.para1.startSize / 2; //10;
            emitter.endSizeVar = p.para1.endSizeVar;
        }
    };

    p._loadAsset = function() {
        if (!p.particleImage) {
            p.particleImage = new Image();
            p.particleImage.onload = p._initCanvas;
            p.particleImage.src = 'http://'+TQ.Config.DOMAIN_NAME + "/public/mcImages/xuehua1.png";
        }
    };

    // 停止下雨
    p.stop = function() {
        createjs.ParticleEmitter.stopped = true;
    };

    p._initCanvas = function () {
        if (!canvas) {
            canvas = document.getElementById('testCanvas');
            context = canvas.getContext("2d");
            stage = new createjs.Stage(canvas);
        }

        if (!p.emitter) {
            createjs.Ticker.setFPS(30);
            createjs.Ticker.addListener(update);
            addFPS();
            p._create(p.para1);
            p.created = true;
        } else {
            p._apply(p.para1);
        }
    };

    p._create = function(para) {
        var M = para.density;  // 雪花的密度，
        var N = 1;
        p.emitters = [];
        for (var i =0; i < M; i++) {
            for (var j = 0; j < N; j++) {
                var x = i/M * canvas.width  + canvas.width/10;
                var y = j/N * canvas.height - canvas.height/10;
                para.x = x;
                para.y = y;
                p.emitters.push(p.addParticleEmitter(para));
            }}
    };

    p.addParticleEmitter = function(para) {
        var emitter = new createjs.ParticleEmitter(p.particleImage);
        emitter.position = new createjs.Point(para.x, para.y);
        emitter.emitterType = createjs.ParticleEmitterType.Emit;
        emitter.emissionRate = 2;  // 产生新粒子的速度
        emitter.maxParticles = 2000; // 粒子库的大小
        emitter.life = 9000; // 粒子的寿命长度
        emitter.lifeVar = 500;
        emitter.speed = para.v0; // 粒子的初始速度，
        emitter.speedVar = 20; //
        emitter.positionVarX = 20;
        emitter.positionVarY = para.dy;
        emitter.accelerationX = 0;
        emitter.accelerationY = 0;
        emitter.radialAcceleration = 0;
        emitter.radialAccelerationVar = 0;
        emitter.tangentalAcceleration = 0;
        emitter.tangentalAccelerationVar = 0;
        emitter.angle = para.direction;
        emitter.angleVar = 10;
        emitter.startSpin = 20;
        emitter.startSpinVar = 10;
        emitter.endSpin = null;
        emitter.endSpinVar = null;
        emitter.startColor = [190, 190, 255];
        emitter.startColorVar = [50, 50, 0];
        emitter.startOpacity = 1;
        emitter.endColor = null;
        emitter.endColorVar = null;
        emitter.endOpacity = para.endOpacity;
        emitter.startSize = para.startSize;
        emitter.startSizeVar = para.startSize / 2; //10;
        emitter.endSize = 0;
        emitter.endSizeVar = para.endSizeVar;
        p.emitter = emitter;
        stage.addChild(emitter);
        return emitter;
    };

    TQ.SnowEffect = SnowEffect;
}());


var stage;          // the createjs stage
// var fpsLabel;       // label to show the current frames per second

function update() {
    // fpsLabel.text = Math.round(createjs.Ticker.getMeasuredFPS()) + " fps";
    stage.update();
}

function addFPS() {
    // fpsLabel = new createjs.Text("-- fps", "bold 14px Arial", "#BBBBBB");
    // stage.addChild(fpsLabel);
}

/*!
* @license TweenJS
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2011-2013 gskinner.com, inc.
* 
* Distributed under the terms of the MIT license.
* http://www.opensource.org/licenses/mit-license.html
*
* This notice shall be included in all copies or substantial portions of the Software.
*/
this.createjs=this.createjs||{};
(function(){var b=function(){this.initialize()},a=b.prototype;b.initialize=function(d){d.addEventListener=a.addEventListener;d.removeEventListener=a.removeEventListener;d.removeAllEventListeners=a.removeAllEventListeners;d.hasEventListener=a.hasEventListener;d.dispatchEvent=a.dispatchEvent};a._listeners=null;a.initialize=function(){};a.addEventListener=function(d,a){var c=this._listeners;c?this.removeEventListener(d,a):c=this._listeners={};var b=c[d];b||(b=c[d]=[]);b.push(a);return a};a.removeEventListener=
function(d,a){var c=this._listeners;if(c){var b=c[d];if(b)for(var f=0,g=b.length;f<g;f++)if(b[f]==a){1==g?delete c[d]:b.splice(f,1);break}}};a.removeAllEventListeners=function(d){d?this._listeners&&delete this._listeners[d]:this._listeners=null};a.dispatchEvent=function(d,a){var c=!1,b=this._listeners;if(d&&b){"string"==typeof d&&(d={type:d});b=b[d.type];if(!b)return c;d.target=a||this;for(var b=b.slice(),f=0,g=b.length;f<g;f++)var j=b[f],c=j.handleEvent?c||j.handleEvent(d):c||j(d)}return!!c};a.hasEventListener=
function(d){var a=this._listeners;return!(!a||!a[d])};a.toString=function(){return"[EventDispatcher]"};createjs.EventDispatcher=b})();this.createjs=this.createjs||{};
(function(){var b=function(d,a,c){this.initialize(d,a,c)},a=b.prototype;b.NONE=0;b.LOOP=1;b.REVERSE=2;b.IGNORE={};b._tweens=[];b._plugins={};b.get=function(d,a,c,e){e&&b.removeTweens(d);return new b(d,a,c)};b.tick=function(d,a){for(var c=b._tweens.slice(),e=c.length-1;0<=e;e--){var f=c[e];a&&!f.ignoreGlobalPause||f._paused||f.tick(f._useTicks?1:d)}};createjs.Ticker&&createjs.Ticker.addListener(b,!1);b.removeTweens=function(d){if(d.tweenjs_count){for(var a=b._tweens,c=a.length-1;0<=c;c--)a[c]._target==
d&&(a[c]._paused=!0,a.splice(c,1));d.tweenjs_count=0}};b.removeAllTweens=function(){for(var d=b._tweens,a=0,c=d.length;a<c;a++){var e=d[a];e.paused=!0;e.target.tweenjs_count=0}d.length=0};b.hasActiveTweens=function(d){return d?d.tweenjs_count:b._tweens&&b._tweens.length};b.installPlugin=function(d,a){var c=d.priority;null==c&&(d.priority=c=0);for(var e=0,f=a.length,g=b._plugins;e<f;e++){var j=a[e];if(g[j]){for(var l=g[j],k=0,p=l.length;k<p&&!(c<l[k].priority);k++);g[j].splice(k,0,d)}else g[j]=[d]}};
b._register=function(d,a){var c=d._target;a?(c&&(c.tweenjs_count=c.tweenjs_count?c.tweenjs_count+1:1),b._tweens.push(d)):(c&&c.tweenjs_count--,c=b._tweens.indexOf(d),-1!=c&&b._tweens.splice(c,1))};a.addEventListener=null;a.removeEventListener=null;a.removeAllEventListeners=null;a.dispatchEvent=null;a.hasEventListener=null;a._listeners=null;createjs.EventDispatcher.initialize(a);a.ignoreGlobalPause=!1;a.loop=!1;a.duration=0;a.pluginData=null;a.onChange=null;a.change=null;a.target=null;a.position=null;
a._paused=!1;a._curQueueProps=null;a._initQueueProps=null;a._steps=null;a._actions=null;a._prevPosition=0;a._stepPosition=0;a._prevPos=-1;a._target=null;a._useTicks=!1;a.initialize=function(d,a,c){this.target=this._target=d;a&&(this._useTicks=a.useTicks,this.ignoreGlobalPause=a.ignoreGlobalPause,this.loop=a.loop,this.onChange=a.onChange,a.override&&b.removeTweens(d));this.pluginData=c||{};this._curQueueProps={};this._initQueueProps={};this._steps=[];this._actions=[];a&&a.paused?this._paused=!0:b._register(this,
!0);a&&null!=a.position&&this.setPosition(a.position,b.NONE)};a.wait=function(a){if(null==a||0>=a)return this;var b=this._cloneProps(this._curQueueProps);return this._addStep({d:a,p0:b,e:this._linearEase,p1:b})};a.to=function(a,b,c){if(isNaN(b)||0>b)b=0;return this._addStep({d:b||0,p0:this._cloneProps(this._curQueueProps),e:c,p1:this._cloneProps(this._appendQueueProps(a))})};a.call=function(a,b,c){return this._addAction({f:a,p:b?b:[this],o:c?c:this._target})};a.set=function(a,b){return this._addAction({f:this._set,
o:this,p:[a,b?b:this._target]})};a.play=function(a){return this.call(a.setPaused,[!1],a)};a.pause=function(a){a||(a=this);return this.call(a.setPaused,[!0],a)};a.setPosition=function(a,b){0>a&&(a=0);null==b&&(b=1);var c=a,e=!1;c>=this.duration&&(this.loop?c%=this.duration:(c=this.duration,e=!0));if(c==this._prevPos)return e;var f=this._prevPos;this.position=this._prevPos=c;this._prevPosition=a;if(this._target)if(e)this._updateTargetProps(null,1);else if(0<this._steps.length){for(var g=0,j=this._steps.length;g<
j&&!(this._steps[g].t>c);g++);g=this._steps[g-1];this._updateTargetProps(g,(this._stepPosition=c-g.t)/g.d)}0!=b&&0<this._actions.length&&(this._useTicks?this._runActions(c,c):1==b&&c<f?(f!=this.duration&&this._runActions(f,this.duration),this._runActions(0,c,!0)):this._runActions(f,c));e&&this.setPaused(!0);this.onChange&&this.onChange(this);this.dispatchEvent("change");return e};a.tick=function(a){this._paused||this.setPosition(this._prevPosition+a)};a.setPaused=function(a){this._paused=!!a;b._register(this,
!a);return this};a.w=a.wait;a.t=a.to;a.c=a.call;a.s=a.set;a.toString=function(){return"[Tween]"};a.clone=function(){throw"Tween can not be cloned.";};a._updateTargetProps=function(a,h){var c,e,f,g;!a&&1==h?c=e=this._curQueueProps:(a.e&&(h=a.e(h,0,1,1)),c=a.p0,e=a.p1);for(n in this._initQueueProps){if(null==(f=c[n]))c[n]=f=this._initQueueProps[n];if(null==(g=e[n]))e[n]=g=f;f=f==g||0==h||1==h||"number"!=typeof f?1==h?g:f:f+(g-f)*h;var j=!1;if(g=b._plugins[n])for(var l=0,k=g.length;l<k;l++){var p=g[l].tween(this,
n,f,c,e,h,!!a&&c==e,!a);p==b.IGNORE?j=!0:f=p}j||(this._target[n]=f)}};a._runActions=function(a,b,c){var e=a,f=b,g=-1,j=this._actions.length,l=1;a>b&&(e=b,f=a,g=j,j=l=-1);for(;(g+=l)!=j;){b=this._actions[g];var k=b.t;(k==f||k>e&&k<f||c&&k==a)&&b.f.apply(b.o,b.p)}};a._appendQueueProps=function(a){var h,c,e,f,g,j;for(j in a){if(void 0===this._initQueueProps[j]){c=this._target[j];if(h=b._plugins[j]){e=0;for(f=h.length;e<f;e++)c=h[e].init(this,j,c)}this._initQueueProps[j]=void 0===c?null:c}else c=this._curQueueProps[j];
if(h=b._plugins[j]){g=g||{};e=0;for(f=h.length;e<f;e++)h[e].step&&h[e].step(this,j,c,a[j],g)}this._curQueueProps[j]=a[j]}g&&this._appendQueueProps(g);return this._curQueueProps};a._cloneProps=function(a){var b={},c;for(c in a)b[c]=a[c];return b};a._addStep=function(a){0<a.d&&(this._steps.push(a),a.t=this.duration,this.duration+=a.d);return this};a._addAction=function(a){a.t=this.duration;this._actions.push(a);return this};a._set=function(a,b){for(var c in a)b[c]=a[c]};createjs.Tween=b})();this.createjs=this.createjs||{};
(function(){var b=function(a,b,c){this.initialize(a,b,c)},a=b.prototype;a.ignoreGlobalPause=!1;a.duration=0;a.loop=!1;a.onChange=null;a.position=null;a._paused=!1;a._tweens=null;a._labels=null;a._prevPosition=0;a._prevPos=-1;a._useTicks=!1;a.initialize=function(a,b,c){this._tweens=[];c&&(this._useTicks=c.useTicks,this.loop=c.loop,this.ignoreGlobalPause=c.ignoreGlobalPause,this.onChange=c.onChange);a&&this.addTween.apply(this,a);this.setLabels(b);c&&c.paused?this._paused=!0:createjs.Tween._register(this,
!0);c&&null!=c.position&&this.setPosition(c.position,createjs.Tween.NONE)};a.addTween=function(a){var b=arguments.length;if(1<b){for(var c=0;c<b;c++)this.addTween(arguments[c]);return arguments[0]}if(0==b)return null;this.removeTween(a);this._tweens.push(a);a.setPaused(!0);a._paused=!1;a._useTicks=this._useTicks;a.duration>this.duration&&(this.duration=a.duration);0<=this._prevPos&&a.setPosition(this._prevPos,createjs.Tween.NONE);return a};a.removeTween=function(a){var b=arguments.length;if(1<b){for(var c=
!0,e=0;e<b;e++)c=c&&this.removeTween(arguments[e]);return c}if(0==b)return!1;b=this._tweens.indexOf(a);return-1!=b?(this._tweens.splice(b,1),a.duration>=this.duration&&this.updateDuration(),!0):!1};a.addLabel=function(a,b){this._labels[a]=b};a.setLabels=function(a){this._labels=a?a:{}};a.gotoAndPlay=function(a){this.setPaused(!1);this._goto(a)};a.gotoAndStop=function(a){this.setPaused(!0);this._goto(a)};a.setPosition=function(a,b){0>a&&(a=0);var c=this.loop?a%this.duration:a,e=!this.loop&&a>=this.duration;
if(c==this._prevPos)return e;this._prevPosition=a;this.position=this._prevPos=c;for(var f=0,g=this._tweens.length;f<g;f++)if(this._tweens[f].setPosition(c,b),c!=this._prevPos)return!1;e&&this.setPaused(!0);this.onChange&&this.onChange(this);return e};a.setPaused=function(a){this._paused=!!a;createjs.Tween._register(this,!a)};a.updateDuration=function(){for(var a=this.duration=0,b=this._tweens.length;a<b;a++){var c=this._tweens[a];c.duration>this.duration&&(this.duration=c.duration)}};a.tick=function(a){this.setPosition(this._prevPosition+
a)};a.resolve=function(a){var b=parseFloat(a);isNaN(b)&&(b=this._labels[a]);return b};a.toString=function(){return"[Timeline]"};a.clone=function(){throw"Timeline can not be cloned.";};a._goto=function(a){a=this.resolve(a);null!=a&&this.setPosition(a)};createjs.Timeline=b})();this.createjs=this.createjs||{};
(function(){var b=function(){throw"Ease cannot be instantiated.";};b.linear=function(a){return a};b.none=b.linear;b.get=function(a){-1>a&&(a=-1);1<a&&(a=1);return function(b){return 0==a?b:0>a?b*(b*-a+1+a):b*((2-b)*a+(1-a))}};b.getPowIn=function(a){return function(b){return Math.pow(b,a)}};b.getPowOut=function(a){return function(b){return 1-Math.pow(1-b,a)}};b.getPowInOut=function(a){return function(b){return 1>(b*=2)?0.5*Math.pow(b,a):1-0.5*Math.abs(Math.pow(2-b,a))}};b.quadIn=b.getPowIn(2);b.quadOut=
b.getPowOut(2);b.quadInOut=b.getPowInOut(2);b.cubicIn=b.getPowIn(3);b.cubicOut=b.getPowOut(3);b.cubicInOut=b.getPowInOut(3);b.quartIn=b.getPowIn(4);b.quartOut=b.getPowOut(4);b.quartInOut=b.getPowInOut(4);b.quintIn=b.getPowIn(5);b.quintOut=b.getPowOut(5);b.quintInOut=b.getPowInOut(5);b.sineIn=function(a){return 1-Math.cos(a*Math.PI/2)};b.sineOut=function(a){return Math.sin(a*Math.PI/2)};b.sineInOut=function(a){return-0.5*(Math.cos(Math.PI*a)-1)};b.getBackIn=function(a){return function(b){return b*
b*((a+1)*b-a)}};b.backIn=b.getBackIn(1.7);b.getBackOut=function(a){return function(b){return--b*b*((a+1)*b+a)+1}};b.backOut=b.getBackOut(1.7);b.getBackInOut=function(a){a*=1.525;return function(b){return 1>(b*=2)?0.5*b*b*((a+1)*b-a):0.5*((b-=2)*b*((a+1)*b+a)+2)}};b.backInOut=b.getBackInOut(1.7);b.circIn=function(a){return-(Math.sqrt(1-a*a)-1)};b.circOut=function(a){return Math.sqrt(1- --a*a)};b.circInOut=function(a){return 1>(a*=2)?-0.5*(Math.sqrt(1-a*a)-1):0.5*(Math.sqrt(1-(a-=2)*a)+1)};b.bounceIn=
function(a){return 1-b.bounceOut(1-a)};b.bounceOut=function(a){return a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+0.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+0.9375:7.5625*(a-=2.625/2.75)*a+0.984375};b.bounceInOut=function(a){return 0.5>a?0.5*b.bounceIn(2*a):0.5*b.bounceOut(2*a-1)+0.5};b.getElasticIn=function(a,b){var h=2*Math.PI;return function(c){if(0==c||1==c)return c;var e=b/h*Math.asin(1/a);return-(a*Math.pow(2,10*(c-=1))*Math.sin((c-e)*h/b))}};b.elasticIn=b.getElasticIn(1,0.3);b.getElasticOut=
function(a,b){var h=2*Math.PI;return function(c){if(0==c||1==c)return c;var e=b/h*Math.asin(1/a);return a*Math.pow(2,-10*c)*Math.sin((c-e)*h/b)+1}};b.elasticOut=b.getElasticOut(1,0.3);b.getElasticInOut=function(a,b){var h=2*Math.PI;return function(c){var e=b/h*Math.asin(1/a);return 1>(c*=2)?-0.5*a*Math.pow(2,10*(c-=1))*Math.sin((c-e)*h/b):0.5*a*Math.pow(2,-10*(c-=1))*Math.sin((c-e)*h/b)+1}};b.elasticInOut=b.getElasticInOut(1,0.3*1.5);createjs.Ease=b})();this.createjs=this.createjs||{};
(function(){var b=function(){throw"MotionGuidePlugin cannot be instantiated.";};b.priority=0;b.install=function(){createjs.Tween.installPlugin(b,["guide","x","y","rotation"]);return createjs.Tween.IGNORE};b.init=function(a,b,h){a=a.target;a.hasOwnProperty("x")||(a.x=0);a.hasOwnProperty("y")||(a.y=0);a.hasOwnProperty("rotation")||(a.rotation=0);return"guide"==b?null:h};b.step=function(a,d,h,c,e){if("guide"!=d)return c;var f;c.hasOwnProperty("path")||(c.path=[]);a=c.path;c.hasOwnProperty("end")||(c.end=
1);c.hasOwnProperty("start")||(c.start=h&&h.hasOwnProperty("end")&&h.path===a?h.end:0);if(c.hasOwnProperty("_segments")&&c._length)return c;h=a.length;if(6<=h&&0==(h-2)%4){c._segments=[];c._length=0;for(d=2;d<h;d+=4){for(var g=a[d-2],j=a[d-1],l=a[d+0],k=a[d+1],p=a[d+2],x=a[d+3],v=g,w=j,s,m,r=0,t=[],u=1;10>=u;u++){m=u/10;var q=1-m;s=q*q*g+2*q*m*l+m*m*p;m=q*q*j+2*q*m*k+m*m*x;r+=t[t.push(Math.sqrt((f=s-v)*f+(f=m-w)*f))-1];v=s;w=m}c._segments.push(r);c._segments.push(t);c._length+=r}}else throw"invalid 'path' data, please see documentation for valid paths";
f=c.orient;c.orient=!1;b.calc(c,c.end,e);c.orient=f;return c};b.tween=function(a,d,h,c,e,f,g){e=e.guide;if(void 0==e||e===c.guide)return h;e.lastRatio!=f&&(b.calc(e,(e.end-e.start)*(g?e.end:f)+e.start,a.target),e.orient&&(a.target.rotation+=c.rotation||0),e.lastRatio=f);return!e.orient&&"rotation"==d?h:a.target[d]};b.calc=function(a,d,h){void 0==a._segments&&b.validate(a);void 0==h&&(h={x:0,y:0,rotation:0});var c=a._segments,e=a.path,f=a._length*d,g=c.length-2;for(d=0;f>c[d]&&d<g;)f-=c[d],d+=2;for(var c=
c[d+1],j=0,g=c.length-1;f>c[j]&&j<g;)f-=c[j],j++;f=j/++g+f/(g*c[j]);d=2*d+2;g=1-f;h.x=g*g*e[d-2]+2*g*f*e[d+0]+f*f*e[d+2];h.y=g*g*e[d-1]+2*g*f*e[d+1]+f*f*e[d+3];a.orient&&(h.rotation=57.2957795*Math.atan2((e[d+1]-e[d-1])*g+(e[d+3]-e[d+1])*f,(e[d+0]-e[d-2])*g+(e[d+2]-e[d+0])*f));return h};createjs.MotionGuidePlugin=b})();(function(){var b=this.createjs=this.createjs||{},b=b.TweenJS=b.TweenJS||{};b.version="0.4.0";b.buildDate="Tue, 12 Feb 2013 21:08:16 GMT"})();
