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
            TextEditor.getInput(obj.text, obj.fontFace, obj.fontSize,obj.color, ele.displayObj.x, ele.displayObj.y);
        }
    };

    TextEditor.addText = function(str) {
        TextEditor.isCreating = true;
        TextEditor.lastElement = null;  //  防止在输入新字串的时候, 被close
        TQ.SelectSet.clear();

        var x = 20,
             y = 300; // 位置靠上一点, 人容易看见
        jsonObj = {type:"Text", isVis:1, x:x, y:y, zIndex:TQ.Utility.getMaxZ(), rotation:0,
            text: str,
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
        if (x == null) x = 100;
        if (y == null) y = 10;
        TextEditor.xCanvas = x;
        TextEditor.yCanvas = y;
        TextEditor.setEditor(fontFamily, fontSize, fontColor, x, y);
        TextEditor.inputBox.val(defaultvalue); //attr("value")存取的不是真正的值;
        TextEditor.boxDiv.show();
        setSelectorByText("fontFamilySelector", fontFamily);
        setSelectorByText("fontSize", fontSize);
        setSelectorByValue("fontColor", fontColor);
        $( "select, input" ).bind( "click keyup change", TextEditor.realTimeUpdate);
        $( "#idOK" ).bind("click", TextEditor.onOK );
        $( "#idNo" ).bind("click", TextEditor.onNo );
    };

    TextEditor.setEditor = function(fontFamily, fontSize, fontColor, x, y) {
        x = TQ.Utility.canvas2WindowX(TextEditor.xCanvas - 4); // 9px,
        y = TQ.Utility.canvas2WindowY(TextEditor.yCanvas - TextEditor.yDiff(fontSize));  // 45px, ==> 19,  30px=>14, 15px, ==> 9;
        TextEditor.boxDiv.css("left", x.toString() + "px");
        TextEditor.boxDiv.css("top", y.toString() + "px");
        TextEditor.inputBox.css("font-family", fontFamily);
        TextEditor.inputBox.css("font-size", fontSize + "px");
        TextEditor.inputBox.css("color", fontColor);
        TextEditor.inputBox.css("opacity", 0.5); // 0 全透明(不可见了)
        TextEditor.inputBox.css("width", (660 - TextEditor.xCanvas) + "px"); // 0 全透明(不可见了)
    };

    TextEditor.onOK = function()
    {
        TextEditor.visible = false;
        TextEditor.boxDiv.hide();
        TextEditor.lastElement.show(true);
    }

    TextEditor.onNo = function()
    {
        TextEditor.visible = false;
        TextEditor.boxDiv.hide();
    }

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
