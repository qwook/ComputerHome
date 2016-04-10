"use strict"

require('../lib/chat.js');

var GameScene = require('../lib/gamescene.js');
var scene = new GameScene();

var camera = new THREE.PerspectiveCamera( 75, 1, 0.001, 1000 );
camera.position.z = 3;
camera.position.y = -3;
camera.rotation.set(1, 0, 0);

// Set up rendering with THREEjs
var renderer = new THREE.WebGLRenderer({canvas: document.getElementById('game')});
renderer.setSize( 500, 500 );

function render() {
  requestAnimationFrame( render );
  renderer.render( scene, camera );
}
render();

primus.open();
