// ----------------------------------------------- STYLE DECORATOR ------------------------------------------------- //

class StylableCanvas {
	readonly class = "StylableCanvas";
	readonly grid: Grid;
	readonly drawable: DrawableCanvas;

	constructor(grid: Grid, drawable: DrawableCanvas){
		this.grid = grid;
		this.drawable = drawable;
	}

  drawLine(startCoord: Coord, endCoord: Coord, drawHorizontalFirst: string, pixelValue: string, ommitIntersections: boolean) {
		this.drawable.drawLine(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections);
		// get drawing style
		let drawStyle = $("#style-select").val();
		// fix line style
		for (let index in this.grid.pixelsStack){
			let pixelPosition = this.grid.pixelsStack[index];
			let pixel = pixelPosition.pixel;
			pixelValue = this.getPixelValueIntegrated(pixelPosition.coord, String(drawStyle));
			pixel.tempValue = pixelValue;
		}
	}

	/**
	 * Here is the logic to integrate the pixels. This function return the best drawing character
	 * so its nicely integrated into the ASCII code
	 */
	getPixelValueIntegrated(coord: Coord, drawStyle:string) {
		var pixel = this.grid.getPixel(coord);
		var pixelValue = pixel.getValue();

		// test whether the pixel is either of the drawing characters
		var isBoxPixel = window.boxChars1.indexOf(pixelValue) != -1;
		var isArrowPixel = window.arrowChars1.indexOf(pixelValue) != -1;

		// if its not a drawing character just return. we have nothing to integrate
		if (!isBoxPixel && !isArrowPixel) {
			return pixelValue;
		}

		// get pixel context so we decide which is the best character for integration
		var pixelContext = this.drawable.getPixelContext(coord);

		// handle cases when we are drawing a box
		if (isBoxPixel){
			if (pixelContext.left && pixelContext.right && pixelContext.bottom && pixelContext.top) {
				return window.drawStyles[drawStyle]["cross"];
			}
			/* This handles this case:
		 	 *                            X - X
		 	 */
			if (pixelContext.left && pixelContext.right && !pixelContext.bottom && !pixelContext.top) {
				return window.drawStyles[drawStyle]["horizontal"];
			}
			/*
		 	 * This handles this case:	     X
		 	 *                               |
		 	 *                               X
		 	*/
			else if (!pixelContext.left && !pixelContext.right && pixelContext.bottom && pixelContext.top) {
				return window.drawStyles[drawStyle]["vertical"];
			}
			/*
		 	 * This handles this case:	     ┌X
		 	 *                               X
		 	*/
			else if (!pixelContext.left && pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				let cornerPixel = window.drawStyles[drawStyle]["corner-top-left"];
				return cornerPixel? cornerPixel : window.drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	     X┐
		 	 *                                X
		 	*/
			else if (pixelContext.left && !pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				let cornerPixel = window.drawStyles[drawStyle]["corner-top-right"];
				return cornerPixel? cornerPixel : window.drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	     X
		 	 *                               └X
		 	 *
		 	*/
			else if (!pixelContext.left && pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				let cornerPixel = window.drawStyles[drawStyle]["corner-bottom-left"];
				return cornerPixel? cornerPixel : window.drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	      X
		 	 *                               X┘
		 	 *
		 	*/
			else if (pixelContext.left && !pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				let cornerPixel = window.drawStyles[drawStyle]["corner-bottom-right"];
				return cornerPixel? cornerPixel : window.drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.left && pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				pixelValue = window.drawStyles[drawStyle]["horizontal-light-up"];
				return pixelValue? pixelValue : window.drawStyles[drawStyle]["horizontal"];
			}
			else if (pixelContext.left && pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				pixelValue = window.drawStyles[drawStyle]["horizontal-light-down"];
				return pixelValue? pixelValue : window.drawStyles[drawStyle]["horizontal"];
			}
			else if (!pixelContext.left && pixelContext.right && pixelContext.top && pixelContext.bottom) {
				pixelValue = window.drawStyles[drawStyle]["vertical-light-right"];
				return pixelValue? pixelValue : window.drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.left && !pixelContext.right && pixelContext.top && pixelContext.bottom) {
				pixelValue = window.drawStyles[drawStyle]["vertical-light-left"];
				return pixelValue? pixelValue : window.drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.top || pixelContext.bottom) {
				return window.drawStyles[drawStyle]["vertical"];
			}

		}
		// handle cases when we are drawing arrows
		else if (isArrowPixel) {
			if (pixelContext.getLength() == 1) {
				if (pixelContext.left) {
					return ">";
				}
				if (pixelContext.bottom) {
					return "v";
				}
				if (pixelContext.top) {
					return "^";
				}
				if (pixelContext.right) {
					return "<";
				}
			}
			else if (pixelContext.getLength() == 3) {
				/*
		 		 * This handles this case:		X
		 		 *                              < X
		 		 *                              X
		 		 */
				if (!pixelContext.left) {
					return "<";
				}
				/*
		 		 * This handles this case:		X
		 		 *                            X ^ X
		 		 *
		 		 */
				else if (!pixelContext.bottom) {
					return "^";
				}
				/*
		 		 * This handles this case:
		 		 *                            X v X
		 		 *                              X
		 		 */
				else if (!pixelContext.top) {
					return "v";
				}
				/*
		 		 * This handles this case:		X
		 		 *                            X >
		 		 *                              X
		 		 */
				if (!pixelContext.right) {
					return ">";
				}
			}
		}

		/*
		 * This handles this case:		X
		 *                            X - X
		 *                              X
		 */
		if (4 == pixelContext.getLength()) {
			return "-";
		}

		return pixelValue;
	}
}

// -------------------------------------------------- DECORATORS --------------------------------------------------- //

/**
 * This tool handles the cursor position & movement (arrow keys) and pointer hovering.
 * This tool also supports the writing and the edition of the text (Backspace & Delete are supported)
 */
class PointerDecorator {
	readonly class = "PointerDecorator";
	readonly canvas: ASCIICanvas;
	toolId: string
	selectedCell: Coord | null = null;
	pointerCell: Coord | null = null;
	drawSelectedCell = false;
	changed = false;
	mouseStatus: string | null = null;

	constructor(canvas: ASCIICanvas, toolId: string){
		this.canvas = canvas;
		this.toolId = toolId;
	}

	init(){
		const events = this.canvas.events;
		events.onCellDown(this.cellDown.bind(this));
		events.onCellMove(this.cellMove.bind(this));
		events.onCellUp(this.cellUp.bind(this));
		events.onMouseLeave(this.mouseLeave.bind(this));
		events.onKeyDown(this.keyDown.bind(this));
		events.onKeyUp(this.keyUp.bind(this))
	}

	getPointerCell() { return this.pointerCell }
	setPointerCell(coord:Coord) { this.pointerCell = coord }
	getDrawSelectedCell() { return this.drawSelectedCell }
	setDrawSelectedCell(draw:boolean) { this.drawSelectedCell = draw }
	getSelectedCell() { return this.selectedCell }
	setSelectedCell(coord:Coord){
		if (this.canvas.getGrid().getPixel(coord) != undefined){
  		this.selectedCell = coord;
  	}
	}
	hasChanged(){
		this.refresh();
		return this.changed;
	}
	setChanged(changed: boolean){
		this.changed = changed;
	}

	redraw(){
		// draw selected cell
		if (this.getSelectedCell() != null && this.getDrawSelectedCell()){
			this.canvas.drawText("▏",this.getSelectedCell(),"#009900");
		}
		// draw pointer
		if (this.getPointerCell() != null){
			this.canvas.drawRect(this.getPointerCell(),this.canvas.getCellWidth(), this.canvas.getCellHeight(), "#009900");
		}
	}
	/**
 	 * implementation of intermitent cursor
 	 */
	private refresh(){
		var shouldDraw = this.getSelectedCell() != null && new Date().getTime() % 2000 < 1000;
		var changed = shouldDraw != this.getDrawSelectedCell();
		this.setDrawSelectedCell(shouldDraw);
		this.changed = this.changed || changed;
	}

	private cellDown(coord: Coord){
		this.mouseStatus = "down";
		this.setSelectedCell(coord);
		this.changed = true;
	}
	private cellMove(coord: Coord){
		this.mouseStatus = this.mouseStatus == "up" || this.mouseStatus == "hover"? "hover" : "moving";
		this.setPointerCell(coord);
		this.changed = true;
	}
	private cellUp(){
		this.mouseStatus = "up";
	}
	private mouseLeave(){
		this.setPointerCell(null);
		this.changed = true;
	}

	/**
	 * This to prevent moving the document with the arrow keys
	 */
	private keyDown(eventObject: JQuery.Event){
		// check if canvas has the focus
		if (this.canvas.isFocused()){ return }

		// prevent from processing unwanted keys
		if (eventObject.keyCode == KeyEvent.DOM_VK_LEFT){
	  		eventObject.preventDefault();
	  	}
	  	else if (eventObject.keyCode == KeyEvent.DOM_VK_RIGHT){
	  		eventObject.preventDefault();
	  	}
	  	else if (eventObject.keyCode == KeyEvent.DOM_VK_UP){
	  		eventObject.preventDefault();
	  	}
	  	else if (eventObject.keyCode == KeyEvent.DOM_VK_DOWN){
	  		eventObject.preventDefault();
	  	}
	}

	private keyUp(eventObject: JQuery.Event){
		// check if we have the focus
		if (!this.canvas.isFocused()){ return }
		// check if there is the pointer is inside the canvas
		if (this.getSelectedCell() == null){ return; }
		// move selected cell with the arrows & backspace key
		if (eventObject.keyCode == KeyEvent.DOM_VK_LEFT){
  		this.setSelectedCell(this.getSelectedCell().add(leftCoord));
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_RIGHT){
  		this.setSelectedCell(this.getSelectedCell().add(rightCoord));
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_UP){
  		this.setSelectedCell(this.getSelectedCell().add(topCoord));
  	}	else if (eventObject.keyCode == KeyEvent.DOM_VK_DOWN){
  		this.setSelectedCell(this.getSelectedCell().add(bottomCoord));
  	}
  	this.changed = true;
	}
}

// ---------------------------------------------- CANVAS CHAR DECORATOR -------------------------------------------- //

/**
 * This tool handles the cursor position & movement (arrow keys) and pointer hovering.
 * This tool also supports the writing and the edition of the text (Backspace & Delete are supported)
 */
class WritableCanvas {
	class = "WritableCanvas";
	canvas: ASCIICanvas;
	pointer: PointerDecorator;
	drawable: DrawableCanvas;

	constructor (canvas: ASCIICanvas, pointer: PointerDecorator, drawable: DrawableCanvas){
		this.canvas = canvas;
		this.pointer = pointer;
		this.drawable = drawable;
	}

	init(){
		this.canvas.events.onKeyDown(this.keyDown.bind(this));
		this.canvas.events.onKeyPress(this.keyPress.bind(this));
	}

	// some chars are not sent to keypress like period or space
	keyDown(eventObject: JQuery.Event){
		// dont write anything unless canvas has the focus
		if (!this.canvas.isFocused()) return;
		// prevent space key to scroll down page
		if (eventObject.keyCode == KeyEvent.DOM_VK_SPACE) {
			eventObject.preventDefault();
			this.importChar(" ");
			this.pointer.setSelectedCell(this.pointer.getSelectedCell().add(rightCoord));
		} /*else if (eventObject.keyCode == KeyEvent.DOM_VK_PERIOD){
			this.importChar(".");
			this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
		}*/
		// delete previous character
		else if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			if (this.canvas.grid.getPixel(this.pointer.getSelectedCell().add(leftCoord)) != undefined){
				this.pointer.setSelectedCell(this.pointer.getSelectedCell().add(leftCoord));
				this.importChar(" ");
			}
  	}
		// delete next character
		else if (eventObject.keyCode == KeyEvent.DOM_VK_DELETE){
  		// get current text
			let currentText = this.drawable.getText(this.pointer.getSelectedCell());
			if (currentText == null){ return;	}
			// delete first character and replace last with space (we are moving text to left)
			currentText = currentText.substring(1)+" ";
			this.importChar(currentText);
  	}
		// jump to next line
		else if (eventObject.keyCode == KeyEvent.DOM_VK_RETURN){
			var startOfText = this.drawable.getTextColStart(this.pointer.getSelectedCell());
			if (startOfText && startOfText.add(bottomCoord)){
				this.pointer.setSelectedCell(startOfText.add(bottomCoord));
			}
		}
	}
	keyPress(eventObject: JQuery.Event){
		// dont write anything
		if (!this.canvas.isFocused()){ return }
		// write key
		if (this.canvas.grid.getPixel(this.pointer.getSelectedCell().add(rightCoord)) != undefined){
			try{
				this.importChar(String.fromCharCode(eventObject.charCode));
				this.pointer.setSelectedCell(this.pointer.getSelectedCell().add(rightCoord));
			}catch(e){
				console.log(e.message);
			}
		}
	}
	importChar(char: string){
		this.canvas.grid.import(char,this.pointer.getSelectedCell());
		this.canvas.grid.commit();
		this.canvas.setChanged(true);
	}
}

// -------------------------------------------- MOVABLE CANVAS DECORATOR ------------------------------------------- //

class MovableCanvas {
	class = "MovableCanvas";
	canvas: ASCIICanvas;
	$container: JQuery;
	lastMouseEvent:JQuery.Event | null = null;
	shiftKeyEnabled = false;

	constructor(canvas: ASCIICanvas, htmlContainerSelectorId: string){
		this.$container = $(htmlContainerSelectorId);
		this.canvas = canvas;
	}

	init(){
		this.canvas.events.onKeyDown(this.keyDown.bind(this));
		this.canvas.events.onKeyUp(this.keyUp.bind(this));
		this.canvas.events.onMouseDown(this.mouseDown.bind(this));
		this.canvas.events.onMouseMove(this.mouseMove.bind(this));
		this.canvas.events.onMouseUp(this.mouseUp.bind(this));
	}

	keyDown(eventObject:JQuery.Event){
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	keyUp(eventObject:JQuery.Event){
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	mouseDown(eventObject:JQuery.Event) {
		this.lastMouseEvent = eventObject;
	}
	mouseMove(eventObject:JQuery.Event){
		if (!this.canvas.isFocused() || !this.shiftKeyEnabled) return;
		if (this.lastMouseEvent == null) return;
		this.$container.scrollTop(Math.max(0,this.$container.scrollTop() - (eventObject.clientY-this.lastMouseEvent.clientY)));
		this.$container.scrollLeft(Math.max(0,this.$container.scrollLeft()  - (eventObject.clientX-this.lastMouseEvent.clientX)));
		this.lastMouseEvent = eventObject;
	}
	mouseUp(){
		this.lastMouseEvent = null;
	}
}
