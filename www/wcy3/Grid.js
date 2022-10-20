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