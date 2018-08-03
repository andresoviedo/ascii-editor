class CanvasDecorator {
	constructor(canvas){
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

	setChanged(changed){
		this.canvas.setChanged(changed);
	}

	redraw(){
		this.canvas.redraw();
	}

	get pixelsStack() {
		return this.canvas.pixelsStack;
	}

	getPixel(coord){
		return this.canvas.getPixel(coord);
	}

	stackPixel(coord, value) {
		this.canvas.stackPixel(coord,value);
	}

	drawText(text,coord,style){
		this.canvas.drawText(text,coord,style);
	}

	drawRect(coord,width,height,style){
		this.canvas.drawRect(coord,width,height,style);
	}

	get cursor(){
		return this.canvas.cursor;
	}

	getZoom () { 
		return this.canvas.getZoom();
	}

	setZoom(newZoom) {
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

	mouseMove(eventObject){
		this.canvas.mouseMove(eventObject);
	}

	mouseDown(eventObject){
		this.canvas.mouseDown(eventObject);
	}

	cellDown(coord){
		this.canvas.cellDown(coord);
	}

	cellUp(coord){
		this.canvas.cellUp(coord);
	}

	keyDown(eventObject){
		this.canvas.keyDown(eventObject);
	}

	keyUp(eventObject){
		this.canvas.keyUp(eventObject);
	}

	keyPress(eventObject){
		this.canvas.keyPress(eventObject);
	}

	isFocused(){
		return this.canvas.isFocused();
	}

	getGridCoord(canvasHTMLCoord){
		return this.canvas.getGridCoord(canvasHTMLCoord);
	}

	cellMove(coord){
		this.canvas.cellMove(coord);
	}

	getCellWidth(){
		return this.canvas.getCellWidth();
	}

	getCellHeight(){
		return this.canvas.getCellHeight();
	}

	import(text, coord, ommitBlanks, ommitUnrecognized) {
		this.canvas.import(text,coord,ommitBlanks,ommitUnrecognized);
	}

	moveArea(area, diff) {
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

function StylableCanvas(canvas){
	this.class = "StylableCanvas";
	this.canvas = canvas;
}

StylableCanvas.prototype = {

	drawLine : function(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections) {
		this.canvas.drawLine(startCoord, endCoord, drawHorizontalFirst, pixelValue, ommitIntersections);
		// get drawing style
		drawStyle = $("#style-select").val();
		// fix line style
		for (index in this.canvas.pixelsStack){
			pixelPosition = this.canvas.pixelsStack[index];
			pixel = pixelPosition.pixel;
			pixelValue = this.getPixelValueIntegrated(pixelPosition.coord, drawStyle);
			pixel.tempValue = pixelValue;
		}
	}
	/**
	 * Here is the logic to integrate the pixels. This function return the best drawing character
	 * so its nicely integrated into the ASCII code
	 */
	, getPixelValueIntegrated : function(coord, drawStyle) {
		var pixel = this.canvas.getPixel(coord);
		var pixelValue = pixel.getValue();

		// test whether the pixel is either of the drawing characters
		var isBoxPixel = boxChars1.indexOf(pixelValue) != -1;
		var isArrowPixel = arrowChars1.indexOf(pixelValue) != -1;

		// if its not a drawing character just return. we have nothing to integrate
		if (!isBoxPixel && !isArrowPixel) {
			return pixelValue;
		}

		// get pixel context so we decide which is the best character for integration
		var pixelContext = this.canvas.getPixelContext(coord);

		// handle cases when we are drawing a box
		if (isBoxPixel){
			if (pixelContext.left && pixelContext.right && pixelContext.bottom && pixelContext.top) {
				return drawStyles[drawStyle]["cross"];
			}
			/* This handles this case:
		 	 *                            X - X
		 	 */
			if (pixelContext.left && pixelContext.right && !pixelContext.bottom && !pixelContext.top) {
				return drawStyles[drawStyle]["horizontal"];
			}
			/*
		 	 * This handles this case:	     X
		 	 *                               |
		 	 *                               X
		 	*/
			else if (!pixelContext.left && !pixelContext.right && pixelContext.bottom && pixelContext.top) {
				return drawStyles[drawStyle]["vertical"];
			}
			/*
		 	 * This handles this case:	     ┌X
		 	 *                               X
		 	*/
			else if (!pixelContext.left && pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-top-left"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	     X┐
		 	 *                                X
		 	*/
			else if (pixelContext.left && !pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-top-right"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	     X
		 	 *                               └X
		 	 *
		 	*/
			else if (!pixelContext.left && pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-bottom-left"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			/*
		 	 * This handles this case:	      X
		 	 *                               X┘
		 	 *
		 	*/
			else if (pixelContext.left && !pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				cornerPixel = drawStyles[drawStyle]["corner-bottom-right"];
				return cornerPixel? cornerPixel : drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.left && pixelContext.right && pixelContext.top && !pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["horizontal-light-up"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["horizontal"];
			}
			else if (pixelContext.left && pixelContext.right && !pixelContext.top && pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["horizontal-light-down"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["horizontal"];
			}
			else if (!pixelContext.left && pixelContext.right && pixelContext.top && pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["vertical-light-right"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.left && !pixelContext.right && pixelContext.top && pixelContext.bottom) {
				pixelValue = drawStyles[drawStyle]["vertical-light-left"];
				return pixelValue? pixelValue : drawStyles[drawStyle]["corner"];
			}
			else if (pixelContext.top || pixelContext.bottom) {
				return drawStyles[drawStyle]["vertical"];
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
function PointerDecorator(canvas, toolId){
	this.class = "PointerDecorator";
	this.canvas = canvas;
	this.toolId = toolId;
	this.selectedCell = null;
	this.pointerCell = null;
	this.drawSelectedCell = false;
	this.changed = false;
}

PointerDecorator.prototype = {

	getPointerCell : function() { return this.pointerCell }
	, setPointerCell : function(coord) { this.pointerCell = coord }
	, getDrawSelectedCell : function() { return this.drawSelectedCell }
	, setDrawSelectedCell : function(draw) { this.drawSelectedCell = draw }
	, getSelectedCell : function() { return this.selectedCell }
	, setSelectedCell : function(coord){
		if (this.canvas.getGrid().getPixel(coord) != undefined){
  		this.selectedCell = coord;
  	}
	}
	, hasChanged : function(){
		this.refresh();
		return this.canvas.hasChanged() || this.changed;
	}
	, setChanged : function(changed){
		this.canvas.setChanged(changed)
		this.changed = changed;
	}
	, redraw : function(){
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
	, refresh : function(){
		var shouldDraw = this.getSelectedCell() != null && new Date().getTime() % 2000 < 1000;
		var changed = shouldDraw != this.getDrawSelectedCell();
		this.setDrawSelectedCell(shouldDraw);
		this.changed = this.changed || changed;
	}
	, cellDown : function(coord){
		this.canvas.cellDown(coord);
		this.mouseStatus = "down";
		this.setSelectedCell(coord);
		this.changed = true;
	}
	, cellMove : function(coord){
		this.canvas.cellMove(coord);
		this.mouseStatus = this.mouseStatus == "up" || this.mouseStatus == "hover"? "hover" : "moving";
		this.setPointerCell(coord);
		this.changed = true;
	}
	, cellUp : function(coord){
		this.canvas.cellUp(coord);
		this.mouseStatus = "up";
	}
	, mouseLeave : function(){
		this.canvas.mouseLeave();
		this.setPointerCell(null);
		this.changed = true;
	}
	/**
	 * This to prevent moving the document with the arrow keys
	 */
	, keyDown : function(eventObject){
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

	, keyUp : function(eventObject){
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
function WritableCanvas(canvas){
	this.class = "WritableCanvas";
	this.canvas = canvas;
}

WritableCanvas.prototype = {

	// some chars are not sent to keypress like period or space
	keyDown : function(eventObject){
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
			currentText = this.canvas.getText(this.canvas.getSelectedCell());
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
	, keyPress : function(eventObject){
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
	, importChar : function(char){
		this.canvas.import(char,this.canvas.getSelectedCell());
		this.canvas.commit();
		this.canvas.setChanged(true);
	}
}

// -------------------------------------------- MOVABLE CANVAS DECORATOR ------------------------------------------- //

class MovableCanvas extends CanvasDecorator {
	constructor(canvas, htmlContainerSelectorId){
		super(canvas);
		this.class = "MovableCanvas";
		this.htmlContainerSelectorId = htmlContainerSelectorId;
		this.lastMouseEvent = null;
		this.shiftKeyEnabled = false;
	}

	keyDown(eventObject){
		super.keyDown(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = true;
		}
	}
	keyUp(eventObject){
		super.keyUp(eventObject);
		if (eventObject.keyCode == KeyEvent.DOM_VK_SHIFT) {
			this.shiftKeyEnabled = false;
		}
	}
	mouseDown(eventObject) {
		super.mouseDown(eventObject);
		this.lastMouseEvent = eventObject;
	}
	mouseMove(eventObject){
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