// NAMESPACE:
this.createjs = this.createjs || {};

(function () {

    /**
     * A shape particle
     * @constructor
     * @extends createjs.Shape
     */
    var ShapeParticle = function () {

        this.initialize();
    };
    var p = ShapeParticle.prototype = new createjs.Shape();

    // ** BASE METHODS
    p.Shape_initialise = p.initialize;
    p.Shape_draw = p.draw;
    p.Shape_updateContext = p.updateContext;

    // ** PUBLIC PROPERTIES:
    p.particleId = 0;

    // ** PRIVATE PROPERTIES:
    p._baseParticle = null;

    // ** CONSTRUCTOR:
    p.initialize = function () {
        this.Shape_initialise();
        this._baseParticle = new createjs.BaseParticle(this);
    };

    // ** PUBLIC METHODS:
    p.initializeProperties = function (id) {
        this.particleId = id;
        this._baseParticle.initializeProperties(id);
    };

    p.updateContext = function (ctx) {
        this.Shape_updateContext(ctx);
        this._baseParticle.updateParticle();
    };

    // ** PRIVATE METHODS:

    // ** PRIVATE EVENT HANDLERS:

    createjs.ShapeParticle = ShapeParticle;
}());