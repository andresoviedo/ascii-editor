import construct = Reflect.construct;

class CanvasDecorator {
	canvas: ASCIICanvas & Grid;
	constructor(canvas:ASCIICanvas & Grid){
		this.canvas = canvas;
	}

	getCanvasHTML(){
		return this.canvas.getCanvasHTML();
	}

	getGrid(){
		return this.canvas.getGrid();
	}

	getWidth(){
		return this.canvas.getWidth();
	}

	hasChanged(){
		return this.canvas.hasChanged();
	}

	setChanged(changed: boolean){
		this.canvas.setChanged(changed);
	}

	redraw(){
		this.canvas.redraw();
	}

	get pixelsStack() {
		return this.canvas.pixelsStack;
	}

	getPixel(coord:Coord){
		return this.canvas.getPixel(coord);
	}

	stackPixel(coord:Coord, value:string) {
		this.canvas.stackPixel(coord,value);
	}

	drawText(text:string,coord: Coord,style: string){
		this.canvas.drawText(text,coord,style);
	}

	drawRect(coord:Coord,width: number,height: number,style: string){
		this.canvas.drawRect(coord,width,height,style);
	}

	get cursor(){
		return this.canvas.cursor;
	}

	getZoom () {
		return this.canvas.getZoom();
	}

	setZoom(newZoom: number) {
		this.canvas.setZoom(newZoom);
	}

	resize(){
		this.canvas.resize();
	}

	mouseEnter(){
		this.canvas.mouseEnter();
	}

	mouseUp(){
		this.canvas.mouseUp();
	}

	mouseLeave(){
		this.canvas.mouseLeave();
	}

	mouseMove(eventObject: JQuery.Event){
		this.canvas.mouseMove(eventObject);
	}

	mouseDown(eventObject: JQuery.Event){
		this.canvas.mouseDown(eventObject);
	}

	cellDown(coord:Coord){
		this.canvas.cellDown(coord);
	}

	cellUp(coord:Coord){
		this.canvas.cellUp(coord);
	}

	keyDown(eventObject:JQuery.Event){
		this.canvas.keyDown(eventObject);
	}

	keyUp(eventObject:JQuery.Event){
		this.canvas.keyUp(eventObject);
	}

	keyPress(eventObject:JQuery.Event){
		this.canvas.keyPress(eventObject);
	}

	isFocused(){
		return this.canvas.isFocused();
	}

	getGridCoord(canvasHTMLCoord:Coord){
		return this.canvas.getGridCoord(canvasHTMLCoord);
	}

	cellMove(coord:Coord){
		this.canvas.cellMove(coord);
	}

	getCellWidth(){
		return this.canvas.getCellWidth();
	}

	getCellHeight(){
		return this.canvas.getCellHeight();
	}

	import(text:string, coord: Coord, ommitBlanks?: boolean, ommitUnrecognized?: boolean) {
		this.canvas.import(text,coord,ommitBlanks,ommitUnrecognized);
	}

	moveArea(area:Box, diff:Coord) {
		this.canvas.moveArea(area,diff);
	}

	commit(){
		this.canvas.commit();
	}

	rollback(){
		return this.canvas.rollback();
	}
}

// ----------------------------------------------- STYLE DECORATOR ------------------------------------------------- //

class StylableCanvas {
	class = "StylableCanvas";
	canvas: DrawableCanvas & CanvasDecorator
	constructor(canvas: DrawableCanvas & CanvasDecorator){
		this.canvas = canvas;
	}

  drawLine(startCoord: Coord, endCoord: Coord, drawHorizontalFirst: string, pixelValue: string, ommitIntersections: boolean) {
		this.canvas.drawLine(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections);
		// get drawing style
		let drawStyle = $("#style-select").val();
		// fix line style
		for (let index in this.canvas.pixelsStack){
			let pixelPosition = this.canvas.pixelsStack[index];
			let pixel = pixelPosition.pixel;
			pixelValue = this.getPixelValueIntegrated(pixelPosition.coord, drawStyle);
			pixel.tempValue = pixelValue;
		}
	}

	/**
	 * Here is the logic to integrate the pixels. This function return the best drawing character
	 * so its nicely integrated into the ASCII code
	 */
	getPixelValueIntegrated(coord: Coord, drawStyle:string) {
		var pixel = this.canvas.getPixel(coord);
		var pixelValue = pixel.getValue();

		// test whether the pixel is either of the drawing characters
		var isBoxPixel = window.boxChars1.indexOf(pixelValue) != -1;
		var isArrowPixel = window.arrowChars1.indexOf(pixelValue) != -1;

		// if its not a drawing character just return. we have nothing to integrate
		if (!isBoxPixel && !isArrowPixel) {
			return pixelValue;
		}

		// get pixel context so we decide which is the best character for integration
		var pixelContext = this.canvas.getPixelContext(coord);

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
	class = "PointerDecorator";
	canvas: StylableCanvas & DrawableCanvas & CanvasDecorator;
	toolId: string
	selectedCell: Coord | null = null;
	pointerCell: Coord | null = null;
	drawSelectedCell = false;
	changed = false;
	mouseStatus: string | null = null;

	constructor(canvas: StylableCanvas & DrawableCanvas & CanvasDecorator, toolId: string){
		this.canvas = canvas;
		this.toolId = toolId;
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
		return this.canvas.hasChanged() || this.changed;
	}
	setChanged(changed: boolean){
		this.canvas.setChanged(changed)
		this.changed = changed;
	}
	redraw(){
		this.canvas.redraw();
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
	refresh(){
		var shouldDraw = this.getSelectedCell() != null && new Date().getTime() % 2000 < 1000;
		var changed = shouldDraw != this.getDrawSelectedCell();
		this.setDrawSelectedCell(shouldDraw);
		this.changed = this.changed || changed;
	}
	cellDown(coord: Coord){
		this.canvas.cellDown(coord);
		this.mouseStatus = "down";
		this.setSelectedCell(coord);
		this.changed = true;
	}
	cellMove(coord: Coord){
		this.canvas.cellMove(coord);
		this.mouseStatus = this.mouseStatus == "up" || this.mouseStatus == "hover"? "hover" : "moving";
		this.setPointerCell(coord);
		this.changed = true;
	}
	cellUp(coord: Coord){
		this.canvas.cellUp(coord);
		this.mouseStatus = "up";
	}
	mouseLeave(){
		this.canvas.mouseLeave();
		this.setPointerCell(null);
		this.changed = true;
	}
	/**
	 * This to prevent moving the document with the arrow keys
	 */
	keyDown(eventObject: JQuery.Event){
		this.canvas.keyDown(eventObject);

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

	keyUp(eventObject: JQuery.Event){
		this.canvas.keyUp(eventObject);
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
	canvas: CanvasDecorator & PointerDecorator & DrawableCanvas;
	constructor (canvas: CanvasDecorator & PointerDecorator & DrawableCanvas){
		this.canvas = canvas;
	}

	// some chars are not sent to keypress like period or space
	keyDown(eventObject: JQuery.Event){
		this.canvas.keyDown(eventObject);
		// dont write anything unless canvas has the focus
		if (!this.canvas.isFocused()) return;
		// prevent space key to scroll down page
		if (eventObject.keyCode == KeyEvent.DOM_VK_SPACE) {
			eventObject.preventDefault();
			this.importChar(" ");
			this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
		} /*else if (eventObject.keyCode == KeyEvent.DOM_VK_PERIOD){
			this.importChar(".");
			this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
		}*/
		// delete previous character
		else if (eventObject.keyCode == KeyEvent.DOM_VK_BACK_SPACE) {
			if (this.canvas.getPixel(this.canvas.getSelectedCell().add(leftCoord)) != undefined){
				this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(leftCoord));
				this.importChar(" ");
			}
  	}
		// delete next character
		else if (eventObject.keyCode == KeyEvent.DOM_VK_DELETE){
  		// get current text
			let currentText = this.canvas.getText(this.canvas.getSelectedCell());
			if (currentText == null){ return;	}
			// delete first character and replace last with space (we are moving text to left)
			currentText = currentText.substring(1)+" ";
			this.importChar(currentText);
  	}
		// jump to next line
		else if (eventObject.keyCode == KeyEvent.DOM_VK_RETURN){
			var startOfText = this.canvas.getTextColStart(this.canvas.getSelectedCell());
			if (startOfText && startOfText.add(bottomCoord)){
				this.canvas.setSelectedCell(startOfText.add(bottomCoord));
			}
		}
	}
	keyPress(eventObject: JQuery.Event){
		// propagate event
		this.canvas.keyPress(eventObject);
		// dont write anything
		if (!this.canvas.isFocused()){ return }
		// write key
		if (this.canvas.getPixel(this.canvas.getSelectedCell().add(rightCoord)) != undefined){
			try{
				this.importChar(String.fromCharCode(eventObject.charCode));
				this.canvas.setSelectedCell(this.canvas.getSelectedCell().add(rightCoord));
			}catch(e){
				console.log(e.message);
			}
		}
	}
	importChar(char: string){
		this.canvas.import(char,this.canvas.getSelectedCell());
		this.canvas.commit();
		this.canvas.setChanged(true);
	}
}

// -------------------------------------------- MOVABLE CANVAS DECORATOR ------------------------------------------- //

class MovableCanvas extends CanvasDecorator {
	class = "MovableCanvas";
	htmlContainerSelectorId: string;
	lastMouseEvent:JQuery.Event | null = null;
	shiftKeyEnabled = false;

	constructor(canvas: ASCIICanvas & Grid, htmlContainerSelectorId: string){
		super(canvas);
		this.htmlContainerSelectorId = htmlContainerSelectorId;
	}

	keyDown(eventObject:JQuery.Event){
		super.keyDown(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	keyUp(eventObject:JQuery.Event){
		super.keyUp(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	mouseDown(eventObject:JQuery.Event) {
		super.mouseDown(eventObject);
		this.lastMouseEvent = eventObject;
	}
	mouseMove(eventObject:JQuery.Event){
		super.mouseMove(eventObject);
		if (!super.isFocused() || !this.shiftKeyEnabled) return;
		if (this.lastMouseEvent == null) return;
		$(this.htmlContainerSelectorId).scrollTop(Math.max(0,$(this.htmlContainerSelectorId).scrollTop() - (eventObject.clientY-this.lastMouseEvent.clientY)));
		$(this.htmlContainerSelectorId).scrollLeft(Math.max(0,$(this.htmlContainerSelectorId).scrollLeft()  - (eventObject.clientX-this.lastMouseEvent.clientX)));
		this.lastMouseEvent = eventObject;
	}
	mouseUp(){
		super.mouseUp();
		this.lastMouseEvent = null;
	}
}
