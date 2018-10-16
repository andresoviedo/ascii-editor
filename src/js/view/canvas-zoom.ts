// -------------------------------------------- ZOOMABLE CANVAS ---------------------------------------------------- //

class ZoomableCanvas{
	class = "ZoomableCanvas";
	shiftKeyEnabled = false;
	canvas: MovableCanvas;

	constructor(canvas: MovableCanvas){
		this.canvas = canvas;
	}

	init(){
		$(this.canvas.getCanvasHTML()).bind("mousewheel", this.onMouseWheel.bind(this));
	}

	keyDown(eventObject:JQuery.Event){
		this.canvas.keyDown(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	keyUp(eventObject:JQuery.Event){
		this.canvas.keyUp(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	onMouseWheel(eventObject:JQuery.Event) {
		if (!this.shiftKeyEnabled) return;
		//@ts-ignore
		var newZoom = this.canvas.getZoom() * (eventObject.originalEvent.wheelDelta > 0 ? 1.1 : 0.9);
		newZoom = Math.max(Math.min(newZoom, 4), 1);
		this.canvas.setZoom(newZoom);
		this.canvas.resize();
		return false;
	}
}
