"use strict"

require('../lib/chat.js');
require('../lib/timesync.js');

var GameScene = require('../lib/gamescene.js');
var scene = new GameScene();

var camera = new THREE.PerspectiveCamera( 75, 1, 0.001, 1000 );
camera.position.z = 3;
camera.position.y = -3;
camera.rotation.set(1, 0, 0);
global.camera = camera;

var projector = new THREE.Projector()
global.projector = projector;

// todo: have util functions
global.calc3Dto2D = function (vector) {
  return vector.clone().project(camera);
}

global.canvas = document.getElementById('game');

// Set up rendering with THREEjs
var renderer = new THREE.WebGLRenderer({canvas: canvas});
renderer.setSize( 500, 500 );

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();

primus.open();
