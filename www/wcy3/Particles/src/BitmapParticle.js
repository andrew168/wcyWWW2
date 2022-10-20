// NAMESPACE:
this.createjs = this.createjs || {};

(function () {

  // ** ENUMS


  /**
     * A shape particle
     * @constructor
     * @extends createjs.Bitmap
     */
  var BitmapParticle = function (image) {

    this.initialize(image);
  }
  var p = BitmapParticle.prototype = new createjs.Bitmap();

  // ** BASE METHODS
  p.Bitmap_initialise = p.initialize;
  p.Bitmap_draw = p.draw;
  p.Bitmap_updateContext = p.updateContext;

  // ** PUBLIC PROPERTIES:
  p.particleId = 0;

  // ** PRIVATE PROPERTIES:
  p._baseParticle = null;

  // ** CONSTRUCTOR:
  p.initialize = function (image) {
    this.Bitmap_initialise(image);
    this._baseParticle = new createjs.BaseParticle(this);
  };

  // ** PUBLIC METHODS:
  p.initializeProperties = function (id) {
    this.particleId = id;
    this._baseParticle.initializeProperties(id);
  };

  p.updateContext = function (ctx) {
    this._baseParticle.updateParticle();
    this.Bitmap_updateContext(ctx);

  };

  // ** PRIVATE METHODS:

  // ** PRIVATE EVENT HANDLERS:

  createjs.BitmapParticle = BitmapParticle;
}());
