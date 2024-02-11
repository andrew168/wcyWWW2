/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 选择集: 所有的操作都是基于选择集的
 */

TQ = TQ || {};
TQ.UI = TQ.UI || {};

(function() {
  var SelectSetUI = {};
  SelectSetUI.initialize = function() {
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
  };
  TQ.SelectSetUI = SelectSetUI;
}());
