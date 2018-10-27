// -------------------------------------------- ZOOMABLE CANVAS ---------------------------------------------------- //

class ZoomableCanvas{
	class = "ZoomableCanvas";
	shiftKeyEnabled = false;
	canvas: ASCIICanvas;

	constructor(canvas: ASCIICanvas){
		this.canvas = canvas;
	}

	init(){
		this.canvas.events.onKeyDown(this.keyDown.bind(this));
		this.canvas.events.onKeyUp(this.keyUp.bind(this));
		this.canvas.events.onMouseWheel(this.onMouseWheel.bind(this));
	}

	private keyDown(eventObject:JQuery.Event){
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	private keyUp(eventObject:JQuery.Event){
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	private onMouseWheel(eventObject:JQuery.Event) {
		if (!this.shiftKeyEnabled) return;
		//@ts-ignore
		var newZoom = this.canvas.getZoom() * (eventObject.originalEvent.wheelDelta > 0 ? 1.1 : 0.9);
		newZoom = Math.max(Math.min(newZoom, 4), 1);
		this.canvas.setZoom(newZoom);
		this.canvas.events.triggerResize();
		return false;
	}
}
