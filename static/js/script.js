(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var graphics = require('./graphics');
var physics = require('./physics');
var Vector = require('./vector');
var Input = require('./input');

var testObject = {}
new physics.AABB( testObject, new Vector( 5,5 ), new Vector( 10,10 ) );
new physics.PhysObject( testObject );
new graphics.Sprite( testObject, "static/images/diver.png" );

var ctx = null,
    then = 0,
    input;
window.onload = function() {
  var canvas = document.createElement("canvas");
  ctx = canvas.getContext( "2d" );
  canvas.width = 800;
  canvas.height = 600;
  document.body.appendChild( canvas );

  input = new Input( window );

  then = Date.now();
  //testObject.physics.force( new Vector( 100, 0 ) );

  main();
}

// Cross-browser support for requestAnimationFrame
var w = window;
requestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame;

function main() {
  var now = Date.now();
  var dt = (now - then) / 1000;

  if( input.isKeyDown( 40 ) ) {
    testObject.physics.force( new Vector( 0, 1 ) );
  }

  if( input.isKeyDown( 38 ) ) {
    testObject.physics.force( new Vector( 0, -1 ) );
  }

  if( input.isKeyDown( 39 ) ) {
    testObject.physics.force( new Vector( 1, 0 ) );
  }

  if( input.isKeyDown( 37 ) ) {
    testObject.physics.force( new Vector( -1, 0 ) );
  }

  if( testObject.physics.velocity.magnitude_sq() > 45 * 45 ) {
    testObject.physics.velocity = testObject.physics.velocity.set_magnitude( 45 );
  }
  
  //testObject.aabb.move( new Vector( 1,0 ) );
  physics.physicsLoop( dt );
  graphics.drawLoop( ctx );

  then = now;

  requestAnimationFrame( main );
}

},{"./graphics":2,"./input":3,"./physics":4,"./vector":5}],2:[function(require,module,exports){
function clearCtx( ctx ) {
  ctx.fillStyle = "black";
  ctx.fillRect( 0,0, ctx.canvas.width, ctx.canvas.height );
}

function drawLoop( ctx ) {
  clearCtx( ctx );
  G_SpriteList.forEach( function( sprite ) {
    sprite.draw( ctx );
  } );
}

/******************************************************************************
                              Sprite
******************************************************************************/
var G_SpriteList = [];

function Sprite( gameObj,src ) {
  this.transform = gameObj.transform || gameObj.aabb || null
  if ( !this.transform ) return console.error( "Attempted to initialize a sprite without a transform property" );
  this.parent = gameObj;
  gameObj.sprite = this;

  this.ready = false;

  this.image = new Image();
  this.image.onload = (function() {
    this.ready = true;
  }).bind( this );
  this.image.src = src;
  if ( this.transform.diagonal ) {
    this.image.width = this.transform.diagonal.x;
    this.image.height = this.transform.diagonal.y;
  }

  G_SpriteList.push( this );
}

Sprite.prototype.draw = function( ctx ) {
  if ( this.ready ) {
    var posvec = this.transform.topleft ? this.transform.topleft() : this.transform.pos;
    ctx.drawImage( this.image, posvec.x, posvec.y );
    return true;
  }
  return false;
}

module.exports = {
  drawLoop: drawLoop,
  Sprite: Sprite
}

},{}],3:[function(require,module,exports){

/******************************************************************************
                            InputManager
******************************************************************************/
function InputManager( w ) {
  this.keyspressed = {};
  this.bindsOnPress = {};
  this.bindsOnRelease = {};

  w.addEventListener( "keydown", this.pressKey.bind( this ), false );
  w.addEventListener( "keyup", this.releaseKey.bind( this ), false );
}

InputManager.prototype.pressKey = function( key ) {
  key = key.keyCode;
  this.keyspressed[key] = true;

  if ( this.bindsOnPress[key] ) this.bindsOnPress[key].forEach( function( bind ) {
    bind.call( null, this );
  } );
}

InputManager.prototype.releaseKey = function( key ) {
  key = key.keyCode;
  delete this.keyspressed[key];

  if ( this.bindsOnRelease[key] ) this.bindsOnRelease[key].forEach( function( bind ) {
    bind.call( null, this );
  } );
}

InputManager.prototype.addBindOnPress = function( key, bind ) {
  this.bindsOnPress[key] ? this.bindsOnPress[key].push( bind ) : this.bindsOnPress[key] = [bind];
}

InputManager.prototype.addBindOnRelease = function( key, bind ) {
  this.bindsOnRelease[key] ? this.bindsOnRelease[key].push( bind ) : this.bindsOnRelease[key] = [bind];
}

InputManager.prototype.isKeyDown = function( key, bind ) {
  return !!this.keyspressed[key];
}

module.exports = InputManager;

},{}],4:[function(require,module,exports){
var Vector = require( './vector' );

function physicsLoop( dt ) {
  G_PhysicsObjects.forEach( function( phys ) {
    var newvel = phys.velocity.scalar_mul( dt );
    var newpos = phys.transform.pos.add( newvel );
    phys.transform.setPos( newpos );

    //phys.transform.velocity = 
  } );
}

var G_PhysicsObjects = [];
function PhysObject( gameObj ) {
  this.transform = gameObj.aabb || gameObj.transform || null;
  if ( !this.transform ) return console.error( "Tried to create a physics object with no transform" );

  this.parent = gameObj;
  gameObj.physics = this;

  this.velocity = new Vector( 0, 0 );

  G_PhysicsObjects.push( this );
}

PhysObject.prototype.force = function( vec ) {
  this.velocity = this.velocity.add( vec );
} 

/******************************************************************************
                                Transform
******************************************************************************/
function Transform( gameObj, x, y ) {
  this.setPos( x, y );
  this.velocity = new Vector( 0,0 );

  this.parent = gameObj;
  if ( gameObj ) gameObj.transform = this;
}

Transform.prototype.setPos = function( x, y ) {
  if ( x.__proto__ && x.__proto__.constructor === Vector ) {
    this.pos = x;
  } else {
    this.pos = new Vector( x, y );
  }
}

Transform.prototype.move = function( x, y ) {
  if ( x.__proto__ && x.__proto__.constructor === Vector ) {
    this.pos = this.pos.add( x );
  } else {
    this.pos = this.pos.add( new Vector( x, y ) );
  }
}


/******************************************************************************
                                  AABB
******************************************************************************/
function AABB( gameObj, topleft, botright ) {
  this.diagonal = topleft.sub( botright );
  this.half_diagonal = this.diagonal.scalar_mul( 0.5 );
  var midpoint = topleft.add( this.half_diagonal );
  Transform.call( this, gameObj, midpoint );

  if ( gameObj ) gameObj.aabb = this;
}

AABB.prototype = Object.create( Transform.prototype );
AABB.prototype.constructor = AABB;

AABB.prototype.topleft = function() {
  return this.pos.sub( this.half_diagonal );
}

AABB.prototype.botright = function() {
  return this.pos.add( this.half_diagonal );
}

module.exports = {
  physicsLoop: physicsLoop,
  PhysObject: PhysObject,
  Transform: Transform,
  AABB: AABB
}

},{"./vector":5}],5:[function(require,module,exports){
// Vector
// a vector is (for our sake) a 2D array with an x and y position and magnitude
function Vector ( x, y, z ) {
  this.x = x;
  this.y = y;
  this.z = z ? z : 1; // if z is 1, it's a vector, else it's a point
}

// Vector.prototype.add
// adds two vectors and returns a new vector with the sum of their parts.
Vector.prototype.add = function( rhs ) {
  var new_vec = new Vector(
    this.x + rhs.x,
    this.y + rhs.y,
    1
  );
  return new_vec;
}

// Vector.prototype.sub
// subtracts two vectors and returns a new vector with the sum of their parts.
// used to compute distance between two vectors.
Vector.prototype.sub = function( rhs ) {
  var new_vec = new Vector(
    this.x - rhs.x,
    this.y - rhs.y,
    1
  );
  return new_vec;
}

// Vector.prototype.scalar_mul
// multiplies the x and y values of a vector by some scalar.
Vector.prototype.scalar_mul = function( s ) {
  var new_vec = new Vector(
    this.x * s,
    this.y * s,
    this.z
  );
  return new_vec;
}

// Vector.prototype.distance
// computes the distance between two vectors. can be run in fast mode to get an
// approximate distance instead.
Vector.prototype.distance = function( rhs, fast ) {
  if ( fast ) return this.sub( rhs ).magnitude_fast();
  return this.sub( rhs ).magnitude();
}

// Vector.prototype.magnitude
// computes the magnitude of a vector.
Vector.prototype.magnitude = function() {
  return Math.sqrt( this.magnitude_sq() );
}

// Vector.prototype.magnitude_fast
// inaccurately (but quickly) computes the magnitude of a vector.
Vector.prototype.magnitude_fast = function( turbo ) {
  // see also http://www.claysturner.com/dsp/FastMagnitude.pdf
  // in turbo mode, an even greater margin of error is used
  var alpha = turbo ? 1 : 0.947543;
  var beta = turbo ? 0.25 : 0.392485;
  var r = alpha * Math.max( Math.abs( this.x ), Math.abs( this.y ) ) 
    + beta * Math.min( Math.abs( this.x ), Math.abs( this.y ) );
  return r;
}

Vector.prototype.magnitude_sq = function() {
  if ( this.z === 0 ) return 0;
  return this.x * this.x + this.y * this.y;
}

// Vector.prototype.normalize
// normalizes a vector (sets its magnitude to 1). 
Vector.prototype.normalize = function() {
  var mag = this.magnitude();
  var new_vec = new Vector(
    this.x / mag,
    this.y / mag,
    1
  );
  return new_vec;
}

// Vector.prototype.set_magnitude
// sets the magnitude of a vector. this is really expensive pls don't do it.
Vector.prototype.set_magnitude = function( mag ) {
  var new_vec = this.normalize();
  return new_vec.scalar_mul( mag );
}

// Vector.prototype.midpoint
// returns a new vector with its x and y at the midpoint of a vector.
Vector.prototype.midpoint = function() {
  var new_vec = this.scalar_mul( 0.5 );
  return new_vec;
}

// Vector.prototype.angle
// returns the angle of a vector
// TODO: write this function



module.exports = Vector;

},{}]},{},[1]);