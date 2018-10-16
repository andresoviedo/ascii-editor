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
  let c1 = delegateProxy(new ASCIICanvas(document.getElementById("ascii-canvas"), grid), "grid");
	c1.init();
	// add canvas movability
	let c2 = new MovableCanvas(c1, "#canvas-container");
	// add canvas zoom feature
	let c3 = delegateProxy(new ZoomableCanvas(c2), "canvas");
	c3.init();
	// add ascii drawing capabilities
	let c4 = delegateProxy(new DrawableCanvas(c3), "canvas");
	// add ascii drawing capabilities with style
	let c5 = delegateProxy(new StylableCanvas(c4), "canvas");
	// add cursor decorator
	let c6 = delegateProxy(new PointerDecorator(c5, "pointer-button"), "canvas");
	// add char writing capabilities
	let c7 = delegateProxy(new WritableCanvas(c6), "canvas");
	// instantiate canvas controller (mouse control, keyboard control, tools, etc)
	var controller = new CanvasController(c7);
	// add clear canvas capabilities
	controller.addTool(new ClearCanvasTool("clear-button",c7));
	// add set/edit text capabilities
	controller.addTool(new EditTextTool("text-button",c7));
	// add export to ascii capabilities
	controller.addTool(new ExportASCIITool("export-button", c7, "#canvas-container", "#dialog-widget"));
	// add draw box capabilities
	controller.addTool(new BoxDrawerTool("box-button", c7));
	// add line drawing capabilities
	controller.addTool(new LineTool("line-button", c7));
	// add selection capabilities
	controller.addTool(new SelectTool("select-button", c7));
	// set default tool
	controller.setActiveTool("select-button");
	// start animation loop
	animate(c7);
}

function animate(canvas:CanvasDecorator){
	if (canvas.hasChanged()){
		canvas.redraw();
		canvas.setChanged(false);
	}
	window.requestAnimationFrame(function() {
		animate(canvas);
	});
}
