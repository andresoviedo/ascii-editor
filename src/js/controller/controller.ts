//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

class CanvasController{
	class = 'CanvasController';
	canvas: ASCIICanvas;
	tools: Record<string,CanvasTool> = {};
	shiftKeyEnabled = false;
	dummyTool = new CanvasTool("");
	lastPointerCoord: Coord | null = null;

	constructor (canvas: ASCIICanvas, pointer: PointerDecorator) {
		this.canvas = canvas;

		this.init();
		this.lastPointerCoord = null;
		// visual only: adapt canvas container
		$("#canvas-container").width(this.canvas.getWidth());
		// select first cell, so user can start writing right from start
		pointer.setSelectedCell(new Coord(0,0));
	}
	init() {
		$("#tools > button.tool").click((eventObject) => {
			// active tool
			this.setActiveTool(eventObject.target.id);
		});

		const $canvas = this.canvas.$canvas;
		const events = this.canvas.events;

		// bind mouse action for handling the drawing
		$canvas.mousedown((eventObject: JQuery.Event) => {
			this.lastPointerCoord = this.getGridCoord(eventObject);
			events.triggerMouseDown(eventObject);
			events.triggerCellDown(this.lastPointerCoord);
			// invoke active tool
			try{
				this.getActiveTool().mouseDown(eventObject);
				this.getActiveTool().cellDown(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		});
		$canvas.mouseup((evt) =>{
			// propagate event
			events.triggerMouseUp(evt);
			events.triggerCellUp(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseUp();
				this.getActiveTool().cellUp(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		});
		$canvas.mouseenter((evt) => {
			this.canvas.canvasHTML.style.cursor = this.canvas.cursor();
			events.triggerMouseEnter(evt);
			try{
				this.getActiveTool().mouseEnter();
				this.canvas.canvasHTML.style.cursor = this.getActiveTool().cursor();
			} catch(e){
				console.error(e.stack);
			}
		});
		$canvas.mousemove((eventObject)=> {
			// propagate event
			events.triggerMouseMove(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			events.triggerCellMove(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseMove(eventObject);
				this.getActiveTool().cellMove(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		});
		$canvas.mouseleave((evt)=>{
			events.triggerMouseLeave(evt);
			try{
				this.getActiveTool().mouseLeave();
			} catch(e){
				console.error(e.stack);
			}
		});
		$canvas.bind("mousewheel", (evt)=>{
			events.triggerMouseWheel(evt);
		});

		$(window).keydown((eventObject)=>{
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = true;
			}
			events.triggerKeyDown(eventObject);
			try{
				this.getActiveTool().keyDown(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		});
		$(document).keypress((eventObject)=>{
			events.triggerKeyPress(eventObject);
			try{
				this.getActiveTool().keyPress(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		});
		$(window).keyup((eventObject)=>{
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = false;
			}
			events.triggerKeyUp(eventObject);
			try{
				this.getActiveTool().keyUp(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		});
	}
	addTool(tool: CanvasTool){
		this.tools[tool.getId()] = tool;
	}
	getActiveTool(): CanvasTool | null {
		if (this.shiftKeyEnabled) return this.dummyTool;
		for (var tool in this.tools){
			if (this.tools[tool].isEnabled()){
					return this.tools[tool];
			}
		}
		return null;
	}
	setActiveTool(elementId: string){
		try {
			// toggle active button (visual feature only)
			$("#tools > button.tool").removeClass("active");
			$("#" + elementId).toggleClass("active");
			// enable tool
			for (var tool in this.tools){
				this.tools[tool].setEnabled(this.tools[tool].getId() == elementId);
			}
			this.getActiveTool().click();
		}catch(e){
			console.error(e.stack);
		}
	}
	getGridCoord(mouseEvent: JQuery.Event){
		// get HTML canvas relative coordinates
		let canvasHTMLCoord = this.getCanvasHTMLCoord(mouseEvent);
		// get canvas coord
		return this.canvas.getGridCoord(canvasHTMLCoord);
	}
	getCanvasHTMLCoord (mouseEvent: JQuery.Event){
		var x;
		var y;
		if (mouseEvent.pageX || mouseEvent.pageY) {
			x = mouseEvent.pageX;
			y = mouseEvent.pageY;
		}	else {
			x = mouseEvent.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
			y = mouseEvent.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}
		x -= this.canvas.canvasHTML.offsetLeft;
		y -= this.canvas.canvasHTML.offsetTop;
		// are we inside a scrollable div?
		// TODO: should this be handled by MovableTool? (it know there is a container)
		var parent = this.canvas.$canvas.parent();
		if (parent){
			x += parent.scrollLeft();
			y += parent.scrollTop();
		}
		return new Coord(x,y);
	}
}
