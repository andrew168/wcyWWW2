window.TQ = window.TQ || {};
(function () {
  var MessageBubble = {};
  MessageBubble.visible = false;
  MessageBubble.dlg = null;
  MessageBubble.counter=0;
  MessageBubble.initialize = function() {
    // 在 mcDeferLoad.html 中定义，由mc中的mcDeferLoad 统一加载；
    // 把小资源文件合并成大文件，提高加载速度
    MessageBubble.dlg = $( "#messageBubbleDiv" );
    MessageBubble.bubble = $( "#bubble" );
    MessageBubble.dlg.hide();
  };

  MessageBubble.close = function() {
    easyDialog.close();
  };

  MessageBubble.addMessage = function (msg) {
    if (MessageBubble.visible) {
      MessageBubble.bubble.text(MessageBubble.bubble.text() + "; " + msg);
    }
  };

  MessageBubble.show = function (defaultvalue, button1, callback1, button2, callback2)
  {
    return MYJS.alert_obj.alert("Test 信息", "OK", null, null);
  };

  TQ.MessageBubble = MessageBubble;
}());
