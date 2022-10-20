this.createjs = this.createjs || {};

(function () {

  var BaseParticle = function (particleObject) {

    this.initialize(particleObject);
  };
  var p = BaseParticle.prototype;

  // ** PUBLIC PROPERTIES
  p.debugMode = true;
  p.originX = 0;
  p.originY = 0;
  p.velocityX = 0;                //pixels per second
  p.velocityY = 0;                //pixels per second
  p.linearVelocityX = 0;          //pixels per second
  p.linearVelocityY = 0;          //pixels per second
  p.radialVelocity = 0;           //pixels per second, 角速度
  p.tangentalVelocity = 0;        //pixels per second，切线速度， 切线方向随物体的旋转而改变
  p.radialAcceleration = 0;       //pixels per second per second
  p.tangentalAcceleration = 0;    //pixels per second per second
  p.linearAccelerationX = 0;      //pixels per second per second
  p.linearAccelerationY = 0;      //pixels per second per second
  p.particleBaseId = 0;

  // ** PRIVATE PROPERTIES:
  p._lastUpdateTimeMs = 0;

  // ** CONSTRUCTOR:
  p.initialize = function (particleObject) {

    this._particleObject = particleObject;
  };

  // ** PUBLIC METHODS:
  p.initializeProperties = function (id) {
    this.particleBaseId = id;
  };

  p.updateParticle = function (ctx) {

    var currentTimeMs = createjs.Ticker.getTime();

    if (!TQ.FrameCounter.isPlaying()) {
      currentTimeMs = this._lastUpdateTimeMs;
    }

    this.updatePosition(currentTimeMs);
  };

  p.updatePosition = function (currentTimeMs) {

    var diffTimeMs = currentTimeMs - this._lastUpdateTimeMs;
    var fractionTime = diffTimeMs / 1000;

    if (this._lastUpdateTimeMs <= 0) {
      this._lastUpdateTimeMs = currentTimeMs;
      return;
    }

    this.velocityX = 0;
    this.velocityY = 0;

    // Process accelerations
    this._processLinearAcceleration(fractionTime);
    this._processRadialAcceleration(fractionTime);
    this._processTangentalAcceleration(fractionTime);

    // Process velocitys
    this._processLinearVelocity(fractionTime);
    this._processRadialAndTangentalVelocity(fractionTime);

    // Update position
    this._processVelocity();
    this._lastUpdateTimeMs = currentTimeMs;
  };

  // ** PRIVATE METHODS:
  p._processLinearAcceleration = function (fractionTime) {
    var accelerationTickX = this.linearAccelerationX * fractionTime;
    var accelerationTickY = this.linearAccelerationY * fractionTime;

    this.linearVelocityX += accelerationTickX;
    this.linearVelocityY += accelerationTickY;
  };

  p._processRadialAcceleration = function (fractionTime) {
    var radialAceelerationTick = this.radialAcceleration * fractionTime;

    this.radialVelocity += radialAceelerationTick;
  };

  p._processTangentalAcceleration = function (fractionTime) {
    var tangentalAceelerationTick = this.tangentalAcceleration * fractionTime;

    this.tangentalVelocity += tangentalAceelerationTick;
  };

  p._processLinearVelocity = function (fractionTime) {

    var velocityTickY = this.linearVelocityY * fractionTime;
    var velocityTickX = this.linearVelocityX * fractionTime;

    this.velocityX += velocityTickX;
    this.velocityY += velocityTickY;
  };

  p._processRadialAndTangentalVelocity = function (fractionTime) {

    var center = this._getParticleCenter();
    var deltaY = this.originY - center.y;
    var deltaX = this.originX - center.x;
    var angle = Math.atan2(deltaY, deltaX);

    this._processRadialVelocity(fractionTime, angle);
    this._processTangentalVelocity(fractionTime, angle);
  };

  p._processRadialVelocity = function (fractionTime, angle) {

    var velocityTickX = this.radialVelocity * fractionTime * Math.cos(angle);
    var velocityTickY = this.radialVelocity * fractionTime * Math.sin(angle);

    this.velocityX += velocityTickX;
    this.velocityY += velocityTickY;
  };

  p._processTangentalVelocity = function (fractionTime, angle) {

    var velocityTickX = this.tangentalVelocity * fractionTime * Math.cos(angle - (Math.PI / 2));
    var velocityTickY = this.tangentalVelocity * fractionTime * Math.sin(angle - (Math.PI / 2));

    this.velocityX += velocityTickX;
    this.velocityY += velocityTickY;
  };

  p._processVelocity = function () {

    this._particleObject.x += this.velocityX;
    this._particleObject.y += this.velocityY;
  };

  p._getParticleCenter = function () {

    var center = {
      x: this._particleObject.x,
      y: this._particleObject.y
    };

    return center;
  };

  p._debugText = function (text) {
    if (this.debugMode) {
      TQ.Log.debugInfo(text);
    }
  };

  // ** PRIVATE EVENT HANDLERS:

  createjs.BaseParticle = BaseParticle;
}());
