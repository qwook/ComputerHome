"use strict"

global.SERVER = true;
global.CLIENT = false;

// ThreeJS
var THREE = require('../bower_components/three.js/build/three.js');
global.THREE = THREE;

// Express
var express = require('express');
var app = express();

app.use(express.static('public'));
app.use(express.static('bower_components'));
app.use(express.static('build'));

// Primus
var Primus = require('primus');

var server = require('http').createServer(app);
var primus = new Primus(server, {'transformer': 'sockjs'});
global.primus = primus;

server.listen(process.env.PORT || 3000, function () {
  console.log('Listening on port 3000!');
});

var network = new THREE.EventDispatcher();
global.network = network;

var i = 0;

primus.on('connection', function (spark) {

  spark.name = i;
  i++;

  var event = {type: 'connection', spark: spark};
  network.dispatchEvent(event);

  console.log('connection! ' + spark.name);

  spark.on('data', function (event) {
    event.spark = spark;

    if (!event.type) {
      return;
    }

    // network.dispatchEvent(event);
    // setTimeout(function() {
      network.dispatchEvent(event);
    // }, 200);

  })

});

primus.on('disconnection', function (spark) {

  var event = {type: 'disconnection', spark: spark};
  network.dispatchEvent(event);

});

var GameScene = require('../lib/gamescene.js');
require('../lib/chat.js');

var scene = new GameScene();
