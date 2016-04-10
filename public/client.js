
window.global = window;
var global = window;

global.SERVER = false;
global.CLIENT = true;

var primus = new Primus('http://localhost:3000/');
global.primus = primus;

var network = new THREE.EventDispatcher();
global.network = network;

primus.on('open', function () {
  var event = {type: 'connection', spark: primus};
  network.dispatchEvent(event);
});

primus.on('data', function (event) {
  event.spark = primus;
  network.dispatchEvent(event);
});
