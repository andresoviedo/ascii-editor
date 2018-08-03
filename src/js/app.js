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
function init(){
  // init here because it depends on modules
  init_constants();
	// initialize grid
	var grid = new Grid();
	// initialize canvas
	var canvas = delegateProxy(new ASCIICanvas(document.getElementById("ascii-canvas"),grid),"grid");
	canvas.init();
	// add canvas movability
	canvas = new MovableCanvas(canvas, "#canvas-container");
	// add canvas zoom feature
	canvas = delegateProxy(new ZoomableCanvas(canvas), "canvas");
	canvas.init();
	// add ascii drawing capabilities
	canvas = delegateProxy(new DrawableCanvas(canvas), "canvas");
	// add ascii drawing capabilities with style
	canvas = delegateProxy(new StylableCanvas(canvas), "canvas");
	// add cursor decorator
	canvas = delegateProxy(new PointerDecorator(canvas, "pointer-button"), "canvas");
	// add char writing capabilities
	canvas = delegateProxy(new WritableCanvas(canvas), "canvas");
	// instantiate canvas controller (mouse control, keyboard control, tools, etc)
	var controller = new CanvasController(canvas);
	// add clear canvas capabilities
	controller.addTool(new ClearCanvasTool("clear-button",canvas));
	// add set/edit text capabilities
	controller.addTool(new EditTextTool("text-button",canvas));
	// add export to ascii capabilities
	controller.addTool(new ExportASCIITool("export-button", canvas, "#canvas-container", "#dialog-widget"));
	// add draw box capabilities
	controller.addTool(new BoxDrawerTool("box-button", canvas));
	// add line drawing capabilities
	controller.addTool(new LineTool("line-button", canvas));
	// add selection capabilities
	controller.addTool(new SelectTool("select-button", canvas));
	// set default tool
	controller.setActiveTool("select-button");
	// start animation loop
	animate(canvas);
}

function animate(canvas){
	if (canvas.hasChanged()){
		canvas.redraw();
		canvas.setChanged(false);
	}
	window.requestAnimationFrame(function() {
		animate(canvas);
	});
}
