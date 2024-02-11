/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 文本编辑器, singleton
 */

window.TQ = window.TQ || {};
(function() {
  var TextEditor = {};
  TextEditor.visible = false;
  TextEditor.lastElement = null;
  TextEditor.x0 = 100;
  var _initialized = false;
  TextEditor.initialize = function() {
    if (_initialized) {
      return;
    }
    _initialized = true;
    TextEditor.boxDiv = $("#textEditBoxDiv");
    TextEditor.inputBox = $("#textEditBox");
    TextEditor.boxDiv.hide();
    TQ.InputMap.registerAction(TQ.InputMap.TEXT_EDIT_KEY, function() {
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

      var canvas = TQ.Graphics.getCanvas();
      canvasLeft = (canvas.offsetLeft + (TQ.Utility.getOffsetLeft(canvas.offsetParent)));
      canvasTop = (canvas.offsetTop + (TQ.Utility.getOffsetTop(canvas.offsetParent)));

      var xx = canvasLeft + ele.displayObj.x;
      var yy = canvasTop + ele.displayObj.y;
      TextEditor.getInput(obj.text, obj.fontFace, obj.fontSize, obj.color, xx - 25, yy - 5);
    }
  };

  TextEditor.addText = function(str) {
    if (TextEditor.visible) return; // 防止重复进入
    TextEditor.isCreating = true;
    TextEditor.lastElement = null; //  防止在输入新字串的时候, 被close

    var canvas = TQ.Graphics.getCanvas();
    canvasWidth = (canvas.clientWidth || canvas.body.clientWidth || 0);
    canvasHeight = (canvas.clientHeight || canvas.body.clientHeight || 0);

    var x = TextEditor.x0;
    var y = canvasHeight / 2; // z坐标向上。位置靠上一点, 人容易看见

    var _t0 = TQ.FrameCounter.t();
    jsonObj = { type: "Text", isVis: 1, x: x, y: y, zIndex: TQ.Utility.getMaxZ(), rotation: 0,
      text: str, t0: _t0,
      fontFace: TQ.Config.fontFace, fontSize: TQ.Config.fontSize, color: TQ.Config.color };
    TQ.Element.parseHtmlStr(jsonObj, str);

    TextEditor.do(currScene.addText(jsonObj));
    TextEditor.isCreating = false; // 只是这个创建元素的线程走完， 而编辑字符线程仍然打开。
  };

  TextEditor.yDiff = function(fontSize) {
    return (fontSize - 45) / 3 + 19;
  };

  TextEditor.getInput = function(defaultvalue, fontFamily, fontSize, fontColor, x, y) {
    TQ.InputMap.turnOff();
    if (x == null) x = 520;
    if (y == null) y = 300;
    TextEditor.xCanvas = x;
    TextEditor.yCanvas = y;
    var width = fontSize * defaultvalue.length;
    TextEditor.setEditor(fontFamily, fontSize, fontColor, x, y, width);
    TextEditor.inputBox.val(defaultvalue); // attr("value")存取的不是真正的值;
    TextEditor.boxDiv.show();
    setSelectorByText("fontFamilySelector", fontFamily);
    setSelectorByText("fontSize", fontSize);
    setSelectorByValue("fontColor", fontColor);
    $("select, input").bind("click keyup change", TextEditor.realTimeUpdate);
    $("#idOK").bind("click", TextEditor.onOK);
    $("#idNo").bind("click", TextEditor.onNo);
  };

  TextEditor.setEditor = function(fontFamily, fontSize, fontColor, x, y, width) {
    x = TQ.Utility.canvas2WindowX(TextEditor.xCanvas - 4); // 9px,
    y = TQ.Utility.canvas2WindowY(TextEditor.yCanvas - TextEditor.yDiff(fontSize)); // 45px, ==> 19,  30px=>14, 15px, ==> 9;
    TextEditor.boxDiv.css("left", x.toString() + "px");
    TextEditor.boxDiv.css("top", y.toString() + "px");
    TextEditor.inputBox.css("font-family", fontFamily);
    TextEditor.inputBox.css("font-size", fontSize + "px");
    TextEditor.inputBox.css("color", fontColor);
    TextEditor.inputBox.css("opacity", 1); // 0 全透明(不可见了)
    TextEditor.inputBox.css("width", width + "px");
  };

  TextEditor.onOK = function() {
    TQ.InputMap.turnOn();
    TextEditor.visible = false;
    TextEditor.boxDiv.hide();
    TextEditor.lastElement.show(true);
  };

  TextEditor.onNo = function() {
    TQ.InputMap.turnOn();
    if (TextEditor.visible) {
      TextEditor.visible = false;
      TextEditor.boxDiv.hide();
    }
  };

  TextEditor.realTimeUpdate = function() {
    assertNotNull(TQ.Dictionary.PleaseSelectText, TextEditor.lastElement);
    if (TextEditor.lastElement != null) {
      var str = TextEditor.inputBox.val();
      var fontFamily = $("#fontFamilySelector :selected").val();
      var fontSize = $("#fontSize :selected").val();
      var fontColor = $("#fontColor :selected").val();
      TextEditor.lastElement.setText(str, fontFamily, fontSize, fontColor);
      TextEditor.setEditor(fontFamily, fontSize, fontColor, TextEditor.xCanvas, TextEditor.yCanvas);
    }
  };

  function setSelectorByText(id, text) {
    var selector = $("#" + id).get(0);
    if (!selector) {
      return;
    }
    var count = selector.options.length;
    for (var i = 0; i < count; i++) {
      if (selector.options[i].text == text) {
        selector.options[i].selected = true;
        break;
      }
    }
  }

  function setSelectorByValue(id, value) {
    var selector = $("#" + id).get(0);
    if (!selector) {
      return;
    }
    var count = selector.options.length;
    for (var i = 0; i < count; i++) {
      if (selector.options[i].value == value) {
        selector.options[i].selected = true;
        break;
      }
    }
  }

  TQ.TextEditor = TextEditor;
})();
