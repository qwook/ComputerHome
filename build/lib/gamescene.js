define(['module', './gamemeta.js', './player.js'], function (module, gameMeta, Player) {
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

  var TICKRATE = 20;
  var SNAPSHOTS = 100;
  var SNAPSHOT_SEND_MOD = 10;

  if (CLIENT) {
    SNAPSHOTS = 100;
  }

  var GameScene = function (_THREE$Scene) {
    _inherits(GameScene, _THREE$Scene);

    function GameScene() {
      _classCallCheck(this, GameScene);

      var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GameScene).call(this));

      global.game = _this;

      _this.entityIdCount = 0;
      _this.entityMap = {}; // entityId -> entityObject

      _this.startTime = 0;
      _this.currentTick = 0;
      _this.offsetTick = 0;

      _this.snapshots = [];
      _this.snapshotMap = {}; // optimization

      _this.autoUpdate = false;

      /* Start ticking on the server! */
      if (SERVER) {

        // todo: replace this with a more accurate interval function
        _this.startTime = new Date().getTime();
        _this.currentTick = 0;
        _this.lastTick = _this.currentTick;
        var interval = function () {

          _this.currentTick = _this.calculateTick();
          var _oldTick = _this.currentTick;

          if (_this.currentTick != _this.lastTick) {

            // console.log(this.currentTick);
            // console.log((new Date()).getTime());

            var _currentTick = _this.currentTick;

            _this.replaySnapshots();

            var c = 0;
            for (var i = _this.lastTick + 1; i <= _currentTick; i++) {
              c++;
              if (c > 10) break;

              _this.currentTick = i;

              _this.update(TICKRATE / 1000);
              _this.pushSnapshot();

              if (i % SNAPSHOT_SEND_MOD == 0) {
                // setTimeout(() => {
                var last = _this.snapshots.length - 30;
                if (last < 0) {
                  last = 0;
                }
                var oldSnapshot = _this.snapshots[last];
                primus.write({
                  type: 'tick',
                  tick: oldSnapshot.timestamp,
                  snapshot: oldSnapshot
                });
                // }, 15);
              }
            }
          }

          _this.lastTick = _oldTick;

          setImmediate(interval);
        };
        interval();

        // Someone has connected! Give them a player entity.
        network.addEventListener('connection', function (event) {
          var playerId = _this.getNewId();
          var player = new Player();
          _this.addEntId(player, playerId);

          event.spark.entId = playerId;
          event.spark.write({ type: 'possess', entId: playerId });
          event.spark.write({ type: 'initialTick', startTime: _this.startTime, realTimeStamp: new Date().getTime() });

          delete _this.snapshots;
          delete _this.snapshotMap;

          _this.snapshots = [];
          _this.snapshotMap = {};
        });

        network.addEventListener('disconnection', function (event) {
          var entity = _this.findEntityById(event.spark.entId);
          if (entity) {
            _this.remove(entity);
          }
        });

        // network.addEventListener('syncTick1', (event) => {
        //   event.spark.write({type: 'syncTick1', realTimeStamp: (new Date()).getTime(), tick: this.currentTick});
        // });

        network.addEventListener('usersnapshot', function (event) {

          // var snapshotMap = {};

          for (var i in event.snapshots) {
            var snapshot = event.snapshots[i];
            // snapshotMap[snapshot.timestamp] = snapshot.move;

            if (_this.snapshotMap[snapshot.timestamp] && event.spark.entId && _this.snapshotMap[snapshot.timestamp].entities[event.spark.entId] && _this.snapshotMap[snapshot.timestamp].entities[event.spark.entId].vars) {
              _this.snapshotMap[snapshot.timestamp].entities[event.spark.entId].vars.move = snapshot.move;
            } else {
              // console.log("invalid input" + snapshot.timestamp + " " + this.currentTick);
            }
          }

          // var entity = this.findEntityById(event.spark.entId);
          // if (entity) {
          //   entity.snapshotMap = snapshotMap;
          // }
        });
      }

      if (CLIENT) {

        _this.lastSnapshotTimestamp = 0;

        // Possess a local player!
        network.addEventListener('possess', function (event) {
          var entity = _this.findEntityById(event.entId);
          if (!entity) {
            entity = new Player();
            _this.addEntId(entity, event.entId);
          }

          entity.entId = event.entId;
          global.localPlayer = entity;
        });

        network.addEventListener('initialTick', function (event) {

          _this.startTime = event.startTime;
          _this.currentTick = _this.calculateTick();
          _this.lastTick = _this.currentTick;
          var interval = function () {

            _this.currentTick = _this.calculateTick();
            var _oldTick = _this.currentTick;

            if (_this.currentTick != _this.lastTick) {

              var _currentTick = _this.currentTick;

              var c = 0;
              for (var i = _this.lastTick + 1; i <= _currentTick; i++) {
                c++;
                if (c > 10) break;

                _this.currentTick = i;

                // copy system input and put it in actual
                // calculated input
                if (global.localPlayer) {
                  for (var key in localPlayer.localMoveTmp) {
                    localPlayer.localMove[key] = localPlayer.localMoveTmp[key];
                  }
                }

                _this.traverse(function (entity) {

                  if (entity.className === 'Player' && entity != global.localPlayer) {
                    // console.log(entity.snapshotMap);
                    // for (var i = 0; i < 1; i++) {
                    // if (entity.snapshotMap && entity.snapshotMap[this.currentTick]) {
                    // entity.localMove = entity.snapshotMap[this.currentTick-20];
                    var progress = (_this.currentTick - _this.lastSnapshotReceiveTime) / (_this.snapshotLength || SNAPSHOT_SEND_MOD);
                    if (progress < 0) {
                      progress = 0;
                    }
                    if (progress > 1) {
                      progress = 1;
                    }
                    // progress = 0.5;

                    var netRotation = new THREE.Quaternion();
                    netRotation.setFromEuler(entity.netRotation);
                    entity.position.copy(entity.oldPosition);
                    entity.quaternion.copy(entity.oldRotation);
                    entity.position.lerp(entity.netPosition, progress);
                    entity.quaternion.slerp(netRotation, progress);
                    entity.localMove = {};

                    entity.updateMatrixWorld(true);
                    // console.log(entity.localMove);
                    // break;
                    // }
                    // }
                  }
                });

                _this.update(TICKRATE / 1000);

                _this.pushSnapshot();

                if (global.localPlayer) {
                  // console.log(localPlayer.localMove);
                  // primus.write({type: 'usermove', tick: this.currentTick, move: localPlayer.localMove});
                }
              }

              // if (i % 2 == 0) {
              primus.write({ type: 'usersnapshot', snapshots: _this.snapshots.slice(_this.snapshots.length - 20) });
              // }
            }

            // this.replayUser(this.lastSnapshot);

            _this.lastTick = _oldTick;

            requestAnimationFrame(interval);
          };
          interval();
        });

        // we received a snapshot
        network.addEventListener('tick', function (event) {
          if (event.snapshot.timestamp > _this.lastSnapshotTimestamp) {
            _this.replayUser(event.snapshot);
            if (_this.lastSnapshot) {
              _this.snapshotLength = event.snapshot.timestamp - _this.lastSnapshot.timestamp;
            }
            _this.lastSnapshot = event.snapshot;
            _this.lastSnapshotTimestamp = event.snapshot.timestamp;
          }
        });
      }

      // Create static elements!
      var geometry = new THREE.BoxGeometry(20, 20, 0.1);
      var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      if (CLIENT) {
        var texture = new THREE.TextureLoader().load("grass.png");
        texture.minFilter = THREE.NearestFilter;
        texture.magFilter = THREE.NearestFilter;
        material.map = texture;
      }
      var cube = new THREE.Mesh(geometry, material);
      cube.position.z = 0;
      _this.add(cube);
      return _this;
    }

    _createClass(GameScene, [{
      key: 'pushSnapshot',
      value: function pushSnapshot() {
        var snapshot;

        if (SERVER) {
          snapshot = this.serialize(true);
        } else if (global.localPlayer) {
          snapshot = { timestamp: this.currentTick, move: JSON.parse(JSON.stringify(localPlayer.localMove)) };
        }

        this.snapshots.push(snapshot);
        this.snapshotMap[snapshot.timestamp] = snapshot;

        // automatically pop old snapshots
        if (this.snapshots.length > SNAPSHOTS) {
          var oldSnapshot = this.snapshots.shift();
          delete this.snapshotMap[oldSnapshot.timestamp];
        }
      }
    }, {
      key: 'getNewId',
      value: function getNewId() {
        return ++this.entityIdCount;
      }
    }, {
      key: 'findEntityById',
      value: function findEntityById(id) {
        return this.entityMap[id];
      }
    }, {
      key: 'serialize',
      value: function serialize() {
        var serial = {
          timestamp: this.currentTick,
          entities: {}
        };

        this.traverse(function (entity) {
          if (entity.entId && entity.dynamic) {
            var pos = { x: entity.position.x, y: entity.position.y, z: entity.position.z };
            var rot = { x: entity.rotation.x, y: entity.rotation.y, z: entity.rotation.z };
            serial.entities[entity.entId] = {
              className: entity.className,
              vars: JSON.parse(JSON.stringify(entity.syncedVars)), // deep copy
              pos: pos,
              rot: rot
            };
          }
        });

        return serial;
      }
    }, {
      key: 'applySnapshot',
      value: function applySnapshot(snapshot, ignorePosition) {
        var oldSnapshot = this.serialize();

        // updated
        for (var i in snapshot.entities) {
          var serial = snapshot.entities[i];
          var entity = this.entityMap[i];
          // add entity
          if (!entity) {
            entity = gameMeta.createClass(serial.className);
            this.addEntId(entity, i);
          }

          // if (CLIENT) {
          //   entity.snapshotMap = serial.snapshotMap;
          // }

          if (!ignorePosition) {
            if (CLIENT && entity != localPlayer) {
              if (this.lastSnapshot && this.lastSnapshot.entities[i]) {
                entity.oldPosition.copy(this.lastSnapshot.entities[i].pos);
                var rot = new THREE.Euler();
                rot.set(this.lastSnapshot.entities[i].rot.x, this.lastSnapshot.entities[i].rot.y, this.lastSnapshot.entities[i].rot.z);
                entity.oldRotation.setFromEuler(rot);
              }
              entity.netPosition.set(serial.pos.x, serial.pos.y, serial.pos.z);
              entity.netRotation.set(serial.rot.x, serial.rot.y, serial.rot.z);
            } else {
              entity.position.set(serial.pos.x, serial.pos.y, serial.pos.z);
              entity.rotation.set(serial.rot.x, serial.rot.y, serial.rot.z);
            }

            delete entity.syncedVars;
            entity.syncedVars = JSON.parse(JSON.stringify(serial.vars));
          } else {
            entity.syncedVars.move = serial.vars.move;
          }
        }

        // deleted
        for (var i in oldSnapshot.entities) {
          if (!snapshot.entities[i]) {
            this.removeById(i);
          }
        }
      }
    }, {
      key: 'replayUser',
      value: function replayUser(snapshot) {
        if (!snapshot) return;

        this.lastSnapshotReceiveTime = this.currentTick;

        this.applySnapshot(snapshot);
        this.updateMatrix();
        this.updateMatrixWorld(true);

        if (this.snapshots.length == 0) return;

        if (!global.localPlayer) return;

        var _currentTick = this.currentTick;
        var _localMove = localPlayer.localMove;

        for (var i = snapshot.timestamp + 1; i <= _currentTick; i++) {

          this.currentTick = i;

          if (this.snapshotMap[i]) {
            localPlayer.localMove = this.snapshotMap[i].move;
          } else {
            // console.log("lost packet " + i + " for " + snapshot.timestamp + " " + _currentTick);
          }

          this.update(TICKRATE / 1000);
        }

        localPlayer.localMove = _localMove;
        this.currentTick = _currentTick;
      }
    }, {
      key: 'replaySnapshots',
      value: function replaySnapshots() {
        if (this.snapshots.length == 0) return;

        this.applySnapshot(this.snapshots[0]);

        var _currentTick = this.currentTick;

        // replay all user input
        for (var i = 1; i < this.snapshots.length; i++) {
          this.currentTick = this.snapshots[i].timestamp;

          this.applySnapshot(this.snapshots[i], true);
          this.update(TICKRATE / 1000);

          delete this.snapshotMap[this.snapshots[i].timestamp];
          delete this.snapshots[i];
          var newSnapshot = this.serialize();
          this.snapshots[i] = newSnapshot;
          this.snapshotMap[this.snapshots[i].timestamp] = newSnapshot;
        }

        this.currentTick = _currentTick;
      }
    }, {
      key: 'update',
      value: function update(delta) {
        this.traverse(function (entity) {
          if (entity.dynamic && entity.update) {
            entity.update(delta);
          }
        });

        if (CLIENT && global.localPlayer) {

          var offset = new THREE.Vector3(0, -3, 3);
          var pos = global.localPlayer.position.clone();
          pos.add(offset);
          global.camera.position.copy(pos);
        }

        this.updateMatrix();
        this.updateMatrixWorld(true);
      }
    }, {
      key: 'addEntId',
      value: function addEntId(obj, entId) {
        obj.entId = entId;
        this.entityMap[entId] = obj;
        this.add(obj);
      }
    }, {
      key: 'removeById',
      value: function removeById(id) {
        var obj = this.findEntityById(id);
        this.entityMap[obj.entId] = null;

        if (obj) {
          this.remove(obj);
        }
      }
    }, {
      key: 'calculateTick',
      value: function calculateTick() {
        if (SERVER) {
          return Math.floor((new Date().getTime() - this.startTime) / TICKRATE) + this.offsetTick;
        } else {
          return Math.floor((ts.now() - this.startTime) / TICKRATE) + this.offsetTick - 10;
        }
      }
    }]);

    return GameScene;
  }(THREE.Scene);

  module.exports = GameScene;
});
//# sourceMappingURL=gamescene.js.map
