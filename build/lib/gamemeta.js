define(["module"], function (module) {
  "use strict";

  // Stores game data and entity factory

  class GameMeta {
    constructor() {
      this.classes = {};
    }

    registerClass(className, Class) {
      Class.prototype.className = className;
      this.classes[className] = Class;
    }

    createClass(className) {
      if (!this.classes[className]) {
        console.log("No such thing as " + className);
        return new THREE.Object3D();
      }

      return new this.classes[className]();
    }
  }

  module.exports = new GameMeta();
});
//# sourceMappingURL=gamemeta.js.map
