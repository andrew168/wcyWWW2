/**
 * Created by Andrewz on 3/7/19.
 */

(function () {
  var p = createjs.Container.prototype;
  // 覆盖原函数
  p.setChildIndex = function (child, index) {
    var kids = this.children, l = kids.length;
    if (child.parent != this || index < 0 || index >= l) {
      return;
    }
    for (var i = 0; i < l; i++) {
      if (kids[i] == child) {
        break;
      }
    }
    if (i == l || i == index) {
      return;
    }
    kids.splice(i, 1);
    // if (index>i) { index--; }, 不需要, 因为正好要插入到index指定的位置, 绝对位置. 与kids中的内容没有关系
    kids.splice(index, 0, child);
  };
}());
