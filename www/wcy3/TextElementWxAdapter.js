/**
 * Created by Andrewz on 1/31/18.
 */
var TQ = TQ || {};
TQ.TextElementWxAdapter = (function() {
  return {
    detectFontSizeFactor: detectFontSizeFactor,
    cssFontSizeFactor: -1
  };

  function detectFontSizeFactor() {
    if (TQ.TextElementWxAdapter.cssFontSizeFactor > -1) {
      return;
    }
    var stdTextDomEle = createElement200(document.body, "div", 200);
    cssFontSize200 = TQ.Utility.getCssSize(window.getComputedStyle(stdTextDomEle).fontSize);
    cssFontSizeFactor = 200 / cssFontSize200;
    document.body.removeChild(stdTextDomEle);
    TQ.TextElementWxAdapter.cssFontSizeFactor = cssFontSizeFactor;
  }

  function createElement200(parent, tag, fontSize) {
    var ele = document.createElement(tag);
    ele.style.visibility = "hidden";
    ele.style.fontSize = fontSize + "px";

    if (parent) {
      parent.appendChild(ele);
    }

    return ele;
  }
}());
