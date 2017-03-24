//------------------------------------------------- MOUSE CONTROLLER ------------------------------------------------//

function CanvasController(canvas) {
	this.class = 'CanvasController';
	this.canvas = canvas;
	this.tools = {};
	this.shiftKeyEnabled = false;
	this.dummyTool = new CanvasTool();
	this.canvasHTML = canvas.getCanvasHTML();
	this.init();
	this.lastPointerCoord = null;
	// visual only: adapt canvas container
	$("#canvas-container").width(this.canvas.getWidth());
	// select first cell, so user can start writing right from start
	this.canvas.setSelectedCell(new Coord(0,0));
}

CanvasController.prototype = {
	init : function() {
		$("#tools > button.tool").click(function(eventObject) {
			// active tool
			this.setActiveTool(eventObject.target.id);
		}.bind(this));
		// bind mouse action for handling the drawing
		$(this.canvas.getCanvasHTML()).mousedown(function(eventObject) {
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
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseup(function() {
			// propagate event
			this.canvas.mouseUp();
			this.canvas.cellUp(this.lastPointerCoord);
			try{
				this.getActiveTool().mouseUp();
				this.getActiveTool().cellUp(this.lastPointerCoord);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseenter(function() {
			this.canvas.getCanvasHTML().style.cursor = this.canvas.cursor();
			this.canvas.mouseEnter();
			try{
				this.getActiveTool().mouseEnter();
				this.canvas.getCanvasHTML().style.cursor = this.getActiveTool().cursor();
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mousemove(function(eventObject) {
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
		}.bind(this));
		$(this.canvas.getCanvasHTML()).mouseleave(function() {
			this.canvas.mouseLeave();
			try{
				this.getActiveTool().mouseLeave();
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(window).keydown(function(eventObject) {
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = true;
			}
			this.canvas.keyDown(eventObject);
			try{
				this.getActiveTool().keyDown(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(document).keypress(function(eventObject) {
			this.canvas.keyPress(eventObject);
			try{
				this.getActiveTool().keyPress(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
		$(window).keyup(function(eventObject) {
			if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
				this.shiftKeyEnabled = false;
			}
			this.canvas.keyUp(eventObject);
			try{
				this.getActiveTool().keyUp(eventObject);
			} catch(e){
				console.error(e.stack);
			}
		}.bind(this));
	}
	,addTool : function(tool){
		this.tools[tool.getId()] = tool;
	}
	,getActiveTool : function(){
		if (this.shiftKeyEnabled) return this.dummyTool;
		for (var tool in this.tools){
			if (this.tools[tool].isEnabled()){
					return this.tools[tool];
			}
		}
		return null;
	}
	,setActiveTool : function(elementId){
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
	, getGridCoord: function(mouseEvent){
		// get HTML canvas relative coordinates
		canvasHTMLCoord = this.getCanvasHTMLCoord(mouseEvent);
		// get canvas coord
		return this.canvas.getGridCoord(canvasHTMLCoord);
	}
	, getCanvasHTMLCoord : function(mouseEvent){
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
