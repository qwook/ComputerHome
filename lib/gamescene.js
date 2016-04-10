"use strict"

var gameMeta = require('./gamemeta.js');
var Player = require('./player.js');

var TICKRATE = 20;
var SNAPSHOTS = 100;

class GameScene extends THREE.Scene {
  constructor() {
    super();

    global.game = this;

    this.entityIdCount = 0;
    this.entityMap = {}; // entityId -> entityObject

    this.currentTick = 0;

    this.snapshots = [];
    this.snapshotMap = {}; // optimization

    this.autoUpdate = false

    /* Start ticking on the server! */
    if (SERVER) {

      // todo: replace this with a more accurate interval function
      this.startTime = (new Date()).getTime();
      this.currentTick = 0;
      this.lastTick = this.currentTick;
      var interval = () => {

        this.currentTick = Math.floor(((new Date()).getTime() - this.startTime) / TICKRATE);

        if (this.currentTick != this.lastTick) {
          this.replaySnapshots();

          var _currentTick = this.currentTick;
          for (var i = this.lastTick+1; i <= _currentTick; i++) {
            this.currentTick = i;
            this.update(TICKRATE / 1000);
            this.pushSnapshot();

            if (i % 40) {
              primus.write({
                type: 'tick',
                tick: i,
                snapshot: this.snapshots[this.snapshots.length-1]
              });
            }
          }

        }

        this.lastTick = this.currentTick;

      }
      setInterval(interval, 1);

      // Someone has connected! Give them a player entity.
      network.addEventListener('connection', (event) => {
        var playerId = this.getNewId();
        var player = new Player();
        this.addEntId(player, playerId)

        event.spark.entId = playerId;
        event.spark.write({type: 'possess', entId: playerId});
        event.spark.write({type: 'initialTick', startTime: this.startTime});

        delete this.snapshots;
        delete this.snapshotMap;

        this.snapshots = [];
        this.snapshotMap = {};
      })

      network.addEventListener('disconnection', (event) => {
        var entity = this.findEntityById(event.spark.entId);
        if (entity) {
          this.remove(entity);
        }
      });

      network.addEventListener('usermove', (event) => {
        if (this.snapshotMap[event.tick] &&
            event.spark.entId &&
            this.snapshotMap[event.tick].entities[event.spark.entId] &&
            this.snapshotMap[event.tick].entities[event.spark.entId].vars
        ) {
          this.snapshotMap[event.tick].entities[event.spark.entId].vars.move = event.move;
        }
      });
    }

    if (CLIENT) {

      this.lastSnapshotTimestamp = 0;

      // Possess a local player!
      network.addEventListener('possess', (event) => {
        var entity = this.findEntityById(event.entId);
        if (!entity) {
          entity = new Player();
          this.addEntId(entity, event.entId)
        }

        entity.entId = event.entId;
        global.localPlayer = entity;
      })

      network.addEventListener('initialTick', (event) => {
        this.startTime = event.startTime;
        this.currentTick = Math.floor(((new Date()).getTime() - event.startTime) / TICKRATE) - 3;
        this.lastTick = this.currentTick;
        var interval = () => {

          this.currentTick = Math.floor(((new Date()).getTime() - event.startTime) / TICKRATE) - 3;
          if (this.currentTick != this.lastTick) {
            if (this.lastSnapshot) {
              // this.applySnapshot(this.lastSnapshot);
            };

            var _currentTick = this.currentTick;
            for (var i = this.lastTick+1; i <= _currentTick; i++) {
              this.currentTick = i
              // this.update(TICKRATE / 1000);

              this.pushSnapshot();
              this.replayUser(this.lastSnapshot);

              if (global.localPlayer) {
                // console.log(localPlayer.localMove);
                primus.write({type: 'usermove', tick: this.currentTick, move: localPlayer.localMove});
              }

            }
          }

          this.lastTick = this.currentTick;

          requestAnimationFrame(interval);
        };
        interval();
      });

      network.addEventListener('tick', (event) => {
        if (event.snapshot.timestamp > this.lastSnapshotTimestamp) {
          this.lastSnapshot = event.snapshot;
          this.lastSnapshotTimestamp = event.snapshot.timestamp;
        }
      });

    }

    // Create static elements!
    var geometry = new THREE.BoxGeometry( 5, 5, 0.1 );
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    var cube = new THREE.Mesh( geometry, material );
    cube.position.z = 0;
    this.add( cube );
  }

  pushSnapshot() {
    var snapshot;

    if (SERVER) {
      snapshot = this.serialize(true);
    } else if (global.localPlayer) {
      snapshot = {timestamp: this.currentTick, move: JSON.parse(JSON.stringify(localPlayer.localMove))};
    }

    this.snapshots.push(snapshot);
    this.snapshotMap[snapshot.timestamp] = snapshot;

    // automatically pop old snapshots
    if (this.snapshots.length > SNAPSHOTS) {
      var oldSnapshot = this.snapshots.shift();
      delete this.snapshotMap[oldSnapshot.timestamp];
    }
  }

  getNewId() {
    return ++this.entityIdCount;
  }

  findEntityById(id) {
    return this.entityMap[id];
  }

  serialize(ignoreMove) {
    var serial = {
      timestamp: this.currentTick,
      entities: {}
    };

    this.traverse((entity) => {
      if (entity.entId && entity.dynamic) {
        var pos = {x: entity.position.x, y: entity.position.y, z: entity.position.z}
        var rot = {x: entity.rotation.x, y: entity.rotation.y, z: entity.rotation.z}
        serial.entities[entity.entId] = {
          className: entity.className,
          vars: JSON.parse(JSON.stringify(entity.syncedVars)), // deep copy
          pos: pos,
          rot: rot
        };
      }
    })

    return serial;
  }

  applySnapshot(snapshot, ignorePosition) {
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

      if (!ignorePosition) {
        entity.position.set(serial.pos.x, serial.pos.y, serial.pos.z);
        entity.rotation.set(serial.rot.x, serial.rot.y, serial.rot.z);
      }
      delete entity.syncedVars;
      entity.syncedVars = JSON.parse(JSON.stringify(serial.vars));
    }

    // deleted
    for (var i in oldSnapshot.entities) {
      if (!snapshot.entities[i]) {
        this.removeById(i);
      }
    }
  }

  // client
  replayUser(snapshot) {
    this.applySnapshot(snapshot);

    if (this.snapshots.length == 0) return;

    if (!global.localPlayer) return;

    var _currentTick = this.currentTick;
    var _localMove = localPlayer.localMove;

    for (var i = snapshot.timestamp; i <= _currentTick; i++) {

      this.currentTick = i;

      if (this.snapshotMap[i]) {
        // console.log("replay"+ i);
        localPlayer.localMove = this.snapshotMap[i].move;
      }

      this.update(TICKRATE/1000);

    }

    this.updateMatrixWorld();

    localPlayer.localMove = _localMove;
    this.currentTick = _currentTick;
  }

  // server
  replaySnapshots() {
    if (this.snapshots.length == 0) return;

    this.applySnapshot(this.snapshots[0]);

    var _currentTick = this.currentTick;

    // replay all user input
    for (var i = 1; i < this.snapshots.length; i++) {
      this.currentTick = this.snapshots[i].timestamp;

      this.applySnapshot(this.snapshots[i], true);
      this.update(TICKRATE/1000);

      delete this.snapshotMap[this.snapshots[i].timestamp];
      delete this.snapshots[i];
      var newSnapshot = this.serialize();
      this.snapshots[i] = newSnapshot;
      this.snapshotMap[this.snapshots[i].timestamp] = newSnapshot;
    }

    this.currentTick = _currentTick;

  }

  update(delta) {
    this.traverse((entity) => {
      if (entity.dynamic && entity.update) {
        entity.update(delta);
      }
    })

    this.updateMatrix();
    this.updateMatrixWorld( true );
  }

  addEntId(obj, entId) {
    obj.entId = entId;
    this.entityMap[entId] = obj;
    this.add(obj);
  }

  removeById(id) {
    var obj = this.findEntityById(id);
    this.entityMap[obj.entId] = null;

    if (obj) {
      this.remove(obj);
    }
  }
}

module.exports = GameScene;
