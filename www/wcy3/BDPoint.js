window.TQ = window.TQ || {};
(function() {
function BDPoint(x, y) {
    assertDepreciated(TQ.Dictionary.isDepreciated); // 改用createjs.Point.js, 从V1.5开始
    this.x = x;
    this.y = y;
}

    TQ.BDPoint = BDPoint;
}());