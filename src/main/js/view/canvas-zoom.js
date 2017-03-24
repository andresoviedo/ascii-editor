// -------------------------------------------- ZOOMABLE CANVAS ---------------------------------------------------- //

function ZoomableCanvas(canvas){
	this.canvas = canvas;
	this.shiftKeyEnabled = false;
	this.init();
}

ZoomableCanvas.prototype = {
	init : function(){
		// bind mousewheel for zooming into the canvas
		$(this.canvas.getCanvasHTML()).bind("mousewheel", this.onMouseWheel.bind(this));
	}
	, keyDown : function(eventObject){
		this.canvas.keyDown(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	, keyUp: function(eventObject){
		this.canvas.keyUp(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	, onMouseWheel: function(eventObject) {
		if (!this.shiftKeyEnabled) return;
		var newZoom = this.canvas.getZoom() * (eventObject.originalEvent.wheelDelta > 0 ? 1.1 : 0.9);
		newZoom = Math.max(Math.min(newZoom, 4), 1);
		this.canvas.setZoom(newZoom);
		this.canvas.resize();
		return false;
	}
}
