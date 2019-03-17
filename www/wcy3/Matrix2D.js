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

    Matrix2D.mirrorX = function () {
      return Matrix2D.scale(1, -1);
    };

    Matrix2D.mirrorY = function () {
      return Matrix2D.scale(-1, 1);
    };
    Matrix2D.mirrorXY = function () {
      return Matrix2D.scale(-1, -1);
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

    Matrix2D.angle360 = function(matrix2D) {
      var vec3 = TQ.Vector2D.create([1, 0, 0]), //X轴，忽略其次坐标
        rotatedVec3 = matrix2D.multiply(vec3),
        rotatedVec2 = TQ.Vector2D.create([rotatedVec3.elements[0], rotatedVec3.elements[1]]);
      return rotatedVec2.angle360();
    };

  TQ.Matrix2D = Matrix2D;
}());
