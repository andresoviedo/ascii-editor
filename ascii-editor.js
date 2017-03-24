// ascii-editor.js
(function () {

  // trigger module loading by adding script element
  function loadModule(mod) {
    var element = document.createElement('script');
    element.setAttribute('type','text/javascript');
    element.setAttribute('src',mod);
    document.getElementsByTagName('head')[0].appendChild(element);
  }

  // trigger module loading: : load order not guaranteed!
  loadModule("src/main/js/ascii-editor.js");
  loadModule("src/main/js/util/util.js");
  loadModule("src/main/js/util/unicode-chars.js");

  loadModule("src/main/js/model/constants.js");
  loadModule("src/main/js/model/grid.js");
  loadModule("src/main/js/model/coord.js");
  loadModule("src/main/js/model/pixel.js");
  loadModule("src/main/js/model/coord-pixel.js");
  loadModule("src/main/js/view/canvas.js");
  loadModule("src/main/js/view/canvas-zoom.js");
  loadModule("src/main/js/view/drawable-canvas.js");
  loadModule("src/main/js/view/decorators.js");
  loadModule("src/main/js/entities/box.js");
  loadModule("src/main/js/entities/pixel-context.js");
  loadModule("src/main/js/controller/tools.js");
  loadModule("src/main/js/controller/controller.js");

})()
