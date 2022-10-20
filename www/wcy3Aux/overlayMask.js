/**
 * Created by Andrewz on 8/12/18.
 * 三种用法：
 * ** 不允许任何操作，
 * ** 只允许操作某个元素：turnOn(元素id)/Off
 * ** 点击任何地方都关闭： startClickOtherPlaceToClose
 */
var TQ = TQ || {};
TQ.OverlayMask = (function () {
  var operations = ['touch', 'touchstart', 'click'],
    _isOn = false,
    _operateElementId,
	      _promptOnClick;

  return {
    isOn : function () {return _isOn;},
    startClickOtherPlaceToClose: startClickOtherPlaceToClose,
	      startClickAnywhereToClose: startClickAnywhereToClose,
    turnOn: turnOn,
    turnOff: turnOff
  };

  function turnOn(operateElementId, promptOnClick) {
    _operateElementId = operateElementId;
    _isOn = true;
    _promptOnClick = promptOnClick;
    startClickOtherPlaceToClose(operateElementId);
  }

  function turnOff() {
    _operateElementId = null;
    _isOn = false;
    operations.forEach(function (op) {
      document.removeEventListener(op, onTouch);
    });
  }

  function startClickAnywhereToClose(onClickToClose) {
	    return startClickOtherPlaceToClose('no-object-defined', onClickToClose)
  }

  function startClickOtherPlaceToClose(operateElementId, onClickToClose) {
    _operateElementId = operateElementId;
    _onClickToClose = onClickToClose;
    operations.forEach(function (op) {
      document.addEventListener(op, onTouch);
    });
  }

  function onTouch(event) {
    if (event) {
      if (isChildElement(_operateElementId, event.target)) {
        return;
      }

      event.preventDefault();
      if (event.stopPropagation) { // ng broadcast 的event，没有此函数
        event.stopPropagation();
      }
      if (_onClickToClose) {
        turnOff();
        _onClickToClose();
      } else if (_promptOnClick) {
            	TQ.MessageBubble.toast(_promptOnClick);
      }
    }
  }

  function isChildElement(elementId, target) {
    for (; target && (target.nodeName !== 'BODY'); target = target.parentElement) {
      if (target.id === elementId) {
        return true;
      }
    }

    return false;
  }
})();
