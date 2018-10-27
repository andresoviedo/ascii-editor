/**
 * ┌─┐┌─┐┌─┐┌─┐┌─┐   ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐
 * │A││S││C││I││I│-->│E││d││i││t││o││r│
 * └─┘└─┘└─┘└─┘└─┘   └─┘└─┘└─┘└─┘└─┘└─┘
 *
 * This is the main code for drawing the ASCII code (pixels from now on) into the HTML canvas.
 * Basically there is a Canvas object holding a Grid object holding of matrix of Pixels.
 *
 * Features implemented so far:
 * - a grid is drawn into the canvas
 * - canvas can be zoomed
 * - boxes can be drawn
 * - tools has an associated mouse cursor
 * - pixels integration
 * - canvas can be cleared
 *
 * TODO: fix text tool so its not drawn outside the bounds of the canvas
 */

/*
 * Initialize canvas and use the Decorator Pattern to add more features (single responsability chain).
 * In order to implement Decorator Pattern, I use jquery to extend objects ($.extend()).
 * Since the wrapper mechanism is emulated (based on copying object properties), I have to make use of this.$ variable to reference the real 'this'.
 */
function init() {
  // init here because it depends on modules
  init_constants();
  // initialize grid
  var grid = new Grid();
  // initialize canvas
  let $canvas = $("#ascii-canvas") as JQuery<HTMLCanvasElement>;

  let cvs = new ASCIICanvas($canvas, grid);
  cvs.init();

  let movable = new MovableCanvas(cvs, "#canvas-container");
  movable.init();

  let zoomable = new ZoomableCanvas(cvs);
  zoomable.init();

  let drawable = new DrawableCanvas(grid);
  drawable = delegateProxy(new StylableCanvas(grid, drawable), 'drawable');

  let pointer = new PointerDecorator(cvs, "pointer-button");
  pointer.init();

  let wc = new WritableCanvas(cvs, pointer, drawable);
  wc.init();

  // instantiate canvas controller (mouse control, keyboard control, tools, etc)
  var controller = new CanvasController(cvs, pointer);
  // add clear canvas capabilities
  controller.addTool(new ClearCanvasTool("clear-button", grid));
  // add set/edit text capabilities
  controller.addTool(new EditTextTool("text-button", cvs, drawable));
  // add export to ascii capabilities
  controller.addTool(new ExportASCIITool("export-button", grid, "#canvas-container", "#dialog-widget"));
  // add draw box capabilities
  controller.addTool(new BoxDrawerTool("box-button", cvs, drawable, pointer));
  // add line drawing capabilities
  controller.addTool(new LineTool("line-button", cvs, drawable));
  // add selection capabilities
  controller.addTool(new SelectTool("select-button", cvs, drawable));
  // set default tool
  controller.setActiveTool("select-button");

  // start animation loop
  animate(cvs, pointer);
}

function animate(canvas: ASCIICanvas, pointer: PointerDecorator) {
  if (canvas.hasChanged() || pointer.hasChanged()) {
    canvas.redraw();
    pointer.redraw();
    canvas.setChanged(false);
    pointer.setChanged(false);
  }
  window.requestAnimationFrame(function() {
    animate(canvas, pointer);
  });
}
