define(['module', './gamemeta.js'], function (module, gameMeta) {
  "use strict";

  // Player control
  if (CLIENT) {

    document.addEventListener('keydown', function (event) {
      if (!global.localPlayer) {
        return;
      }

      if (event.which == 38) {
        localPlayer.localMove.forward = true;
      } else if (event.which == 40) {
        localPlayer.localMove.backward = true;
      } else if (event.which == 37) {
        localPlayer.localMove.left = true;
      } else if (event.which == 39) {
        localPlayer.localMove.right = true;
      }
    });

    document.addEventListener('keyup', function (event) {
      if (!localPlayer) {
        return;
      }

      if (event.which == 38) {
        localPlayer.localMove.forward = false;
      } else if (event.which == 40) {
        localPlayer.localMove.backward = false;
      } else if (event.which == 37) {
        localPlayer.localMove.left = false;
      } else if (event.which == 39) {
        localPlayer.localMove.right = false;
      }
    });
  }

  class Player extends THREE.Object3D {
    constructor() {
      super();

      this.entId = null;
      this.dynamic = true;

      if (CLIENT) {
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

      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      var cube = new THREE.Mesh(geometry, material);
      cube.position.z += 1;
      this.add(cube);
    }

    update(delta) {

      var move = this.syncedVars.move;

      if (CLIENT) {
        if (this == localPlayer) {
          move = this.localMove;
          primus.write({ type: 'usermove', tick: game.currentTick, move: this.localMove });
          // console.log("move");
        }
      }

      var collide = false;
      game.traverse(entity => {
        if (entity == this || collide || !entity.dynamic) {
          return;
        }

        var distance = entity.position.distanceTo(this.position);

        var push = new THREE.Vector3().subVectors(entity.position, this.position);
        push.normalize();
        push.multiplyScalar(2 * delta);

        // opposite push
        var opush = push.clone();
        opush.multiplyScalar(-1);

        if (distance == 0) {
          entity.position.add(new THREE.Vector3(1, 1, 0));
        }

        if (distance < 1) {
          entity.position.add(push);
          collide = true;
        }
      });

      if (collide) {
        return;
      }

      if (move.forward) {
        this.position.x += Math.cos(this.rotation.z) * 2 * delta;
        this.position.y += Math.sin(this.rotation.z) * 2 * delta;
      }

      if (move.backward) {
        this.position.x -= Math.cos(this.rotation.z) * 2 * delta;
        this.position.y -= Math.sin(this.rotation.z) * 2 * delta;
      }

      if (move.left) {
        this.rotation.z += 3 * delta;
      }

      if (move.right) {
        this.rotation.z -= 3 * delta;
      }
    }
  }

  gameMeta.registerClass("Player", Player);
  module.exports = Player;
});
//# sourceMappingURL=player.js.map
