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
  loadModule("js/ascii-editor.js");
  loadModule("js/util/util.js");
  loadModule("js/util/unicode-chars.js");

  loadModule("js/model/constants.js");
  loadModule("js/model/grid.js");
  loadModule("js/model/coord.js");
  loadModule("js/model/pixel.js");
  loadModule("js/model/coord-pixel.js");
  loadModule("js/view/canvas.js");
  loadModule("js/view/canvas-zoom.js");
  loadModule("js/view/drawable-canvas.js");
  loadModule("js/view/decorators.js");
  loadModule("js/entities/box.js");
  loadModule("js/entities/pixel-context.js");
  loadModule("js/controller/tools.js");
  loadModule("js/controller/controller.js");

})()
