define(["module"], function (module) {
  "use strict";

  // Stores game data and entity factory

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

  var GameMeta = function () {
    function GameMeta() {
      _classCallCheck(this, GameMeta);

      this.classes = {};
    }

    _createClass(GameMeta, [{
      key: "registerClass",
      value: function registerClass(className, Class) {
        Class.prototype.className = className;
        this.classes[className] = Class;
      }
    }, {
      key: "createClass",
      value: function createClass(className) {
        if (!this.classes[className]) {
          console.log("No such thing as " + className);
          return new THREE.Object3D();
        }

        return new this.classes[className]();
      }
    }]);

    return GameMeta;
  }();

  module.exports = new GameMeta();
});
//# sourceMappingURL=gamemeta.js.map
