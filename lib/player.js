"use strict"

var gameMeta = require('./gamemeta.js');

// Player control
if (CLIENT) {

  function keyByAngle(x, y) {
    var ang = Math.atan2(y-250-10, x-250-10);
    // console.log(ang);

    if (ang < -Math.PI/3 && ang > -Math.PI*2/3) {
      return 'forward';
    }

    if (ang > Math.PI/3 && ang < Math.PI*2/3) {
      return 'backward';
    }

    if (ang > -Math.PI*2/3 && ang < Math.PI*2/3) {
      return 'right';
    }

    if (ang < -Math.PI*2/4 || ang > Math.PI*2/4) {
      return 'left';
    }
  }

  var canvas = document.getElementById('game');

  function clear() {
    for (var k in localPlayer.localMoveTmp) {
      localPlayer.localMoveTmp[k] = false;
    }
  }

  canvas.addEventListener('touchstart', function(event) {
    var key = keyByAngle(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    clear();
    localPlayer.localMoveTmp[key] = true;
    event.preventDefault();
  });

  canvas.addEventListener('touchmove', function(event) {
    var key = keyByAngle(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    clear();
    localPlayer.localMoveTmp[key] = true;
    event.preventDefault();
  });

  canvas.addEventListener('touchend', function(event) {
    clear();
    event.preventDefault();
  });

  var mdown = false;
  canvas.addEventListener('mousedown', function(event) {
    var key = keyByAngle(event.pageX, event.pageY);
    clear();
    localPlayer.localMoveTmp[key] = true;
    mdown = true;
    event.preventDefault();
  });

  canvas.addEventListener('mousemove', function(event) {
    if (mdown) {
      var key = keyByAngle(event.pageX, event.pageY);
      clear();
      localPlayer.localMoveTmp[key] = true;
    }
    event.preventDefault();
  });

  canvas.addEventListener('mouseup', function(event) {
    console.log('up');
    mdown = false;
    clear();
    event.preventDefault();
  });

  document.addEventListener('keydown', function(event) {
    if (!global.localPlayer) {
      return;
    }

    if (event.which == 38) {
      localPlayer.localMoveTmp.forward = true;
      event.preventDefault();
    } else if (event.which == 40) {
      localPlayer.localMoveTmp.backward = true;
      event.preventDefault();
    } else if (event.which == 37) {
      localPlayer.localMoveTmp.left = true;
      event.preventDefault();
    } else if (event.which == 39) {
      localPlayer.localMoveTmp.right = true;
      event.preventDefault();
    }

  });

  document.addEventListener('keyup', function(event) {
    if (!global.localPlayer) {
      return;
    }

    if (event.which == 38) {
      localPlayer.localMoveTmp.forward = false;
    } else if (event.which == 40) {
      localPlayer.localMoveTmp.backward = false;
    } else if (event.which == 37) {
      localPlayer.localMoveTmp.left = false;
    } else if (event.which == 39) {
      localPlayer.localMoveTmp.right = false;
    }

    event.preventDefault();
  });
 
}

class Player extends THREE.Object3D {
  constructor() {
    super();

    this.entId = null;
    this.dynamic = true;

    if (CLIENT) {
      this.localMoveTmp = {
        forward: false,
        backward: false,
        left: false,
        right: false
      };

      this.localMove = {
        forward: false,
        backward: false,
        left: false,
        right: false
      };

      this.snapshots = {};
    }

    this.syncedVars = {
      move: {
        forward: false,
        backward: false,
        left: false,
        right: false
      }
    };

    this.oldPosition = new THREE.Vector3();
    this.oldRotation = new THREE.Quaternion();

    this.netPosition = new THREE.Vector3();
    this.netRotation = new THREE.Euler();

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.z += 0.5;
    this.add( cube );

    if (CLIENT) {
      var texture = new THREE.TextureLoader().load( "danny.jpg" );
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      var geometryFace = new THREE.BoxGeometry( 0.5, 0.1, 0.5 );
      var materialFace = new THREE.MeshLambertMaterial( { color: 0xffffff, map: texture } );
      var cubeFace = new THREE.Mesh( geometryFace, materialFace );
      cubeFace.position.y -= 0.5;
      cubeFace.position.z += 0.8;
      this.add( cubeFace );

      material.map = texture;
    }

    if (CLIENT) {
      this.name = document.createElement('div');
      document.body.appendChild(this.name);
      this.name.className = 'nametag';
      this.name.style.position = 'absolute';
      this.name.style.top = 10 + 'px';
      this.name.style.left = 10 + 'px';
    }

    this.addEventListener('removed', () => {
      this.destroy();
    })
  }

  destroy() {
    if (CLIENT) {
      this.name.parentNode.removeChild(this.name);
    }
  }

  update(delta) {

    var move = this.syncedVars.move;

    if (CLIENT) {
      var namePos3D = this.position.clone();
      namePos3D.z += 2;
      var namePos = calc3Dto2D(namePos3D);
      // console.log(namePos);
      this.name.style.left = Math.floor((namePos.x+1)/2*500) + 'px';
      this.name.style.top = (500-Math.floor((namePos.y+1)/2*500)) + 'px';

      // if (this == localPlayer) {        
        // for (var key in this.localMoveTmp) {
        //   this.localMove[key] = this.localMoveTmp[key];
        // }
        move = this.localMove;
      // }
    }

    var collide = false;
    game.traverse((entity) => {
      if (entity == this || collide || !entity.dynamic) {
        return;
      }

      var distance = entity.position.distanceTo(this.position);

      var push = new THREE.Vector3().subVectors(entity.position, this.position);
      push.normalize();
      push.multiplyScalar(2*delta);

      // opposite push
      var opush = push.clone();
      opush.multiplyScalar(-1);

      if (distance == 0) {
        entity.position.add(new THREE.Vector3(1,1,0));
      }

      if (distance < 1) {
        entity.position.add(push);
        collide = true;
      }
    })

    if (collide) {
      return;
    }

    if (move.forward) {
      this.position.x += Math.cos(this.rotation.z-Math.PI/2) * 5 * delta;
      this.position.y += Math.sin(this.rotation.z-Math.PI/2) * 5 * delta;

    }

    if (move.backward) {
      this.position.x -= Math.cos(this.rotation.z-Math.PI/2) * 5 * delta;
      this.position.y -= Math.sin(this.rotation.z-Math.PI/2) * 5 * delta;
    }

    if (move.left) {
      this.rotation.z += 4 * delta;
    }

    if (move.right) {
      this.rotation.z -= 4 * delta;
    }

  }
}

gameMeta.registerClass("Player", Player)
module.exports = Player;
