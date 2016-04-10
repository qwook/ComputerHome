define(['module', './gamemeta.js'], function (module, gameMeta) {
  "use strict";

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  // Player control
  if (CLIENT) {
    var canvas;
    var mdown;

    (function () {
      var keyByAngle = function (x, y) {
        var ang = Math.atan2(y - 250 - 10, x - 250 - 10);
        // console.log(ang);

        if (ang < -Math.PI / 3 && ang > -Math.PI * 2 / 3) {
          return 'forward';
        }

        if (ang > Math.PI / 3 && ang < Math.PI * 2 / 3) {
          return 'backward';
        }

        if (ang > -Math.PI * 2 / 3 && ang < Math.PI * 2 / 3) {
          return 'right';
        }

        if (ang < -Math.PI * 2 / 4 || ang > Math.PI * 2 / 4) {
          return 'left';
        }
      };

      var clear = function () {
        for (var k in localPlayer.localMoveTmp) {
          localPlayer.localMoveTmp[k] = false;
        }
      };

      canvas = document.getElementById('game');


      canvas.addEventListener('touchstart', function (event) {
        var key = keyByAngle(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
        clear();
        localPlayer.localMoveTmp[key] = true;
        event.preventDefault();
      });

      canvas.addEventListener('touchmove', function (event) {
        var key = keyByAngle(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
        clear();
        localPlayer.localMoveTmp[key] = true;
        event.preventDefault();
      });

      canvas.addEventListener('touchend', function (event) {
        clear();
        event.preventDefault();
      });

      mdown = false;

      canvas.addEventListener('mousedown', function (event) {
        var key = keyByAngle(event.pageX, event.pageY);
        clear();
        localPlayer.localMoveTmp[key] = true;
        mdown = true;
        event.preventDefault();
      });

      canvas.addEventListener('mousemove', function (event) {
        if (mdown) {
          var key = keyByAngle(event.pageX, event.pageY);
          clear();
          localPlayer.localMoveTmp[key] = true;
        }
        event.preventDefault();
      });

      canvas.addEventListener('mouseup', function (event) {
        console.log('up');
        mdown = false;
        clear();
        event.preventDefault();
      });

      document.addEventListener('keydown', function (event) {
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

      document.addEventListener('keyup', function (event) {
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
    })();
  }

  var Player = function (_THREE$Object3D) {
    _inherits(Player, _THREE$Object3D);

    function Player() {
      _classCallCheck(this, Player);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Player).call(this));

      _this.entId = null;
      _this.dynamic = true;

      if (CLIENT) {
        _this.localMoveTmp = {
          forward: false,
          backward: false,
          left: false,
          right: false
        };

        _this.localMove = {
          forward: false,
          backward: false,
          left: false,
          right: false
        };

        _this.snapshots = {};
      }

      _this.syncedVars = {
        move: {
          forward: false,
          backward: false,
          left: false,
          right: false
        }
      };

      var geometry = new THREE.BoxGeometry(1, 1, 1);
      var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      var cube = new THREE.Mesh(geometry, material);
      cube.position.z += 1;
      _this.add(cube);

      if (CLIENT) {
        var texture = new THREE.TextureLoader().load("danny.jpg");
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        var geometryFace = new THREE.BoxGeometry(0.5, 0.1, 0.5);
        var materialFace = new THREE.MeshBasicMaterial({ color: 0xffffff, map: texture });
        var cubeFace = new THREE.Mesh(geometryFace, materialFace);
        cubeFace.position.y -= 0.5;
        cubeFace.position.z += 1;
        _this.add(cubeFace);
      }

      if (CLIENT) {
        _this.name = document.createElement('div');
        document.body.appendChild(_this.name);
        _this.name.className = 'nametag';
        _this.name.style.position = 'absolute';
        _this.name.style.top = 10 + 'px';
        _this.name.style.left = 10 + 'px';
      }

      _this.addEventListener('removed', function () {
        _this.destroy();
      });
      return _this;
    }

    _createClass(Player, [{
      key: 'destroy',
      value: function destroy() {
        if (CLIENT) {
          this.name.parentNode.removeChild(this.name);
        }
      }
    }, {
      key: 'update',
      value: function update(delta) {
        var _this2 = this;

        var move = this.syncedVars.move;

        if (CLIENT) {
          var namePos3D = this.position.clone();
          namePos3D.z += 2;
          var namePos = calc3Dto2D(namePos3D);
          // console.log(namePos);
          this.name.style.left = Math.floor((namePos.x + 1) / 2 * 500) + 'px';
          this.name.style.top = 500 - Math.floor((namePos.y + 1) / 2 * 500) + 'px';

          if (this == localPlayer) {
            // for (var key in this.localMoveTmp) {
            //   this.localMove[key] = this.localMoveTmp[key];
            // }
            move = this.localMove;
          }
        }

        var collide = false;
        game.traverse(function (entity) {
          if (entity == _this2 || collide || !entity.dynamic) {
            return;
          }

          var distance = entity.position.distanceTo(_this2.position);

          var push = new THREE.Vector3().subVectors(entity.position, _this2.position);
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
          this.position.x += Math.cos(this.rotation.z - Math.PI / 2) * 5 * delta;
          this.position.y += Math.sin(this.rotation.z - Math.PI / 2) * 5 * delta;
        }

        if (move.backward) {
          this.position.x -= Math.cos(this.rotation.z - Math.PI / 2) * 5 * delta;
          this.position.y -= Math.sin(this.rotation.z - Math.PI / 2) * 5 * delta;
        }

        if (move.left) {
          this.rotation.z += 4 * delta;
        }

        if (move.right) {
          this.rotation.z -= 4 * delta;
        }
      }
    }]);

    return Player;
  }(THREE.Object3D);

  gameMeta.registerClass("Player", Player);
  module.exports = Player;
});
//# sourceMappingURL=player.js.map
