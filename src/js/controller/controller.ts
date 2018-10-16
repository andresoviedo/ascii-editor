//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

class CanvasController{
	class = 'CanvasController';
	canvas: CanvasDecorator & PointerDecorator;
	canvasHTML: HTMLCanvasElement;
	tools: Record<string,CanvasTool> = {};
	shiftKeyEnabled = false;
	dummyTool = new CanvasTool("");
	lastPointerCoord: Coord | null = null;

	constructor (canvas: CanvasDecorator & PointerDecorator) {
		this.canvas = canvas;
		this.canvasHTML = canvas.getCanvasHTML();

		this.init();
		this.lastPointerCoord = null;
		// visual only: adapt canvas container
		$("#canvas-container").width(this.canvas.getWidth());
		// select first cell, so user can start writing right from start
		this.canvas.setSelectedCell(new Coord(0,0));
	}
	init() {
		$("#tools > button.tool").click((eventObject) => {
			// active tool
			this.setActiveTool(eventObject.target.id);
		});
		// bind mouse action for handling the drawing
		$(this.canvas.getCanvasHTML()).mousedown((eventObject: JQuery.Event) => {
			// propagate event
			this.canvas.mouseDown(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			this.canvas.cellDown(this.lastPointerCoord);
			// invoke active tool
			try{
				this.getActiveTool().mouseDown(eventObject);
				this.getActiveTool().cellDown(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		});
		$(this.canvas.getCanvasHTML()).mouseup(() =>{
			// propagate event
			this.canvas.mouseUp();
			this.canvas.cellUp(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseUp();
				this.getActiveTool().cellUp(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		});
		$(this.canvas.getCanvasHTML()).mouseenter(() => {
			this.canvas.getCanvasHTML().style.cursor = this.canvas.cursor();
			this.canvas.mouseEnter();
			try{
				this.getActiveTool().mouseEnter();
				this.canvas.getCanvasHTML().style.cursor = this.getActiveTool().cursor();
			} catch(e){
				console.error(e.stack);
			}
		});
		$(this.canvas.getCanvasHTML()).mousemove((eventObject)=> {
			// propagate event
			this.canvas.mouseMove(eventObject);
			this.lastPointerCoord = this.getGridCoord(eventObject);
			this.canvas.cellMove(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseMove(eventObject);
				this.getActiveTool().cellMove(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		});
		$(this.canvas.getCanvasHTML()).mouseleave(()=>{
			this.canvas.mouseLeave();
			try{
				this.getActiveTool().mouseLeave();
			} catch(e){
				console.error(e.stack);
			}
		});
		$(window).keydown((eventObject)=>{
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = true;
			}
			this.canvas.keyDown(eventObject);
			try{
				this.getActiveTool().keyDown(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		});
		$(document).keypress((eventObject)=>{
			this.canvas.keyPress(eventObject);
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
			this.canvas.keyUp(eventObject);
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
	getActiveTool(): CanvasTool | null{
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
		x -= this.canvasHTML.offsetLeft;
		y -= this.canvasHTML.offsetTop;
		// are we inside a scrollable div?
		// TODO: should this be handled by MovableTool? (it know there is a container)
		var parent = $(this.canvasHTML).parent();
		if (parent){
			x += parent.scrollLeft();
			y += parent.scrollTop();
		}
		return new Coord(x,y);
	}
}
